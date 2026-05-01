from io import BytesIO

from django.db import transaction
from django.db.models import Q
from datetime import datetime, timedelta
from calendar import monthrange
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from apps.departments.models import Department
from apps.staff.models import StaffProfile
from common.permissions import IsAdminOrReadOnly
from common.services import publish_event
from common.utils import parse_date_safe

from .models import (
    AvailabilityRequest,
    Holiday,
    ShiftType,
    StaffAvailability,
    UnitRequirement,
    WorkAssignment,
)
from .serializers import (
    AvailabilityRequestSerializer,
    AutoScheduleRequestSerializer,
    ShiftTypeSerializer,
    StaffAvailabilitySerializer,
    UnitRequirementSerializer,
    WorkAssignmentSerializer,
)
from .services import (
    analyze_assignments,
    generate_schedule_preview,
    save_generated_schedule,
    serialize_preview_items,
)
from .services.excel_templates import build_dynamic_assignment_workbook


def _emit_assignment_event(event_type: str, assignment: WorkAssignment) -> None:
    payload = WorkAssignmentSerializer(assignment).data
    publish_event("schedule_global", event_type, payload)


def _create_assignment_notification(assignment: WorkAssignment, action: str) -> None:
    recipient = assignment.staff_profile.user
    notification = Notification.objects.create(
        recipient=recipient,
        event_type=Notification.EventType.ASSIGNMENT_UPDATE,
        title=f"Assignment {action}",
        message=(
            f"{assignment.shift_type.name} shift on {assignment.assignment_date.isoformat()} "
            f"is {action}."
        ),
        metadata={"assignmentId": assignment.id, "status": assignment.status},
    )
    publish_event(
        f"notifications_{recipient.id}",
        "notification.new",
        {"notification": NotificationSerializer(notification).data},
    )


def _first_present(payload, *keys):
    for key in keys:
        value = payload.get(key)
        if value not in (None, ""):
            return value
    return None


def _coerce_date(value):
    if value in (None, ""):
        return None
    if hasattr(value, "year") and hasattr(value, "month") and hasattr(value, "day"):
        return value
    return parse_date_safe(str(value))


def _apply_assignment_filters(queryset, payload):
    department_id = _first_present(payload, "departmentId", "department_id", "department")
    start_date = _coerce_date(_first_present(payload, "startDate", "start_date"))
    end_date = _coerce_date(_first_present(payload, "endDate", "end_date"))

    if department_id:
        queryset = queryset.filter(department_id=department_id)
    if start_date and end_date:
        queryset = queryset.filter(assignment_date__range=[start_date, end_date])
    elif start_date:
        queryset = queryset.filter(assignment_date__gte=start_date)
    elif end_date:
        queryset = queryset.filter(assignment_date__lte=end_date)

    return queryset


def _get_actor_staff_profile(user):
    if not user or not user.is_authenticated:
        return None
    return StaffProfile.objects.select_related("department").filter(user=user).first()


def _apply_staff_scope(queryset, user):
    if user.is_superuser:
        return queryset

    profile = _get_actor_staff_profile(user)
    if not profile:
        return queryset.none()

    if profile.can_manage_department and profile.department_id:
        return queryset.filter(staff_profile__department_id=profile.department_id)

    return queryset.filter(staff_profile=profile)


def _parse_calendar_boundary(raw_value: str):
    if not raw_value:
        return None
    if "T" in raw_value:
        raw_value = raw_value.split("T", 1)[0]
    return parse_date_safe(raw_value)


def _build_assignment_window(assignment_date, shift_type: ShiftType):
    tz = timezone.get_current_timezone()
    start_dt = datetime.combine(assignment_date, shift_type.start_time)
    end_dt = datetime.combine(assignment_date, shift_type.end_time)
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)

    if timezone.is_naive(start_dt):
        start_dt = timezone.make_aware(start_dt, tz)
    if timezone.is_naive(end_dt):
        end_dt = timezone.make_aware(end_dt, tz)
    return start_dt, end_dt


def _build_calendar_event_window(assignment_date, shift_type: ShiftType):
    start_dt, end_dt = _build_assignment_window(assignment_date, shift_type)

    # Month/day-grid rendering should keep overnight shifts inside the day cell
    # where they start, even if the actual shift ends the next morning.
    if end_dt.date() != start_dt.date():
        end_dt = start_dt.replace(hour=23, minute=59, second=0, microsecond=0)

    return start_dt, end_dt


def _has_window_overlap(start_a, end_a, start_b, end_b) -> bool:
    return start_a < end_b and start_b < end_a


def _is_night_shift(shift_type: ShiftType) -> bool:
    if bool(getattr(shift_type, "is_night", False)):
        return True
    if bool(getattr(shift_type, "is_night_shift", False)):
        return True
    name = (getattr(shift_type, "name", "") or "").lower()
    return ("night" in name) or ("nobet" in name) or ("gece" in name)


def _shift_duration_hours(shift_type: ShiftType) -> float:
    direct = getattr(shift_type, "duration_hours", None)
    if direct is not None:
        try:
            return float(direct)
        except (TypeError, ValueError):
            pass
    start_dt, end_dt = _build_assignment_window(timezone.localdate(), shift_type)
    return float((end_dt - start_dt).total_seconds() / 3600)


def _weekly_limit_hours(staff_profile: StaffProfile) -> float:
    constraint = getattr(staff_profile, "constraint", None)
    if constraint and constraint.max_weekly_hours is not None:
        return float(constraint.max_weekly_hours)
    if getattr(staff_profile, "weekly_limit_hours", None) is not None:
        return float(staff_profile.weekly_limit_hours)
    if getattr(staff_profile, "weekly_hour_limit", None) is not None:
        return float(staff_profile.weekly_hour_limit)
    return 40.0


def _max_consecutive_days_limit(staff_profile: StaffProfile) -> int:
    constraint = getattr(staff_profile, "constraint", None)
    if constraint and getattr(constraint, "max_consecutive_days", None):
        return int(constraint.max_consecutive_days)
    return 6


