from django.contrib.auth.models import AbstractUser
from django.db import models


class Skill(models.Model):
    """A normalised skill/tag shared between student profiles and job postings."""

    name = models.CharField(max_length=64, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_STUDENT = "student"
    ROLE_RECRUITER = "recruiter"
    ROLE_ADMIN = "admin"
    ROLE_CHOICES = (
        (ROLE_STUDENT, "Student"),
        (ROLE_RECRUITER, "Recruiter"),
        (ROLE_ADMIN, "Admin"),
    )

    BRANCH_CHOICES = (
        ("CSE", "Computer Science"),
        ("IT", "Information Technology"),
        ("ECE", "Electronics & Communication"),
        ("EEE", "Electrical & Electronics"),
        ("MECH", "Mechanical"),
        ("CIVIL", "Civil"),
    )

    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default=ROLE_STUDENT)

    # Student profile fields
    university = models.CharField(max_length=150, blank=True)
    branch = models.CharField(max_length=10, choices=BRANCH_CHOICES, blank=True)
    cgpa = models.FloatField(default=0)
    bio = models.TextField(blank=True)
    resume_text = models.TextField(blank=True, help_text="Free-text resume/skills summary used for ML matching")
    resume_file = models.FileField(upload_to="resumes/", blank=True, null=True, help_text="Original uploaded resume file")
    graduation_year = models.PositiveIntegerField(null=True, blank=True)

    # Recruiter profile fields
    company_name = models.CharField(max_length=150, blank=True)
    company = models.ForeignKey(
        "jobs.Company", on_delete=models.SET_NULL, null=True, blank=True, related_name="recruiters",
    )

    skills = models.ManyToManyField(Skill, through="StudentSkill", related_name="students", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

    @property
    def is_student(self):
        return self.role == self.ROLE_STUDENT

    @property
    def is_recruiter(self):
        return self.role == self.ROLE_RECRUITER


class StudentSkill(models.Model):
    """Through model storing a student's self-rated proficiency in a skill (0-100)."""

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="student_skills")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="student_links")
    level = models.PositiveSmallIntegerField(default=70)

    class Meta:
        unique_together = ("student", "skill")
        ordering = ["-level"]

    def __str__(self):
        return f"{self.student.username} - {self.skill.name} ({self.level}%)"
