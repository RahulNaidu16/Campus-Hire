"""
Mock interview answer scoring.

This is a transparent, rule-based scorer (keyword coverage + effort/structure
heuristics) - the same honest approach used by mlengine/resume_analyzer.py.
It is NOT a generative LLM grading free-form text; that would need a separate
hosted LLM API which this project does not depend on. What it *does* give:
a real, explainable 0-10 score, genuine strengths/weaknesses derived from the
actual answer text, and the question's curated sample answer as a model answer
to learn from.
"""

from __future__ import annotations

import re


def score_answer(answer_text: str, expected_keywords: list, sample_answer: str = "") -> dict:
    text = (answer_text or "").strip()
    text_lower = text.lower()
    word_count = len(text.split())

    if not text:
        return {
            "score": 0,
            "strengths": [],
            "weaknesses": ["No answer was given."],
            "matched_keywords": [],
            "missing_keywords": list(expected_keywords),
            "suggested_answer": sample_answer,
        }

    matched = [k for k in expected_keywords if k.lower() in text_lower]
    missing = [k for k in expected_keywords if k.lower() not in text_lower]

    # Keyword coverage: up to 6 points
    if expected_keywords:
        keyword_score = (len(matched) / len(expected_keywords)) * 6
    else:
        keyword_score = 4.5  # no keyword list defined (e.g. open-ended HR question) - neutral baseline

    # Effort / depth: up to 2.5 points based on length
    if word_count < 8:
        effort_score = 0.3
    elif word_count < 25:
        effort_score = 1.2
    elif word_count <= 180:
        effort_score = 2.5
    else:
        effort_score = 1.8  # rambling

    # Structure bonus: up to 1.5 points for examples / reasoning markers
    structure_markers = ["for example", "e.g.", "such as", "because", "first", "second", "in my experience"]
    structure_hits = sum(1 for m in structure_markers if m in text_lower)
    structure_score = min(1.5, structure_hits * 0.6)

    total = round(keyword_score + effort_score + structure_score, 1)
    total = max(0, min(10, total))

    strengths = []
    if matched:
        strengths.append(f"Covered key points: {', '.join(matched[:5])}.")
    if structure_hits:
        strengths.append("Used concrete examples/reasoning to support the answer.")
    if word_count > 25:
        strengths.append("Gave a reasonably detailed answer.")
    if not strengths:
        strengths.append("Attempted the question.")

    weaknesses = []
    if missing:
        weaknesses.append(f"Didn't mention: {', '.join(missing[:5])}.")
    if word_count < 25:
        weaknesses.append("Answer is quite short - try explaining your reasoning in more depth.")
    if not structure_hits and word_count > 15:
        weaknesses.append("Consider backing up your answer with a concrete example.")
    if not weaknesses:
        weaknesses.append("Solid answer - no major gaps detected.")

    return {
        "score": total,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "suggested_answer": sample_answer,
    }


def topic_breakdown(answers) -> dict:
    """Given an iterable of MockInterviewAnswer-like objects (with .question.interview_type
    and .score), return average score per interview_type, to highlight strong/weak areas."""
    buckets: dict[str, list] = {}
    for a in answers:
        buckets.setdefault(a.question.interview_type, []).append(a.score)

    return {
        topic: round(sum(scores) / len(scores), 1)
        for topic, scores in buckets.items() if scores
    }
