from django.db import models


class SiteSettings(models.Model):
    """Singleton model storing all CMS-driven frontend content.

    Only one row ever exists (pk=1). Use ``SiteSettings.get_settings()``
    to retrieve or create the default instance. All fields have safe
    defaults so the frontend works correctly before any admin edits.

    Security notes:
    - All text fields have explicit ``max_length`` to bound stored data.
    - No ``HTMLField`` or rich-text — content is rendered as plain text
      on the frontend (never via ``dangerouslySetInnerHTML``).
    """

    # ------------------------------------------------------------------ #
    # Branding                                                             #
    # ------------------------------------------------------------------ #
    site_name = models.CharField(
        max_length=100,
        default="Community Portal",
        help_text="Displayed in the browser tab title and footer.",
    )
    site_tagline = models.CharField(
        max_length=255,
        default="Report issues in your community",
        help_text="Short tagline shown in meta descriptions / SEO.",
    )

    # ------------------------------------------------------------------ #
    # Navbar                                                               #
    # ------------------------------------------------------------------ #
    navbar_brand_text = models.CharField(
        max_length=100,
        default="Community Portal",
        help_text="Brand name shown in the top navigation bar.",
    )
    navbar_cta_text = models.CharField(
        max_length=60,
        default="New Report",
        help_text="Label for the primary call-to-action button in the navbar.",
    )

    # ------------------------------------------------------------------ #
    # Hero section (Home page)                                             #
    # ------------------------------------------------------------------ #
    hero_title = models.CharField(
        max_length=255,
        default="Make Your Community Better",
        help_text="Large heading displayed in the home page hero area.",
    )
    hero_subtitle = models.CharField(
        max_length=500,
        default=(
            "Help us improve your neighborhood. Report issues, "
            "track progress, and stay informed about local improvements."
        ),
        help_text="Subtitle paragraph below the hero heading.",
    )
    hero_cta_text = models.CharField(
        max_length=60,
        default="Submit a Report",
        help_text="Label for the hero call-to-action button.",
    )

    # ------------------------------------------------------------------ #
    # Empty state (Home page — no reports)                                 #
    # ------------------------------------------------------------------ #
    empty_state_title = models.CharField(
        max_length=255,
        default="No reports found",
        help_text="Heading shown when the reports list is empty.",
    )
    empty_state_body = models.CharField(
        max_length=500,
        default="Be the first to report an issue in your area.",
        help_text="Body text shown when the reports list is empty.",
    )

    # ------------------------------------------------------------------ #
    # About page                                                           #
    # ------------------------------------------------------------------ #
    about_title = models.CharField(
        max_length=255,
        default="About Community Portal",
        help_text="Heading for the About page.",
    )
    about_body = models.TextField(
        max_length=5000,
        default=(
            "Community Portal is a community-driven platform designed to "
            "bridge the gap between citizens and local authorities. By "
            "providing a transparent and easy-to-use interface for reporting "
            "infrastructure, safety, and environmental issues, we empower "
            "residents to take an active role in improving their neighborhoods."
        ),
        help_text="Main body text for the About page (max 5 000 characters).",
    )

    # ------------------------------------------------------------------ #
    # Footer                                                               #
    # ------------------------------------------------------------------ #
    footer_copyright_text = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text=(
            "Optional extra copyright or legal text shown in the footer. "
            "The year and site name are appended automatically."
        ),
    )

    # ------------------------------------------------------------------ #
    # Report Detail page                                                   #
    # ------------------------------------------------------------------ #
    detail_official_response_label = models.CharField(
        max_length=100,
        default="Official Response",
        help_text="Heading for the resolution-comment card on the report detail page.",
    )
    detail_support_title = models.CharField(
        max_length=100,
        default="Need Help?",
        help_text="Heading for the support card on the report detail page.",
    )
    detail_support_body = models.CharField(
        max_length=500,
        default=(
            "If you have more information about this issue, "
            "please contact our community support team."
        ),
        help_text="Body text for the support card on the report detail page.",
    )

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self) -> str:
        return "Site Settings"

    def save(self, *args, **kwargs) -> None:
        """Enforce the singleton pattern: always save as pk=1."""
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls) -> "SiteSettings":
        """Return the single settings instance, creating it if absent."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
