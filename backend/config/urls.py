from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from apps.scheduling.views import CalendarEventsView, MoveAssignmentView

admin.site.site_header = "MediShift Admin"
admin.site.site_title = "MediShift Admin"
admin.site.index_title = "Hospital Workforce Management"


def root_view(request):
    return JsonResponse(
        {
            "service": "Hospital Workforce Backend",
            "status": "ok",
            "apiBase": "/api/",
            "dashboard": "/dashboard/",
            "admin": "/admin/",
        }
    )


def api_root_view(request):
    return JsonResponse(
        {
            "auth": "/api/auth/",
            "staff": "/api/staff/",
            "departments": "/api/departments/",
            "assignments": "/api/assignments/",
            "availability": "/api/availability/",
            "dashboardSummary": "/api/dashboard/summary/",
            "notifications": "/api/notifications/",
            "messages": "/api/messages/",
            "reports": "/api/reports/",
        }
    )


urlpatterns = [
    path("", root_view, name="root"),
    path("admin/", admin.site.urls),
    path("dashboard/", include("apps.dashboard.urls")),
    path("api/", api_root_view, name="api-root"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/staff/", include("apps.staff.urls")),
    path("api/departments/", include("apps.departments.urls")),
    path("api/", include("apps.scheduling.urls")),
    path("api/", include("apps.notifications.urls")),
    path("api/messages/", include("apps.messaging.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("scheduling/api/events/", CalendarEventsView.as_view(), name="scheduling-calendar-events-compat"),
    path(
        "scheduling/api/move-assignment/",
        MoveAssignmentView.as_view(),
        name="scheduling-move-assignment-compat",
    ),
]
