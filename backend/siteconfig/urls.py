from django.urls import path

from .views import ContactSubmissionView, SiteSettingsView

urlpatterns = [
    path("settings/", SiteSettingsView.as_view(), name="site-settings"),
    path("contact/", ContactSubmissionView.as_view(), name="contact-submit"),
]
