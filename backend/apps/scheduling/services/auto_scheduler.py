import math
import random
from collections import defaultdict
from datetime import date, timedelta
from types import SimpleNamespace

from apps.scheduling.models import ShiftType, StaffAvailability, UnitRequirement, WorkAssignment
from apps.staff.models import StaffProfile

from .validators import is_staff_eligible

AUTO_SCHEDULE_NOTE_PREFIX = "Two-phase auto schedule"


def daterange(start_date, end_date):
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)


def is_weekend(date_obj):
    return date_obj.weekday() >= 5


def requirement_matches_date(requirement, target_date):
    weekday = target_date.weekday()
    return {
        0: getattr(requirement, "monday", False),
        1: getattr(requirement, "tuesday", False),
        2: getattr(requirement, "wednesday", False),
        3: getattr(requirement, "thursday", False),
        4: getattr(requirement, "friday", False),
        5: getattr(requirement, "saturday", False),
        6: getattr(requirement, "sunday", False),
    }.get(weekday, False)


def get_shift_duration_hours(shift_type):
    start_minutes = shift_type.start_time.hour * 60 + shift_type.start_time.minute
    end_minutes = shift_type.end_time.hour * 60 + shift_type.end_time.minute
    diff = end_minutes - start_minutes
    if diff <= 0:
        diff += 24 * 60
    return diff / 60.0


def is_night_shift_type(shift_type):
    if getattr(shift_type, "is_night", False):
        return True
    name = (getattr(shift_type, "name", "") or "").lower()
    return "night" in name or "nobet" in name or "gece" in name


def safe_mean(values):
    return sum(values) / len(values) if values else 0.0


def weighted_choice(items, weight_func, rng):
    if not items:
        return None
    weights = [max(float(weight_func(item)), 0.0001) for item in items]
    return rng.choices(items, weights=weights, k=1)[0]


def pick_from_best_pool(candidates, score_map, rng, pool_size=3, temperature=1.15):
    if not candidates:
        return None

    pool_size = max(int(pool_size or 1), 1)
    sorted_candidates = sorted(candidates, key=lambda staff: score_map[staff.id])
    best_pool = sorted_candidates[: min(pool_size, len(sorted_candidates))]
    min_score = min(score_map[staff.id] for staff in best_pool)

    def weight_func(staff):
        diff = score_map[staff.id] - min_score
        return math.exp(-(diff / max(float(temperature), 0.1)))

    return weighted_choice(best_pool, weight_func=weight_func, rng=rng)


def _build_fallback_requirements():
    fallback = []
    for shift_type in ShiftType.objects.all().order_by("start_time"):
        fallback.append(
            SimpleNamespace(
                department=None,
                shift_type=shift_type,
                shift_type_id=shift_type.id,
                required_count=1,
                monday=True,
                tuesday=True,
                wednesday=True,
                thursday=True,
                friday=True,
                saturday=True,
                sunday=True,
            )
        )
    return fallback


def get_active_requirements(department):
    requirements = list(
        UnitRequirement.objects.filter(department=department, is_active=True)
        .select_related("shift_type")
        .order_by("shift_type__start_time")
    )

    if requirements:
        return requirements, []

    fallback = _build_fallback_requirements()
    if fallback:
        return fallback, [
            "No active unit requirements found. Fallback mode uses 1 staff per shift type."
        ]

    return [], ["No shift types configured for auto schedule."]


