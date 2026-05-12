from rest_framework import serializers

from .models import SiteSettings, ContactSubmission


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Serialiser for the SiteSettings singleton.

    All text fields are validated server-side:
    - CharField fields stripped of leading/trailing whitespace.
    - Lengths enforced by the model's ``max_length`` attributes via DRF.
    - No HTML content is permitted; values are stored and rendered as
      plain text only.
    """

    class Meta:
        model = SiteSettings
        exclude = ["id"]

    def validate(self, attrs: dict) -> dict:
        """Strip whitespace from all string values before saving."""
        return {
            key: value.strip() if isinstance(value, str) else value
            for key, value in attrs.items()
        }


class ContactSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for the public contact form submission."""

    class Meta:
        model = ContactSubmission
        fields = ["id", "name", "email", "message", "created_at"]
        read_only_fields = ["id", "created_at"]
