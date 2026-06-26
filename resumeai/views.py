import pdfplumber
from django.contrib.auth import get_user_model
from django.http import FileResponse, Http404
from rest_framework import permissions
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Skill
from jobs.models import Application, Job
from mlengine.resume_analyzer import analyze_resume

User = get_user_model()


def _extract_text_from_file(uploaded_file) -> str:
    name = (uploaded_file.name or "").lower()
    if name.endswith(".pdf"):
        text_parts = []
        with pdfplumber.open(uploaded_file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
        return "\n".join(text_parts)

    if name.endswith(".txt") or name.endswith(".md"):
        raw = uploaded_file.read()
        return raw.decode("utf-8", errors="ignore")

    raise ValueError("Unsupported file type. Please upload a .pdf or .txt file.")


class ResumeAnalyzeView(APIView):
    """AI Resume Analysis: ATS scoring, section feedback and keyword matching,
    optionally tailored to a specific target job."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        resume_text = request.data.get("resume_text", "")
        uploaded_file = request.FILES.get("resume_file")
        job_id = request.data.get("job_id")

        if uploaded_file:
            try:
                resume_text = _extract_text_from_file(uploaded_file)
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=400)

        resume_text = (resume_text or "").strip()
        if not resume_text:
            return Response({"detail": "Please paste your resume text or upload a .pdf/.txt file."}, status=400)

        target_job = None
        target_skills = None
        if job_id:
            target_job = Job.objects.filter(pk=job_id).select_related("company").prefetch_related("skills").first()
            if target_job:
                target_skills = [s.name for s in target_job.skills.all()]

        if target_skills is None and request.user.role == "student":
            # No specific job chosen: check the resume against the skills the
            # student themselves has declared on their profile (a very real
            # ATS failure mode is "I have the skill but my resume doesn't say
            # so in plain text"). Falls back to the full skills catalog only
            # if the student hasn't set up a skill profile yet.
            own_skills = list(
                request.user.student_skills.select_related("skill").values_list("skill__name", flat=True)
            )
            if own_skills:
                target_skills = own_skills

        catalog_skills = list(Skill.objects.values_list("name", flat=True)) if target_skills is None else None
        result = analyze_resume(resume_text, target_skills=target_skills, catalog_skills=catalog_skills)

        # Persist the latest resume text (and the original file, if one was
        # uploaded) on the student's profile so recruiters can review it later
        # and the student can re-download what they submitted.
        if request.user.role == "student":
            request.user.resume_text = resume_text[:20000]
            if uploaded_file:
                uploaded_file.seek(0)
                request.user.resume_file.save(uploaded_file.name, uploaded_file, save=False)
            request.user.save()

        result["target_job"] = (
            {"id": target_job.id, "title": target_job.title, "company": target_job.company.name}
            if target_job else None
        )
        result["resume_file_url"] = (
            request.build_absolute_uri(request.user.resume_file.url) if request.user.resume_file else None
        )
        return Response(result)


class ResumeFileDownloadView(APIView):
    """Lets a student download their own resume file, or a recruiter download
    a candidate's resume file if that candidate has applied to one of the
    recruiter's jobs. This is the access-controlled alternative to relying on
    the raw /media/ URL (which has no auth check)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        try:
            target = User.objects.get(pk=user_id, role="student")
        except User.DoesNotExist:
            raise Http404("Student not found.")

        is_self = request.user.id == target.id
        recruiter_has_access = (
            request.user.role == "recruiter"
            and Application.objects.filter(student=target, job__created_by=request.user).exists()
        )
        if not (is_self or recruiter_has_access or request.user.is_staff):
            return Response({"detail": "You don't have permission to view this resume."}, status=403)

        if not target.resume_file:
            raise Http404("This student hasn't uploaded a resume file.")

        return FileResponse(target.resume_file.open("rb"), as_attachment=True, filename=target.resume_file.name.split("/")[-1])
