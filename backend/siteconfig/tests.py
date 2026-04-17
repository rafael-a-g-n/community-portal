import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from .models import SiteSettings


@pytest.fixture
def api_client():
    """Return an API test client."""
    return APIClient()


@pytest.fixture
def site_settings(db):
    """Return the SiteSettings singleton, creating it with defaults."""
    return SiteSettings.get_settings()


@pytest.mark.django_db
class TestSiteSettingsGetEndpoint:
    """Test GET /api/v1/settings/ — public access and response shape."""

    def test_get_settings_returns_200(self, api_client, site_settings):
        """Public users can read site settings without authentication."""
        response = api_client.get("/api/v1/settings/")
        assert response.status_code == 200

    def test_get_settings_contains_expected_fields(self, api_client, site_settings):
        """Response includes all expected CMS fields."""
        response = api_client.get("/api/v1/settings/")
        data = response.json()
        expected_fields = {
            "site_name",
            "site_tagline",
            "navbar_brand_text",
            "navbar_cta_text",
            "hero_title",
            "hero_subtitle",
            "hero_cta_text",
            "empty_state_title",
            "empty_state_body",
            "about_title",
            "about_body",
            "footer_copyright_text",
            "detail_official_response_label",
            "detail_support_title",
            "detail_support_body",
        }
        assert expected_fields.issubset(set(data.keys()))

    def test_get_settings_returns_defaults(self, api_client, site_settings):
        """Freshly created settings return the model defaults."""
        response = api_client.get("/api/v1/settings/")
        data = response.json()
        assert data["site_name"] == "Community Portal"
        assert data["hero_title"] == "Make Your Community Better"

    def test_get_settings_does_not_expose_id(self, api_client, site_settings):
        """The singleton pk is excluded from the public response."""
        response = api_client.get("/api/v1/settings/")
        assert "id" not in response.json()


@pytest.mark.django_db
class TestSiteSettingsPatchEndpoint:
    """Test PATCH /api/v1/settings/ — admin-only write access and validation."""

    def test_patch_settings_as_anonymous_returns_401(
        self, api_client, site_settings
    ):
        """Anonymous users cannot update site settings."""
        response = api_client.patch(
            "/api/v1/settings/",
            {"site_name": "Hacked"},
            format="json",
        )
        assert response.status_code in [401, 403]

    def test_patch_settings_as_admin_updates_field(self, api_client, site_settings):
        """Admin users can update individual CMS fields."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="settings_admin", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        response = api_client.patch(
            "/api/v1/settings/",
            {"hero_title": "A Better Place for Everyone", "navbar_cta_text": "Report Now"},
            format="json",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["hero_title"] == "A Better Place for Everyone"
        assert data["navbar_cta_text"] == "Report Now"

    def test_patch_settings_strips_whitespace(self, api_client, site_settings):
        """String values are stripped of leading/trailing whitespace before saving."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="settings_admin2", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        response = api_client.patch(
            "/api/v1/settings/",
            {"site_name": "  My City Portal  "},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["site_name"] == "My City Portal"

    def test_patch_settings_rejects_oversized_field(self, api_client, site_settings):
        """Values exceeding max_length are rejected with a 400 error."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="settings_admin3", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        response = api_client.patch(
            "/api/v1/settings/",
            {"site_name": "x" * 101},  # max_length=100
            format="json",
        )
        assert response.status_code == 400
        assert "site_name" in response.json()

    def test_patch_settings_persists_to_database(self, api_client, site_settings):
        """Updated settings are persisted; subsequent GET returns new values."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="settings_admin4", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        api_client.patch(
            "/api/v1/settings/",
            {"footer_copyright_text": "All rights reserved. City of Example."},
            format="json",
        )
        # Read back with a fresh unauthenticated client
        fresh_client = APIClient()
        response = fresh_client.get("/api/v1/settings/")
        assert response.json()["footer_copyright_text"] == (
            "All rights reserved. City of Example."
        )
