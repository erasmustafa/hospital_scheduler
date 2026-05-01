from django.conf import settings
from django.db import models

from apps.departments.models import Department
from common.mixins import TimestampMixin


class StaffProfile(TimestampMixin):
    class Gender(models.TextChoices):
        FEMALE = "female", "Female"
        MALE = "male", "Male"
        OTHER = "other", "Other"
        UNSPECIFIED = "unspecified", "Unspecified"

    class EmploymentType(models.TextChoices):
        PERMANENT = "permanent", "Permanent"
        CONTRACT = "contract", "Contract"
        INTERN = "intern", "Intern"

    class Role(models.TextChoices):
        DOCTOR = "doctor", "Doctor"
        NURSE = "nurse", "Nurse"
        TECHNICIAN = "technician", "Technician"
        ADMIN = "admin", "Admin"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_profile"
    )
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="staff"
    )
    employee_no = models.CharField(max_length=30, unique=True, null=True, blank=True)
    title = models.CharField(max_length=100, blank=True)
    profession = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.NURSE)
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.PERMANENT,
    )
    weekly_limit_hours = models.PositiveIntegerField(default=40)
    phone = models.CharField(max_length=20, blank=True)
    phone_internal = models.CharField(max_length=20, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        default=Gender.UNSPECIFIED,
    )
    cannot_work_night = models.BooleanField(default=False)
    is_new_mother = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    can_manage_department = models.BooleanField(default=False)

    class Meta:
        ordering = ["user__first_name", "user__last_name", "user__username"]

    def __str__(self) -> str:
        return self.full_name

    @property
    def full_name(self) -> str:
        name = f"{self.user.first_name} {self.user.last_name}".strip()
        return name or self.user.username

    @property
    def weekly_hour_limit(self) -> float:
        return float(self.weekly_limit_hours)

    @weekly_hour_limit.setter
    def weekly_hour_limit(self, value):
        self.weekly_limit_hours = int(float(value))
