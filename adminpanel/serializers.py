from rest_framework import serializers

from accounts.models import User


class AdminStudentSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    applications_count = serializers.IntegerField(read_only=True)
    selected_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "full_name", "university", "branch", "cgpa",
            "applications_count", "selected_count", "is_active", "date_joined",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class AdminRecruiterSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    jobs_count = serializers.IntegerField(read_only=True)
    company = serializers.CharField(source="company.name", read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "full_name", "company_name", "company",
            "jobs_count", "is_active", "date_joined",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
