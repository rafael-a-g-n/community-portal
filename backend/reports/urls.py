from django.urls import path

from .views import (
    AdminStatsView,
    CategoryAdminView,
    CategoryAdminDetailView,
    ReportCommentListCreateView,
    ReportExportView,
    ReportListCreateView,
    ReportDetailView,
    ReportTrackView,
)

urlpatterns = [
    path("categories/", CategoryAdminView.as_view(), name="category-list-create"),
    path("categories/<int:pk>/", CategoryAdminDetailView.as_view(), name="category-detail"),
    path("reports/", ReportListCreateView.as_view(), name="report-list-create"),
    path("reports/<uuid:pk>/", ReportDetailView.as_view(), name="report-detail"),
    path("reports/track/<uuid:token>/", ReportTrackView.as_view(), name="report-track"),
    path("reports/<uuid:pk>/comments/", ReportCommentListCreateView.as_view(), name="report-comment-list-create"),
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/reports/export/", ReportExportView.as_view(), name="report-export"),
]
