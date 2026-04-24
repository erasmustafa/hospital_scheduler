from django.http import HttpRequest, HttpResponse

from .models import AuditLog


def _client_ip(request: HttpRequest):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)

        try:
            is_authenticated = bool(
                getattr(request, "user", None) and request.user.is_authenticated
            )
            is_mutating_api_call = request.path.startswith("/api/") and request.method not in {
                "GET",
                "HEAD",
                "OPTIONS",
            }
            if not is_authenticated and not is_mutating_api_call:
                return response

            actor = request.user if is_authenticated else None
            action = request.method.lower() if is_mutating_api_call else "request"
            AuditLog.objects.create(
                actor=actor,
                action=action[:20],
                entity=request.path[:255],
                payload={
                    "statusCode": response.status_code,
                    "method": request.method,
                    "ipAddress": _client_ip(request),
                },
            )
        except Exception:
            # Audit logging should never break user-facing requests.
            return response

        return response


class AuditTrailMiddleware(AuditMiddleware):
    pass
