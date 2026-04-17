from django.contrib import admin

from .models import SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    """Django admin integration for the SiteSettings singleton."""

    fieldsets = (
        ("Branding", {"fields": ("site_name", "site_tagline")}),
        ("Navbar", {"fields": ("navbar_brand_text", "navbar_cta_text")}),
        (
            "Hero Section",
            {"fields": ("hero_title", "hero_subtitle", "hero_cta_text")},
        ),
        (
            "Empty State",
            {"fields": ("empty_state_title", "empty_state_body")},
        ),
        ("About Page", {"fields": ("about_title", "about_body")}),
        ("Footer", {"fields": ("footer_copyright_text",)}),
        (
            "Report Detail Page",
            {
                "fields": (
                    "detail_official_response_label",
                    "detail_support_title",
                    "detail_support_body",
                )
            },
        ),
    )

    def has_add_permission(self, request) -> bool:
        """Block adding a second instance via the Django admin UI."""
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None) -> bool:
        """Prevent accidental deletion of the singleton via Django admin."""
        return False
