from django.core.management.base import BaseCommand

from mockinterview.models import InterviewQuestion
from mockinterview.question_bank import QUESTION_BANK


class Command(BaseCommand):
    help = "Seed the AI Mock Interview question bank."

    def handle(self, *args, **options):
        created = 0
        for q in QUESTION_BANK:
            _, was_created = InterviewQuestion.objects.get_or_create(
                role=q["role"],
                interview_type=q["interview_type"],
                difficulty=q["difficulty"],
                question_text=q["question_text"],
                defaults={
                    "question_format": q.get("question_format", "concept"),
                    "expected_keywords": q.get("expected_keywords", ""),
                    "sample_answer": q.get("sample_answer", ""),
                },
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(
            f"Question bank seeded: {created} new, {InterviewQuestion.objects.count()} total."
        ))
