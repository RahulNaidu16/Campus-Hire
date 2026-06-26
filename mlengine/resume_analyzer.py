"""
AI Resume Analysis engine.

Gives an ATS-style score for a plain-text resume:
  - checks for the standard sections recruiters/ATS systems look for
  - matches the resume's content against either a specific target job's
    required skills, or the full skills catalog if no job was chosen
  - scores resume length (too short / about right / too long)
  - turns all of the above into concrete, human-readable suggestions

This is intentionally a transparent, rule-based + keyword-matching system
(rather than a black box) so every point of the score can be explained back
to the student - which is exactly what "ATS scoring" tools do in practice.
"""

from __future__ import annotations

import re

SECTION_PATTERNS = {
    "Contact Info": [r"[\w.+-]+@[\w-]+\.[\w.-]+", r"\b\d{10}\b", r"linkedin\.com"],
    "Education": ["education", "university", "college", "b.tech", "btech", "bachelor", "cgpa", "gpa", "degree"],
    "Experience": ["experience", "internship", "intern ", "work history", "employment"],
    "Projects": ["project", "github", "portfolio"],
    "Skills": ["skills", "technologies", "tech stack", "tools"],
    "Certifications": ["certification", "certificate", "course", "nptel", "coursera"],
}

SECTION_TIPS = {
    "Contact Info": "Add an email, phone number, and LinkedIn URL so recruiters can reach you.",
    "Education": "List your degree, institution name, and CGPA clearly under an Education heading.",
    "Experience": "Add internships or work experience with measurable outcomes (numbers stand out).",
    "Projects": "Showcase 2-3 projects with a one-line description and a GitHub/demo link each.",
    "Skills": "Add a dedicated Skills section listing your technical skills as a clean list.",
    "Certifications": "Mention any relevant certifications or completed online courses.",
}


def _section_present(text_lower: str, patterns) -> bool:
    return any(re.search(p, text_lower) for p in patterns)


def _length_score(word_count: int) -> float:
    if word_count == 0:
        return 0
    if word_count < 80:
        return 5
    if word_count < 150:
        return 12
    if word_count <= 700:
        return 20
    return 14  # long resumes lose a few points for freshers


def analyze_resume(resume_text: str, target_skills=None, catalog_skills=None) -> dict:
    text = (resume_text or "").strip()
    text_lower = text.lower()
    word_count = len(text.split())

    section_feedback = []
    sections_found = 0
    for section, patterns in SECTION_PATTERNS.items():
        present = _section_present(text_lower, patterns)
        if present:
            sections_found += 1
        section_feedback.append({
            "section": section,
            "present": present,
            "feedback": (
                f"{section} section detected." if present else SECTION_TIPS.get(section, f"Consider adding a {section} section.")
            ),
        })

    pool = list(target_skills) if target_skills else list(catalog_skills or [])
    matched = sorted({s for s in pool if s.lower() in text_lower})
    missing = sorted({s for s in pool if s.lower() not in text_lower})

    section_score = (sections_found / len(SECTION_PATTERNS)) * 40 if SECTION_PATTERNS else 0
    keyword_score = (len(matched) / len(pool) * 40) if pool else 20
    length_score = _length_score(word_count)

    overall = int(round(section_score + keyword_score + length_score))
    overall = max(0, min(100, overall)) if text else 0

    suggestions = _build_suggestions(section_feedback, missing, word_count, bool(text))

    return {
        "overall_score": overall,
        "word_count": word_count,
        "section_feedback": section_feedback,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "suggestions": suggestions,
    }


def _build_suggestions(section_feedback, missing_keywords, word_count, has_text) -> list:
    if not has_text:
        return ["Paste your resume text or upload a file to get started."]

    suggestions = [sf["feedback"] for sf in section_feedback if not sf["present"]]

    if missing_keywords:
        top = missing_keywords[:5]
        suggestions.append(f"Add these in-demand skills if you genuinely have them: {', '.join(top)}.")

    if word_count < 100:
        suggestions.append("Your resume looks quite short — add more detail to your projects and experience.")
    elif word_count > 800:
        suggestions.append("Your resume is on the longer side — for freshers, aim for roughly one page.")

    if not suggestions:
        suggestions.append("Strong resume! It covers the key sections and matches the target skills well.")

    return suggestions
