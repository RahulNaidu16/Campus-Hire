import random

from django.db.models import Avg
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from mlengine.mock_interview_scorer import score_answer, topic_breakdown

from .models import InterviewQuestion, MockInterviewAnswer, MockInterviewSession
from .question_bank import ROLES
from .serializers import AnswerResultSerializer, QuestionPublicSerializer, SessionListSerializer, SessionSerializer


def _pick_questions(role, interview_type, difficulty, num_questions):
    if interview_type == InterviewQuestion.TECHNICAL:
        pool = list(InterviewQuestion.objects.filter(
            interview_type=interview_type, difficulty=difficulty, role__iexact=role,
        ))
        if not pool:
            pool = list(InterviewQuestion.objects.filter(
                interview_type=interview_type, difficulty=difficulty, role="Any",
            ))
        if not pool:
            pool = list(InterviewQuestion.objects.filter(interview_type=interview_type, role="Any"))
    else:
        pool = list(InterviewQuestion.objects.filter(interview_type=interview_type, difficulty=difficulty))
        if not pool:
            pool = list(InterviewQuestion.objects.filter(interview_type=interview_type))

    random.shuffle(pool)
    return pool[:num_questions]


class AvailableRolesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"roles": ROLES, "allow_custom": True})


class StartSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != "student":
            return Response({"detail": "Mock interviews are available for student accounts."}, status=400)

        role = (request.data.get("role") or "Software Engineer").strip()
        difficulty = request.data.get("difficulty", InterviewQuestion.MEDIUM)
        interview_type = request.data.get("interview_type", InterviewQuestion.TECHNICAL)
        num_questions = min(int(request.data.get("num_questions", 5)), 10)

        questions = _pick_questions(role, interview_type, difficulty, num_questions)
        if not questions:
            return Response({"detail": "No questions available for this combination yet."}, status=400)

        session = MockInterviewSession.objects.create(
            student=request.user, role=role, difficulty=difficulty, interview_type=interview_type,
        )

        return Response({
            "session_id": session.id,
            "questions": QuestionPublicSerializer(questions, many=True).data,
        }, status=201)


class SubmitAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = MockInterviewSession.objects.get(pk=session_id, student=request.user)
        except MockInterviewSession.DoesNotExist:
            return Response({"detail": "Session not found."}, status=404)

        question_id = request.data.get("question_id")
        answer_text = request.data.get("answer_text", "")
        time_taken = request.data.get("time_taken_seconds")

        try:
            question = InterviewQuestion.objects.get(pk=question_id)
        except InterviewQuestion.DoesNotExist:
            return Response({"detail": "Question not found."}, status=404)

        result = score_answer(answer_text, question.keyword_list, question.sample_answer)

        answer = MockInterviewAnswer.objects.create(
            session=session,
            question=question,
            answer_text=answer_text,
            score=result["score"],
            strengths="\n".join(result["strengths"]),
            weaknesses="\n".join(result["weaknesses"]),
            suggested_answer=result["suggested_answer"],
            time_taken_seconds=time_taken or None,
        )

        return Response(AnswerResultSerializer(answer).data, status=201)


class CompleteSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = MockInterviewSession.objects.get(pk=session_id, student=request.user)
        except MockInterviewSession.DoesNotExist:
            return Response({"detail": "Session not found."}, status=404)

        avg = session.answers.aggregate(avg=Avg("score"))["avg"] or 0
        session.average_score = round(avg, 1)
        session.status = MockInterviewSession.COMPLETED
        session.completed_at = timezone.now()
        session.save(update_fields=["average_score", "status", "completed_at"])

        return Response(SessionSerializer(session).data)


class SessionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = MockInterviewSession.objects.prefetch_related("answers__question").get(
                pk=session_id, student=request.user,
            )
        except MockInterviewSession.DoesNotExist:
            return Response({"detail": "Session not found."}, status=404)
        return Response(SessionSerializer(session).data)


class SessionHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = MockInterviewSession.objects.filter(student=request.user, status=MockInterviewSession.COMPLETED)
        return Response(SessionListSerializer(sessions, many=True).data)


class MockInterviewStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = MockInterviewSession.objects.filter(student=request.user, status=MockInterviewSession.COMPLETED)
        total = sessions.count()
        scores = list(sessions.values_list("average_score", flat=True))
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0
        best_score = max(scores) if scores else 0

        answers = MockInterviewAnswer.objects.filter(
            session__student=request.user, session__status=MockInterviewSession.COMPLETED,
        ).select_related("question")
        breakdown = topic_breakdown(answers)

        strong_areas = sorted(breakdown.items(), key=lambda kv: kv[1], reverse=True)[:2]
        weak_areas = sorted(breakdown.items(), key=lambda kv: kv[1])[:2]

        return Response({
            "total_interviews": total,
            "average_score": avg_score,
            "best_score": best_score,
            "topic_breakdown": breakdown,
            "strong_areas": [t for t, _ in strong_areas],
            "weak_areas": [t for t, _ in weak_areas],
        })
