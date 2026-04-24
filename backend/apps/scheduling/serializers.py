from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.departments.models import Department
from apps.staff.models import StaffProfile

from .models import (
    AvailabilityRequest,
    ShiftType,
    StaffAvailability,
    UnitRequirement,
    WorkAssignment,
)

User = get_user_model()


class ShiftTypeSerializer(serializers.ModelSerializer):
    startTime = serializers.TimeField(source="start_time")
    endTime = serializers.TimeField(source="end_time")
    isNight = serializers.BooleanField(source="is_night")

    class Meta:
        model = ShiftType
        fields = ["id", "name", "startTime", "endTime", "isNight", "color"]


class UnitRequirementSerializer(serializers.ModelSerializer):
    departmentId = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.filter(is_active=True),
        source="department",
    )
    shiftTypeId = serializers.PrimaryKeyRelatedField(
        queryset=ShiftType.objects.all(),
        source="shift_type",
    )
    requiredCount = serializers.IntegerField(source="required_count", min_value=1)
    shiftTypeName = serializers.CharField(source="shift_type.name", read_only=True)
    departmentName = serializers.CharField(source="department.name", read_only=True)
    isActive = serializers.BooleanField(source="is_active")

    class Meta:
        model = UnitRequirement
        fields = [
            "id",
            "departmentId",
            "departmentName",
            "shiftTypeId",
            "shiftTypeName",
            "requiredCount",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
            "isActive",
            "created_at",
            "updated_at",
        ]


class WorkAssignmentSerializer(serializers.ModelSerializer):
    staffProfileId = serializers.PrimaryKeyRelatedField(
        queryset=StaffProfile.objects.select_related("user").all(),
        source="staff_profile",
        write_only=True,
    )
    departmentId = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source="department",
        write_only=True,
        required=False,
        allow_null=True,
    )
    shiftTypeId = serializers.PrimaryKeyRelatedField(
        queryset=ShiftType.objects.all(), source="shift_type", write_only=True
    )
    assignmentDate = serializers.DateField(source="assignment_date")
    staffProfileName = serializers.CharField(source="staff_profile.full_name", read_only=True)
    departmentName = serializers.CharField(source="department.name", read_only=True)
    shiftTypeName = serializers.CharField(source="shift_type.name", read_only=True)
    shiftColor = serializers.CharField(source="shift_type.color", read_only=True)

    class Meta:
        model = WorkAssignment
        fields = [
            "id",
            "staffProfileId",
            "departmentId",
            "shiftTypeId",
            "assignmentDate",
            "status",
            "notes",
            "staffProfileName",
            "departmentName",
            "shiftTypeName",
            "shiftColor",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        department = attrs.get("department")
        staff_profile = attrs.get("staff_profile")

        if not department:
            current_staff = staff_profile
            if current_staff is None and self.instance is not None:
                current_staff = self.instance.staff_profile
            if current_staff and current_staff.department:
                attrs["department"] = current_staff.department
            else:
                raise serializers.ValidationError(
                    {"departmentId": "Department is required when staff has no default department."}
                )
        return attrs

    def update(self, instance, validated_data):
        if "department" not in validated_data and "staff_profile" in validated_data:
            staff_profile = validated_data["staff_profile"]
            if staff_profile.department:
                validated_data["department"] = staff_profile.department
        return super().update(instance, validated_data)

    def create(self, validated_data):
        if "department" not in validated_data:
            staff_profile = validated_data["staff_profile"]
            if staff_profile.department:
                validated_data["department"] = staff_profile.department
        return super().create(validated_data)


class StaffAvailabilitySerializer(serializers.ModelSerializer):
    staffProfileId = serializers.PrimaryKeyRelatedField(
        queryset=StaffProfile.objects.select_related("user").all(),
        source="staff_profile",
    )
    shiftTypeId = serializers.PrimaryKeyRelatedField(
        queryset=ShiftType.objects.all(),
        source="shift_type",
        required=False,
        allow_null=True,
    )
    approvedById = serializers.PrimaryKeyRelatedField(
        source="approved_by",
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = StaffAvailability
        fields = [
            "id",
            "staffProfileId",
            "shiftTypeId",
            "date",
            "status",
            "reason",
            "approvedById",
        ]


class AvailabilityRequestSerializer(serializers.ModelSerializer):
    staffProfileId = serializers.PrimaryKeyRelatedField(
        queryset=StaffProfile.objects.select_related("user").all(),
        source="staff_profile",
        required=False,
        allow_null=True,
    )
    shiftTypeId = serializers.PrimaryKeyRelatedField(
        queryset=ShiftType.objects.all(),
        source="shift_type",
        required=False,
        allow_null=True,
    )
    startDate = serializers.DateField(source="start_date")
    endDate = serializers.DateField(source="end_date")
    requestType = serializers.CharField(source="request_type")
    approvalStatus = serializers.CharField(source="approval_status", read_only=True)
    staffProfileName = serializers.CharField(source="staff_profile.full_name", read_only=True)
    departmentName = serializers.CharField(source="staff_profile.department.name", read_only=True)
    shiftTypeName = serializers.CharField(source="shift_type.name", read_only=True)
    createdById = serializers.IntegerField(source="created_by_id", read_only=True)
    createdByName = serializers.CharField(source="created_by.get_full_name", read_only=True)
    reviewedById = serializers.IntegerField(source="reviewed_by_id", read_only=True)
    reviewedByName = serializers.CharField(source="reviewed_by.get_full_name", read_only=True)
    reviewedAt = serializers.DateTimeField(source="reviewed_at", read_only=True)

    class Meta:
        model = AvailabilityRequest
        fields = [
            "id",
            "staffProfileId",
            "staffProfileName",
            "departmentName",
            "shiftTypeId",
            "shiftTypeName",
            "startDate",
            "endDate",
            "requestType",
            "notes",
            "approvalStatus",
            "createdById",
            "createdByName",
            "reviewedById",
            "reviewedByName",
            "reviewedAt",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {"endDate": "End date cannot be before start date."}
            )
        return attrs


class AutoScheduleRequestSerializer(serializers.Serializer):
    departmentId = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.filter(is_active=True),
        source="department",
    )
    startDate = serializers.DateField(source="start_date")
    endDate = serializers.DateField(source="end_date")
    options = serializers.DictField(required=False, default=dict)
    replaceExisting = serializers.BooleanField(
        source="replace_existing", required=False, default=False
    )

    def validate(self, attrs):
        if attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError(
                {"endDate": "End date must be the same or after start date."}
            )
        return attrs
