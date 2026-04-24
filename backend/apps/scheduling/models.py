from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta

from apps.departments.models import Department
from apps.staff.models import StaffProfile
from common.mixins import TimestampMixin


class ShiftType(TimestampMixin):
    name = models.CharField(max_length=80, unique=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_night = models.BooleanField(default=False)
    color = models.CharField(max_length=20, default="#0284c7")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["start_time"]

    def __str__(self) -> str:
        return self.name

    @property
    def is_night_shift(self) -> bool:
        return bool(self.is_night)

    @property
    def duration_hours(self) -> float:
        today = timezone.localdate()
        start_dt = datetime.combine(today, self.start_time)
        end_dt = datetime.combine(today, self.end_time)
        if end_dt <= start_dt:
            end_dt += timedelta(days=1)
        return round((end_dt - start_dt).total_seconds() / 3600, 2)


class UnitRequirement(TimestampMixin):
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="unit_requirements"
    )
    shift_type = models.ForeignKey(
        ShiftType, on_delete=models.CASCADE, related_name="unit_requirements"
    )
    required_count = models.PositiveIntegerField(default=1)
    monday = models.BooleanField(default=True)
    tuesday = models.BooleanField(default=True)
    wednesday = models.BooleanField(default=True)
    thursday = models.BooleanField(default=True)
    friday = models.BooleanField(default=True)
    saturday = models.BooleanField(default=True)
    sunday = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["department__name", "shift_type__start_time", "id"]

    def __str__(self) -> str:
        return (
            f"{self.department.name} - {self.shift_type.name} "
            f"({self.required_count}/day)"
        )

    def selected_days(self) -> str:
        days = []
        if self.monday:
            days.append("Mon")
        if self.tuesday:
            days.append("Tue")
        if self.wednesday:
            days.append("Wed")
        if self.thursday:
            days.append("Thu")
        if self.friday:
            days.append("Fri")
        if self.saturday:
            days.append("Sat")
        if self.sunday:
            days.append("Sun")
        return ", ".join(days) if days else "No days selected"

    def clean(self):
        super().clean()
        if not any(
            [
                self.monday,
                self.tuesday,
                self.wednesday,
                self.thursday,
                self.friday,
                self.saturday,
                self.sunday,
            ]
        ):
            raise ValidationError("At least one day must be selected.")


class WorkAssignment(TimestampMixin):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        APPROVED = "approved", "Approved"
        CANCELLED = "cancelled", "Cancelled"

    staff_profile = models.ForeignKey(
        StaffProfile, on_delete=models.CASCADE, related_name="assignments"
    )
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="assignments"
    )
    shift_type = models.ForeignKey(
        ShiftType, on_delete=models.PROTECT, related_name="assignments"
    )
    assignment_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_assignments",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_assignments",
    )

    class Meta:
        ordering = ["assignment_date", "shift_type__start_time"]
        unique_together = ("staff_profile", "assignment_date", "shift_type")

    def __str__(self) -> str:
        return f"{self.staff_profile.full_name} - {self.assignment_date} - {self.shift_type.name}"

    @property
    def staff(self) -> StaffProfile:
        return self.staff_profile

    @staff.setter
    def staff(self, value: StaffProfile):
        self.staff_profile = value

    @property
    def note(self) -> str:
        return self.notes

    @note.setter
    def note(self, value: str):
        self.notes = value


