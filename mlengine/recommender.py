"""
Content-based job recommendation engine.

Approach
--------
Each job is represented by the text of its required skills, and each student
is represented by the text of their skills (repeated in proportion to their
self-rated proficiency, so a skill the student is strong in counts for more).
A TF-IDF vectorizer turns both into vectors in the same vocabulary space, and
cosine similarity gives a content-based similarity score. This is blended
with a simple skill-overlap ratio (how much of what the job is asking for the
student actually has) to produce a stable, human-readable match percentage,
the same idea used in real-world resume/job matching systems.
"""

from __future__ import annotations

from typing import Iterable

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _job_text(job) -> str:
    skill_names = [s.name for s in job.skills.all()]
    tokens = list(skill_names)
    # Give the job title a small amount of signal too (helps when skills are sparse).
    tokens += job.title.split()
    return " ".join(tokens).lower() if tokens else "general"


def _student_text(student) -> str:
    links = list(student.student_skills.select_related("skill").all())
    if not links:
        return ""
    tokens = []
    for link in links:
        weight = max(1, round(link.level / 20))  # 0-100 -> 1-5 repeats
        tokens.extend([link.skill.name] * weight)
    return " ".join(tokens).lower()


def _skill_overlap_ratio(student_skill_names: set, job) -> float:
    job_skill_names = {s.name.lower() for s in job.skills.all()}
    if not job_skill_names:
        return 0.0
    hit = len(job_skill_names & student_skill_names)
    return hit / len(job_skill_names)


def compute_match_scores(student, jobs: Iterable) -> dict:
    """Return {job_id: match_percentage} for the given student and jobs queryset/list."""

    jobs = list(jobs)
    if not jobs:
        return {}

    student_text = _student_text(student)
    student_skill_names = {
        link.skill.name.lower() for link in student.student_skills.select_related("skill").all()
    }

    if not student_text:
        # No declared skills yet -> neutral score based on how recently/popular the job is.
        return {job.id: 40 for job in jobs}

    corpus = [student_text] + [_job_text(job) for job in jobs]

    try:
        vectorizer = TfidfVectorizer()
        matrix = vectorizer.fit_transform(corpus)
        sims = cosine_similarity(matrix[0:1], matrix[1:])[0]
    except ValueError:
        # Empty vocabulary edge case (e.g. all stop words) - fall back to overlap only.
        sims = np.zeros(len(jobs))

    scores = {}
    for job, cosine_sim in zip(jobs, sims):
        overlap = _skill_overlap_ratio(student_skill_names, job)
        blended = 0.55 * cosine_sim + 0.45 * overlap
        pct = int(round(blended * 100))
        pct = max(5, min(99, pct))
        scores[job.id] = pct
    return scores


def recommend_jobs(student, jobs_queryset, limit: int | None = None):
    """Return jobs ordered by descending ML match score, each annotated with `.match_score`."""

    jobs = list(jobs_queryset)
    scores = compute_match_scores(student, jobs)
    for job in jobs:
        job.match_score = scores.get(job.id, 0)
    jobs.sort(key=lambda j: j.match_score, reverse=True)
    return jobs[:limit] if limit else jobs
