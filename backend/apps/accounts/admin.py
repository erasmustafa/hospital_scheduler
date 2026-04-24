from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

from apps.staff.models import StaffProfile


User = get_user_model()


class StaffProfileInline(admin.StackedInline):
    model = StaffProfile
    fk_name = "user"
    extra = 0
    autocomplete_fields = ("department",)


try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    inlines = (StaffProfileInline,)
    list_display = UserAdmin.list_display + ("is_staff", "is_superuser")
    list_filter = UserAdmin.list_filter + ("is_staff", "is_superuser", "is_active")
    search_fields = ("username", "first_name", "last_name", "email")