def get_range_level_targets(start_date, end_date, staff_count, requirements):
    staff_count = max(int(staff_count or 0), 1)

    total_night_required = 0
    weekend_night_required = 0
    weekday_night_required = 0
    total_mesai_required = 0
    total_hours_required = 0.0

    for current_date in daterange(start_date, end_date):
        for req in requirements:
            if not requirement_matches_date(req, current_date):
                continue

            count = int(req.required_count)
            total_hours_required += float(count) * get_shift_duration_hours(req.shift_type)

            if is_night_shift_type(req.shift_type):
                total_night_required += count
                if is_weekend(current_date):
                    weekend_night_required += count
                else:
                    weekday_night_required += count
            else:
                total_mesai_required += count

    return {
        "per_staff_total_night_target": total_night_required / staff_count,
        "per_staff_weekend_night_target": weekend_night_required / staff_count,
        "per_staff_weekday_night_target": weekday_night_required / staff_count,
        "per_staff_mesai_target": total_mesai_required / staff_count,
        "per_staff_required_hours": total_hours_required / staff_count,
        "total_night_required": total_night_required,
        "weekend_night_required": weekend_night_required,
        "weekday_night_required": weekday_night_required,
        "total_mesai_required": total_mesai_required,
        "total_hours_required": total_hours_required,
    }


def build_staff_state(staff_members, start_date, end_date):
    leave_map = defaultdict(set)
    availability_rows = StaffAvailability.objects.filter(
        staff_profile__in=staff_members,
        date__range=[start_date, end_date],
        status=StaffAvailability.AvailabilityStatus.UNAVAILABLE,
    )
    for row in availability_rows:
        leave_map[row.staff_profile_id].add(row.date)

    state = {}
    for staff in staff_members:
        leave_days = leave_map.get(staff.id, set())
        weekday_leave_count = sum(1 for day in leave_days if not is_weekend(day))
        state[staff.id] = {
            "staff": staff,
            "assigned_hours": 0.0,
            "weekday_night_count": 0,
            "weekend_night_count": 0,
            "mesai_count": 0,
            "weekday_leave_count": weekday_leave_count,
            "leave_days": set(leave_days),
            "blocked_next_days": set(),
            "preview_assignments": [],
            "assignment_dates": set(),
            "week_hours": defaultdict(float),
        }

    existing = WorkAssignment.objects.filter(
        staff_profile__in=staff_members,
        assignment_date__range=[start_date, end_date],
    ).select_related("shift_type")

    for item in existing:
        if item.status == WorkAssignment.Status.CANCELLED:
            continue

        st = state[item.staff_profile_id]
        duration = get_shift_duration_hours(item.shift_type)
        st["assigned_hours"] += duration
        st["assignment_dates"].add(item.assignment_date)
        st["week_hours"][item.assignment_date.isocalendar()[:2]] += duration

        if is_night_shift_type(item.shift_type):
            if is_weekend(item.assignment_date):
                st["weekend_night_count"] += 1
            else:
                st["weekday_night_count"] += 1
            st["blocked_next_days"].add(item.assignment_date + timedelta(days=1))
        else:
            st["mesai_count"] += 1

    return state


def get_staff_total_night_count(staff_state):
    return int(staff_state["weekday_night_count"]) + int(staff_state["weekend_night_count"])


def get_staff_effective_required_hours(base_required_hours, weekday_leave_count):
    adjusted = float(base_required_hours) - float(weekday_leave_count * 8)
    return max(adjusted, 0.0)


def apply_assignment_to_staff_state(staff_state, assignment_date, shift_type, preview_item):
    duration = get_shift_duration_hours(shift_type)
    staff_state["assigned_hours"] += duration
    staff_state["preview_assignments"].append(preview_item)
    staff_state["assignment_dates"].add(assignment_date)
    staff_state["week_hours"][assignment_date.isocalendar()[:2]] += duration

    if is_night_shift_type(shift_type):
        if is_weekend(assignment_date):
            staff_state["weekend_night_count"] += 1
        else:
            staff_state["weekday_night_count"] += 1
        staff_state["blocked_next_days"].add(assignment_date + timedelta(days=1))
    else:
        staff_state["mesai_count"] += 1


def basic_candidate_filter(staff, staff_state, assignment_date, shift_type, options=None):
    options = options or {}
    is_ok, _reason = is_staff_eligible(staff, assignment_date, shift_type, options)
    if not is_ok:
        return False

    if assignment_date in staff_state["assignment_dates"]:
        return False

    if assignment_date in staff_state["leave_days"]:
        return False

    if assignment_date in staff_state["blocked_next_days"]:
        return False

    if options.get("respect_weekly_limit", True):
        week_key = assignment_date.isocalendar()[:2]
        projected = staff_state["week_hours"][week_key] + get_shift_duration_hours(shift_type)
        if projected > float(staff.weekly_limit_hours):
            return False

    return True