def _min_rest_hours_limit(staff_profile: StaffProfile) -> int:
    constraint = getattr(staff_profile, "constraint", None)
    if constraint and getattr(constraint, "min_rest_hours", None):
        return int(constraint.min_rest_hours)
    return 12


def _count_weekdays_in_range(start_date, end_date) -> int:
    day_count = 0
    current = start_date
    while current <= end_date:
        if current.weekday() < 5:
            day_count += 1
        current += timedelta(days=1)
    return day_count


def _get_monthly_required_hours(target_date):
    last_day = monthrange(target_date.year, target_date.month)[1]
    weekday_count = _count_weekdays_in_range(
        target_date.replace(day=1),
        target_date.replace(day=last_day),
    )
    return {
        "weekday_count": weekday_count,
        "required_hours": float(weekday_count * 8),
    }


def _night_shift_allowed(staff_profile: StaffProfile) -> bool:
    if bool(getattr(staff_profile, "cannot_work_night", False)):
        return False
    if bool(getattr(staff_profile, "is_new_mother", False)):
        return False
    constraint = getattr(staff_profile, "constraint", None)
    if constraint is not None:
        return bool(getattr(constraint, "can_work_night", True))
    return True


def _staged_has_night_assignment(staged_assignments, target_date) -> bool:
    for staged_date, staged_shift in staged_assignments:
        if staged_date == target_date and _is_night_shift(staged_shift):
            return True
    return False


def _validate_staff_rules_for_candidate(
    *,
    staff_profile: StaffProfile,
    target_date,
    shift_type: ShiftType,
    exclude_ids=None,
    staged_assignments=None,
):
    exclude_ids = set(exclude_ids or [])
    staged_assignments = list(staged_assignments or [])

    if not staff_profile.is_active:
        return "Personel aktif degil."

    # 1) Same-day and overlap checks.
    candidate_start, candidate_end = _build_assignment_window(target_date, shift_type)
    nearby_qs = (
        WorkAssignment.objects.select_related("shift_type")
        .filter(
            staff_profile=staff_profile,
            assignment_date__range=[target_date - timedelta(days=2), target_date + timedelta(days=2)],
        )
        .exclude(status=WorkAssignment.Status.CANCELLED)
    )
    if exclude_ids:
        nearby_qs = nearby_qs.exclude(pk__in=exclude_ids)
    nearby_items = list(nearby_qs)

    for item in nearby_items:
        if item.assignment_date == target_date:
            return "Bu personelin hedef gunde zaten vardiyasi var."
        existing_start, existing_end = _build_assignment_window(item.assignment_date, item.shift_type)
        if _has_window_overlap(candidate_start, candidate_end, existing_start, existing_end):
            return "Bu personelin hedef tarihte cakisan vardiyasi var."

    for staged_date, staged_shift in staged_assignments:
        if staged_date == target_date:
            return "Bu personelin hedef gunde zaten vardiyasi var."
        staged_start, staged_end = _build_assignment_window(staged_date, staged_shift)
        if _has_window_overlap(candidate_start, candidate_end, staged_start, staged_end):
            return "Bu personelin hedef tarihte cakisan vardiyasi var."

    # 2) Availability restrictions.
    availability_conflict = (
        StaffAvailability.objects.filter(staff_profile=staff_profile, date=target_date)
        .filter(Q(shift_type__isnull=True) | Q(shift_type=shift_type))
        .filter(
            status__in=[
                StaffAvailability.AvailabilityStatus.UNAVAILABLE,
                StaffAvailability.AvailabilityStatus.LEAVE,
                StaffAvailability.AvailabilityStatus.PREFERRED_OFF,
            ]
        )
        .exists()
    )
    if availability_conflict:
        return "Personel hedef tarihte uygun degil."

    # 3) Night eligibility.
    if _is_night_shift(shift_type) and not _night_shift_allowed(staff_profile):
        return "Personel gece nobeti alamaz."

    # 4) Consecutive night restriction (previous-day night blocked).
    if _is_night_shift(shift_type):
        prev_day = target_date - timedelta(days=1)
        prev_night_exists = (
            WorkAssignment.objects.filter(
                staff_profile=staff_profile,
                assignment_date=prev_day,
            )
            .exclude(status=WorkAssignment.Status.CANCELLED)
            .filter(
                Q(shift_type__is_night=True)
                | Q(shift_type__name__icontains="nobet")
                | Q(shift_type__name__icontains="gece")
                | Q(shift_type__name__icontains="night")
            )
        )
        if exclude_ids:
            prev_night_exists = prev_night_exists.exclude(pk__in=exclude_ids)
        if prev_night_exists.exists() or _staged_has_night_assignment(staged_assignments, prev_day):
            return "Ardisik gece nobeti yasagi nedeniyle islem yapilamadi."

    # 5) Weekly hour limit.
    week_start = target_date - timedelta(days=target_date.weekday())
    week_end = week_start + timedelta(days=6)
    weekly_items_qs = (
        WorkAssignment.objects.select_related("shift_type")
        .filter(
            staff_profile=staff_profile,
            assignment_date__range=[week_start, week_end],
        )
        .exclude(status=WorkAssignment.Status.CANCELLED)
    )
    if exclude_ids:
        weekly_items_qs = weekly_items_qs.exclude(pk__in=exclude_ids)
    used_hours = sum(_shift_duration_hours(item.shift_type) for item in weekly_items_qs)
    staged_hours = sum(
        _shift_duration_hours(staged_shift)
        for staged_date, staged_shift in staged_assignments
        if week_start <= staged_date <= week_end
    )
    projected_hours = float(used_hours) + float(staged_hours) + _shift_duration_hours(shift_type)
    if projected_hours > _weekly_limit_hours(staff_profile):
        return "Haftalik saat limiti asiliyor."

    # 6) Max consecutive days.
    all_dates = {item.assignment_date for item in weekly_items_qs}
    all_dates.add(target_date)
    for staged_date, _staged_shift in staged_assignments:
        all_dates.add(staged_date)

    if all_dates:
        sorted_dates = sorted(all_dates)
        streak = 1
        max_streak = 1
        for idx in range(1, len(sorted_dates)):
            if sorted_dates[idx] == sorted_dates[idx - 1] + timedelta(days=1):
                streak += 1
                max_streak = max(max_streak, streak)
            elif sorted_dates[idx] != sorted_dates[idx - 1]:
                streak = 1
        if max_streak > _max_consecutive_days_limit(staff_profile):
            return "Ardisik calisma gunu limiti asiliyor."

    # 7) Minimum rest hours.
    min_rest_hours = _min_rest_hours_limit(staff_profile)
    if min_rest_hours > 0:
        check_windows = []
        for item in nearby_items:
            existing_start, existing_end = _build_assignment_window(item.assignment_date, item.shift_type)
            check_windows.append((existing_start, existing_end))
        for staged_date, staged_shift in staged_assignments:
            staged_start, staged_end = _build_assignment_window(staged_date, staged_shift)
            check_windows.append((staged_start, staged_end))

        for other_start, other_end in check_windows:
            if other_end <= candidate_start:
                gap_hours = (candidate_start - other_end).total_seconds() / 3600
            elif candidate_end <= other_start:
                gap_hours = (other_start - candidate_end).total_seconds() / 3600
            else:
                # Overlap is already blocked above.
                continue
            if gap_hours < min_rest_hours:
                return "Minimum dinlenme suresi kurali ihlal ediliyor."

    return None


