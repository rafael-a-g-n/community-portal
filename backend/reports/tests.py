import pytest
from rest_framework.test import APIClient

from .models import Category, Report


@pytest.fixture
def api_client():
    """Return an API test client."""
    return APIClient()


@pytest.fixture
def sample_categories(db):
    """Create sample categories for testing."""
    return [
        Category.objects.create(name="Pothole", icon="🕳️"),
        Category.objects.create(name="Graffiti", icon="🎨"),
        Category.objects.create(name="Broken Sign", icon="⚠️"),
    ]


@pytest.mark.django_db
class TestCategoryListEndpoint:
    """Test /api/v1/categories/ endpoint."""

    def test_category_list_returns_200(self, api_client):
        """Test that category list endpoint returns 200."""
        response = api_client.get("/api/v1/categories/")
        assert response.status_code == 200

    def test_category_list_is_unpaginated(self, api_client, sample_categories):
        """Test that response is a list, not a paginated dict."""
        response = api_client.get("/api/v1/categories/")
        data = response.json()
        assert isinstance(data, list), "Response should be a list"

    def test_category_list_contains_all_categories(self, api_client, sample_categories):
        """Test that all created categories are in the response."""
        response = api_client.get("/api/v1/categories/")
        data = response.json()
        assert len(data) == 3

    def test_category_list_has_expected_fields(self, api_client, sample_categories):
        """Test that each category has expected fields."""
        response = api_client.get("/api/v1/categories/")
        data = response.json()
        expected_fields = {"id", "name", "slug", "icon"}
        actual_fields = set(data[0].keys())
        assert actual_fields == expected_fields

    def test_category_list_is_public(self, api_client, sample_categories):
        """Test that category list is accessible without authentication."""
        response = api_client.get("/api/v1/categories/")
        assert response.status_code == 200


@pytest.mark.django_db
class TestReportCreateEndpoint:
    """Test /api/v1/reports/ create behavior."""

    def test_report_create_forces_status_open(self, api_client):
        """Citizens cannot set status during report creation."""
        category = Category.objects.create(name="Lighting", icon="bulb")

        payload = {
            "title": "Streetlight outage",
            "description": "The streetlight has been off for over two nights.",
            "category_id": category.id,
            "status": "resolved",
        }

        response = api_client.post("/api/v1/reports/", payload, format="json")
        assert response.status_code == 201

        created = Report.objects.get(id=response.json()["id"])
        assert created.status == Report.Status.OPEN


@pytest.mark.django_db
class TestReportValidation:
    """Test /api/v1/reports/ payload validation behavior."""

    def test_report_create_rejects_short_title(self, api_client):
        category = Category.objects.create(name="Road", icon="cone")
        payload = {
            "title": "Bad",
            "description": "This description is long enough to pass validation.",
            "category_id": category.id,
        }

        response = api_client.post("/api/v1/reports/", payload, format="json")
        assert response.status_code == 400
        assert "title" in response.json()

    def test_report_create_rejects_short_description(self, api_client):
        category = Category.objects.create(name="Road", icon="cone")
        payload = {
            "title": "Very valid title",
            "description": "Too short",
            "category_id": category.id,
        }

        response = api_client.post("/api/v1/reports/", payload, format="json")
        assert response.status_code == 400
        assert "description" in response.json()

    def test_report_create_rejects_description_over_5000_chars(self, api_client):
        category = Category.objects.create(name="Road", icon="cone")
        payload = {
            "title": "Valid title",
            "description": "x" * 5001,
            "category_id": category.id,
        }

        response = api_client.post("/api/v1/reports/", payload, format="json")
        assert response.status_code == 400
        assert "description" in response.json()
