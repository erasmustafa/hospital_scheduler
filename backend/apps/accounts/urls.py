from django.urls import path

from .views import LoginView, LogoutView, MeView, RegisterView

urlpatterns = [
    path("", LoginView.as_view(), name="login-legacy"),
    path("login/", LoginView.as_view(), name="login"),
    path("register/", RegisterView.as_view(), name="register"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
]
