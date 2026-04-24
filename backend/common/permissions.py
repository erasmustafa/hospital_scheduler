from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import SAFE_METHODS, BasePermission


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):  # type: ignore[override]
        return


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)
