import django_filters

from .models import Report


class ReportFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Report.Status.choices)
    category = django_filters.NumberFilter(
        field_name="category_id", lookup_expr="exact"
    )
    has_coordinates = django_filters.BooleanFilter(
        method="filter_has_coordinates",
        label="Filter reports that have location coordinates.",
    )
    near_lat = django_filters.NumberFilter(
        method="filter_near",
        field_name="latitude",
        label="Latitude for proximity search.",
    )
    near_lng = django_filters.NumberFilter(
        method="filter_near",
        field_name="longitude",
        label="Longitude for proximity search.",
    )
    radius_km = django_filters.NumberFilter(
        method="filter_near",
        field_name="radius",
        label="Search radius in kilometers.",
    )

    class Meta:
        model = Report
        fields = [
            "status",
            "category",
            "has_coordinates",
            "near_lat",
            "near_lng",
            "radius_km",
        ]

    def filter_has_coordinates(self, queryset, name, value):
        if value:
            return queryset.filter(
                latitude__isnull=False, longitude__isnull=False
            )
        return queryset

    def filter_near(self, queryset, name, value):
        """Filter reports within a given radius (km) of a point using Haversine.

        Requires all three params: near_lat, near_lng, radius_km.
        Uses MySQL-compatible SQL via Django ORM annotations.
        """
        lat = self.request.query_params.get("near_lat")
        lng = self.request.query_params.get("near_lng")
        radius = self.request.query_params.get("radius_km")

        if not (lat and lng and radius):
            return queryset

        try:
            lat = float(lat)
            lng = float(lng)
            radius = float(radius)
        except (ValueError, TypeError):
            return queryset

        # Use a raw WHERE clause with Haversine for MySQL compatibility
        # (TiDB/MySQL don't have PostGIS but support basic math functions)
        queryset = queryset.filter(
            latitude__isnull=False,
            longitude__isnull=False,
        )

        from django.db.models.expressions import RawSQL

        haversine_sql = (
            "6371 * 2 * ASIN(SQRT("
            f"    POWER(SIN(RADIANS(latitude - {lat}) / 2), 2) + "
            f"    COS(RADIANS({lat})) * COS(RADIANS(latitude)) * "
            f"    POWER(SIN(RADIANS(longitude - {lng}) / 2), 2)"
            "))"
        )
        return (
            queryset.annotate(distance=RawSQL(haversine_sql, []))
            .filter(distance__lte=radius)
            .order_by("distance")
        )
