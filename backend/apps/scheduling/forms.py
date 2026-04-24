from django import forms

from apps.departments.models import Department

from .models import (
    AvailabilityRequest,
    ChannelMessage,
    MessageChannel,
    StaffAvailability,
    WorkAssignment,
)


class WorkAssignmentForm(forms.ModelForm):
    class Meta:
        model = WorkAssignment
        fields = [
            "staff_profile",
            "department",
            "shift_type",
            "assignment_date",
            "status",
            "notes",
        ]
        widgets = {
            "assignment_date": forms.DateInput(attrs={"type": "date"}),
            "notes": forms.Textarea(attrs={"rows": 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["staff_profile"].label = "Staff"
        self.fields["notes"].label = "Note"

    def clean(self):
        cleaned_data = super().clean()
        staff_profile = cleaned_data.get("staff_profile")
        assignment_date = cleaned_data.get("assignment_date")
        shift_type = cleaned_data.get("shift_type")

        if staff_profile and assignment_date and shift_type:
            queryset = WorkAssignment.objects.filter(
                staff_profile=staff_profile,
                assignment_date=assignment_date,
                shift_type=shift_type,
            )
            if self.instance.pk:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise forms.ValidationError("There is already an assignment for the same slot.")

        return cleaned_data


class AutoScheduleForm(forms.Form):
    department = forms.ModelChoiceField(
        queryset=Department.objects.filter(is_active=True).order_by("name"),
        label="Department",
    )
    start_date = forms.DateField(
        widget=forms.DateInput(attrs={"type": "date"}),
        label="Start Date",
    )
    end_date = forms.DateField(
        widget=forms.DateInput(attrs={"type": "date"}),
        label="End Date",
    )
    balance_night_shifts = forms.BooleanField(
        required=False,
        initial=True,
        label="Balance night shifts",
    )
    respect_weekly_limit = forms.BooleanField(
        required=False,
        initial=True,
        label="Respect weekly limits",
    )
    use_availability = forms.BooleanField(
        required=False,
        initial=True,
        label="Respect availability entries",
    )
    dry_run = forms.BooleanField(
        required=False,
        initial=True,
        label="Preview only",
    )
    balance_weekends = forms.BooleanField(
        required=False,
        initial=True,
        label="Balance weekend shifts",
    )

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get("start_date")
        end_date = cleaned_data.get("end_date")

        if start_date and end_date and start_date > end_date:
            raise forms.ValidationError("Start date cannot be after end date.")

        return cleaned_data


class StaffAvailabilityForm(forms.ModelForm):
    class Meta:
        model = StaffAvailability
        fields = ["date", "shift_type", "status", "reason"]
        widgets = {
            "date": forms.DateInput(attrs={"type": "date"}),
            "reason": forms.Textarea(attrs={"rows": 3}),
        }
        labels = {
            "reason": "Note",
        }


class AvailabilityRequestForm(forms.ModelForm):
    class Meta:
        model = AvailabilityRequest
        fields = ["shift_type", "start_date", "end_date", "request_type", "notes"]
        widgets = {
            "start_date": forms.DateInput(attrs={"type": "date"}),
            "end_date": forms.DateInput(attrs={"type": "date"}),
            "notes": forms.Textarea(attrs={"rows": 3}),
        }
        labels = {
            "notes": "Note",
        }

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get("start_date")
        end_date = cleaned_data.get("end_date")
        if start_date and end_date and end_date < start_date:
            raise forms.ValidationError("End date cannot be before start date.")
        return cleaned_data


class ChannelMessageForm(forms.ModelForm):
    class Meta:
        model = ChannelMessage
        fields = ["body"]
        widgets = {
            "body": forms.Textarea(
                attrs={
                    "rows": 3,
                    "placeholder": "Write a message...",
                }
            ),
        }


class ChannelPinnedNoticeForm(forms.ModelForm):
    class Meta:
        model = MessageChannel
        fields = ["pinned_notice"]
        widgets = {
            "pinned_notice": forms.Textarea(
                attrs={
                    "rows": 3,
                    "placeholder": "Write a pinned notice...",
                }
            ),
        }
