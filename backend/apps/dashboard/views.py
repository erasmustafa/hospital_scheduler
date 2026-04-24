from collections import defaultdict
from datetime import date, timedelta
import calendar

from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render
from django.template import TemplateDoesNotExist
from django.utils import timezone

from apps.scheduling.models import AvailabilityRequest, MessageChannel, WorkAssignment
from apps.staff.models import StaffProfile


def _get_dashboard_scopes(user):
    staff_profile = StaffProfile.objects.filter(user=user).select_related("department").first()

    assignment_scope = WorkAssignment.objects.select_related(
        "staff_profile__user", "department", "shift_type"
    )
    staff_scope = StaffProfile.objects.select_related("department")
    pending_request_scope = AvailabilityRequest.objects.select_related(
        "staff_profile__user", "shift_type"
    )

    if not user.is_superuser and staff_profile:
        if staff_profile.can_manage_department and staff_profile.department_id:
            assignment_scope = assignment_scope.filter(department=staff_profile.department)
            staff_scope = staff_scope.filter(department=staff_profile.department)
            pending_request_scope = pending_request_scope.filter(
                staff_profile__department=staff_profile.department
            )
        else:
            assignment_scope = assignment_scope.filter(staff_profile=staff_profile)
            staff_scope = staff_scope.filter(pk=staff_profile.pk)
            pending_request_scope = pending_request_scope.filter(staff_profile=staff_profile)

    return assignment_scope, staff_scope, pending_request_scope


def _format_turkish_full_date(value):
    weekdays = ["Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi", "Pazar"]
    months = [
        "Ocak",
        "Subat",
        "Mart",
        "Nisan",
        "Mayis",
        "Haziran",
        "Temmuz",
        "Agustos",
        "Eylul",
        "Ekim",
        "Kasim",
        "Aralik",
    ]
    return f"{value.day} {months[value.month - 1]} {value.year}, {weekdays[value.weekday()]}"


def _format_turkish_short_date(value):
    months = [
        "Ocak",
        "Subat",
        "Mart",
        "Nisan",
        "Mayis",
        "Haziran",
        "Temmuz",
        "Agustos",
        "Eylul",
        "Ekim",
        "Kasim",
        "Aralik",
    ]
    return f"{value.day} {months[value.month - 1]} {value.year}"


def _build_relative_day_label(value, today):
    delta = (today - timezone.localtime(value).date()).days
    if delta <= 0:
        return "Bugun"
    if delta == 1:
        return "Dun"
    return f"{delta} gun once"


def _json_summary_payload(
    *,
    is_department_manager,
    greeting_name,
    page_subtitle,
    active_staff_count,
    today_assignment_count,
    tonight_oncall_count,
    pending_leave_count,
    personal_month_shift_count,
    personal_month_night_count,
    remaining_leave_days,
    upcoming_sections,
    announcement_messages,
    mini_calendar_data,
    year,
    month,
):
    return {
        "isDepartmentManager": is_department_manager,
        "greetingName": greeting_name,
        "subtitle": page_subtitle,
        "stats": {
            "activeStaff": active_staff_count,
            "todayAssignments": today_assignment_count,
            "tonightOncall": tonight_oncall_count,
            "pendingLeave": pending_leave_count,
            "monthShiftCount": personal_month_shift_count,
            "monthNightCount": personal_month_night_count,
            "remainingLeaveDays": remaining_leave_days,
        },
        "upcomingSections": upcoming_sections,
        "announcements": announcement_messages,
        "miniCalendar": {
            "year": year,
            "month": month,
            "data": mini_calendar_data,
        },
    }


