from django.db.models import QuerySet
from django.db.models.deletion import ProtectedError

from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import BasePermission
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import BaseThrottle
from rest_framework.throttling import AnonRateThrottle
from rest_framework import status as http_status

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from .filters import ReportFilter
from .models import Category, Report
from .serializers import CategorySerializer, CategoryWriteSerializer, ReportSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List categories",
        description=(
            "Return a public, unpaginated list of report categories. "
            "Useful for populating category selectors on clients."
        ),
        responses={200: CategorySerializer(many=True)},
    ),
    create=extend_schema(
        summary="Create category (admin only)",
        description="Create a new category. Restricted to admin users.",
        request=CategorySerializer,
        responses={
            201: CategorySerializer,
            400: OpenApiResponse(description="Validation failed."),
            401: OpenApiResponse(description="Authentication required."),
            403: OpenApiResponse(description="Admin privileges required."),
        },
    ),
)
class CategoryAdminView(ListCreateAPIView):
    """List all categories (public) or create a new one (admin only)."""

    queryset = Category.objects.all()
    pagination_class = None
    throttle_classes = []

    def get_serializer_class(self):
        """Use write serialiser for mutations; read-only for GET."""
        if self.request.method == "POST":
            return CategoryWriteSerializer
        return CategorySerializer

    def get_permissions(self) -> list[BasePermission]:
        """GET is public; POST requires admin."""
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [AllowAny()]


