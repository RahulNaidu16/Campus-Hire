"""
Turns the inputs behind the placement-probability model into concrete,
actionable suggestions for the student - the "concrete improvement steps"
promised by the Placement Prediction feature.
"""

from __future__ import annotations


def build_improvement_tips(avg_match, num_applications, num_interviews, cgpa, placed_avg_cgpa=None) -> list:
    tips = []

    if avg_match < 50:
        tips.append(
            "Your skills currently match under half of the open roles — add more in-demand "
            "skills on your Profile page to widen your options."
        )

    if num_applications < 5:
        tips.append(
            f"You've applied to only {num_applications} job(s) so far — applying more broadly "
            "meaningfully increases your odds of landing an offer."
        )

    if num_applications > 0 and num_interviews == 0:
        tips.append(
            "None of your applications have converted into an interview yet — try tailoring your "
            "resume per role with the Resume Analyzer before you apply."
        )

    if placed_avg_cgpa is not None and cgpa is not None and cgpa > 0 and cgpa < placed_avg_cgpa:
        tips.append(
            f"Your CGPA ({cgpa:.1f}) is below the average of {placed_avg_cgpa:.1f} among students "
            "who've been placed — strong projects and skills can help offset this."
        )

    if not tips:
        tips.append("You're in great shape — keep applying consistently and preparing for interviews.")

    return tips