def dashboard_view(request):
    if not getattr(request, "user", None) or request.user.is_anonymous:
        return JsonResponse({"detail": "Authentication required."}, status=401)

    today = timezone.localdate()
    assignment_scope, staff_scope, pending_request_scope = _get_dashboard_scopes(request.user)
    staff_profile = StaffProfile.objects.filter(user=request.user).select_related("department").first()
    is_department_manager = bool(
        request.user.is_superuser or (staff_profile and staff_profile.can_manage_department)
    )

    year = today.year
    month = today.month

    month_start = date(year, month, 1)
    month_end = date(year, month, calendar.monthrange(year, month)[1])

    qs = assignment_scope.filter(assignment_date__range=(month_start, month_end)).order_by(
        "assignment_date", "shift_type__start_time"
    )

    active_staff_count = staff_scope.filter(is_active=True).count()
    today_assignment_count = assignment_scope.filter(assignment_date=today).exclude(
        status=WorkAssignment.Status.CANCELLED
    ).count()
    tonight_oncall_count = assignment_scope.filter(assignment_date=today).exclude(
        status=WorkAssignment.Status.CANCELLED
    ).filter(
        Q(shift_type__is_night=True)
        | Q(shift_type__name__icontains="nobet")
        | Q(shift_type__name__icontains="nobet")
    ).count()
    pending_leave_count = pending_request_scope.filter(
        approval_status=AvailabilityRequest.ApprovalStatus.PENDING
    ).count()

    monthly_assignments = assignment_scope.filter(
        assignment_date__range=(month_start, month_end)
    ).exclude(status=WorkAssignment.Status.CANCELLED)
    personal_month_shift_count = monthly_assignments.values("assignment_date").distinct().count()
    personal_month_night_count = monthly_assignments.filter(
        Q(shift_type__is_night=True)
        | Q(shift_type__name__icontains="nobet")
        | Q(shift_type__name__icontains="nobet")
    ).count()
    personal_upcoming_assignments = (
        assignment_scope.filter(assignment_date__gte=today)
        .exclude(status=WorkAssignment.Status.CANCELLED)
        .order_by("assignment_date", "shift_type__start_time")[:2]
    )
    today_primary_assignment = (
        assignment_scope.filter(assignment_date=today)
        .exclude(status=WorkAssignment.Status.CANCELLED)
        .order_by("shift_type__start_time")
        .first()
    )

    calendar_map = defaultdict(list)
    for item in qs:
        day_key = item.assignment_date.isoformat()
        shift_name = item.shift_type.name if item.shift_type else ""
        calendar_map[day_key].append(
            {
                "staff_name": item.staff_profile.full_name if item.staff_profile else "",
                "department": item.department.name if item.department else "",
                "shift_name": shift_name,
                "is_night": bool(item.shift_type and item.shift_type.is_night)
                or ("nobet" in shift_name.lower()),
            }
        )

    mini_calendar_data = {}
    for day_key, rows in calendar_map.items():
        mini_calendar_data[day_key] = {
            "count": len(rows),
            "items": rows[:5],
            "has_night": any(row["is_night"] for row in rows),
        }

    annual_leave_allowance = 14
    used_leave_days = 0
    approved_leave_requests = pending_request_scope.filter(
        approval_status=AvailabilityRequest.ApprovalStatus.APPROVED,
        request_type=AvailabilityRequest.RequestType.LEAVE,
        start_date__year=today.year,
    )
    for request_obj in approved_leave_requests:
        used_leave_days += (request_obj.end_date - request_obj.start_date).days + 1
    remaining_leave_days = max(0, annual_leave_allowance - used_leave_days)

    upcoming_sections = []
    section_map = {}
    for item in personal_upcoming_assignments:
        if item.assignment_date == today:
            section_title = "Bugun"
        elif item.assignment_date == today + timedelta(days=1):
            section_title = "Yarin"
        else:
            section_title = _format_turkish_short_date(item.assignment_date)

        if section_title not in section_map:
            section_map[section_title] = []
            upcoming_sections.append({"title": section_title, "items": section_map[section_title]})

        start_time = item.shift_type.start_time.strftime("%H:%M") if item.shift_type else ""
        end_time = item.shift_type.end_time.strftime("%H:%M") if item.shift_type else ""
        section_map[section_title].append(
            {
                "time": start_time,
                "time_range": f"{start_time} - {end_time}".strip(),
                "shift_name": item.shift_type.name if item.shift_type else "Vardiya",
                "department_name": item.department.name if item.department else "",
                "is_night": bool(item.shift_type and item.shift_type.is_night),
            }
        )

    announcement_messages = []
    announcement_channel = (
        MessageChannel.objects.filter(
            channel_type=MessageChannel.ChannelType.ANNOUNCEMENT,
            is_active=True,
        )
        .prefetch_related("messages__sender")
        .first()
    )
    if announcement_channel:
        recent_messages = announcement_channel.messages.select_related("sender").order_by(
            "-created_at"
        )[:2]
        for message in recent_messages:
            announcement_messages.append(
                {
                    "title": (message.body or "").splitlines()[0][:68] or "Yeni duyuru",
                    "body": (message.body or "")[:140],
                    "relative_label": _build_relative_day_label(message.created_at, today),
                }
            )

    greeting_name = (
        (staff_profile.full_name.split()[0] if staff_profile and staff_profile.full_name else "")
        or request.user.first_name
        or request.user.username
    )
    page_subtitle = f"Iyi calismalar! Bugun {_format_turkish_full_date(today)}"
    template_name = (
        "dashboard/admin_dashboard.html"
        if is_department_manager
        else "dashboard/staff_dashboard.html"
    )

    context = {
        "is_department_manager": is_department_manager,
        "staff_profile": staff_profile,
        "greeting_name": greeting_name,
        "staff_dashboard_subtitle": page_subtitle,
        "active_staff_count": active_staff_count,
        "today_assignment_count": today_assignment_count,
        "tonight_oncall_count": tonight_oncall_count,
        "pending_leave_count": pending_leave_count,
        "personal_month_shift_count": personal_month_shift_count,
        "personal_month_night_count": personal_month_night_count,
        "remaining_leave_days": remaining_leave_days,
        "today_primary_assignment": today_primary_assignment,
        "announcement_messages": announcement_messages,
        "upcoming_sections": upcoming_sections,
        "mini_calendar_data": mini_calendar_data,
        "mini_calendar_year": year,
        "mini_calendar_month": month,
    }

    if request.GET.get("format") == "json":
        return JsonResponse(
            _json_summary_payload(
                is_department_manager=is_department_manager,
                greeting_name=greeting_name,
                page_subtitle=page_subtitle,
                active_staff_count=active_staff_count,
                today_assignment_count=today_assignment_count,
                tonight_oncall_count=tonight_oncall_count,
                pending_leave_count=pending_leave_count,
                personal_month_shift_count=personal_month_shift_count,
                personal_month_night_count=personal_month_night_count,
                remaining_leave_days=remaining_leave_days,
                upcoming_sections=upcoming_sections,
                announcement_messages=announcement_messages,
                mini_calendar_data=mini_calendar_data,
                year=year,
                month=month,
            )
        )

    try:
        return render(request, template_name, context)
    except TemplateDoesNotExist:
        return JsonResponse(
            _json_summary_payload(
                is_department_manager=is_department_manager,
                greeting_name=greeting_name,
                page_subtitle=page_subtitle,
                active_staff_count=active_staff_count,
                today_assignment_count=today_assignment_count,
                tonight_oncall_count=tonight_oncall_count,
                pending_leave_count=pending_leave_count,
                personal_month_shift_count=personal_month_shift_count,
                personal_month_night_count=personal_month_night_count,
                remaining_leave_days=remaining_leave_days,
                upcoming_sections=upcoming_sections,
                announcement_messages=announcement_messages,
                mini_calendar_data=mini_calendar_data,
                year=year,
                month=month,
            )
        )