@extend_schema_view(
    retrieve=extend_schema(
        summary="Retrieve category",
        description="Fetch a single category by primary key.",
        responses={
            200: CategorySerializer,
            404: OpenApiResponse(description="Category not found."),
        },
    ),
    partial_update=extend_schema(
        summary="Update category (admin only)",
        description="Partially update a category name or icon.",
        request=CategorySerializer,
        responses={
            200: CategorySerializer,
            400: OpenApiResponse(description="Validation failed."),
            403: OpenApiResponse(description="Admin privileges required."),
            404: OpenApiResponse(description="Category not found."),
        },
    ),
    destroy=extend_schema(
        summary="Delete category (admin only)",
        description=(
            "Delete a category. Returns HTTP 400 if any reports are "
            "still linked to this category."
        ),
        responses={
            204: OpenApiResponse(description="Category deleted."),
            400: OpenApiResponse(
                description="Category has linked reports; deletion blocked."
            ),
            403: OpenApiResponse(description="Admin privileges required."),
            404: OpenApiResponse(description="Category not found."),
        },
    ),
)
class CategoryAdminDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve (public), update or delete (admin only) a single category."""

    queryset = Category.objects.all()
    http_method_names = ["get", "patch", "delete"]

    def get_serializer_class(self):
        """Use write serialiser for mutations; read-only for GET."""
        if self.request.method == "PATCH":
            return CategoryWriteSerializer
        return CategorySerializer

    def get_permissions(self) -> list[BasePermission]:
        """GET is public; PATCH and DELETE require admin."""
        if self.request.method in ("PATCH", "DELETE"):
            return [IsAdminUser()]
        return [AllowAny()]

    def destroy(self, request, *args, **kwargs) -> Response:
        """Block deletion if any reports are linked to this category."""
        instance: Category = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            report_count: int = Report.objects.filter(category=instance).count()
            raise ValidationError(
                {
                    "detail": (
                        f"Cannot delete '{instance.name}': "
                        f"{report_count} report(s) are still linked to it. "
                        "Reassign or delete those reports first."
                    )
                }
            )
        return Response(status=http_status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(
        summary="List reports",
        description=(
            "Return a paginated public list of reports with optional status/category "
            "filters and ordering by created_at or status."
        ),
        parameters=[
            OpenApiParameter(
                name="status",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter by status: open, in_progress, resolved.",
            ),
            OpenApiParameter(
                name="category",
                type=int,
                location=OpenApiParameter.QUERY,
                description="Filter by category primary key.",
            ),
            OpenApiParameter(
                name="ordering",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Allowed values: created_at, -created_at, status, -status.",
            ),
            OpenApiParameter(
                name="search",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Search by title or description.",
            ),
        ],
        responses={
            200: OpenApiResponse(description="Reports retrieved successfully."),
            400: OpenApiResponse(description="Invalid filter or ordering parameter."),
        },
    ),
    create=extend_schema(
        summary="Create report",
        description=(
            "Create a new citizen report. Incoming status is ignored and forced to "
            "open by server-side business rules."
        ),
        request=ReportSerializer,
        responses={
            201: ReportSerializer,
            400: OpenApiResponse(description="Validation failed."),
            429: OpenApiResponse(description="Anonymous request rate limit exceeded."),
        },
    ),
)
class ReportListCreateView(ListCreateAPIView):
    """List reports or create a new one."""

    queryset = Report.objects.select_related("category").all()
    serializer_class = ReportSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = ReportFilter
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]

    def get_throttles(self) -> list[BaseThrottle]:
        if self.request.method == "POST" and not self.request.user.is_authenticated:
            return [AnonRateThrottle()]
        return []

    def filter_queryset(self, queryset: QuerySet[Report]) -> QuerySet[Report]:
        ordering = self.request.query_params.get("ordering")
        if ordering:
            allowed_fields = set(self.ordering_fields)
            requested_fields = [
                field.strip()
                for field in ordering.split(",")
                if field.strip()
            ]
            invalid_fields = [
                field
                for field in requested_fields
                if field.lstrip("-") not in allowed_fields
            ]
            if invalid_fields:
                raise ValidationError(
                    {
                        "ordering": (
                            "Invalid ordering field(s): "
                            f"{', '.join(invalid_fields)}. "
                            f"Allowed: {', '.join(sorted(allowed_fields))}."
                        )
                    }
                )
        return super().filter_queryset(queryset)


@extend_schema_view(
    retrieve=extend_schema(
        summary="Retrieve report",
        description="Fetch a single report by UUID.",
        responses={
            200: ReportSerializer,
            404: OpenApiResponse(description="Report not found."),
        },
    ),
    partial_update=extend_schema(
        summary="Update report (admin only)",
        description="Partially update a report. PATCH is restricted to admin users.",
        request=ReportSerializer,
        responses={
            200: ReportSerializer,
            403: OpenApiResponse(description="Admin privileges required."),
            404: OpenApiResponse(description="Report not found."),
        },
    ),
    destroy=extend_schema(
        summary="Delete report (admin only)",
        description="Permanently delete a report. Restricted to admin users.",
        responses={
            204: OpenApiResponse(description="Report deleted."),
            403: OpenApiResponse(description="Admin privileges required."),
            404: OpenApiResponse(description="Report not found."),
        },
    ),
)
class ReportDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve (public), update or delete (admin only) a single report."""

    queryset = Report.objects.select_related("category").all()
    serializer_class = ReportSerializer
    http_method_names = ["get", "patch", "delete"]
    lookup_field = "id"
    lookup_url_kwarg = "pk"

    def get_permissions(self) -> list[BasePermission]:
        """GET is public; PATCH and DELETE require admin."""
        if self.request.method in ("PATCH", "DELETE"):
            return [IsAdminUser()]
        return [AllowAny()]


@extend_schema_view(
    retrieve=extend_schema(
        summary="Track report by token",
        description=(
            "Public endpoint that returns a single report identified by its "
            "anonymous tracking token. Used by citizens who did not create an "
            "account to follow up on their report."
        ),
        responses={
            200: ReportSerializer,
            404: OpenApiResponse(description="Report not found for this token."),
        },
    ),
)
class ReportTrackView(RetrieveAPIView):
    """Look up a report by its anonymous tracking token (public)."""

    queryset = Report.objects.select_related("category").all()
    serializer_class = ReportSerializer
    lookup_field = "tracking_token"
    lookup_url_kwarg = "token"
