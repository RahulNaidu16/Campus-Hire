from rest_framework import serializers

from accounts.models import Skill

from .models import Application, ApplicationStatusHistory, Company, Job, SavedJob


class SkillNameField(serializers.SlugRelatedField):
    """Like SlugRelatedField(slug_field='name'), but creates the skill if it
    doesn't exist yet instead of raising 'does not exist' - recruiters should
    be able to type any skill name when posting a job."""

    def __init__(self, **kwargs):
        kwargs.setdefault("slug_field", "name")
        kwargs.setdefault("queryset", Skill.objects.all())
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        name = str(data).strip()
        skill, _ = Skill.objects.get_or_create(name__iexact=name, defaults={"name": name})
        return skill


class CompanySerializer(serializers.ModelSerializer):
    active_jobs_count = serializers.IntegerField(read_only=True)
    total_hires = serializers.IntegerField(read_only=True)

    class Meta:
        model = Company
        fields = [
            "id", "name", "initial", "color", "website", "logo_url",
            "description", "industry", "hq_location", "active_jobs_count", "total_hires",
        ]


class JobSerializer(serializers.ModelSerializer):
    company = serializers.CharField(source="company.name", read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(source="company", queryset=Company.objects.all(), required=False)
    initial = serializers.CharField(source="company.initial", read_only=True)
    color = serializers.CharField(source="company.color", read_only=True)
    logo_url = serializers.CharField(source="company.logo_url", read_only=True)
    tags = serializers.SerializerMethodField()
    skills = SkillNameField(many=True, required=False)
    applicants = serializers.IntegerField(source="applicants_count", read_only=True)
    posted = serializers.SerializerMethodField()
    match = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    is_eligible = serializers.SerializerMethodField()
    ineligible_reasons = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id", "title", "company", "company_id", "initial", "color", "logo_url",
            "location", "job_type", "salary_lpa", "salary_display",
            "description", "eligibility_criteria", "min_cgpa", "eligible_branches",
            "experience_required", "openings",
            "tags", "skills", "applicants", "posted",
            "posted_at", "deadline", "match", "has_applied", "is_saved", "is_active",
            "is_eligible", "ineligible_reasons",
        ]

    def get_tags(self, obj):
        return [s.name for s in obj.skills.all()]

    def get_posted(self, obj):
        from django.utils.timesince import timesince
        return f"{timesince(obj.posted_at)} ago"

    def get_match(self, obj):
        return getattr(obj, "match_score", None)

    def _student(self):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else self.context.get("user")
        if user and getattr(user, "is_authenticated", False) and user.role == "student":
            return user
        return None

    def get_is_eligible(self, obj):
        student = self._student()
        if not student:
            return None
        return len(obj.eligibility_reasons(student)) == 0

    def get_ineligible_reasons(self, obj):
        student = self._student()
        if not student:
            return []
        return obj.eligibility_reasons(student)

    def get_has_applied(self, obj):
        applied_ids = self.context.get("applied_job_ids")
        if applied_ids is None:
            return None
        return obj.id in applied_ids

    def get_is_saved(self, obj):
        saved_ids = self.context.get("saved_job_ids")
        if saved_ids is None:
            return None
        return obj.id in saved_ids


class SavedJobSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)

    class Meta:
        model = SavedJob
        fields = ["id", "job", "saved_at"]


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationStatusHistory
        fields = ["id", "status", "status_display", "note", "changed_by_name", "changed_at"]

    def get_changed_by_name(self, obj):
        if not obj.changed_by:
            return None
        return obj.changed_by.get_full_name() or obj.changed_by.username


class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source="job.title", read_only=True)
    job_id = serializers.IntegerField(source="job.id", read_only=True)
    company = serializers.CharField(source="job.company.name", read_only=True)
    location = serializers.CharField(source="job.location", read_only=True)
    salary_display = serializers.CharField(source="job.salary_display", read_only=True)
    initial = serializers.CharField(source="job.company.initial", read_only=True)
    color = serializers.CharField(source="job.company.color", read_only=True)
    student_username = serializers.CharField(source="student.username", read_only=True)
    student_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    stage_index = serializers.IntegerField(read_only=True)
    stage_order = serializers.SerializerMethodField()
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    student_profile = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id", "job", "job_id", "job_title", "company", "location", "salary_display",
            "initial", "color", "student_username", "student_name",
            "status", "status_display", "stage_index", "stage_order", "status_history",
            "student_profile", "applied_at", "updated_at",
        ]
        read_only_fields = ["id", "applied_at", "updated_at"]

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username

    def get_stage_order(self, obj):
        return [
            {"value": s, "label": label}
            for s, label in Application.STATUS_CHOICES if s in Application.STAGE_ORDER
        ]

    def get_student_profile(self, obj):
        if not self.context.get("include_student_profile"):
            return None
        student = obj.student
        skills = [
            {"name": link.skill.name, "level": link.level}
            for link in student.student_skills.select_related("skill").all()
        ]
        return {
            "university": student.university,
            "branch": student.branch,
            "cgpa": student.cgpa,
            "bio": student.bio,
            "email": student.email,
            "skills": skills,
            "resume_text": student.resume_text,
            "has_resume_file": bool(student.resume_file),
            "resume_file_user_id": student.id if student.resume_file else None,
        }
