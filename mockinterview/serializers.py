from rest_framework import serializers

from .models import InterviewQuestion, MockInterviewAnswer, MockInterviewSession


class QuestionPublicSerializer(serializers.ModelSerializer):
    """Sent to the client when a session starts - never includes the answer key."""

    class Meta:
        model = InterviewQuestion
        fields = ["id", "question_text", "question_format", "interview_type", "difficulty"]


class AnswerResultSerializer(serializers.ModelSerializer):
    strengths = serializers.SerializerMethodField()
    weaknesses = serializers.SerializerMethodField()
    question_text = serializers.CharField(source="question.question_text", read_only=True)

    class Meta:
        model = MockInterviewAnswer
        fields = [
            "id", "question", "question_text", "answer_text", "score",
            "strengths", "weaknesses", "suggested_answer", "answered_at",
        ]

    def get_strengths(self, obj):
        return [s for s in obj.strengths.split("\n") if s]

    def get_weaknesses(self, obj):
        return [w for w in obj.weaknesses.split("\n") if w]


class SessionSerializer(serializers.ModelSerializer):
    answers = AnswerResultSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = MockInterviewSession
        fields = [
            "id", "role", "difficulty", "interview_type", "status",
            "started_at", "completed_at", "average_score", "answers", "question_count",
        ]

    def get_question_count(self, obj):
        return obj.answers.count()


class SessionListSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = MockInterviewSession
        fields = [
            "id", "role", "difficulty", "interview_type", "status",
            "started_at", "completed_at", "average_score", "question_count",
        ]

    def get_question_count(self, obj):
        return obj.answers.count()
