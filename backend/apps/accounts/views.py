from django.contrib.auth import authenticate, get_user_model, login, logout
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer, UserSerializer

User = get_user_model()


class LoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "detail": "POST username and password to login.",
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = LoginSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        user = authenticate(request=request, username=username, password=password)
        if not user:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        login(request, user)
        return Response({"user": UserSerializer(user).data})


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logged out."}, status=status.HTTP_200_OK)


class MeView(APIView):
    def get(self, request):
        return Response({"user": UserSerializer(request.user).data})


def user_login(request):
    return LoginView.as_view()(request)


def user_logout(request):
    return LogoutView.as_view()(request)
