from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateAPIView,
)
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.throttling import AnonRateThrottle
from django_filters.rest_framework import DjangoFilterBackend

from .filters import ReportFilter
from .models import Category, Report
from .serializers import CategorySerializer, ReportSerializer


class CategoryListView(ListAPIView):
    """List all categories without pagination."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None
    throttle_classes = []


class ReportListCreateView(ListCreateAPIView):
    """List reports or create a new one."""
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ReportFilter
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]
    throttle_classes = [AnonRateThrottle]


class ReportDetailView(RetrieveUpdateAPIView):
    """Retrieve or update a report (PATCH only; GET public, PATCH admin)."""
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    http_method_names = ["get", "patch"]
    lookup_field = "id"

    def get_permissions(self):
        """GET public, PATCH requires admin."""
        if self.request.method == "PATCH":
            return [IsAdminUser()]
        return [AllowAny()]