def score_staff_for_night(staff, staff_state_map, assignment_date, targets):
    st = staff_state_map[staff.id]
    total_night = get_staff_total_night_count(st)
    weekend_night = st["weekend_night_count"]
    weekday_night = st["weekday_night_count"]
    assigned_hours = st["assigned_hours"]

    target_total = float(targets.get("per_staff_total_night_target", 0))
    target_weekend = float(targets.get("per_staff_weekend_night_target", 0))
    target_weekday = float(targets.get("per_staff_weekday_night_target", 0))
    effective_required_hours = get_staff_effective_required_hours(
        targets.get("per_staff_required_hours", 0),
        st["weekday_leave_count"],
    )

    total_gap = total_night - target_total
    weekend_gap = weekend_night - target_weekend
    weekday_gap = weekday_night - target_weekday
    hour_gap = assigned_hours - effective_required_hours

    score = 0.0
    score += total_night * 100.0
    score += max(total_gap, 0) * 60.0

    if is_weekend(assignment_date):
        score += weekend_night * 160.0
        score += max(weekend_gap, 0) * 120.0
        score += weekday_night * 8.0
    else:
        score += weekday_night * 130.0
        score += max(weekday_gap, 0) * 100.0
        score += weekend_night * 10.0

    score += max(hour_gap, 0) * 1.5
    score += assigned_hours * 0.03
    return score


def score_staff_for_mesai(staff, staff_state_map, targets):
    st = staff_state_map[staff.id]
    assigned_hours = st["assigned_hours"]
    mesai_count = st["mesai_count"]
    total_night = get_staff_total_night_count(st)

    effective_required_hours = get_staff_effective_required_hours(
        targets.get("per_staff_required_hours", 0),
        st["weekday_leave_count"],
    )
    target_mesai = float(targets.get("per_staff_mesai_target", 0))
    target_total_night = float(targets.get("per_staff_total_night_target", 0))

    hour_gap = assigned_hours - effective_required_hours
    mesai_gap = mesai_count - target_mesai
    night_gap = total_night - target_total_night

    score = 0.0
    score += mesai_count * 120.0
    score += max(mesai_gap, 0) * 90.0
    score += max(hour_gap, 0) * 6.0
    score += night_gap * 18.0
    score += assigned_hours * 0.05
    return score


def allocate_night_phase(
    preview_items,
    warnings,
    staff_members,
    staff_state_map,
    requirements,
    department,
    start_date,
    end_date,
    targets,
    rng,
    weekend_only,
    options=None,
):
    options = options or {}
    pool_size = options.get("night_candidate_pool_size", options.get("candidate_pool_size", 3))
    temperature = options.get("night_selection_temperature", options.get("selection_temperature", 1.1))

    for current_date in daterange(start_date, end_date):
        if weekend_only is True and not is_weekend(current_date):
            continue
        if weekend_only is False and is_weekend(current_date):
            continue

        daily_requirements = [
            req
            for req in requirements
            if requirement_matches_date(req, current_date) and is_night_shift_type(req.shift_type)
        ]
        daily_requirements.sort(key=lambda req: req.shift_type.start_time)

        for req in daily_requirements:
            for slot_index in range(int(req.required_count)):
                candidates = []
                for staff in staff_members:
                    st = staff_state_map[staff.id]
                    if basic_candidate_filter(
                        staff=staff,
                        staff_state=st,
                        assignment_date=current_date,
                        shift_type=req.shift_type,
                        options=options,
                    ):
                        candidates.append(staff)

                if not candidates:
                    warnings.append(
                        f"{current_date} - {department.name} - {req.shift_type.name} has no night candidate. "
                        f"Slot {slot_index + 1}/{req.required_count}"
                    )
                    continue

                score_map = {
                    staff.id: score_staff_for_night(staff, staff_state_map, current_date, targets)
                    for staff in candidates
                }
                selected = pick_from_best_pool(
                    candidates,
                    score_map,
                    rng,
                    pool_size=pool_size,
                    temperature=temperature,
                )
                if not selected:
                    warnings.append(f"{current_date} - {req.shift_type.name} night selection failed.")
                    continue

                preview_item = {
                    "staff_profile": selected,
                    "department": department,
                    "shift_type": req.shift_type,
                    "assignment_date": current_date,
                    "status": WorkAssignment.Status.PLANNED,
                    "notes": f"{AUTO_SCHEDULE_NOTE_PREFIX} - night priority",
                }
                preview_items.append(preview_item)
                apply_assignment_to_staff_state(
                    staff_state=staff_state_map[selected.id],
                    assignment_date=current_date,
                    shift_type=req.shift_type,
                    preview_item=preview_item,
                )


