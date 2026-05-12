from io import BytesIO
import os
import uuid

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
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
        expected_fields = {"id", "name", "name_pt", "slug", "icon"}
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

    def test_report_list_search_by_keyword(self, api_client):
        cat = Category.objects.create(name="Public Space", icon="bench")
        Report.objects.create(
            title="Broken park bench",
            description="The wooden bench at Central Park is broken.",
            category=cat,
            status=Report.Status.OPEN
        )
        Report.objects.create(
            title="Graffiti on wall",
            description="Spray paint on the community center wall.",
            category=cat,
            status=Report.Status.OPEN
        )

        # Search for "bench"
        response = api_client.get("/api/v1/reports/?search=bench")
        assert response.status_code == 200
        data = response.json()["results"]
        assert len(data) == 1
        assert "bench" in data[0]["title"]

        # Search for "community"
        response = api_client.get("/api/v1/reports/?search=community")
        assert response.status_code == 200
        data = response.json()["results"]
        assert len(data) == 1
        assert "community" in data[0]["description"]

        # Search for something that shouldn't match
        response = api_client.get("/api/v1/reports/?search=pothole")
        assert response.status_code == 200
        assert len(response.json()["results"]) == 0


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
                "resolution_comment": (
                    "We successfully verified and replaced the missing street sign today."
                ),
            },
            format="json",
        )
        assert response.status_code == 200

        report.refresh_from_db()
        assert report.status == Report.Status.RESOLVED
        assert report.resolution_comment == (
            "We successfully verified and replaced the missing street sign today."
        )


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


@pytest.mark.django_db
class TestReportDelete:
    """Test DELETE /api/v1/reports/<uuid>/ permission and behaviour."""

    def test_delete_report_as_anonymous_returns_401(self, api_client):
        """Anonymous users must not be able to delete reports."""
        category = Category.objects.create(name="Parks", icon="🌳")
        report = Report.objects.create(
            title="Vandalised bench",
            description="Park bench has been vandalised and needs replacing.",
            category=category,
        )
        response = api_client.delete(f"/api/v1/reports/{report.id}/")
        assert response.status_code in [401, 403]
        assert Report.objects.filter(id=report.id).exists()

    def test_delete_report_as_admin_returns_204(self, api_client):
        """Admin users can delete reports; object is removed from the database."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="del_admin", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)

        category = Category.objects.create(name="Roads", icon="🛣️")
        report = Report.objects.create(
            title="Pothole on main road",
            description="Large pothole causing danger for cyclists near the roundabout.",
            category=category,
        )
        response = api_client.delete(f"/api/v1/reports/{report.id}/")
        assert response.status_code == 204
        assert not Report.objects.filter(id=report.id).exists()

    def test_delete_nonexistent_report_as_admin_returns_404(self, api_client):
        """Attempting to delete a report that does not exist returns 404."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="del_admin2", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        import uuid as uuid_mod
        fake_id = uuid_mod.uuid4()
        response = api_client.delete(f"/api/v1/reports/{fake_id}/")
        assert response.status_code == 404


