from django.urls import path

from .views import LoginView, LogoutView, MeView

urlpatterns = [
    path("", LoginView.as_view(), name="login-legacy"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
]
