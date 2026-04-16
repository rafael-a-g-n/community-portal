import django_filters

from .models import Report


class ReportFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Report.Status.choices)
    category = django_filters.CharFilter(field_name="category", lookup_expr="exact")

    class Meta:
        model = Report
        fields = ["status", "category"]
