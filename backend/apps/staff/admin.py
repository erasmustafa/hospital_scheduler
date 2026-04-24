from django.contrib import admin

from .models import StaffProfile


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "full_name",
        "employee_no",
        "title",
        "role",
        "employment_type",
        "department",
        "weekly_limit_hours",
        "can_manage_department",
        "is_active",
    )
    list_filter = ("is_active", "can_manage_department", "role", "employment_type", "department")
    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "title",
        "profession",
        "employee_no",
        "phone",
        "phone_internal",
    )
    ordering = ("user__first_name", "user__last_name", "user__username")
    list_select_related = ("user", "department")
    autocomplete_fields = ("user", "department")
    fieldsets = (
        (
            "Identity",
            {
                "fields": (
                    "user",
                    "employee_no",
                    "title",
                    "profession",
                    "role",
                    "employment_type",
                )
            },
        ),
        (
            "Department",
            {
                "fields": (
                    "department",
                    "can_manage_department",
                    "weekly_limit_hours",
                )
            },
        ),
        (
            "Contact",
            {
                "fields": (
                    "phone",
                    "phone_internal",
                )
            },
        ),
        ("Status", {"fields": ("is_active",)}),
    )