def mini_calendar_data_api(request):
    if not getattr(request, "user", None) or request.user.is_anonymous:
        return JsonResponse({"detail": "Authentication required."}, status=401)

    today = timezone.localdate()
    assignment_scope, _, _ = _get_dashboard_scopes(request.user)

    try:
        year = int(request.GET.get("year", today.year))
        month = int(request.GET.get("month", today.month))
        month = max(1, min(12, month))
    except (TypeError, ValueError):
        year = today.year
        month = today.month

    month_start = date(year, month, 1)
    month_end = date(year, month, calendar.monthrange(year, month)[1])

    qs = assignment_scope.filter(assignment_date__range=(month_start, month_end))
    calendar_map = defaultdict(list)

    for item in qs:
        key = item.assignment_date.isoformat()
        shift_name = item.shift_type.name if item.shift_type else ""
        calendar_map[key].append(
            {
                "staff_name": item.staff_profile.full_name if item.staff_profile else "",
                "shift_name": shift_name,
                "department": item.department.name if item.department else "",
                "is_night": bool(item.shift_type and item.shift_type.is_night)
                or ("nobet" in shift_name.lower()),
            }
        )

    result = {}
    for key, rows in calendar_map.items():
        result[key] = {
            "count": len(rows),
            "items": rows[:5],
            "has_night": any(row["is_night"] for row in rows),
        }

    return JsonResponse(result)

