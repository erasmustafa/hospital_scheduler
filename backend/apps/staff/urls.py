from django.urls import path

from .views import MyScheduleView, StaffProfileDetailView, StaffProfileListCreateView

urlpatterns = [
    path("", StaffProfileListCreateView.as_view(), name="staff-list"),
    path("create/", StaffProfileListCreateView.as_view(), name="staff-create-legacy"),
    path("my-schedule/", MyScheduleView.as_view(), name="my-schedule"),
    path("<int:pk>/edit/", StaffProfileDetailView.as_view(), name="staff-edit-legacy"),
    path("<int:pk>/", StaffProfileDetailView.as_view(), name="staff-detail"),
]
