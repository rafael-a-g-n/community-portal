from django.urls import path

from .views import CategoryListView, ReportListCreateView, ReportDetailView

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("reports/", ReportListCreateView.as_view(), name="report-list-create"),
    path("reports/<uuid:pk>/", ReportDetailView.as_view(), name="report-detail"),
]