@pytest.mark.django_db
class TestCategoryAdminCreate:
    """Test POST /api/v1/categories/ permission and validation."""

    def test_create_category_as_anonymous_returns_401(self, api_client):
        """Anonymous users cannot create categories."""
        response = api_client.post(
            "/api/v1/categories/", {"name": "Utilities", "icon": "⚡"}, format="json"
        )
        assert response.status_code in [401, 403]

    def test_create_category_as_admin_returns_201(self, api_client):
        """Admin users can create categories; slug is generated automatically."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="cat_admin", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        response = api_client.post(
            "/api/v1/categories/",
            {"name": "Utilities", "icon": "⚡"},
            format="json",
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Utilities"
        assert "slug" in data

    def test_create_category_with_short_name_returns_400(self, api_client):
        """Category names shorter than 2 characters are rejected."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="cat_admin2", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        response = api_client.post(
            "/api/v1/categories/", {"name": "X", "icon": "🔧"}, format="json"
        )
        assert response.status_code == 400
        assert "name" in response.json()

    def test_create_category_strips_whitespace(self, api_client):
        """Leading/trailing whitespace is stripped from name and icon."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="cat_admin3", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        response = api_client.post(
            "/api/v1/categories/",
            {"name": "  Sanitation  ", "icon": "  🗑️  "},
            format="json",
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Sanitation"


@pytest.mark.django_db
class TestCategoryAdminUpdate:
    """Test PATCH /api/v1/categories/<pk>/ permission and validation."""

    def test_update_category_name_as_admin_returns_200(self, api_client):
        """Admin users can rename a category."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="up_admin", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        category = Category.objects.create(name="Graffiti", icon="🎨")
        response = api_client.patch(
            f"/api/v1/categories/{category.pk}/",
            {"name": "Vandalism"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Vandalism"

    def test_update_category_as_anonymous_returns_401(self, api_client):
        """Anonymous users cannot update categories."""
        category = Category.objects.create(name="Waste", icon="🗑️")
        response = api_client.patch(
            f"/api/v1/categories/{category.pk}/",
            {"name": "Recycling"},
            format="json",
        )
        assert response.status_code in [401, 403]


@pytest.mark.django_db
class TestCategoryAdminDelete:
    """Test DELETE /api/v1/categories/<pk>/ — blocking and success paths."""

    def test_delete_category_with_no_reports_returns_204(self, api_client):
        """A category with no linked reports can be deleted."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="catdel_admin", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        category = Category.objects.create(name="Unused", icon="❓")
        response = api_client.delete(f"/api/v1/categories/{category.pk}/")
        assert response.status_code == 204
        assert not Category.objects.filter(pk=category.pk).exists()

    def test_delete_category_with_linked_reports_returns_400(self, api_client):
        """Deleting a category that has linked reports returns 400 with a message."""
        User = get_user_model()
        admin = User.objects.create_user(
            username="catdel_admin2", password="pass-123", is_staff=True
        )
        api_client.force_authenticate(user=admin)
        category = Category.objects.create(name="Lighting", icon="💡")
        Report.objects.create(
            title="Broken street lamp",
            description="Street lamp has been broken for two weeks near the park entrance.",
            category=category,
        )
        response = api_client.delete(f"/api/v1/categories/{category.pk}/")
        assert response.status_code == 400
        body = response.json()
        assert "detail" in body
        assert "Lighting" in body["detail"]
        assert Category.objects.filter(pk=category.pk).exists()

    def test_delete_category_as_anonymous_returns_401(self, api_client):
        """Anonymous users cannot delete categories."""
        category = Category.objects.create(name="Safety", icon="⚠️")
        response = api_client.delete(f"/api/v1/categories/{category.pk}/")
        assert response.status_code in [401, 403]


@pytest.mark.django_db
class TestReportTracking:
    """Test GET /api/v1/reports/track/<uuid:token>/ endpoint."""

    def test_track_valid_token_returns_report(self, api_client):
        """A valid tracking token returns the matching report."""
        category = Category.objects.create(name="Lighting", icon="💡")
        report = Report.objects.create(
            title="Streetlight broken",
            description="The streetlight has been broken for a week.",
            category=category,
        )
        response = api_client.get(
            f"/api/v1/reports/track/{report.tracking_token}/"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(report.id)
        assert data["title"] == report.title
        assert "tracking_token" in data

    def test_track_invalid_token_returns_404(self, api_client):
        """An invalid tracking token returns 404."""
        import uuid as uuid_mod
        fake_token = uuid_mod.uuid4()
        response = api_client.get(
            f"/api/v1/reports/track/{fake_token}/"
        )
        assert response.status_code == 404

    def test_track_token_returns_read_only_fields(self, api_client):
        """The tracking endpoint returns read-only data (no write fields exposed)."""
        category = Category.objects.create(name="Roads", icon="🛣️")
        report = Report.objects.create(
            title="Pothole tracking test",
            description="A pothole to test the tracking endpoint.",
            category=category,
        )
        response = api_client.get(
            f"/api/v1/reports/track/{report.tracking_token}/"
        )
        data = response.json()
        # Should not include write-only fields
        assert "category_id" not in data
        # Should include read-only computed fields
        assert data["status_display"] is not None

    def test_track_token_created_at_submission(self, api_client):
        """A newly created report should be trackable via its token."""
        cat = Category.objects.create(name="Parks", icon="🌳")
        payload = {
            "title": "Trackable park issue",
            "description": "This issue should be trackable after creation.",
            "category_id": cat.id,
        }
        create_resp = api_client.post("/api/v1/reports/", payload, format="json")
        assert create_resp.status_code == 201
        created = create_resp.json()
        token = created.get("tracking_token")
        assert token is not None

        # Now track using the token
        track_resp = api_client.get(f"/api/v1/reports/track/{token}/")
        assert track_resp.status_code == 200
        assert track_resp.json()["id"] == created["id"]
