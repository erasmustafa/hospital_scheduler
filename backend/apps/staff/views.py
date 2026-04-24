from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdminOrReadOnly
from common.utils import parse_date_safe

from apps.scheduling.models import WorkAssignment
from apps.scheduling.serializers import WorkAssignmentSerializer

from .models import StaffProfile
from .serializers import StaffProfileSerializer


class StaffProfileListCreateView(generics.ListCreateAPIView):
    serializer_class = StaffProfileSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = StaffProfile.objects.select_related("user", "department").all()
        user = self.request.user

        if not user or not user.is_authenticated or user.is_superuser:
            return queryset

        profile = StaffProfile.objects.select_related("department").filter(user=user).first()
        if not profile:
            return queryset.none()

        if profile.can_manage_department and profile.department_id:
            return queryset.filter(department_id=profile.department_id)

        return queryset.filter(pk=profile.pk)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({"staff": response.data}, status=response.status_code)


class StaffProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StaffProfileSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = StaffProfile.objects.select_related("user", "department").all()
        user = self.request.user

        if not user or not user.is_authenticated or user.is_superuser:
            return queryset

        profile = StaffProfile.objects.select_related("department").filter(user=user).first()
        if not profile:
            return queryset.none()

        if profile.can_manage_department and profile.department_id:
            return queryset.filter(department_id=profile.department_id)

        return queryset.filter(pk=profile.pk)


class MyScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = StaffProfile.objects.select_related("department", "user").filter(user=request.user).first()
        if not profile:
            return Response(
                {"detail": "Staff profile not found for current user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        assignments = WorkAssignment.objects.select_related(
            "staff_profile__user", "department", "shift_type"
        ).filter(staff_profile=profile)

        date_from = parse_date_safe(request.query_params.get("date_from", ""))
        date_to = parse_date_safe(request.query_params.get("date_to", ""))
        if date_from:
            assignments = assignments.filter(assignment_date__gte=date_from)
        if date_to:
            assignments = assignments.filter(assignment_date__lte=date_to)

        assignments = assignments.order_by("assignment_date", "shift_type__start_time")
        serializer = WorkAssignmentSerializer(assignments, many=True)

        return Response(
            {
                "staffProfile": {
                    "id": profile.id,
                    "fullName": profile.full_name,
                    "departmentName": profile.department.name if profile.department else None,
                },
                "assignments": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
