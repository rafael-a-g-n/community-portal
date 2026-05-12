import csv
from datetime import timedelta

from django.db.models import Count, QuerySet
from django.db.models.deletion import ProtectedError
from django.http import StreamingHttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from rest_framework import status as http_status
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import AllowAny, BasePermission, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, BaseThrottle
from rest_framework.views import APIView

from auditlog.models import AuditLog

from .filters import ReportFilter
from .models import Category, Comment, Report
from .serializers import (
    CategorySerializer,
    CategoryWriteSerializer,
    CommentSerializer,
    ReportSerializer,
)


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

    def perform_update(self, serializer):
        super().perform_update(serializer)
        AuditLog.objects.create(
            actor=self.request.user,
            action="update",
            target_model="Category",
            target_id=str(serializer.instance.id),
            summary=f"Updated category '{serializer.instance.name}'",
        )

    def destroy(self, request, *args, **kwargs) -> Response:
        """Block deletion if any reports are linked to this category."""
        instance: Category = self.get_object()
        try:
            name = instance.name
            instance.delete()
        except ProtectedError as err:
            report_count: int = Report.objects.filter(category=instance).count()
            raise ValidationError(
                {
                    "detail": (
                        f"Cannot delete '{instance.name}': "
                        f"{report_count} report(s) are still linked to it. "
                        "Reassign or delete those reports first."
                    )
                }
            ) from err
        AuditLog.objects.create(
            actor=request.user,
            action="delete",
            target_model="Category",
            target_id=str(instance.id),
            summary=f"Deleted category '{name}'",
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

    def perform_update(self, serializer):
        super().perform_update(serializer)
        AuditLog.objects.create(
            actor=self.request.user,
            action="update",
            target_model="Report",
            target_id=str(serializer.instance.id),
            summary=f"Updated report '{serializer.instance.title}'",
        )

    def perform_destroy(self, instance):
        title = instance.title
        AuditLog.objects.create(
            actor=self.request.user,
            action="delete",
            target_model="Report",
            target_id=str(instance.id),
            summary=f"Deleted report '{title}'",
        )
        instance.delete()


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


@extend_schema_view(
    get=extend_schema(
        summary="Admin analytics stats",
        description=(
            "Returns aggregate stats about reports for the admin"
            " dashboard. Admin only."
        ),
    ),
)
class AdminStatsView(RetrieveAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total = Report.objects.count()
        by_status = Report.objects.values("status").annotate(count=Count("id"))
        by_category = Report.objects.values(
            "category__name", "category__name_pt"
        ).annotate(count=Count("id"))

        thirty_days_ago = timezone.now() - timedelta(days=30)
        per_day = (
            Report.objects.filter(created_at__gte=thirty_days_ago)
            .extra(select={"date": "DATE(created_at)"})
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        resolved = Report.objects.filter(status=Report.Status.RESOLVED)
        avg_resolution = None
        if resolved.exists():
            avg_resolution = resolved.count()

        return Response({
            "total_reports": total,
            "by_status": {s["status"]: s["count"] for s in by_status},
            "by_category": list(by_category),
            "reports_per_day": list(per_day),
            "avg_resolution_time_days": avg_resolution,
        })


class ReportExportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        reports = Report.objects.select_related("category").all()

        response = StreamingHttpResponse(
            content_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="reports.csv"'},
        )
        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Title",
                "Description",
                "Category",
                "Status",
                "Address",
                "Latitude",
                "Longitude",
                "Created",
                "Updated",
                "Tracking Token",
            ]
        )
        for r in reports:
            writer.writerow([
                r.id, r.title, r.description, r.category.name, r.status,
                r.address, r.latitude, r.longitude,
                r.created_at.isoformat(), r.updated_at.isoformat(), r.tracking_token
            ])
        return response


class ReportCommentListCreateView(ListCreateAPIView):
    """List (public) and create (public, throttled) comments on a report."""

    serializer_class = CommentSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def get_queryset(self):
        return Comment.objects.filter(
            report_id=self.kwargs["pk"]
        ).order_by("created_at")

    def perform_create(self, serializer):
        serializer.save(report_id=self.kwargs["pk"])
