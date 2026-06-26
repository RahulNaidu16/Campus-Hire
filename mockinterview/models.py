from django.conf import settings
from django.db import models


class InterviewQuestion(models.Model):
    TECHNICAL = "technical"
    HR = "hr"
    APTITUDE = "aptitude"
    BEHAVIORAL = "behavioral"
    TYPE_CHOICES = (
        (TECHNICAL, "Technical"), (HR, "HR"), (APTITUDE, "Aptitude"), (BEHAVIORAL, "Behavioral"),
    )

    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    DIFFICULTY_CHOICES = ((EASY, "Easy"), (MEDIUM, "Medium"), (HARD, "Hard"))

    CONCEPT = "concept"
    CODING = "coding"
    FORMAT_CHOICES = ((CONCEPT, "Concept"), (CODING, "Coding"))

    role = models.CharField(max_length=60, help_text="e.g. 'Java Developer', or 'Any' for generic questions")
    interview_type = models.CharField(max_length=12, choices=TYPE_CHOICES)
    difficulty = models.CharField(max_length=8, choices=DIFFICULTY_CHOICES, default=MEDIUM)
    question_format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default=CONCEPT)

    question_text = models.TextField()
    expected_keywords = models.CharField(
        max_length=400, blank=True,
        help_text="Comma-separated concepts a strong answer should mention - used for scoring.",
    )
    sample_answer = models.TextField(blank=True)

    class Meta:
        ordering = ["role", "interview_type", "difficulty"]

    def __str__(self):
        return f"[{self.role}/{self.interview_type}/{self.difficulty}] {self.question_text[:50]}"

    @property
    def keyword_list(self):
        return [k.strip() for k in self.expected_keywords.split(",") if k.strip()]


class MockInterviewSession(models.Model):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    STATUS_CHOICES = ((IN_PROGRESS, "In progress"), (COMPLETED, "Completed"))

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mock_sessions")
    role = models.CharField(max_length=60)
    difficulty = models.CharField(max_length=8, choices=InterviewQuestion.DIFFICULTY_CHOICES)
    interview_type = models.CharField(max_length=12, choices=InterviewQuestion.TYPE_CHOICES)

    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=IN_PROGRESS)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    average_score = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.student.username} - {self.role} ({self.interview_type}/{self.difficulty})"


class MockInterviewAnswer(models.Model):
    session = models.ForeignKey(MockInterviewSession, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(InterviewQuestion, on_delete=models.CASCADE, related_name="+")
    answer_text = models.TextField(blank=True)

    score = models.FloatField(default=0)  # 0-10
    strengths = models.TextField(blank=True)
    weaknesses = models.TextField(blank=True)
    suggested_answer = models.TextField(blank=True)

    answered_at = models.DateTimeField(auto_now_add=True)
    time_taken_seconds = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["answered_at"]

    def __str__(self):
        return f"{self.session} - Q{self.question_id} ({self.score}/10)"
