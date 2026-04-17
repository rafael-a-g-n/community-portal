import uuid
from typing import Any

from PIL import Image
from rest_framework import serializers

from .models import Category, Report


class CategorySerializer(serializers.ModelSerializer):
    """Read-only serialiser used for public category list/detail responses."""

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon"]
        read_only_fields = ["id", "name", "slug", "icon"]


class CategoryWriteSerializer(serializers.ModelSerializer):
    """Write serialiser used for admin create/update of categories.

    Enforces strict sanitisation:
    - name: stripped, 2–120 characters, unique enforced by model.
    - icon: stripped, max 120 characters (optional emoji/text label).
    Slug is derived automatically by the model's ``save()`` method.
    """

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon"]
        read_only_fields = ["id", "slug"]

    def validate_name(self, value: str) -> str:
        value = value.strip() if isinstance(value, str) else value
        if len(value) < 2:
            raise serializers.ValidationError(
                "Category name must be at least 2 characters long."
            )
        if len(value) > 120:
            raise serializers.ValidationError(
                "Category name must not exceed 120 characters."
            )
        return value

    def validate_icon(self, value: str) -> str:
        if not isinstance(value, str):
            return value
        value = value.strip()
        if len(value) > 120:
            raise serializers.ValidationError(
                "Icon label must not exceed 120 characters."
            )
        return value


class ReportSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        write_only=True,
        source="category",
    )
    status_display = serializers.SerializerMethodField()
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "description",
            "category",
            "category_id",
            "status",
            "status_display",
            "resolution_comment",
            "photo",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_status_display(self, obj: Report) -> str:
        return obj.get_status_display()

    def validate_title(self, value: str) -> str:
        """Trim and enforce minimum length."""
        value = value.strip() if isinstance(value, str) else value
        if len(value) < 5:
            raise serializers.ValidationError(
                "Title must be at least 5 characters long."
            )
        return value

    def validate_description(self, value: str) -> str:
        """Trim and enforce min/max length."""
        value = value.strip() if isinstance(value, str) else value
        if len(value) < 10:
            raise serializers.ValidationError(
                "Description must be at least 10 characters long."
            )
        if len(value) > 5000:
            raise serializers.ValidationError(
                "Description cannot exceed 5000 characters."
            )
        return value

    def validate_status(self, value: str) -> str:
        """Ensure status is in valid choices."""
        valid_choices = [choice[0] for choice in Report.Status.choices]
        if value not in valid_choices:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(valid_choices)}"
            )
        return value

    def validate_photo(self, value: Any) -> Any:
        """Validate photo: size, format, and rename with UUID."""
        if not value:
            return value

        # 1. Check size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError("Photo must not exceed 5MB.")

        # 2. Check format using Pillow
        try:
            image = Image.open(value)
            fmt = image.format
            image.verify()
            allowed_formats = {"JPEG", "PNG", "WEBP", "GIF"}
            if fmt not in allowed_formats:
                raise serializers.ValidationError(
                    "Photo format must be one of: GIF, JPEG, PNG, WEBP"
                )
        except serializers.ValidationError:
            raise
        except Exception:
            raise serializers.ValidationError("Invalid image file.")

        if hasattr(value, "seek"):
            value.seek(0)

        # 3. Rename file to UUID
        extension = fmt.lower()
        if extension == "jpeg":
            extension = "jpg"
        new_filename = f"{uuid.uuid4()}.{extension}"
        value.name = new_filename

        return value

    def create(self, validated_data):
        """Override create to exclude status from user input."""
        # Pop status if present (citizens cannot set status on creation)
        validated_data.pop("status", None)
        return super().create(validated_data)