class StaffAvailability(TimestampMixin):
    class AvailabilityStatus(models.TextChoices):
        AVAILABLE = "available", "Available"
        PREFERRED = "preferred", "Preferred"
        UNAVAILABLE = "unavailable", "Unavailable"
        LEAVE = "leave", "Leave"
        PREFERRED_OFF = "preferred_off", "Preferred Off"

    staff_profile = models.ForeignKey(
        StaffProfile, on_delete=models.CASCADE, related_name="availability_entries"
    )
    date = models.DateField()
    shift_type = models.ForeignKey(
        ShiftType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="staff_availability_entries",
    )
    status = models.CharField(
        max_length=20, choices=AvailabilityStatus.choices, default=AvailabilityStatus.AVAILABLE
    )
    reason = models.CharField(max_length=255, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_availability_entries",
    )

    class Meta:
        ordering = ["-date"]
        unique_together = ("staff_profile", "date", "shift_type")

    def __str__(self) -> str:
        return f"{self.staff_profile.full_name} - {self.date} - {self.status}"

    @property
    def staff(self) -> StaffProfile:
        return self.staff_profile

    @staff.setter
    def staff(self, value: StaffProfile):
        self.staff_profile = value

    @property
    def note(self) -> str:
        return self.reason

    @note.setter
    def note(self, value: str):
        self.reason = value


class AvailabilityRequest(TimestampMixin):
    class RequestType(models.TextChoices):
        LEAVE = "leave", "Leave"
        UNAVAILABLE = "unavailable", "Unavailable"
        PREFERRED_OFF = "preferred_off", "Preferred Off"

    class ApprovalStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    staff_profile = models.ForeignKey(
        StaffProfile,
        on_delete=models.CASCADE,
        related_name="availability_requests",
    )
    shift_type = models.ForeignKey(
        ShiftType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="availability_requests",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    request_type = models.CharField(max_length=20, choices=RequestType.choices)
    notes = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_availability_requests",
    )
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_availability_requests",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def clean(self):
        super().clean()
        if self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date.")

    def __str__(self) -> str:
        return f"{self.staff_profile.full_name} {self.start_date} -> {self.end_date}"


class MessageChannel(TimestampMixin):
    class ChannelType(models.TextChoices):
        ANNOUNCEMENT = "announcement", "Announcement"
        DEPARTMENT = "department", "Department"

    channel_type = models.CharField(
        max_length=20,
        choices=ChannelType.choices,
        default=ChannelType.ANNOUNCEMENT,
    )
    name = models.CharField(max_length=150)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="message_channels",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_message_channels",
    )
    pinned_notice = models.TextField(blank=True)
    pinned_notice_updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_pinned_notices",
    )
    pinned_notice_updated_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["channel_type", "name"]

    def __str__(self) -> str:
        return self.name


class ChannelMessage(TimestampMixin):
    channel = models.ForeignKey(
        MessageChannel,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="channel_messages",
    )
    body = models.TextField()

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self) -> str:
        return f"{self.channel.name} - {self.sender_id} - {self.created_at:%Y-%m-%d %H:%M}"


class ChannelReadState(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="channel_read_states",
    )
    channel = models.ForeignKey(
        MessageChannel,
        on_delete=models.CASCADE,
        related_name="read_states",
    )
    last_read_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "channel")

    def __str__(self) -> str:
        return f"{self.user_id} - {self.channel_id}"


class ChannelMessageReaction(TimestampMixin):
    message = models.ForeignKey(
        ChannelMessage,
        on_delete=models.CASCADE,
        related_name="reactions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_reactions",
    )
    emoji = models.CharField(max_length=8)

    class Meta:
        unique_together = ("message", "user", "emoji")

    def __str__(self) -> str:
        return f"{self.user_id} - {self.emoji}"


class StaffConstraint(TimestampMixin):
    staff_profile = models.OneToOneField(
        StaffProfile,
        on_delete=models.CASCADE,
        related_name="constraint",
    )
    max_weekly_hours = models.DecimalField(max_digits=5, decimal_places=2, default=40)
    can_work_night = models.BooleanField(default=True)
    max_consecutive_days = models.PositiveIntegerField(default=6)
    min_rest_hours = models.PositiveIntegerField(default=12)

    def __str__(self) -> str:
        return f"{self.staff_profile.full_name} constraints"


class Holiday(TimestampMixin):
    date = models.DateField(unique=True)
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["date"]

    def __str__(self) -> str:
        return f"{self.date} - {self.name}"
