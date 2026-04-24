from django.contrib import admin

from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "is_active", "staff_count")
    list_filter = ("is_active",)
    search_fields = ("name", "code")
    ordering = ("name",)

    def staff_count(self, obj):
        return obj.staff.count()

    staff_count.short_description = "Staff"
