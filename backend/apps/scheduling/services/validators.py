from datetime import datetime, timedelta

from django.db.models import Q

from apps.scheduling.models import StaffAvailability, WorkAssignment


def _opt(options, *keys, default=None):
    for key in keys:
        if key in options:
            return options[key]
    return default


def _is_night_shift(shift_type) -> bool:
    if getattr(shift_type, "is_night", False):
        return True
    if getattr(shift_type, "is_night_shift", False):
        return True
    name = (getattr(shift_type, "name", "") or "").lower()
    return "night" in name or "nobet" in name or "gece" in name


def _get_shift_duration_hours(shift_type) -> float:
    direct = getattr(shift_type, "duration_hours", None)
    if direct is not None:
        try:
            return float(direct)
        except (TypeError, ValueError):
            pass

    if getattr(shift_type, "start_time", None) and getattr(shift_type, "end_time", None):
        today = datetime.now().date()
        start_dt = datetime.combine(today, shift_type.start_time)
        end_dt = datetime.combine(today, shift_type.end_time)
        if end_dt <= start_dt:
            end_dt += timedelta(days=1)
        return float((end_dt - start_dt).total_seconds() / 3600)

    return 0.0


def get_week_start(date_obj):
    return date_obj - timedelta(days=date_obj.weekday())


def is_staff_available(staff_profile, date_obj, shift_type=None, respect_availability=True):
    if not respect_availability:
        return True

    records = list(
        StaffAvailability.objects.filter(staff_profile=staff_profile, date=date_obj)
        .filter(Q(shift_type__isnull=True) | Q(shift_type=shift_type))
        .select_related("shift_type")
        .order_by("shift_type_id")
    )

    if not records:
        return True

    blocking_statuses = {
        StaffAvailability.AvailabilityStatus.UNAVAILABLE,
        StaffAvailability.AvailabilityStatus.LEAVE,
        StaffAvailability.AvailabilityStatus.PREFERRED_OFF,
    }

    for rec in records:
        if rec.shift_type_id is None:
            return rec.status not in blocking_statuses

    for rec in records:
        if rec.status in blocking_statuses:
            return False

    return True


def has_same_day_assignment(staff_profile, date_obj):
    return (
        WorkAssignment.objects.filter(staff_profile=staff_profile, assignment_date=date_obj)
        .exclude(status=WorkAssignment.Status.CANCELLED)
        .exists()
    )


def _get_weekly_limit(staff_profile) -> float:
    constraint = getattr(staff_profile, "constraint", None)
    if constraint and constraint.max_weekly_hours is not None:
        return float(constraint.max_weekly_hours)
    if getattr(staff_profile, "weekly_limit_hours", None) is not None:
        return float(staff_profile.weekly_limit_hours)
    if getattr(staff_profile, "weekly_hour_limit", None) is not None:
        return float(staff_profile.weekly_hour_limit)
    return 40.0


def exceeds_weekly_limit(staff_profile, date_obj, shift_type, respect_weekly_limit=True):
    if not respect_weekly_limit:
        return False

    week_start = get_week_start(date_obj)
    week_end = week_start + timedelta(days=6)
    used_qs = (
        WorkAssignment.objects.filter(
            staff_profile=staff_profile,
            assignment_date__range=[week_start, week_end],
        )
        .exclude(status=WorkAssignment.Status.CANCELLED)
        .select_related("shift_type")
    )
    used_hours = sum(_get_shift_duration_hours(item.shift_type) for item in used_qs)
    projected = float(used_hours) + _get_shift_duration_hours(shift_type)

    return projected > _get_weekly_limit(staff_profile)


def night_shift_allowed(staff_profile):
    constraint = getattr(staff_profile, "constraint", None)
    if constraint is not None:
        return bool(constraint.can_work_night)
    return True


def is_staff_eligible(staff_profile, assignment_date, shift_type, options=None):
    options = options or {}

    if not staff_profile.is_active:
        return False, "staff_inactive"

    if not _opt(options, "allow_double_shift_day", default=False):
        if has_same_day_assignment(staff_profile, assignment_date):
            return False, "already_assigned_same_day"

    respect_availability = bool(
        _opt(options, "respect_availability", "use_availability", default=True)
    )
    if not is_staff_available(
        staff_profile=staff_profile,
        date_obj=assignment_date,
        shift_type=shift_type,
        respect_availability=respect_availability,
    ):
        return False, "staff_unavailable"

    if _is_night_shift(shift_type) and not night_shift_allowed(staff_profile):
        return False, "night_not_allowed"

    respect_weekly_limit = bool(
        _opt(options, "respect_weekly_limit", "respectWeeklyLimit", default=True)
    )
    if exceeds_weekly_limit(
        staff_profile=staff_profile,
        date_obj=assignment_date,
        shift_type=shift_type,
        respect_weekly_limit=respect_weekly_limit,
    ):
        return False, "weekly_limit_exceeded"

    if _is_night_shift(shift_type) and not _opt(options, "allow_consecutive_night", default=False):
        previous_night = (
            WorkAssignment.objects.filter(
                staff_profile=staff_profile,
                assignment_date=assignment_date - timedelta(days=1),
                shift_type__is_night=True,
            )
            .exclude(status=WorkAssignment.Status.CANCELLED)
            .exists()
        )
        if previous_night:
            return False, "consecutive_night_block"

    return True, None
