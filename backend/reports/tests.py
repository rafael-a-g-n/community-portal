import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from PIL import Image

from io import BytesIO
import os
import uuid

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


@pytest.mark.django_db
class TestReportFiltering:
    """Test /api/v1/reports/ filter behavior."""

    def test_report_list_filter_by_status_open(self, api_client):
        category_a = Category.objects.create(name="Road", icon="cone")
        category_b = Category.objects.create(name="Utilities", icon="bolt")

        open_report_1 = Report.objects.create(
            title="Open report one",
            description="Description long enough for report one.",
            category=category_a,
            status=Report.Status.OPEN,
        )
        Report.objects.create(
            title="In-progress report",
            description="Description long enough for in-progress report.",
            category=category_a,
            status=Report.Status.IN_PROGRESS,
        )
        open_report_2 = Report.objects.create(
            title="Open report two",
            description="Description long enough for report two.",
            category=category_b,
            status=Report.Status.OPEN,
        )
        Report.objects.create(
            title="Resolved report",
            description="Description long enough for resolved report.",
            category=category_b,
            status=Report.Status.RESOLVED,
        )

        response = api_client.get("/api/v1/reports/?status=open")
        assert response.status_code == 200

        payload = response.json()
        data = payload["results"] if isinstance(payload, dict) else payload

        returned_ids = {item["id"] for item in data}
        assert returned_ids == {str(open_report_1.id), str(open_report_2.id)}
        assert all(item["status"] == Report.Status.OPEN for item in data)

    def test_report_list_filter_invalid_status_returns_400(self, api_client):
        response = api_client.get("/api/v1/reports/?status=not-a-real-status")
        assert response.status_code == 400


@pytest.mark.django_db
class TestReportOrdering:
    """Test /api/v1/reports/ ordering allowlist behavior."""

    def test_report_list_ordering_by_status_works(self, api_client):
        category = Category.objects.create(name="Ordering", icon="sort")

        Report.objects.create(
            title="Resolved report",
            description="Description long enough for resolved report.",
            category=category,
            status=Report.Status.RESOLVED,
        )
        Report.objects.create(
            title="Open report",
            description="Description long enough for open report.",
            category=category,
            status=Report.Status.OPEN,
        )
        Report.objects.create(
            title="In-progress report",
            description="Description long enough for in-progress report.",
            category=category,
            status=Report.Status.IN_PROGRESS,
        )

        response = api_client.get("/api/v1/reports/?ordering=status")
        assert response.status_code == 200

        payload = response.json()
        data = payload["results"] if isinstance(payload, dict) else payload
        statuses = [item["status"] for item in data]
        assert statuses == sorted(statuses)

    def test_report_list_ordering_by_title_is_rejected(self, api_client):
        response = api_client.get("/api/v1/reports/?ordering=title")
        assert response.status_code == 400
        assert "ordering" in response.json()


@pytest.mark.django_db
class TestReportDetailPatchPermissions:
    """Test /api/v1/reports/<uuid:pk>/ PATCH permission behavior."""

    def test_report_detail_patch_as_anonymous_returns_403(self, api_client):
        category = Category.objects.create(name="Parks", icon="tree")
        report = Report.objects.create(
            title="Bench damaged",
            description="A park bench is damaged and needs maintenance.",
            category=category,
            status=Report.Status.OPEN,
        )

        response = api_client.patch(
            f"/api/v1/reports/{report.id}/",
            {"status": Report.Status.RESOLVED},
            format="json",
        )
        assert response.status_code in [401, 403]

    def test_report_detail_patch_as_admin_updates_status_and_comment(self, api_client):
        category = Category.objects.create(name="Transit", icon="bus")
        report = Report.objects.create(
            title="Bus stop sign missing",
            description="The bus stop sign is missing at this location.",
            category=category,
            status=Report.Status.OPEN,
        )

        User = get_user_model()
        admin_user = User.objects.create_user(
            username="staff_admin",
            password="admin-pass-123",
            is_staff=True,
        )
        api_client.force_authenticate(user=admin_user)

        response = api_client.patch(
            f"/api/v1/reports/{report.id}/",
            {
                "status": Report.Status.RESOLVED,
                "resolution_comment": "We successfully verified and replaced the missing street sign today."
            },
            format="json",
        )
        assert response.status_code == 200

        report.refresh_from_db()
        assert report.status == Report.Status.RESOLVED
        assert report.resolution_comment == "We successfully verified and replaced the missing street sign today."


@pytest.mark.django_db
class TestReportPhotoUploadValidation:
    """Test /api/v1/reports/ photo upload hardening behavior."""

    def _make_image_upload(self, fmt, filename):
        image = Image.new("RGB", (16, 16), color=(123, 45, 67))
        buffer = BytesIO()
        image.save(buffer, format=fmt)
        buffer.seek(0)
        content_type = f"image/{fmt.lower()}"
        if fmt.upper() == "JPEG":
            content_type = "image/jpeg"
        return SimpleUploadedFile(filename, buffer.getvalue(), content_type=content_type)

    def test_report_create_with_valid_png_upload_returns_201_and_uuid_filename(self, api_client):
        category = Category.objects.create(name="Waste", icon="bin")
        photo = self._make_image_upload("PNG", "my-original-image-name.png")

        payload = {
            "title": "Overflowing public bin",
            "description": "Public trash bin is overflowing and needs pickup soon.",
            "category_id": str(category.id),
            "photo": photo,
        }

        response = api_client.post("/api/v1/reports/", payload, format="multipart")
        assert response.status_code == 201

        report = Report.objects.get(id=response.json()["id"])
        basename = os.path.basename(report.photo.name)
        stem, ext = os.path.splitext(basename)
        assert ext.lower() == ".png"
        assert basename != "my-original-image-name.png"
        parsed_uuid = uuid.UUID(stem)
        assert str(parsed_uuid) == stem

    def test_report_create_with_invalid_image_bytes_returns_400(self, api_client):
        category = Category.objects.create(name="Roadworks", icon="cone")
        fake_image = SimpleUploadedFile(
            "not-really-an-image.png",
            b"this is not valid image data",
            content_type="image/png",
        )

        payload = {
            "title": "Road marking issue",
            "description": "Lane markings have faded and are hard to see at night.",
            "category_id": str(category.id),
            "photo": fake_image,
        }

        response = api_client.post("/api/v1/reports/", payload, format="multipart")
        assert response.status_code == 400
        assert "photo" in response.json()

    def test_report_create_with_disallowed_image_format_returns_400(self, api_client):
        category = Category.objects.create(name="Parks", icon="tree")
        bmp_photo = self._make_image_upload("BMP", "map.bmp")

        payload = {
            "title": "Trail sign damaged",
            "description": "Trail sign board is damaged and text is not readable anymore.",
            "category_id": str(category.id),
            "photo": bmp_photo,
        }

        response = api_client.post("/api/v1/reports/", payload, format="multipart")
        assert response.status_code == 400
        assert "photo" in response.json()

    def test_report_create_with_valid_jpeg_upload_returns_201(self, api_client):
        category = Category.objects.create(name="Lighting", icon="bulb")
        jpeg_photo = self._make_image_upload("JPEG", "camera-name.jpeg")

        payload = {
            "title": "Streetlamp flickering",
            "description": "Lamp keeps flickering and creates unsafe visibility on crosswalk.",
            "category_id": str(category.id),
            "photo": jpeg_photo,
        }

        response = api_client.post("/api/v1/reports/", payload, format="multipart")
        assert response.status_code == 201
