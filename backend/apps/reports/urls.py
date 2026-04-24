from django.urls import path

from .reports import ReportOverviewView

urlpatterns = [
    path("overview/", ReportOverviewView.as_view(), name="reports-overview"),
]