def allocate_mesai_phase(
    preview_items,
    warnings,
    staff_members,
    staff_state_map,
    requirements,
    department,
    start_date,
    end_date,
    targets,
    rng,
    options=None,
):
    options = options or {}
    pool_size = options.get("mesai_candidate_pool_size", options.get("candidate_pool_size", 3))
    temperature = options.get("mesai_selection_temperature", options.get("selection_temperature", 1.2))

    mesai_requirements = [req for req in requirements if not is_night_shift_type(req.shift_type)]

    for current_date in daterange(start_date, end_date):
        daily_requirements = [
            req for req in mesai_requirements if requirement_matches_date(req, current_date)
        ]
        daily_requirements.sort(key=lambda req: req.shift_type.start_time)

        for req in daily_requirements:
            for slot_index in range(int(req.required_count)):
                candidates = []
                for staff in staff_members:
                    st = staff_state_map[staff.id]
                    if basic_candidate_filter(
                        staff=staff,
                        staff_state=st,
                        assignment_date=current_date,
                        shift_type=req.shift_type,
                        options=options,
                    ):
                        candidates.append(staff)

                if not candidates:
                    warnings.append(
                        f"{current_date} - {department.name} - {req.shift_type.name} has no day candidate. "
                        f"Slot {slot_index + 1}/{req.required_count}"
                    )
                    continue

                score_map = {
                    staff.id: score_staff_for_mesai(staff, staff_state_map, targets)
                    for staff in candidates
                }
                selected = pick_from_best_pool(
                    candidates,
                    score_map,
                    rng,
                    pool_size=pool_size,
                    temperature=temperature,
                )
                if not selected:
                    warnings.append(f"{current_date} - {req.shift_type.name} day selection failed.")
                    continue

                preview_item = {
                    "staff_profile": selected,
                    "department": department,
                    "shift_type": req.shift_type,
                    "assignment_date": current_date,
                    "status": WorkAssignment.Status.PLANNED,
                    "notes": f"{AUTO_SCHEDULE_NOTE_PREFIX} - day balancing",
                }
                preview_items.append(preview_item)
                apply_assignment_to_staff_state(
                    staff_state=staff_state_map[selected.id],
                    assignment_date=current_date,
                    shift_type=req.shift_type,
                    preview_item=preview_item,
                )


def get_schedule_fairness_summary(staff_members, staff_state_map, targets):
    summary = []
    for staff in staff_members:
        st = staff_state_map[staff.id]
        effective_required_hours = get_staff_effective_required_hours(
            targets.get("per_staff_required_hours", 0),
            st["weekday_leave_count"],
        )
        summary.append(
            {
                "staffId": staff.id,
                "staffName": staff.full_name,
                "assignedHours": round(float(st["assigned_hours"]), 2),
                "effectiveRequiredHours": round(float(effective_required_hours), 2),
                "weekdayNightCount": st["weekday_night_count"],
                "weekendNightCount": st["weekend_night_count"],
                "totalNightCount": get_staff_total_night_count(st),
                "mesaiCount": st["mesai_count"],
                "weekdayLeaveCount": st["weekday_leave_count"],
            }
        )
    return summary


