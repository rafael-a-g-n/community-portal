from django.urls import path

from .views import SiteSettingsView, ContactSubmissionView

urlpatterns = [
    path("settings/", SiteSettingsView.as_view(), name="site-settings"),
    path("contact/", ContactSubmissionView.as_view(), name="contact-submit"),
]
