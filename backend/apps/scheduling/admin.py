from django.contrib import admin

from .models import (
    AvailabilityRequest,
    ChannelMessage,
    ChannelMessageReaction,
    ChannelReadState,
    Holiday,
    MessageChannel,
    ShiftType,
    StaffAvailability,
    StaffConstraint,
    UnitRequirement,
    WorkAssignment,
)


@admin.register(ShiftType)
class ShiftTypeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "start_time",
        "end_time",
        "duration_hours",
        "is_night",
        "is_active",
    )
    list_filter = ("is_night", "is_active")
    search_fields = ("name",)
    ordering = ("start_time", "name")


@admin.register(UnitRequirement)
class UnitRequirementAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "department",
        "shift_type",
        "required_count",
        "selected_days",
        "is_active",
    )
    list_filter = ("department", "shift_type", "is_active")
    search_fields = ("department__name", "department__code", "shift_type__name")
    autocomplete_fields = ("department", "shift_type")
    list_select_related = ("department", "shift_type")


@admin.register(WorkAssignment)
class WorkAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "assignment_date",
        "staff_profile",
        "department",
        "shift_type",
        "status",
        "created_by",
    )
    list_filter = ("status", "department", "shift_type", "assignment_date")
    search_fields = (
        "staff_profile__user__username",
        "staff_profile__user__first_name",
        "staff_profile__user__last_name",
        "staff_profile__employee_no",
        "department__name",
        "shift_type__name",
        "notes",
    )
    date_hierarchy = "assignment_date"
    autocomplete_fields = ("staff_profile", "department", "shift_type", "created_by", "updated_by")
    list_select_related = ("staff_profile__user", "department", "shift_type", "created_by")


@admin.register(StaffAvailability)
class StaffAvailabilityAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "staff_profile",
        "date",
        "shift_type",
        "status",
        "approved_by",
    )
    list_filter = ("status", "date", "shift_type")
    search_fields = (
        "staff_profile__user__username",
        "staff_profile__user__first_name",
        "staff_profile__user__last_name",
        "staff_profile__employee_no",
        "reason",
    )
    date_hierarchy = "date"
    autocomplete_fields = ("staff_profile", "shift_type", "approved_by")
    list_select_related = ("staff_profile__user", "shift_type", "approved_by")


@admin.register(AvailabilityRequest)
class AvailabilityRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "staff_profile",
        "request_type",
        "approval_status",
        "start_date",
        "end_date",
        "reviewed_by",
    )
    list_filter = ("request_type", "approval_status", "shift_type")
    search_fields = (
        "staff_profile__user__username",
        "staff_profile__user__first_name",
        "staff_profile__user__last_name",
        "staff_profile__employee_no",
        "notes",
    )
    autocomplete_fields = ("staff_profile", "shift_type", "created_by", "reviewed_by")
    list_select_related = ("staff_profile__user", "shift_type", "created_by", "reviewed_by")


@admin.register(MessageChannel)
class MessageChannelAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "channel_type", "department", "is_active", "created_by")
    list_filter = ("channel_type", "is_active", "department")
    search_fields = ("name", "department__name", "pinned_notice")
    autocomplete_fields = (
        "department",
        "created_by",
        "pinned_notice_updated_by",
    )
    list_select_related = ("department", "created_by", "pinned_notice_updated_by")


@admin.register(ChannelMessage)
class ChannelMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "channel", "sender", "created_at")
    list_filter = ("channel", "created_at")
    search_fields = ("channel__name", "sender__username", "body")
    autocomplete_fields = ("channel", "sender")
    list_select_related = ("channel", "sender")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ChannelReadState)
class ChannelReadStateAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "channel", "last_read_at")
    list_filter = ("channel",)
    search_fields = ("user__username", "channel__name")
    autocomplete_fields = ("user", "channel")
    list_select_related = ("user", "channel")
    readonly_fields = ("last_read_at",)


@admin.register(ChannelMessageReaction)
class ChannelMessageReactionAdmin(admin.ModelAdmin):
    list_display = ("id", "message", "user", "emoji", "created_at")
    list_filter = ("emoji", "created_at")
    search_fields = ("user__username", "emoji", "message__body")
    autocomplete_fields = ("message", "user")
    list_select_related = ("message", "user")
    readonly_fields = ("created_at", "updated_at")


@admin.register(StaffConstraint)
class StaffConstraintAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "staff_profile",
        "max_weekly_hours",
        "can_work_night",
        "max_consecutive_days",
        "min_rest_hours",
    )
    list_filter = ("can_work_night",)
    search_fields = (
        "staff_profile__user__username",
        "staff_profile__user__first_name",
        "staff_profile__user__last_name",
        "staff_profile__employee_no",
    )
    autocomplete_fields = ("staff_profile",)
    list_select_related = ("staff_profile__user",)


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ("id", "date", "name", "is_active")
    list_filter = ("is_active", "date")
    search_fields = ("name",)
    date_hierarchy = "date"
