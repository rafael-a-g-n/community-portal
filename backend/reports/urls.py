from django.urls import path

from .views import (
    CategoryAdminView,
    CategoryAdminDetailView,
    ReportListCreateView,
    ReportDetailView,
)

urlpatterns = [
    path("categories/", CategoryAdminView.as_view(), name="category-list-create"),
    path("categories/<int:pk>/", CategoryAdminDetailView.as_view(), name="category-detail"),
    path("reports/", ReportListCreateView.as_view(), name="report-list-create"),
    path("reports/<uuid:pk>/", ReportDetailView.as_view(), name="report-detail"),
]
