from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.departments.models import Department

from .models import StaffProfile

User = get_user_model()


class StaffProfileSerializer(serializers.ModelSerializer):
    userId = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user", write_only=True
    )
    departmentId = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source="department",
        write_only=True,
        required=False,
        allow_null=True,
    )
    fullName = serializers.CharField(source="full_name", read_only=True)
    departmentName = serializers.CharField(source="department.name", read_only=True)
    employeeNo = serializers.CharField(source="employee_no", required=False, allow_null=True, allow_blank=True)
    title = serializers.CharField(required=False, allow_blank=True)
    profession = serializers.CharField(required=False, allow_blank=True)
    employmentType = serializers.ChoiceField(
        choices=StaffProfile.EmploymentType.choices,
        source="employment_type",
        required=False,
    )
    weeklyLimitHours = serializers.IntegerField(source="weekly_limit_hours")
    isActive = serializers.BooleanField(source="is_active")
    phoneInternal = serializers.CharField(source="phone_internal", required=False, allow_blank=True)
    canManageDepartment = serializers.BooleanField(source="can_manage_department", required=False)
    email = serializers.EmailField(source="user.email", read_only=True)
    gender = serializers.ChoiceField(
        choices=StaffProfile.Gender.choices,
        required=False,
    )
    cannotTakeNightShifts = serializers.BooleanField(
        source="cannot_work_night",
        required=False,
    )
    isNewMother = serializers.BooleanField(source="is_new_mother", required=False)

    class Meta:
        model = StaffProfile
        fields = [
            "id",
            "userId",
            "departmentId",
            "employeeNo",
            "title",
            "profession",
            "role",
            "employmentType",
            "weeklyLimitHours",
            "phone",
            "phoneInternal",
            "email",
            "gender",
            "cannotTakeNightShifts",
            "isNewMother",
            "isActive",
            "canManageDepartment",
            "fullName",
            "departmentName",
            "created_at",
            "updated_at",
        ]

    def validate_employeeNo(self, value):
        if value in ("", None):
            return None
        return value
