from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.staff.models import StaffProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    isStaff = serializers.BooleanField(source="is_staff", read_only=True)
    isSuperuser = serializers.BooleanField(source="is_superuser", read_only=True)
    departmentId = serializers.IntegerField(source="staff_profile.department_id", read_only=True)
    departmentName = serializers.CharField(source="staff_profile.department.name", read_only=True)
    canManageDepartment = serializers.BooleanField(
        source="staff_profile.can_manage_department",
        read_only=True,
        default=False,
    )
    staffRole = serializers.CharField(source="staff_profile.role", read_only=True, default="")
    staffProfileId = serializers.IntegerField(source="staff_profile.id", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "firstName",
            "lastName",
            "email",
            "isStaff",
            "isSuperuser",
            "departmentId",
            "departmentName",
            "canManageDepartment",
            "staffRole",
            "staffProfileId",
        ]


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True, allow_blank=False)
    password = serializers.CharField(
        max_length=128, trim_whitespace=False, required=True, allow_blank=False
    )
