"""URL configuration for core project."""
from django.conf import settings
from django.contrib import admin
from django.conf.urls.static import static
from django.urls import include, path, re_path
from django.views.static import serve as media_serve
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from .auth_views import RateLimitedObtainAuthToken

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/login/", RateLimitedObtainAuthToken.as_view(), name="api_token_auth"),
    path("api/v1/", include("reports.urls")),
    path("api/v1/", include("siteconfig.urls")),
    path("api/v1/", include("auditlog.urls")),
]

# Always serve media files directly (bypasses DEBUG check in static())
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', media_serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "api/docs/swagger/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
        path(
            "api/docs/redoc/",
            SpectacularRedocView.as_view(url_name="schema"),
            name="redoc",
        ),
    ]
