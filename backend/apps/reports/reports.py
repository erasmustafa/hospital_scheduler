from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import build_operational_report, parse_report_range


class ReportOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_from, date_to = parse_report_range(
            request.query_params.get("date_from"),
            request.query_params.get("date_to"),
        )
        if date_to < date_from:
            return Response(
                {"detail": "date_to must be the same or after date_from."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = build_operational_report(
            date_from=date_from,
            date_to=date_to,
            department_id=request.query_params.get("department"),
            status_filter=request.query_params.get("status"),
        )
        return Response(payload, status=status.HTTP_200_OK)
