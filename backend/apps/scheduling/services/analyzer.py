from collections import defaultdict
from datetime import timedelta

from apps.scheduling.models import StaffAvailability, WorkAssignment


def get_week_start(date_obj):
    return date_obj - timedelta(days=date_obj.weekday())


def get_shift_duration_hours(shift_type):
    start_minutes = shift_type.start_time.hour * 60 + shift_type.start_time.minute
    end_minutes = shift_type.end_time.hour * 60 + shift_type.end_time.minute
    diff = end_minutes - start_minutes
    if diff <= 0:
        diff += 24 * 60
    return diff / 60.0


def analyze_assignments(queryset, *, max_consecutive_days=6):
    issues = []

    assignments = list(
        queryset.select_related("staff_profile__user", "department", "shift_type").order_by(
            "staff_profile__user__first_name",
            "staff_profile__user__last_name",
            "staff_profile__user__username",
            "assignment_date",
            "shift_type__start_time",
        )
    )

    assignments = [a for a in assignments if a.status != WorkAssignment.Status.CANCELLED]
    if not assignments:
        return issues

    staff_ids = {item.staff_profile_id for item in assignments}
    dates = {item.assignment_date for item in assignments}
    availability_rows = StaffAvailability.objects.filter(
        staff_profile_id__in=staff_ids, date__in=dates
    ).values("staff_profile_id", "date", "status")
    availability_map = {
        (row["staff_profile_id"], row["date"]): row["status"] for row in availability_rows
    }

    # 1) Multiple assignments on same day.
    same_day_map = defaultdict(list)
    for item in assignments:
        key = (item.staff_profile_id, item.assignment_date)
        same_day_map[key].append(item)

    for (_staff_id, day), items in same_day_map.items():
        if len(items) > 1:
            first = items[0]
            issues.append(
                {
                    "type": "same_day_multiple",
                    "severity": "high",
                    "title": "Multiple assignments in same day",
                    "message": (
                        f"{first.staff_profile.full_name} has {len(items)} assignments on {day}."
                    ),
                    "staff": first.staff_profile.full_name,
                    "date": str(day),
                    "department": first.department.name,
                }
            )

    # 2) Weekly hour limit exceeded.
    weekly_hours = defaultdict(float)
    staff_cache = {}
    for item in assignments:
        week_start = get_week_start(item.assignment_date)
        key = (item.staff_profile_id, week_start)
        weekly_hours[key] += float(get_shift_duration_hours(item.shift_type))
        staff_cache[item.staff_profile_id] = item.staff_profile

    for (staff_id, week_start), total_hours in weekly_hours.items():
        staff = staff_cache[staff_id]
        weekly_limit = float(staff.weekly_limit_hours)
        if total_hours > weekly_limit:
            issues.append(
                {
                    "type": "weekly_limit_exceeded",
                    "severity": "high",
                    "title": "Weekly hour limit exceeded",
                    "message": (
                        f"{staff.full_name} has {round(total_hours, 2)} hours in week "
                        f"starting {week_start}. Limit is {weekly_limit}."
                    ),
                    "staff": staff.full_name,
                    "date": str(week_start),
                    "department": staff.department.name if staff.department else "-",
                }
            )

    # 3) Availability conflict.
    for item in assignments:
        status = availability_map.get((item.staff_profile_id, item.assignment_date))
        if status == StaffAvailability.AvailabilityStatus.UNAVAILABLE:
            issues.append(
                {
                    "type": "availability_conflict",
                    "severity": "high",
                    "title": "Availability conflict",
                    "message": (
                        f"{item.staff_profile.full_name} is unavailable on "
                        f"{item.assignment_date} but has an assignment."
                    ),
                    "staff": item.staff_profile.full_name,
                    "date": str(item.assignment_date),
                    "department": item.department.name,
                }
            )
        elif status == StaffAvailability.AvailabilityStatus.PREFERRED:
            issues.append(
                {
                    "type": "availability_preference_conflict",
                    "severity": "medium",
                    "title": "Preference conflict",
                    "message": (
                        f"{item.staff_profile.full_name} marked {item.assignment_date} "
                        "as preferred, but assignment may still need review."
                    ),
                    "staff": item.staff_profile.full_name,
                    "date": str(item.assignment_date),
                    "department": item.department.name,
                }
            )

    # 4) Too many consecutive working days.
    grouped = defaultdict(list)
    for item in assignments:
        grouped[item.staff_profile_id].append(item)

    for _staff_id, items in grouped.items():
        items = sorted(items, key=lambda x: x.assignment_date)
        staff = items[0].staff_profile

        streak = 1
        for idx in range(1, len(items)):
            prev_day = items[idx - 1].assignment_date
            current_day = items[idx].assignment_date

            if current_day == prev_day + timedelta(days=1):
                streak += 1
            elif current_day != prev_day:
                streak = 1

            if streak > max_consecutive_days:
                issues.append(
                    {
                        "type": "consecutive_days_exceeded",
                        "severity": "medium",
                        "title": "Consecutive day limit exceeded",
                        "message": (
                            f"{staff.full_name} has {streak} consecutive work days. "
                            f"Limit is {max_consecutive_days}."
                        ),
                        "staff": staff.full_name,
                        "date": str(current_day),
                        "department": staff.department.name if staff.department else "-",
                    }
                )

    severity_order = {"high": 0, "medium": 1, "low": 2}
    issues.sort(key=lambda item: (severity_order.get(item["severity"], 3), item["date"]))
    return issues
