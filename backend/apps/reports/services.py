from datetime import timedelta

from django.utils import timezone

from apps.scheduling.models import WorkAssignment
from apps.scheduling.services import analyze_assignments
from apps.staff.models import StaffProfile
from common.utils import parse_date_safe


def parse_report_range(date_from_raw, date_to_raw):
    today = timezone.localdate()
    date_from = parse_date_safe(date_from_raw or "") or (today - timedelta(days=30))
    date_to = parse_date_safe(date_to_raw or "") or (today + timedelta(days=30))
    return date_from, date_to


def build_operational_report(
    *,
    date_from=None,
    date_to=None,
    department_id=None,
    status_filter=None,
):
    assignments_qs = WorkAssignment.objects.select_related(
        "staff_profile__user",
        "department",
        "shift_type",
    ).all()
    staff_qs = StaffProfile.objects.filter(is_active=True)

    if date_from:
        assignments_qs = assignments_qs.filter(assignment_date__gte=date_from)
    if date_to:
        assignments_qs = assignments_qs.filter(assignment_date__lte=date_to)
    if department_id:
        assignments_qs = assignments_qs.filter(department_id=department_id)
        staff_qs = staff_qs.filter(department_id=department_id)
    if status_filter:
        assignments_qs = assignments_qs.filter(status=status_filter)

    assignments = list(assignments_qs)
    issues = analyze_assignments(assignments_qs)

    by_status = {}
    by_department = {}
    by_shift_type = {}
    for assignment in assignments:
        by_status[assignment.status] = by_status.get(assignment.status, 0) + 1
        by_department[assignment.department.name] = (
            by_department.get(assignment.department.name, 0) + 1
        )
        by_shift_type[assignment.shift_type.name] = (
            by_shift_type.get(assignment.shift_type.name, 0) + 1
        )

    severity_totals = {"high": 0, "medium": 0, "low": 0}
    for issue in issues:
        severity = issue.get("severity", "low")
        severity_totals[severity] = severity_totals.get(severity, 0) + 1

    return {
        "summary": {
            "activeStaff": staff_qs.count(),
            "totalAssignments": len(assignments),
            "plannedAssignments": sum(1 for item in assignments if item.status == "planned"),
            "approvedAssignments": sum(1 for item in assignments if item.status == "approved"),
            "cancelledAssignments": sum(1 for item in assignments if item.status == "cancelled"),
            "totalIssues": len(issues),
            "highSeverityIssues": severity_totals.get("high", 0),
            "mediumSeverityIssues": severity_totals.get("medium", 0),
            "lowSeverityIssues": severity_totals.get("low", 0),
        },
        "byStatus": [
            {"label": key, "count": value}
            for key, value in sorted(by_status.items(), key=lambda item: item[0])
        ],
        "byDepartment": [
            {"label": key, "count": value}
            for key, value in sorted(by_department.items(), key=lambda item: item[0])
        ],
        "byShiftType": [
            {"label": key, "count": value}
            for key, value in sorted(by_shift_type.items(), key=lambda item: item[0])
        ],
        "issues": issues,
        "range": {
            "dateFrom": date_from.isoformat() if date_from else None,
            "dateTo": date_to.isoformat() if date_to else None,
            "departmentId": int(department_id) if department_id else None,
            "status": status_filter or None,
        },
    }
