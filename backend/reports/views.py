from django.db.models import QuerySet
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateAPIView,
)
from rest_framework.permissions import BasePermission
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.throttling import BaseThrottle
from rest_framework.throttling import AnonRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from drf_spectacular.utils import extend_schema_view

from .filters import ReportFilter
from .models import Category, Report
from .serializers import CategorySerializer, ReportSerializer


@extend_schema(
    summary="List categories",
    description=(
        "Return a public, unpaginated list of report categories. "
        "Useful for populating category selectors on clients."
    ),
    responses={
        200: CategorySerializer(many=True),
    },
)
class CategoryListView(ListAPIView):
    """List all categories without pagination."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None
    throttle_classes = []


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
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ReportFilter
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
            requested_fields = [field.strip() for field in ordering.split(",") if field.strip()]
            invalid_fields = [
                field for field in requested_fields if field.lstrip("-") not in allowed_fields
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
)
class ReportDetailView(RetrieveUpdateAPIView):
    """Retrieve or update a report (PATCH only; GET public, PATCH admin)."""
    queryset = Report.objects.select_related("category").all()
    serializer_class = ReportSerializer
    http_method_names = ["get", "patch"]
    lookup_field = "id"
    lookup_url_kwarg = "pk"

    def get_permissions(self) -> list[BasePermission]:
        """GET public, PATCH requires admin."""
        if self.request.method == "PATCH":
            return [IsAdminUser()]
        return [AllowAny()]
