from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.permissions import BasePermission

from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view

from .models import SiteSettings
from .serializers import SiteSettingsSerializer, ContactSubmissionSerializer


@extend_schema_view(
    retrieve=extend_schema(
        summary="Retrieve site settings",
        description=(
            "Return the current site-wide settings that drive all "
            "customisable frontend content. Public endpoint — no "
            "authentication required."
        ),
        responses={200: SiteSettingsSerializer},
    ),
    partial_update=extend_schema(
        summary="Update site settings (admin only)",
        description=(
            "Partially update one or more site settings fields. "
            "Restricted to admin users. All string values are stripped "
            "and length-validated server-side."
        ),
        request=SiteSettingsSerializer,
        responses={
            200: SiteSettingsSerializer,
            400: OpenApiResponse(description="Validation failed."),
            401: OpenApiResponse(description="Authentication required."),
            403: OpenApiResponse(description="Admin privileges required."),
        },
    ),
)
class SiteSettingsView(RetrieveUpdateAPIView):
    """Retrieve (public) or update (admin only) the site settings singleton."""

    serializer_class = SiteSettingsSerializer
    http_method_names = ["get", "patch"]

    def get_object(self) -> SiteSettings:
        """Always return the singleton instance, creating it if absent."""
        return SiteSettings.get_settings()

    def get_permissions(self) -> list[BasePermission]:
        """GET is public; PATCH requires admin."""
        if self.request.method == "PATCH":
            return [IsAdminUser()]
        return [AllowAny()]


@extend_schema_view(
    create=extend_schema(
        summary="Submit contact form message",
        description="Public endpoint to submit a contact form message.",
        request=ContactSubmissionSerializer,
        responses={
            201: ContactSubmissionSerializer,
            400: OpenApiResponse(description="Validation failed."),
        },
    ),
)
class ContactSubmissionView(CreateAPIView):
    """Public endpoint for visitors to submit contact form messages."""

    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    permission_classes = [AllowAny]
