from django.contrib import admin

from .models import Category, Report


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ["name", "slug", "icon"]
	prepopulated_fields = {"slug": ("name",)}


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
	list_display = ["title", "category", "status", "created_at"]
	list_filter = ["status", "category"]
	search_fields = ["title"]
	readonly_fields = ["id", "created_at", "updated_at"]
