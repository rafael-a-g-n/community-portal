from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(ListAPIView):
    permission_classes = [IsAdminUser]
    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    ordering = ["-created_at"]
