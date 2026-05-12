from django.urls import path

from .views import AuditLogListView

urlpatterns = [
    path("admin/audit-log/", AuditLogListView.as_view(), name="audit-log-list"),
]
