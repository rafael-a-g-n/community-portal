"""Custom auth views with rate limiting for the login endpoint."""

from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.throttling import AnonRateThrottle


class AnonAuthRateThrottle(AnonRateThrottle):
    """Stricter throttle for anonymous auth attempts.

    Overrides the default ``anon`` rate so login brute-forcing is
    mitigated without affecting the global anonymous throttle used by
    report creation.
    """
    rate = "10/minute"


class RateLimitedObtainAuthToken(ObtainAuthToken):
    """Token-based login endpoint protected by anonymous rate limiting.

    Authenticated users are not throttled (they are already logged in
    and have no reason to hit this endpoint). Anonymous IPs are
    limited to 10 requests per minute.
    """

    throttle_classes = [AnonAuthRateThrottle]