def _staff_has_assignment_conflict(
    staff_profile: StaffProfile,
    target_date,
    shift_type: ShiftType,
    exclude_ids=None,
) -> bool:
    exclude_ids = set(exclude_ids or [])
    target_start, target_end = _build_assignment_window(target_date, shift_type)

    nearby_assignments = WorkAssignment.objects.select_related("shift_type").filter(
        staff_profile=staff_profile,
        assignment_date__range=[target_date - timedelta(days=1), target_date + timedelta(days=1)],
    )
    if exclude_ids:
        nearby_assignments = nearby_assignments.exclude(pk__in=exclude_ids)

    for existing in nearby_assignments:
        existing_start, existing_end = _build_assignment_window(
            existing.assignment_date, existing.shift_type
        )
        if _has_window_overlap(target_start, target_end, existing_start, existing_end):
            return True
    return False


def _staff_has_unavailability(staff_profile: StaffProfile, target_date) -> bool:
    return StaffAvailability.objects.filter(
        staff_profile=staff_profile,
        date=target_date,
        status__in=[
            StaffAvailability.AvailabilityStatus.UNAVAILABLE,
            StaffAvailability.AvailabilityStatus.LEAVE,
        ],
    ).exists()


def _ensure_assignment_manage_permission(user, assignment: WorkAssignment):
    if user.is_superuser:
        return None

    actor_profile = _get_actor_staff_profile(user)
    if not actor_profile:
        return "Personel profili bulunamadi."

    if not actor_profile.can_manage_department:
        return "Bu islem icin yetkiniz yok."

    if actor_profile.department_id != assignment.department_id:
        return "Sadece kendi biriminizdeki vardiyalari yonetebilirsiniz."

    return None


class ShiftTypeListCreateView(generics.ListCreateAPIView):
    queryset = ShiftType.objects.all()
    serializer_class = ShiftTypeSerializer
    permission_classes = [IsAdminOrReadOnly]

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({"shiftTypes": response.data}, status=response.status_code)


class ShiftTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ShiftType.objects.all()
    serializer_class = ShiftTypeSerializer
    permission_classes = [IsAdminOrReadOnly]


class UnitRequirementListCreateView(generics.ListCreateAPIView):
    serializer_class = UnitRequirementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = UnitRequirement.objects.select_related("department", "shift_type").all()
        department_id = self.request.query_params.get("department")
        shift_type_id = self.request.query_params.get("shift_type")
        is_active = self.request.query_params.get("is_active")

        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if shift_type_id:
            queryset = queryset.filter(shift_type_id=shift_type_id)
        if is_active in {"true", "false"}:
            queryset = queryset.filter(is_active=is_active == "true")

        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({"unitRequirements": response.data}, status=response.status_code)


class UnitRequirementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = UnitRequirement.objects.select_related("department", "shift_type").all()
    serializer_class = UnitRequirementSerializer
    permission_classes = [IsAuthenticated]


class WorkAssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = WorkAssignment.objects.select_related(
            "staff_profile__user", "department", "shift_type"
        ).all()

        date_from = parse_date_safe(self.request.query_params.get("date_from", ""))
        date_to = parse_date_safe(self.request.query_params.get("date_to", ""))
        department_id = self.request.query_params.get("department")
        staff_profile_id = self.request.query_params.get("staff")
        status_filter = self.request.query_params.get("status")

        if date_from:
            queryset = queryset.filter(assignment_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(assignment_date__lte=date_to)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if staff_profile_id:
            queryset = queryset.filter(staff_profile_id=staff_profile_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        assignment = serializer.save(
            created_by=self.request.user if self.request.user.is_authenticated else None
        )
        _emit_assignment_event("assignment.created", assignment)
        _create_assignment_notification(assignment, "created")

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({"assignments": response.data}, status=response.status_code)


class WorkAssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WorkAssignment.objects.select_related(
        "staff_profile__user", "department", "shift_type"
    ).all()
    serializer_class = WorkAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        assignment = serializer.save()
        _emit_assignment_event("assignment.updated", assignment)
        _create_assignment_notification(assignment, "updated")

    def perform_destroy(self, instance):
        _create_assignment_notification(instance, "deleted")
        payload = {"id": instance.id}
        instance.delete()
        publish_event("schedule_global", "assignment.deleted", payload)


class StaffAvailabilityListCreateView(generics.ListCreateAPIView):
    serializer_class = StaffAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = StaffAvailability.objects.select_related("staff_profile__user").all()
        staff_profile_id = self.request.query_params.get("staffProfileId")
        date_from = parse_date_safe(self.request.query_params.get("date_from", ""))
        date_to = parse_date_safe(self.request.query_params.get("date_to", ""))
        if staff_profile_id:
            queryset = queryset.filter(staff_profile_id=staff_profile_id)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        return queryset

    def perform_create(self, serializer):
        availability = serializer.save()
        publish_event(
            "schedule_global",
            "availability.created",
            {
                "id": availability.id,
                "staffProfileId": availability.staff_profile_id,
                "date": availability.date.isoformat(),
                "status": availability.status,
            },
        )

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({"availability": response.data}, status=response.status_code)


class StaffAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StaffAvailability.objects.select_related("staff_profile__user").all()
    serializer_class = StaffAvailabilitySerializer
    permission_classes = [IsAuthenticated]


class AvailabilityRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = AvailabilityRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = AvailabilityRequest.objects.select_related(
            "staff_profile__user",
            "staff_profile__department",
            "shift_type",
            "created_by",
            "reviewed_by",
        ).all()
        queryset = _apply_staff_scope(queryset, self.request.user)

        staff_profile_id = self.request.query_params.get("staffProfileId")
        approval_status = self.request.query_params.get("approvalStatus")
        date_from = parse_date_safe(self.request.query_params.get("startDate", ""))
        date_to = parse_date_safe(self.request.query_params.get("endDate", ""))

        if staff_profile_id:
            queryset = queryset.filter(staff_profile_id=staff_profile_id)
        if approval_status in AvailabilityRequest.ApprovalStatus.values:
            queryset = queryset.filter(approval_status=approval_status)
        if date_from:
            queryset = queryset.filter(end_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(start_date__lte=date_to)

        return queryset

    def perform_create(self, serializer):
        actor_profile = _get_actor_staff_profile(self.request.user)
        requested_profile = serializer.validated_data.get("staff_profile")

        if self.request.user.is_superuser:
            target_profile = requested_profile or actor_profile
            if not target_profile:
                raise ValidationError({"staffProfileId": "A valid staff profile is required."})
        else:
            if not actor_profile:
                raise PermissionDenied("No staff profile is linked to the current user.")

            if actor_profile.can_manage_department and actor_profile.department_id:
                if (
                    requested_profile
                    and requested_profile.department_id != actor_profile.department_id
                ):
                    raise PermissionDenied(
                        "Department managers can only create requests for their own department."
                    )
                target_profile = requested_profile or actor_profile
            else:
                target_profile = actor_profile

        serializer.save(staff_profile=target_profile, created_by=self.request.user)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({"availabilityRequests": response.data}, status=response.status_code)


class AvailabilityRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AvailabilityRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = AvailabilityRequest.objects.select_related(
            "staff_profile__user",
            "staff_profile__department",
            "shift_type",
            "created_by",
            "reviewed_by",
        ).all()
        return _apply_staff_scope(queryset, self.request.user)

    def perform_update(self, serializer):
        if (
            serializer.instance.approval_status != AvailabilityRequest.ApprovalStatus.PENDING
            and not self.request.user.is_superuser
        ):
            raise ValidationError(
                {"detail": "Only pending requests can be updated by non-admin users."}
            )
        serializer.save()

    def perform_destroy(self, instance):
        if (
            instance.approval_status != AvailabilityRequest.ApprovalStatus.PENDING
            and not self.request.user.is_superuser
        ):
            raise ValidationError(
                {"detail": "Only pending requests can be deleted by non-admin users."}
            )
        instance.delete()


class AvailabilityRequestReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int, decision: str):
        if decision not in {"approve", "reject"}:
            return Response({"detail": "Unknown review action."}, status=status.HTTP_404_NOT_FOUND)

        availability_request = get_object_or_404(
            AvailabilityRequest.objects.select_related(
                "staff_profile__department",
                "shift_type",
            ),
            pk=pk,
        )

        actor_profile = _get_actor_staff_profile(request.user)
        can_review = False
        if request.user.is_superuser:
            can_review = True
        elif (
            actor_profile
            and actor_profile.can_manage_department
            and actor_profile.department_id
            and actor_profile.department_id == availability_request.staff_profile.department_id
        ):
            can_review = True

        if not can_review:
            raise PermissionDenied("You do not have permission to review this request.")

        target_status = (
            AvailabilityRequest.ApprovalStatus.APPROVED
            if decision == "approve"
            else AvailabilityRequest.ApprovalStatus.REJECTED
        )

        applied_count = 0
        with transaction.atomic():
            availability_request.approval_status = target_status
            availability_request.reviewed_by = request.user
            availability_request.reviewed_at = timezone.now()
            availability_request.save(
                update_fields=["approval_status", "reviewed_by", "reviewed_at", "updated_at"]
            )

            if target_status == AvailabilityRequest.ApprovalStatus.APPROVED:
                current = availability_request.start_date
                while current <= availability_request.end_date:
                    StaffAvailability.objects.update_or_create(
                        staff_profile=availability_request.staff_profile,
                        date=current,
                        shift_type=availability_request.shift_type,
                        defaults={
                            "status": availability_request.request_type,
                            "reason": availability_request.notes or "",
                            "approved_by": request.user,
                        },
                    )
                    applied_count += 1
                    current += timedelta(days=1)

        publish_event(
            "schedule_global",
            "availability.request.reviewed",
            {
                "id": availability_request.id,
                "staffProfileId": availability_request.staff_profile_id,
                "status": availability_request.approval_status,
                "reviewedById": request.user.id,
                "appliedCount": applied_count,
            },
        )

        payload = AvailabilityRequestSerializer(availability_request).data
        return Response(
            {"request": payload, "appliedCount": applied_count},
            status=status.HTTP_200_OK,
        )


class StaffScheduleEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        staff_profile_id = request.query_params.get("staffProfileId") or request.query_params.get(
            "staff"
        )
        if not staff_profile_id:
            return Response(
                {"detail": "staffProfileId is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        staff_profile = get_object_or_404(
            StaffProfile.objects.select_related("department", "user"),
            pk=staff_profile_id,
        )

        actor_profile = _get_actor_staff_profile(request.user)
        if not request.user.is_superuser:
            if (
                actor_profile
                and actor_profile.can_manage_department
                and actor_profile.department_id == staff_profile.department_id
            ):
                pass
            elif actor_profile and actor_profile.pk == staff_profile.pk:
                pass
            else:
                raise PermissionDenied("You do not have permission to view this schedule.")

        start_date = _parse_calendar_boundary(request.query_params.get("start", ""))
        end_date = _parse_calendar_boundary(request.query_params.get("end", ""))

        assignments_qs = WorkAssignment.objects.select_related(
            "department",
            "shift_type",
            "staff_profile__user",
        ).filter(staff_profile=staff_profile)

        if start_date:
            assignments_qs = assignments_qs.filter(assignment_date__gte=start_date)
        if end_date:
            assignments_qs = assignments_qs.filter(assignment_date__lte=end_date)

        assignments = list(assignments_qs.order_by("assignment_date", "shift_type__start_time"))

        visible_dates = {item.assignment_date for item in assignments}
        if start_date and end_date:
            current = start_date
            while current <= end_date:
                visible_dates.add(current)
                current += timedelta(days=1)

        holiday_map = {
            item.date.isoformat(): item.name
            for item in Holiday.objects.filter(date__in=visible_dates, is_active=True)
        }
        availability_map = {
            item.date.isoformat(): item
            for item in StaffAvailability.objects.filter(
                staff_profile=staff_profile,
                date__in=visible_dates,
            ).select_related("shift_type")
        }

        events = []
        for assignment in assignments:
            start_dt, end_dt = _build_calendar_event_window(
                assignment.assignment_date, assignment.shift_type
            )

            events.append(
                {
                    "id": assignment.id,
                    "title": f"{assignment.shift_type.name}",
                    "start": start_dt.isoformat(),
                    "end": end_dt.isoformat(),
                    "allDay": False,
                    "extendedProps": {
                        "kind": "assignment",
                        "department": assignment.department.name,
                        "shiftType": assignment.shift_type.name,
                        "status": assignment.status,
                        "notes": assignment.notes or "",
                        "workDay": assignment.assignment_date.isoformat(),
                        "isNight": bool(assignment.shift_type.is_night_shift),
                    },
                }
            )

        for day in sorted(visible_dates):
            day_key = day.isoformat()

            if day_key in holiday_map:
                events.append(
                    {
                        "id": f"holiday-{day_key}",
                        "title": holiday_map[day_key],
                        "start": day_key,
                        "end": day_key,
                        "allDay": True,
                        "extendedProps": {
                            "kind": "holiday",
                            "day": day_key,
                            "label": holiday_map[day_key],
                        },
                    }
                )

            availability = availability_map.get(day_key)
            if availability:
                events.append(
                    {
                        "id": f"availability-{day_key}",
                        "title": availability.get_status_display(),
                        "start": day_key,
                        "end": day_key,
                        "allDay": True,
                        "extendedProps": {
                            "kind": "availability",
                            "day": day_key,
                            "availabilityStatus": availability.status,
                            "label": availability.get_status_display(),
                            "note": availability.reason or "",
                        },
                    }
                )

        return Response({"events": events}, status=status.HTTP_200_OK)


class CalendarEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = WorkAssignment.objects.select_related(
            "staff_profile__user",
            "department",
            "shift_type",
        )

        scope = (request.query_params.get("scope") or "department").strip().lower()
        if scope not in {"all", "department", "staff", "my"}:
            scope = "department"

        department_id = (request.query_params.get("department") or "").strip()
        staff_id = (request.query_params.get("staff") or "").strip()
        start_date = _parse_calendar_boundary(request.query_params.get("start", ""))
        end_date = _parse_calendar_boundary(request.query_params.get("end", ""))

        if start_date:
            queryset = queryset.filter(assignment_date__gte=start_date)
        # FullCalendar end boundary is exclusive.
        if end_date:
            queryset = queryset.filter(assignment_date__lt=end_date)

        actor_profile = _get_actor_staff_profile(request.user)

        if request.user.is_superuser:
            if scope == "staff" and staff_id:
                queryset = queryset.filter(staff_profile_id=staff_id)
            elif scope == "department" and department_id:
                queryset = queryset.filter(department_id=department_id)
            elif scope == "my":
                if actor_profile:
                    queryset = queryset.filter(staff_profile=actor_profile)
                else:
                    queryset = queryset.none()
            elif department_id:
                queryset = queryset.filter(department_id=department_id)
        else:
            if not actor_profile:
                queryset = queryset.none()
            elif actor_profile.can_manage_department and actor_profile.department_id:
                queryset = queryset.filter(department_id=actor_profile.department_id)
                if scope == "staff" and staff_id:
                    queryset = queryset.filter(staff_profile_id=staff_id)
                elif scope == "my":
                    queryset = queryset.filter(staff_profile=actor_profile)
            else:
                queryset = queryset.filter(staff_profile=actor_profile)

        assignments = list(queryset.order_by("assignment_date", "shift_type__start_time"))

        visible_dates = {item.assignment_date for item in assignments}
        if start_date and end_date:
            current = start_date
            while current < end_date:
                visible_dates.add(current)
                current += timedelta(days=1)

        holiday_map = {
            item.date.isoformat(): item.name
            for item in Holiday.objects.filter(date__in=visible_dates, is_active=True)
        }

        events = []
        for item in assignments:
            actual_start_dt, actual_end_dt = _build_assignment_window(
                item.assignment_date, item.shift_type
            )
            start_dt, end_dt = _build_calendar_event_window(
                item.assignment_date, item.shift_type
            )
            hour_label = (
                f"{actual_start_dt.strftime('%H:%M')}-{actual_end_dt.strftime('%H:%M')}"
            )
            if scope in {"staff", "my"}:
                event_title = item.shift_type.name
            else:
                event_title = f"{item.staff_profile.full_name} - {item.shift_type.name}"

            events.append(
                {
                    "id": item.id,
                    "title": event_title,
                    "start": start_dt.isoformat(),
                    "end": end_dt.isoformat(),
                    "allDay": False,
                    "extendedProps": {
                        "kind": "assignment",
                        "staff_name": item.staff_profile.full_name,
                        "staff_id": item.staff_profile_id,
                        "department": item.department.name,
                        "department_id": item.department_id,
                        "shift_type": item.shift_type.name,
                        "status": item.get_status_display(),
                        "note": item.notes or "",
                        "hours": hour_label,
                        "work_day": item.assignment_date.isoformat(),
                        "is_nobet": (
                            "nobet" in item.shift_type.name.lower()
                            or bool(item.shift_type.is_night_shift)
                        ),
                    },
                }
            )

        for day in sorted(visible_dates):
            day_key = day.isoformat()
            if day_key in holiday_map:
                events.append(
                    {
                        "id": f"holiday-{day_key}",
                        "title": holiday_map[day_key],
                        "start": day_key,
                        "end": day_key,
                        "allDay": True,
                        "extendedProps": {
                            "kind": "holiday",
                            "day": day_key,
                            "label": holiday_map[day_key],
                        },
                    }
                )

        return Response(events, status=status.HTTP_200_OK)


class MoveAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        action = (request.data.get("action") or "move").strip().lower()
        assignment_id = _first_present(request.data, "assignmentId", "assignment_id")
        target_date_raw = _first_present(request.data, "targetDate", "target_date")
        target_assignment_id = _first_present(
            request.data, "targetAssignmentId", "target_assignment_id"
        )

        if action not in {"move", "swap"}:
            return Response(
                {"success": False, "error": "Gecersiz islem tipi."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not assignment_id or not target_date_raw:
            return Response(
                {"success": False, "error": "Eksik parametre gonderildi."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        source_assignment = get_object_or_404(
            WorkAssignment.objects.select_related(
                "staff_profile__user",
                "department",
                "shift_type",
            ),
            pk=assignment_id,
        )

        permission_error = _ensure_assignment_manage_permission(request.user, source_assignment)
        if permission_error:
            return Response(
                {"success": False, "error": permission_error},
                status=status.HTTP_403_FORBIDDEN,
            )

        target_date = _coerce_date(target_date_raw)
        if not target_date:
            return Response(
                {"success": False, "error": "Gecersiz tarih formati."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "swap":
            if not target_assignment_id:
                return Response(
                    {"success": False, "error": "Swap icin hedef vardiya secilmelidir."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            target_assignment = get_object_or_404(
                WorkAssignment.objects.select_related(
                    "staff_profile__user",
                    "department",
                    "shift_type",
                ),
                pk=target_assignment_id,
            )

            if source_assignment.pk == target_assignment.pk:
                return Response(
                    {"success": False, "error": "Ayni vardiya ile swap yapilamaz."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            permission_error = _ensure_assignment_manage_permission(request.user, target_assignment)
            if permission_error:
                return Response(
                    {"success": False, "error": permission_error},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if source_assignment.department_id != target_assignment.department_id:
                return Response(
                    {
                        "success": False,
                        "error": "Farkli birimler arasinda swap yapilamaz.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if target_assignment.assignment_date != target_date:
                return Response(
                    {
                        "success": False,
                        "error": "Secilen hedef vardiya birakilan gun ile eslesmiyor.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            source_original_date = source_assignment.assignment_date
            excluded_ids = [source_assignment.pk, target_assignment.pk]

            target_staff_conflict = _staff_has_assignment_conflict(
                target_assignment.staff_profile,
                source_original_date,
                target_assignment.shift_type,
                exclude_ids=excluded_ids,
            )
            if target_staff_conflict:
                return Response(
                    {
                        "success": False,
                        "error": "Hedef personelin kaynak gunde cakisan vardiyasi var.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            target_availability_conflict = _staff_has_unavailability(
                target_assignment.staff_profile, source_original_date
            )
            if target_availability_conflict:
                return Response(
                    {
                        "success": False,
                        "error": "Hedef personel kaynak tarihte izinli veya uygun degil.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            source_conflict_exists = _staff_has_assignment_conflict(
                source_assignment.staff_profile,
                target_date,
                source_assignment.shift_type,
                exclude_ids=excluded_ids,
            )
            if source_conflict_exists:
                return Response(
                    {
                        "success": False,
                        "error": "Kaynak personelin hedef gunde cakisan vardiyasi var.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            source_staged = []
            target_staged = []
            if source_assignment.staff_profile_id == target_assignment.staff_profile_id:
                source_staged = [(source_original_date, target_assignment.shift_type)]
                target_staged = [(target_date, source_assignment.shift_type)]

            source_rule_error = _validate_staff_rules_for_candidate(
                staff_profile=source_assignment.staff_profile,
                target_date=target_date,
                shift_type=source_assignment.shift_type,
                exclude_ids=excluded_ids,
                staged_assignments=source_staged,
            )
            if source_rule_error:
                return Response(
                    {"success": False, "error": source_rule_error},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            target_rule_error = _validate_staff_rules_for_candidate(
                staff_profile=target_assignment.staff_profile,
                target_date=source_original_date,
                shift_type=target_assignment.shift_type,
                exclude_ids=excluded_ids,
                staged_assignments=target_staged,
            )
            if target_rule_error:
                return Response(
                    {"success": False, "error": target_rule_error},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                source_assignment.assignment_date = target_date
                source_assignment.updated_by = request.user
                source_assignment.save(update_fields=["assignment_date", "updated_by", "updated_at"])

                target_assignment.assignment_date = source_original_date
                target_assignment.updated_by = request.user
                target_assignment.save(update_fields=["assignment_date", "updated_by", "updated_at"])

            _emit_assignment_event("assignment.updated", source_assignment)
            _emit_assignment_event("assignment.updated", target_assignment)
            _create_assignment_notification(source_assignment, "swapped")
            _create_assignment_notification(target_assignment, "swapped")
            return Response(
                {"success": True, "message": "Vardiyalar basariyla yer degistirildi."},
                status=status.HTTP_200_OK,
            )

        source_rule_error = _validate_staff_rules_for_candidate(
            staff_profile=source_assignment.staff_profile,
            target_date=target_date,
            shift_type=source_assignment.shift_type,
            exclude_ids=[source_assignment.pk],
            staged_assignments=[],
        )
        if source_rule_error:
            return Response(
                {"success": False, "error": source_rule_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        source_assignment.assignment_date = target_date
        source_assignment.updated_by = request.user
        source_assignment.save(update_fields=["assignment_date", "updated_by", "updated_at"])
        _emit_assignment_event("assignment.updated", source_assignment)
        _create_assignment_notification(source_assignment, "moved")
        return Response(
            {"success": True, "message": "Vardiya basariyla tasindi."},
            status=status.HTTP_200_OK,
        )


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        summary = {
            "activeStaff": StaffProfile.objects.filter(is_active=True).count(),
            "todaysAssignments": WorkAssignment.objects.filter(assignment_date=today).count(),
            "pendingApprovals": WorkAssignment.objects.filter(status="planned").count(),
            "unreadNotifications": Notification.objects.filter(
                recipient=request.user, is_read=False
            ).count(),
        }
        return Response(summary, status=status.HTTP_200_OK)


class AutoSchedulePreviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AutoScheduleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        department = serializer.validated_data["department"]
        start_date = serializer.validated_data["start_date"]
        end_date = serializer.validated_data["end_date"]
        options = serializer.validated_data.get("options", {})

        preview_items, warnings, meta = generate_schedule_preview(
            department=department,
            start_date=start_date,
            end_date=end_date,
            options=options,
        )

        return Response(
            {
                "previewAssignments": serialize_preview_items(preview_items),
                "warnings": warnings,
                "meta": meta,
            },
            status=status.HTTP_200_OK,
        )


class AutoScheduleCommitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AutoScheduleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        department = serializer.validated_data["department"]
        start_date = serializer.validated_data["start_date"]
        end_date = serializer.validated_data["end_date"]
        options = serializer.validated_data.get("options", {})
        replace_existing = serializer.validated_data.get("replace_existing", False)

        preview_items, warnings, meta = generate_schedule_preview(
            department=department,
            start_date=start_date,
            end_date=end_date,
            options=options,
        )

        with transaction.atomic():
            created = save_generated_schedule(
                preview_items=preview_items,
                user=request.user,
                replace_existing=replace_existing,
            )

        for assignment in created:
            _emit_assignment_event("assignment.created", assignment)
            _create_assignment_notification(assignment, "created")

        return Response(
            {
                "createdCount": len(created),
                "warnings": warnings,
                "meta": meta,
                "previewAssignments": serialize_preview_items(preview_items),
            },
            status=status.HTTP_201_CREATED,
        )


class LegacyAssignmentBulkActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, action: str):
        if not request.user.is_superuser:
            return Response(
                {"detail": "Only superusers can execute this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = WorkAssignment.objects.select_related(
            "staff_profile__user", "department", "shift_type"
        ).all()
        queryset = _apply_assignment_filters(queryset, request.data)

        if action == "approve":
            assignments = list(queryset.filter(status=WorkAssignment.Status.PLANNED))
            with transaction.atomic():
                for assignment in assignments:
                    assignment.status = WorkAssignment.Status.APPROVED
                    assignment.save(update_fields=["status", "updated_at"])
                    _emit_assignment_event("assignment.updated", assignment)
                    _create_assignment_notification(assignment, "approved")
            return Response({"updatedCount": len(assignments)}, status=status.HTTP_200_OK)

        if action == "delete-planned":
            assignments = list(queryset.filter(status=WorkAssignment.Status.PLANNED))
        elif action == "delete-approved":
            assignments = list(queryset.filter(status=WorkAssignment.Status.APPROVED))
        elif action == "delete-filtered":
            status_filter = _first_present(request.data, "status")
            if status_filter and status_filter not in WorkAssignment.Status.values:
                return Response(
                    {"detail": "Invalid status filter."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            assignments = list(queryset)
        else:
            return Response({"detail": "Unknown bulk action."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            for assignment in assignments:
                assignment_id = assignment.id
                _create_assignment_notification(assignment, "deleted")
                assignment.delete()
                publish_event("schedule_global", "assignment.deleted", {"id": assignment_id})

        return Response({"deletedCount": len(assignments)}, status=status.HTTP_200_OK)


class AssignmentTemplateExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        department_id = request.query_params.get("department")
        status_filter = request.query_params.get("status")
        date_from = parse_date_safe(request.query_params.get("date_from", ""))
        date_to = parse_date_safe(request.query_params.get("date_to", ""))

        if not department_id:
            return Response(
                {"detail": "Template export icin birim secilmelidir."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        department = get_object_or_404(Department, pk=department_id)

        assignment_qs = (
            WorkAssignment.objects.select_related(
                "staff_profile__user", "department", "shift_type"
            )
            .filter(department_id=department_id)
            .exclude(status=WorkAssignment.Status.CANCELLED)
            .order_by("assignment_date", "shift_type__start_time")
        )

        if status_filter:
            assignment_qs = assignment_qs.filter(status=status_filter)
        if date_from:
            assignment_qs = assignment_qs.filter(assignment_date__gte=date_from)
        if date_to:
            assignment_qs = assignment_qs.filter(assignment_date__lte=date_to)

        assignments = list(assignment_qs)
        if not assignments:
            return Response(
                {"detail": "Secilen filtrelere uygun vardiya kaydi bulunamadi."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workbook, _worksheet, unmatched_staff = build_dynamic_assignment_workbook(
            assignments=assignments,
            department=department,
            start_date=date_from,
            end_date=date_to,
        )

        output = BytesIO()
        workbook.save(output)
        output.seek(0)

        department_slug = (department.code or department.name or "birim").strip().lower().replace(" ", "-")
        filename = f"{department_slug}-vardiya-cizelgesi.xlsx"
        response = HttpResponse(
            output.getvalue(),
            content_type=(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ),
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        if unmatched_staff:
            response["X-MediShift-Unmatched-Staff"] = ", ".join(unmatched_staff[:10])
        return response


class AnalyticsReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        date_from = parse_date_safe(request.query_params.get("date_from", "")) or (
            today - timedelta(days=30)
        )
        date_to = parse_date_safe(request.query_params.get("date_to", "")) or (
            today + timedelta(days=30)
        )

        if date_to < date_from:
            return Response(
                {"detail": "date_to must be the same or after date_from."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        department_id = request.query_params.get("department")
        status_filter = request.query_params.get("status")

        assignment_qs = WorkAssignment.objects.select_related(
            "staff_profile__user", "department", "shift_type"
        ).filter(assignment_date__range=[date_from, date_to])

        staff_qs = StaffProfile.objects.filter(is_active=True)
        if department_id:
            assignment_qs = assignment_qs.filter(department_id=department_id)
            staff_qs = staff_qs.filter(department_id=department_id)
        if status_filter:
            assignment_qs = assignment_qs.filter(status=status_filter)

        assignments = list(assignment_qs)
        issues = analyze_assignments(assignment_qs)

        status_counts = {}
        department_counts = {}
        shift_type_counts = {}
        staff_breakdown = {}
        for item in assignments:
            status_counts[item.status] = status_counts.get(item.status, 0) + 1
            department_name = item.department.name if item.department else "-"
            department_counts[department_name] = department_counts.get(department_name, 0) + 1
            shift_type_counts[item.shift_type.name] = shift_type_counts.get(item.shift_type.name, 0) + 1
            staff_key = item.staff_profile_id
            staff_row = staff_breakdown.setdefault(
                staff_key,
                {
                    "staffProfileId": item.staff_profile_id,
                    "staffProfileName": item.staff_profile.full_name,
                    "departmentName": department_name,
                    "totalHours": 0.0,
                    "assignmentCount": 0,
                    "nightCount": 0,
                    "overtimeCount": 0,
                    "weeklyLimitHours": float(item.staff_profile.weekly_limit_hours),
                },
            )
            shift_hours = _shift_duration_hours(item.shift_type)
            staff_row["totalHours"] += shift_hours
            staff_row["assignmentCount"] += 1
            if _is_night_shift(item.shift_type):
                staff_row["nightCount"] += 1
            shift_name = (item.shift_type.name or "").lower()
            if "mesai" in shift_name or "overtime" in shift_name:
                staff_row["overtimeCount"] += 1

        severity_counts = {"high": 0, "medium": 0, "low": 0}
        issue_type_counts = {}
        for issue in issues:
            severity = issue.get("severity", "low")
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
            issue_type = issue.get("type", "unknown")
            issue_type_counts[issue_type] = issue_type_counts.get(issue_type, 0) + 1

        summary = {
            "activeStaff": staff_qs.count(),
            "totalAssignments": len(assignments),
            "plannedAssignments": sum(1 for item in assignments if item.status == "planned"),
            "approvedAssignments": sum(1 for item in assignments if item.status == "approved"),
            "cancelledAssignments": sum(1 for item in assignments if item.status == "cancelled"),
            "totalIssues": len(issues),
            "highSeverityIssues": severity_counts.get("high", 0),
            "mediumSeverityIssues": severity_counts.get("medium", 0),
            "lowSeverityIssues": severity_counts.get("low", 0),
            "unreadNotifications": Notification.objects.filter(
                recipient=request.user, is_read=False
            ).count(),
        }

        same_month_range = (
            date_from.year == date_to.year and date_from.month == date_to.month
        )
        by_staff = []
        for row in staff_breakdown.values():
            if same_month_range:
                mandatory_hours = round(
                    _get_monthly_required_hours(date_from)["required_hours"], 1
                )
            else:
                weekday_count = max(_count_weekdays_in_range(date_from, date_to), 1)
                mandatory_hours = round(float(weekday_count * 8), 1)
            total_hours = round(float(row["totalHours"]), 1)
            extra_hours = round(max(total_hours - mandatory_hours, 0.0), 1)
            by_staff.append(
                {
                    "staffProfileId": row["staffProfileId"],
                    "staffProfileName": row["staffProfileName"],
                    "departmentName": row["departmentName"],
                    "totalHours": total_hours,
                    "assignmentCount": row["assignmentCount"],
                    "nightCount": row["nightCount"],
                    "overtimeCount": row["overtimeCount"],
                    "mandatoryHours": mandatory_hours,
                    "extraHours": extra_hours,
                }
            )
        by_staff.sort(key=lambda item: (-item["totalHours"], item["staffProfileName"]))

        return Response(
            {
                "summary": summary,
                "byStatus": [
                    {"label": key, "count": value}
                    for key, value in sorted(status_counts.items(), key=lambda x: x[0])
                ],
                "byDepartment": [
                    {"label": key, "count": value}
                    for key, value in sorted(department_counts.items(), key=lambda x: x[0])
                ],
                "byShiftType": [
                    {"label": key, "count": value}
                    for key, value in sorted(shift_type_counts.items(), key=lambda x: x[0])
                ],
                "byStaff": by_staff,
                "issuesByType": [
                    {"label": key, "count": value}
                    for key, value in sorted(
                        issue_type_counts.items(), key=lambda x: (-x[1], x[0])
                    )
                ],
                "issues": issues,
                "range": {
                    "dateFrom": date_from.isoformat(),
                    "dateTo": date_to.isoformat(),
                    "departmentId": int(department_id) if department_id else None,
                    "status": status_filter or None,
                },
            },
            status=status.HTTP_200_OK,
        )
