from django.urls import path

from .views import dashboard_view, mini_calendar_data_api

urlpatterns = [
    path("", dashboard_view, name="dashboard"),
    path("mini-calendar-data/", mini_calendar_data_api, name="mini_calendar_data_api"),
]

