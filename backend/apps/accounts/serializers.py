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


class RegisterSerializer(serializers.Serializer):
    fullName = serializers.CharField(max_length=150, required=True, allow_blank=False)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(
        max_length=128, trim_whitespace=False, required=True, allow_blank=False
    )
    purpose = serializers.ChoiceField(
        choices=["personal", "manager", "invite"], required=True
    )
    metadata = serializers.JSONField(required=False)

    def validate_email(self, value: str) -> str:
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Bu e-posta adresi zaten kullanılıyor.")
        return normalized

    def validate_password(self, value: str) -> str:
        if len(value) < 8:
            raise serializers.ValidationError("Şifre en az 8 karakter olmalıdır.")
        return value

    def _build_username(self, email: str) -> str:
        if len(email) <= 150 and not User.objects.filter(username=email).exists():
            return email
        base = email.split("@", 1)[0].strip().lower().replace(" ", ".") or "kullanici"
        candidate = base[:150]
        counter = 1
        while User.objects.filter(username=candidate).exists():
            suffix = str(counter)
            candidate = f"{base[: max(1, 150 - len(suffix) - 1)]}-{suffix}"
            counter += 1
        return candidate

    def create(self, validated_data):
        full_name = validated_data["fullName"].strip()
        first_name, _, last_name = full_name.partition(" ")
        email = validated_data["email"]
        phone = (validated_data.get("phone") or "").strip()
        purpose = validated_data["purpose"]

        user = User.objects.create_user(
            username=self._build_username(email),
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            email=email,
            password=validated_data["password"],
        )

        StaffProfile.objects.create(
            user=user,
            phone=phone,
            can_manage_department=(purpose == "manager"),
            is_active=True,
        )
        return user
