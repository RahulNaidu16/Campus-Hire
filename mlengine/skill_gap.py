"""
Skill Gap Detection.

Looks at the jobs a student is already a strong match for (per the ML
recommender) and finds which required skills they're *missing* most often
across those roles - i.e. the highest-leverage skills to learn next, each
paired with a curated learning resource.
"""

from __future__ import annotations

from .recommender import compute_match_scores

LEARNING_RESOURCES = {
    "React": ("React official docs", "https://react.dev/learn"),
    "Python": ("Python for Everybody (Coursera)", "https://www.coursera.org/specializations/python"),
    "ML": ("Machine Learning by Andrew Ng", "https://www.coursera.org/learn/machine-learning"),
    "Node": ("Node.js — official guide", "https://nodejs.org/en/learn"),
    "AWS": ("AWS Cloud Practitioner Essentials", "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/"),
    "SQL": ("SQL for Data Analysis (Udacity)", "https://www.udacity.com/course/sql-for-data-analysis--ud198"),
    "TypeScript": ("TypeScript Handbook", "https://www.typescriptlang.org/docs/handbook/intro.html"),
    "Docker": ("Docker — Get Started", "https://docs.docker.com/get-started/"),
    "PyTorch": ("PyTorch Tutorials", "https://pytorch.org/tutorials/"),
    "NLP": ("NLP Specialization (Coursera)", "https://www.coursera.org/specializations/natural-language-processing"),
    "CSS": ("CSS — MDN Web Docs", "https://developer.mozilla.org/en-US/docs/Web/CSS"),
    "JavaScript": ("JavaScript.info", "https://javascript.info/"),
    "PostgreSQL": ("PostgreSQL Tutorial", "https://www.postgresqltutorial.com/"),
    "Redis": ("Redis University", "https://university.redis.com/"),
    "CI/CD": ("CI/CD with GitHub Actions", "https://docs.github.com/en/actions"),
    "Terraform": ("Terraform — HashiCorp Learn", "https://developer.hashicorp.com/terraform/tutorials"),
    "System Design": ("System Design Primer (GitHub)", "https://github.com/donnemartin/system-design-primer"),
    "Analytics": ("Google Data Analytics Certificate", "https://www.coursera.org/professional-certificates/google-data-analytics"),
    "Product": ("Digital Product Management (Coursera)", "https://www.coursera.org/learn/uva-darden-digital-product-management"),
    "Statistics": ("Statistics with Python", "https://www.coursera.org/learn/basic-statistics"),
    "Kubernetes": ("Kubernetes Basics", "https://kubernetes.io/docs/tutorials/kubernetes-basics/"),
    "GraphQL": ("GraphQL — official docs", "https://graphql.org/learn/"),
    "Java": ("Learn Java (freeCodeCamp)", "https://www.freecodecamp.org/news/learn-java-programming/"),
    "C++": ("learncpp.com", "https://www.learncpp.com/"),
    "AutoCAD": ("AutoCAD Certification — Autodesk", "https://www.autodesk.com/certification/learn/autocad"),
    "SolidWorks": ("SolidWorks Tutorials", "https://www.solidworks.com/sw/support/tutorials.htm"),
    "Embedded C": ("Embedded Systems (Coursera)", "https://www.coursera.org/learn/eit-embedded-systems"),
    "VLSI": ("VLSI Design (NPTEL)", "https://nptel.ac.in/courses/108107129"),
    "Structural Analysis": ("Structural Analysis (NPTEL)", "https://nptel.ac.in/courses/105105166"),
    "Surveying": ("Surveying Fundamentals (NPTEL)", "https://nptel.ac.in/courses/105106139"),
    "Manufacturing": ("Manufacturing Processes (NPTEL)", "https://nptel.ac.in/courses/112105126"),
    "Thermodynamics": ("Engineering Thermodynamics (NPTEL)", "https://nptel.ac.in/courses/112105123"),
    "Circuit Design": ("Circuits & Electronics (MIT OCW)", "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/"),
}

DEFAULT_RESOURCE = ("Search this skill on Coursera / freeCodeCamp", "https://www.coursera.org/search")


def detect_skill_gap(student, candidate_jobs, top_n_jobs: int = 5, top_n_skills: int = 6) -> list:
    jobs = list(candidate_jobs)
    if not jobs:
        return []

    scores = compute_match_scores(student, jobs)
    ranked = sorted(jobs, key=lambda j: scores.get(j.id, 0), reverse=True)[:top_n_jobs]

    student_skill_names = {
        link.skill.name.lower() for link in student.student_skills.select_related("skill").all()
    }

    gap_counter = {}
    for job in ranked:
        for skill in job.skills.all():
            if skill.name.lower() not in student_skill_names:
                gap_counter[skill.name] = gap_counter.get(skill.name, 0) + 1

    ranked_gaps = sorted(gap_counter.items(), key=lambda kv: kv[1], reverse=True)[:top_n_skills]

    results = []
    for skill_name, frequency in ranked_gaps:
        resource_name, resource_url = LEARNING_RESOURCES.get(skill_name, DEFAULT_RESOURCE)
        results.append({
            "skill": skill_name,
            "appears_in_jobs": frequency,
            "resource_name": resource_name,
            "resource_url": resource_url,
        })
    return results