def evaluate_schedule(staff_members, staff_state_map, warnings):
    hours = [float(staff_state_map[staff.id]["assigned_hours"]) for staff in staff_members]
    total_nights = [get_staff_total_night_count(staff_state_map[staff.id]) for staff in staff_members]
    weekend_nights = [staff_state_map[staff.id]["weekend_night_count"] for staff in staff_members]
    weekday_nights = [staff_state_map[staff.id]["weekday_night_count"] for staff in staff_members]
    mesais = [staff_state_map[staff.id]["mesai_count"] for staff in staff_members]

    hour_spread = (max(hours) - min(hours)) if hours else 0
    total_night_spread = (max(total_nights) - min(total_nights)) if total_nights else 0
    weekend_night_spread = (max(weekend_nights) - min(weekend_nights)) if weekend_nights else 0
    weekday_night_spread = (max(weekday_nights) - min(weekday_nights)) if weekday_nights else 0
    mesai_spread = (max(mesais) - min(mesais)) if mesais else 0

    score = 0.0
    score += total_night_spread * 100.0
    score += weekend_night_spread * 90.0
    score += weekday_night_spread * 70.0
    score += mesai_spread * 35.0
    score += hour_spread * 4.0
    score += len(warnings) * 250.0

    return {
        "fairnessScore": round(score, 4),
        "hourSpread": round(hour_spread, 2),
        "totalNightSpread": total_night_spread,
        "weekendNightSpread": weekend_night_spread,
        "weekdayNightSpread": weekday_night_spread,
        "mesaiSpread": mesai_spread,
        "avgAssignedHours": round(safe_mean(hours), 2),
        "avgNightCount": round(safe_mean(total_nights), 2),
    }


def _sorted_preview(preview_items):
    return sorted(
        preview_items,
        key=lambda item: (
            item["assignment_date"],
            item["shift_type"].start_time,
            item["staff_profile"].full_name,
        ),
    )


def generate_single_schedule_preview(department, start_date, end_date, options=None, seed=None):
    options = options or {}
    rng = random.Random(seed)

    staff_members = list(
        StaffProfile.objects.filter(department=department, is_active=True)
        .select_related("user")
        .order_by("user__first_name", "user__last_name", "user__username")
    )

    requirements, requirement_warnings = get_active_requirements(department)
    preview_items = []
    warnings = list(requirement_warnings)

    if not staff_members:
        warnings.append("No active staff in selected department.")
        return preview_items, warnings, {
            "targets": {},
            "fairnessSummary": [],
            "fairnessScore": 999999.0,
            "hourSpread": 0,
            "totalNightSpread": 0,
            "weekendNightSpread": 0,
            "weekdayNightSpread": 0,
            "mesaiSpread": 0,
        }

    if not requirements:
        warnings.append("No active requirements or shift types. Auto schedule aborted.")
        return preview_items, warnings, {
            "targets": {},
            "fairnessSummary": [],
            "fairnessScore": 999999.0,
            "hourSpread": 0,
            "totalNightSpread": 0,
            "weekendNightSpread": 0,
            "weekdayNightSpread": 0,
            "mesaiSpread": 0,
        }

    targets = get_range_level_targets(
        start_date=start_date,
        end_date=end_date,
        staff_count=len(staff_members),
        requirements=requirements,
    )

    staff_state_map = build_staff_state(
        staff_members=staff_members,
        start_date=start_date,
        end_date=end_date,
    )

    allocate_night_phase(
        preview_items=preview_items,
        warnings=warnings,
        staff_members=staff_members,
        staff_state_map=staff_state_map,
        requirements=requirements,
        department=department,
        start_date=start_date,
        end_date=end_date,
        targets=targets,
        rng=rng,
        weekend_only=True,
        options=options,
    )

    allocate_night_phase(
        preview_items=preview_items,
        warnings=warnings,
        staff_members=staff_members,
        staff_state_map=staff_state_map,
        requirements=requirements,
        department=department,
        start_date=start_date,
        end_date=end_date,
        targets=targets,
        rng=rng,
        weekend_only=False,
        options=options,
    )

    allocate_mesai_phase(
        preview_items=preview_items,
        warnings=warnings,
        staff_members=staff_members,
        staff_state_map=staff_state_map,
        requirements=requirements,
        department=department,
        start_date=start_date,
        end_date=end_date,
        targets=targets,
        rng=rng,
        options=options,
    )

    fairness_summary = get_schedule_fairness_summary(
        staff_members=staff_members,
        staff_state_map=staff_state_map,
        targets=targets,
    )
    metrics = evaluate_schedule(
        staff_members=staff_members,
        staff_state_map=staff_state_map,
        warnings=warnings,
    )

    meta = {
        "targets": targets,
        "fairnessSummary": fairness_summary,
        **metrics,
    }
    return _sorted_preview(preview_items), warnings, meta


