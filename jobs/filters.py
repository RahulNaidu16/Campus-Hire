import django_filters

from .models import Job


class JobFilter(django_filters.FilterSet):
    location = django_filters.CharFilter(field_name="location", lookup_expr="iexact")
    job_type = django_filters.CharFilter(field_name="job_type", lookup_expr="iexact")
    min_salary = django_filters.NumberFilter(field_name="salary_lpa", lookup_expr="gte")
    max_salary = django_filters.NumberFilter(field_name="salary_lpa", lookup_expr="lte")
    company = django_filters.CharFilter(field_name="company__name", lookup_expr="icontains")
    search = django_filters.CharFilter(method="filter_search")
    skills = django_filters.CharFilter(method="filter_skills")

    class Meta:
        model = Job
        fields = ["location", "job_type", "min_salary", "max_salary", "company", "search", "skills"]

    def filter_search(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(title__icontains=value)
            | Q(company__name__icontains=value)
            | Q(skills__name__icontains=value)
        ).distinct()

    def filter_skills(self, queryset, name, value):
        names = [s.strip() for s in value.split(",") if s.strip()]
        if not names:
            return queryset
        for skill_name in names:
            queryset = queryset.filter(skills__name__iexact=skill_name)
        return queryset
