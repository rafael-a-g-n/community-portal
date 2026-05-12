from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "actor", "target_model", "target_id", "created_at"]
    list_filter = ["action", "target_model"]
    search_fields = ["target_model", "summary"]
    readonly_fields = ["actor", "action", "target_model", "target_id", "summary", "created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