def generate_schedule_preview(department, start_date, end_date, options=None):
    options = options or {}
    attempt_count = max(int(options.get("attemptCount", 24)), 1)
    keep_top_n = max(int(options.get("keepTopN", 5)), 1)
    base_seed = options.get("seed")

    attempts = []
    for attempt_no in range(attempt_count):
        attempt_seed = (base_seed + attempt_no) if base_seed is not None else random.randint(1, 10**9)
        preview_items, warnings, meta = generate_single_schedule_preview(
            department=department,
            start_date=start_date,
            end_date=end_date,
            options=options,
            seed=attempt_seed,
        )
        attempts.append(
            {
                "attemptNo": attempt_no + 1,
                "seed": attempt_seed,
                "previewItems": preview_items,
                "warnings": warnings,
                "meta": meta,
            }
        )

    attempts.sort(key=lambda item: item["meta"]["fairnessScore"])
    best = attempts[0]

    alternatives = []
    for item in attempts[:keep_top_n]:
        alternatives.append(
            {
                "attemptNo": item["attemptNo"],
                "seed": item["seed"],
                "fairnessScore": item["meta"]["fairnessScore"],
                "hourSpread": item["meta"]["hourSpread"],
                "totalNightSpread": item["meta"]["totalNightSpread"],
                "weekendNightSpread": item["meta"]["weekendNightSpread"],
                "weekdayNightSpread": item["meta"]["weekdayNightSpread"],
                "mesaiSpread": item["meta"]["mesaiSpread"],
                "warningCount": len(item["warnings"]),
            }
        )

    selected_meta = dict(best["meta"])
    selected_meta["alternatives"] = alternatives
    selected_meta["selectedAttemptNo"] = best["attemptNo"]
    selected_meta["selectedSeed"] = best["seed"]

    return best["previewItems"], best["warnings"], selected_meta


def serialize_preview_items(preview_items):
    serialized = []
    for item in preview_items:
        serialized.append(
            {
                "staffProfileId": item["staff_profile"].id,
                "staffProfileName": item["staff_profile"].full_name,
                "departmentId": item["department"].id,
                "departmentName": item["department"].name,
                "shiftTypeId": item["shift_type"].id,
                "shiftTypeName": item["shift_type"].name,
                "shiftColor": item["shift_type"].color,
                "assignmentDate": item["assignment_date"].isoformat(),
                "status": item["status"],
                "notes": item["notes"],
            }
        )
    return serialized


def save_generated_schedule(preview_items, user, replace_existing=False):
    created_objects = []
    if not preview_items:
        return created_objects

    if replace_existing:
        department = preview_items[0]["department"]
        dates = [item["assignment_date"] for item in preview_items]
        WorkAssignment.objects.filter(
            department=department,
            assignment_date__range=[min(dates), max(dates)],
            status=WorkAssignment.Status.PLANNED,
        ).delete()

    for item in preview_items:
        assignment, created = WorkAssignment.objects.get_or_create(
            staff_profile=item["staff_profile"],
            department=item["department"],
            shift_type=item["shift_type"],
            assignment_date=item["assignment_date"],
            defaults={
                "status": item["status"],
                "notes": item["notes"],
                "created_by": user,
            },
        )

        if created:
            created_objects.append(assignment)

    return created_objects
