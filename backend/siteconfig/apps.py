from django.apps import AppConfig


class SiteconfigConfig(AppConfig):
    """Application configuration for the siteconfig app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "siteconfig"
    verbose_name = "Site Configuration"
