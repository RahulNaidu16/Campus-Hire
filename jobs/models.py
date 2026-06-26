from django.conf import settings
from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=120, unique=True)
    initial = models.CharField(max_length=2, blank=True)
    color = models.CharField(max_length=9, default="#0ea5e9", help_text="Brand accent color, hex")
    website = models.URLField(blank=True)

    logo_url = models.URLField(blank=True, help_text="Direct image URL for the company logo")
    description = models.TextField(blank=True)
    industry = models.CharField(max_length=80, blank=True)
    hq_location = models.CharField(max_length=80, blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "companies"

    def save(self, *args, **kwargs):
        if not self.initial:
            self.initial = self.name[:1].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Job(models.Model):
    FULL_TIME = "Full-time"
    INTERNSHIP = "Internship"
    PART_TIME = "Part-time"
    REMOTE = "Remote"
    HYBRID = "Hybrid"
    JOB_TYPE_CHOICES = (
        (FULL_TIME, "Full-time"),
        (INTERNSHIP, "Internship"),
        (PART_TIME, "Part-time"),
        (REMOTE, "Remote"),
        (HYBRID, "Hybrid"),
    )

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="jobs")
    title = models.CharField(max_length=150)
    location = models.CharField(max_length=80)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default=FULL_TIME)

    # salary_lpa is always the *annualised* package in LPA (Lakhs Per Annum) so it can be
    # filtered/sorted numerically, regardless of how it is displayed to the user.
    salary_lpa = models.FloatField(default=0)
    salary_display = models.CharField(max_length=40, help_text="e.g. '28 LPA' or '80K/mo'")

    description = models.TextField(blank=True)
    eligibility_criteria = models.CharField(max_length=255, blank=True, help_text="e.g. 'B.Tech/B.E, CGPA >= 7.0' (descriptive text shown to students)")
    min_cgpa = models.FloatField(default=0, help_text="Minimum CGPA required to apply. 0 = no minimum.")
    eligible_branches = models.CharField(
        max_length=120, blank=True,
        help_text="Comma-separated branch codes (e.g. 'CSE,IT'). Blank = open to all branches.",
    )
    experience_required = models.CharField(max_length=80, blank=True, default="Fresher")
    openings = models.PositiveIntegerField(default=1)

    skills = models.ManyToManyField("accounts.Skill", related_name="jobs", blank=True)

    posted_at = models.DateTimeField(auto_now_add=True)
    deadline = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="posted_jobs",
    )

    class Meta:
        ordering = ["-posted_at"]

    def __str__(self):
        return f"{self.title} @ {self.company.name}"

    @property
    def applicants_count(self):
        return self.applications.count()

    @property
    def is_open(self):
        return self.is_active

    @property
    def eligible_branch_list(self):
        return [b.strip() for b in self.eligible_branches.split(",") if b.strip()]

    def eligibility_reasons(self, student):
        """Return a list of reasons a student is NOT eligible (empty list = eligible)."""
        reasons = []
        if self.min_cgpa and (student.cgpa or 0) < self.min_cgpa:
            reasons.append(f"Requires CGPA >= {self.min_cgpa} (yours: {student.cgpa or 0})")
        branches = self.eligible_branch_list
        if branches and student.branch and student.branch not in branches:
            reasons.append(f"Open only to: {', '.join(branches)} (yours: {student.branch})")
        return reasons


class Application(models.Model):
    APPLIED = "applied"
    RESUME_SHORTLISTED = "resume_shortlisted"
    APTITUDE_TEST = "aptitude_test"
    TECHNICAL_INTERVIEW = "technical_interview"
    HR_INTERVIEW = "hr_interview"
    SELECTED = "selected"
    REJECTED = "rejected"

    STATUS_CHOICES = (
        (APPLIED, "Applied"),
        (RESUME_SHORTLISTED, "Resume Shortlisted"),
        (APTITUDE_TEST, "Aptitude Test"),
        (TECHNICAL_INTERVIEW, "Technical Interview"),
        (HR_INTERVIEW, "HR Interview"),
        (SELECTED, "Selected"),
        (REJECTED, "Rejected"),
    )

    # Ordering of the "happy path" stages, used to render a progress timeline.
    # REJECTED is a terminal branch that can happen from any stage, so it is
    # deliberately excluded from this ordered list.
    STAGE_ORDER = [APPLIED, RESUME_SHORTLISTED, APTITUDE_TEST, TECHNICAL_INTERVIEW, HR_INTERVIEW, SELECTED]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications",
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default=APPLIED)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "job")
        ordering = ["-applied_at"]

    def __str__(self):
        return f"{self.student.username} -> {self.job.title} ({self.status})"

    @property
    def stage_index(self):
        """0-based index into STAGE_ORDER, or -1 for REJECTED."""
        try:
            return self.STAGE_ORDER.index(self.status)
        except ValueError:
            return -1


class ApplicationStatusHistory(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="status_history")
    status = models.CharField(max_length=24, choices=Application.STATUS_CHOICES)
    note = models.CharField(max_length=255, blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+",
    )
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["changed_at"]

    def __str__(self):
        return f"{self.application} -> {self.status} @ {self.changed_at:%Y-%m-%d}"


class SavedJob(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_jobs")
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="saved_by")
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "job")
        ordering = ["-saved_at"]

    def __str__(self):
        return f"{self.student.username} saved {self.job.title}"
