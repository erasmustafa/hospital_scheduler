from django import forms
from django.contrib.auth import get_user_model

from .models import StaffProfile

User = get_user_model()


class StaffProfileForm(forms.ModelForm):
    user = forms.ModelChoiceField(
        queryset=User.objects.all().order_by("username"),
        required=True,
        label="Linked User Account",
    )
    full_name = forms.CharField(required=False, max_length=150, label="Full Name")

    class Meta:
        model = StaffProfile
        fields = [
            "user",
            "employee_no",
            "full_name",
            "title",
            "profession",
            "department",
            "phone_internal",
            "phone",
            "employment_type",
            "role",
            "weekly_limit_hours",
            "is_active",
            "can_manage_department",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["full_name"].initial = self.instance.full_name

    def save(self, commit=True):
        instance = super().save(commit=False)

        full_name = (self.cleaned_data.get("full_name") or "").strip()
        if full_name and instance.user_id:
            parts = full_name.split()
            instance.user.first_name = parts[0]
            instance.user.last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
            if commit:
                instance.user.save(update_fields=["first_name", "last_name"])

        if commit:
            instance.save()
            self.save_m2m()

        return instance
