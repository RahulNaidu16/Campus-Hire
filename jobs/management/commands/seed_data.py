import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Skill, StudentSkill, User
from interviews.models import ScheduledInterview
from jobs.models import Application, ApplicationStatusHistory, Company, Job, SavedJob

COMPANIES = [
    ("Google", "#4285F4", "Internet & Software", "Bangalore"),
    ("Microsoft", "#00A4EF", "Internet & Software", "Hyderabad"),
    ("Amazon", "#FF9900", "E-commerce & Cloud", "Bangalore"),
    ("Infosys", "#007CC2", "IT Services", "Pune"),
    ("TCS", "#6B4FBB", "IT Services", "Chennai"),
    ("Flipkart", "#F74F00", "E-commerce", "Bangalore"),
    ("Swiggy", "#FC8019", "Food-tech", "Mumbai"),
    ("Razorpay", "#2EB6AF", "Fintech", "Bangalore"),
    ("Accenture", "#A100FF", "IT Consulting", "Mumbai"),
    ("Wipro", "#341F65", "IT Services", "Pune"),
    ("HCLTech", "#0050AB", "IT Services", "Noida"),
    ("Zomato", "#E23744", "Food-tech", "Gurgaon"),
    ("Paytm", "#00BAF2", "Fintech", "Noida"),
    ("L&T", "#0033A0", "Engineering & Construction", "Chennai"),
    ("Siemens", "#009999", "Industrial Engineering", "Mumbai"),
    ("Tata Motors", "#1B3A6B", "Automotive", "Pune"),
]

TECH_SKILLS = [
    "React", "Python", "ML", "Node", "AWS", "SQL", "TypeScript", "Docker",
    "PyTorch", "NLP", "CSS", "JavaScript", "PostgreSQL", "Redis", "CI/CD",
    "Terraform", "System Design", "Analytics", "Product", "Statistics",
    "Kubernetes", "GraphQL", "Java", "C++",
]
CORE_SKILLS = [
    "AutoCAD", "SolidWorks", "Embedded C", "VLSI", "Structural Analysis",
    "Surveying", "Manufacturing", "Thermodynamics", "Circuit Design",
]
ALL_SKILLS = TECH_SKILLS + CORE_SKILLS

JOBS = [
    # The original 8 jobs shown in the design mock - kept identical so the
    # demo experience matches what the UI was designed around.
    dict(title="Software Engineer", company="Google", location="Bangalore", job_type="Full-time",
         salary_lpa=28, salary_display="28 LPA", skills=["React", "TypeScript", "System Design"]),
    dict(title="Product Manager Intern", company="Microsoft", location="Hyderabad", job_type="Internship",
         salary_lpa=14.4, salary_display="1.2L/mo", skills=["Product", "Analytics", "SQL"]),
    dict(title="Data Scientist", company="Amazon", location="Bangalore", job_type="Full-time",
         salary_lpa=24, salary_display="24 LPA", skills=["Python", "ML", "Statistics"]),
    dict(title="Frontend Developer", company="Infosys", location="Pune", job_type="Full-time",
         salary_lpa=9, salary_display="9 LPA", skills=["React", "CSS", "JavaScript"]),
    dict(title="Cloud Engineer", company="TCS", location="Chennai", job_type="Full-time",
         salary_lpa=15, salary_display="15 LPA", skills=["AWS", "Docker", "Kubernetes"]),
    dict(title="ML Research Intern", company="Flipkart", location="Bangalore", job_type="Internship",
         salary_lpa=9.6, salary_display="80K/mo", skills=["Python", "PyTorch", "NLP"]),
    dict(title="Backend Developer", company="Swiggy", location="Mumbai", job_type="Full-time",
         salary_lpa=18, salary_display="18 LPA", skills=["Node", "PostgreSQL", "Redis"]),
    dict(title="DevOps Engineer", company="Razorpay", location="Remote", job_type="Full-time",
         salary_lpa=22, salary_display="22 LPA", skills=["CI/CD", "Terraform", "AWS"]),

    # Extra roles for variety across companies, locations and departments.
    dict(title="Full Stack Developer", company="Zomato", location="Bangalore", job_type="Full-time",
         salary_lpa=16, salary_display="16 LPA", skills=["React", "Node", "SQL"]),
    dict(title="SDE Intern", company="Microsoft", location="Hyderabad", job_type="Internship",
         salary_lpa=10.8, salary_display="90K/mo", skills=["Java", "System Design", "SQL"]),
    dict(title="Data Analyst", company="Paytm", location="Noida", job_type="Full-time",
         salary_lpa=11, salary_display="11 LPA", skills=["SQL", "Statistics", "Analytics"]),
    dict(title="QA Engineer", company="Wipro", location="Pune", job_type="Full-time",
         salary_lpa=7, salary_display="7 LPA", skills=["Java", "CI/CD", "SQL"]),
    dict(title="Associate Consultant", company="Accenture", location="Mumbai", job_type="Full-time",
         salary_lpa=8.5, salary_display="8.5 LPA", skills=["Analytics", "Product", "SQL"]),
    dict(title="Systems Engineer", company="TCS", location="Chennai", job_type="Full-time",
         salary_lpa=6.5, salary_display="6.5 LPA", skills=["Java", "SQL", "System Design"]),
    dict(title="Backend Developer Intern", company="Swiggy", location="Mumbai", job_type="Internship",
         salary_lpa=7.2, salary_display="60K/mo", skills=["Node", "Redis", "JavaScript"]),
    dict(title="Platform Engineer", company="Razorpay", location="Remote", job_type="Full-time",
         salary_lpa=26, salary_display="26 LPA", skills=["Kubernetes", "AWS", "Terraform"]),
    dict(title="ML Engineer", company="Amazon", location="Bangalore", job_type="Full-time",
         salary_lpa=27, salary_display="27 LPA", skills=["Python", "ML", "PyTorch"]),
    dict(title="Frontend Engineer Intern", company="Google", location="Bangalore", job_type="Internship",
         salary_lpa=18, salary_display="1.5L/mo", skills=["React", "TypeScript", "CSS"]),
    dict(title="Software Development Engineer II", company="Flipkart", location="Bangalore", job_type="Full-time",
         salary_lpa=32, salary_display="32 LPA", skills=["Java", "System Design", "AWS"]),
    dict(title="Database Administrator", company="HCLTech", location="Noida", job_type="Full-time",
         salary_lpa=8, salary_display="8 LPA", skills=["SQL", "PostgreSQL", "Redis"]),
    dict(title="Product Analyst", company="Zomato", location="Gurgaon", job_type="Full-time",
         salary_lpa=13, salary_display="13 LPA", skills=["Analytics", "SQL", "Product"]),
    dict(title="GraphQL API Developer", company="Paytm", location="Remote", job_type="Full-time",
         salary_lpa=19, salary_display="19 LPA", skills=["GraphQL", "Node", "TypeScript"]),

    # Core-engineering roles (Mechanical / Electrical / Civil) to round out the
    # department-wise analytics with non-CS placements.
    dict(title="Design Engineer", company="Tata Motors", location="Pune", job_type="Full-time",
         salary_lpa=8, salary_display="8 LPA", skills=["AutoCAD", "SolidWorks", "Manufacturing"]),
    dict(title="Production Engineer", company="Tata Motors", location="Chennai", job_type="Full-time",
         salary_lpa=6.8, salary_display="6.8 LPA", skills=["Manufacturing", "Thermodynamics", "AutoCAD"]),
    dict(title="Electrical Design Engineer", company="Siemens", location="Mumbai", job_type="Full-time",
         salary_lpa=9.5, salary_display="9.5 LPA", skills=["Circuit Design", "Embedded C", "VLSI"]),
    dict(title="Embedded Systems Engineer", company="Siemens", location="Bangalore", job_type="Full-time",
         salary_lpa=12, salary_display="12 LPA", skills=["Embedded C", "VLSI", "Circuit Design"]),
    dict(title="Site Engineer", company="L&T", location="Chennai", job_type="Full-time",
         salary_lpa=6, salary_display="6 LPA", skills=["Structural Analysis", "Surveying", "AutoCAD"]),
    dict(title="Civil Project Engineer", company="L&T", location="Hyderabad", job_type="Full-time",
         salary_lpa=7.5, salary_display="7.5 LPA", skills=["Structural Analysis", "Surveying", "Manufacturing"]),
    dict(title="Mechanical Design Intern", company="Tata Motors", location="Pune", job_type="Internship",
         salary_lpa=4.8, salary_display="40K/mo", skills=["SolidWorks", "AutoCAD", "Thermodynamics"]),
]

LOCATIONS = ["Bangalore", "Hyderabad", "Pune", "Mumbai", "Chennai", "Remote", "Noida", "Gurgaon"]
BRANCHES = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"]
FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Ishaan", "Riya", "Diya", "Ananya", "Saanvi",
    "Kabir", "Aryan", "Sai", "Rohan", "Priya", "Neha", "Karan", "Tanvi",
    "Meera", "Pranav", "Yash", "Sneha", "Arjun", "Kavya", "Rahul", "Pooja",
]
LAST_NAMES = [
    "Sharma", "Verma", "Iyer", "Reddy", "Gupta", "Nair", "Kulkarni", "Singh",
    "Patel", "Mishra", "Joshi", "Pillai", "Rao", "Bose", "Chatterjee", "Menon",
]

BRANCH_SKILL_POOL = {
    "CSE": TECH_SKILLS,
    "IT": TECH_SKILLS,
    "ECE": ["Embedded C", "VLSI", "Circuit Design", "Python", "C++"],
    "EEE": ["Circuit Design", "Embedded C", "VLSI", "AutoCAD"],
    "MECH": ["AutoCAD", "SolidWorks", "Manufacturing", "Thermodynamics"],
    "CIVIL": ["AutoCAD", "Structural Analysis", "Surveying", "Manufacturing"],
}

# Branches get a different baseline placement rate so the analytics
# dashboard's department-wise chart looks realistic (CS-heavy roles dominate).
BRANCH_PLACEMENT_WEIGHT = {"CSE": 1.0, "IT": 0.85, "ECE": 0.55, "EEE": 0.4, "MECH": 0.3, "CIVIL": 0.2}

STATUS_WEIGHTS = [
    (Application.APPLIED, 0.32),
    (Application.RESUME_SHORTLISTED, 0.18),
    (Application.APTITUDE_TEST, 0.12),
    (Application.TECHNICAL_INTERVIEW, 0.09),
    (Application.HR_INTERVIEW, 0.07),
    (Application.SELECTED, 0.12),
    (Application.REJECTED, 0.10),
]


def weighted_status(branch):
    """Pick an application status, biasing towards SELECTED for branches/students
    that are more likely to be placed, to produce believable analytics."""
    weight = BRANCH_PLACEMENT_WEIGHT.get(branch, 0.5)
    statuses, weights = zip(*STATUS_WEIGHTS)
    weights = list(weights)
    selected_idx = statuses.index(Application.SELECTED)
    weights[selected_idx] *= (0.3 + weight)
    return random.choices(statuses, weights=weights, k=1)[0]


def backdate(application, days_ago, status_age_days=0):
    """Override the auto_now/auto_now_add timestamps so seeded applications are
    spread across the last several months instead of all sitting on 'today'.
    queryset.update() bypasses auto_now*, which is exactly what we want here."""
    applied_at = timezone.now() - timedelta(days=days_ago)
    updated_at = applied_at + timedelta(days=min(status_age_days, days_ago))
    Application.objects.filter(pk=application.pk).update(applied_at=applied_at, updated_at=updated_at)


class Command(BaseCommand):
    help = "Seed the database with skills, companies, jobs, a demo account and a synthetic student population."

    def add_arguments(self, parser):
        parser.add_argument("--students", type=int, default=320, help="Number of synthetic student accounts to create")
        parser.add_argument("--flush", action="store_true", help="Delete existing seeded data before reseeding")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write("Flushing existing data...")
            Application.objects.all().delete()
            Job.objects.all().delete()
            Company.objects.all().delete()
            Skill.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        skills = self._seed_skills()
        companies = self._seed_companies()
        recruiters = self._seed_recruiters(companies)
        jobs = self._seed_jobs(companies, skills, recruiters)
        self._seed_demo_accounts(skills)
        self._seed_synthetic_students(options["students"], skills, jobs)

        self.stdout.write(self.style.SUCCESS(
            f"Seed complete: {len(skills)} skills, {len(companies)} companies, "
            f"{len(jobs)} jobs, {User.objects.filter(role='student').count()} students, "
            f"{len(recruiters)} recruiters."
        ))

    def _seed_skills(self):
        skills = {}
        for name in ALL_SKILLS:
            skill, _ = Skill.objects.get_or_create(name=name)
            skills[name] = skill
        return skills

    def _seed_companies(self):
        companies = {}
        for name, color, industry, hq in COMPANIES:
            company, _ = Company.objects.get_or_create(
                name=name,
                defaults={
                    "color": color,
                    "industry": industry,
                    "hq_location": hq,
                    "description": f"{name} is a leading {industry.lower()} company headquartered in {hq}, "
                                    f"hiring top campus talent across engineering and business roles.",
                },
            )
            companies[name] = company
        return companies

    def _seed_recruiters(self, companies):
        recruiters = {}

        if not User.objects.filter(username="recruiter1").exists():
            User.objects.create_user(
                username="recruiter1", email="recruiter1@google.com", password="Campus@123",
                first_name="Maya", last_name="Kapoor", role=User.ROLE_RECRUITER,
                company_name="Google", company=companies["Google"],
            )
        recruiters["Google"] = User.objects.get(username="recruiter1")

        for name, company in companies.items():
            if name == "Google":
                continue
            slug = "".join(ch for ch in name.lower() if ch.isalnum())
            username = f"recruiter_{slug}"
            if not User.objects.filter(username=username).exists():
                User.objects.create_user(
                    username=username, email=f"{username}@{slug}.com", password="Campus@123",
                    first_name="Recruiter", last_name=name, role=User.ROLE_RECRUITER,
                    company_name=name, company=company,
                )
            recruiters[name] = User.objects.get(username=username)

        return recruiters

    def _seed_jobs(self, companies, skills, recruiters):
        jobs = []
        for spec in JOBS:
            job, created = Job.objects.get_or_create(
                title=spec["title"],
                company=companies[spec["company"]],
                defaults=dict(
                    location=spec["location"],
                    job_type=spec["job_type"],
                    salary_lpa=spec["salary_lpa"],
                    salary_display=spec["salary_display"],
                    eligibility_criteria="B.Tech/B.E from a recognized university, CGPA >= 6.5",
                    experience_required="Fresher" if spec["job_type"] == "Internship" else "0-2 years",
                    openings=random.randint(1, 6),
                    created_by=recruiters.get(spec["company"]),
                    description=(
                        f"{spec['company']} is hiring a {spec['title']} based in {spec['location']}. "
                        f"You'll work with {', '.join(spec['skills'])} in a fast-paced, collaborative team."
                    ),
                ),
            )
            if created:
                job.skills.set([skills[name] for name in spec["skills"]])
            jobs.append(job)
        return jobs

    def _seed_demo_accounts(self, skills):
        if not User.objects.filter(username="aarav").exists():
            student = User.objects.create_user(
                username="aarav", email="aarav@university.edu", password="Campus@123",
                first_name="Aarav", last_name="Sharma", role=User.ROLE_STUDENT,
                university="IIT Delhi", branch="CSE", cgpa=8.4,
                bio="Final year CSE student passionate about full-stack development and ML.",
            )
            demo_levels = {
                "React": 88, "TypeScript": 82, "Node": 75, "Python": 78,
                "SQL": 70, "System Design": 62,
            }
            for name, level in demo_levels.items():
                StudentSkill.objects.create(student=student, skill=skills[name], level=level)

            jobs_by_title = {job.title: job for job in Job.objects.all()}
            # (job title, status, days_ago application was made, days after that it reached this status)
            demo_apps = [
                ("Software Engineer", Application.TECHNICAL_INTERVIEW, 10, 4),
                ("Product Manager Intern", Application.RESUME_SHORTLISTED, 40, 10),
                ("Data Scientist", Application.APPLIED, 8, 0),
                ("Design Engineer", Application.SELECTED, 95, 20),
                ("Frontend Engineer Intern", Application.APPLIED, 175, 0),
                ("SDE Intern", Application.REJECTED, 168, 30),
                ("Full Stack Developer", Application.HR_INTERVIEW, 140, 20),
                ("Cloud Engineer", Application.RESUME_SHORTLISTED, 110, 15),
                ("Backend Developer", Application.APPLIED, 70, 0),
                ("DevOps Engineer", Application.APTITUDE_TEST, 55, 12),
                ("Platform Engineer", Application.APPLIED, 28, 0),
                ("ML Engineer", Application.APPLIED, 18, 0),
            ]
            for title, status, days_ago, status_age in demo_apps:
                job = jobs_by_title.get(title)
                if job:
                    app, created = Application.objects.get_or_create(
                        student=student, job=job, defaults={"status": status},
                    )
                    backdate(app, days_ago, status_age)
                    if created:
                        # Build a believable status history leading up to the current stage.
                        stage_order = Application.STAGE_ORDER
                        if status in stage_order:
                            path_so_far = stage_order[:stage_order.index(status) + 1]
                        else:
                            path_so_far = [Application.APPLIED, status]
                        for step_i, step_status in enumerate(path_so_far):
                            hist = ApplicationStatusHistory.objects.create(application=app, status=step_status)
                            if len(path_so_far) > 1:
                                step_days_ago = days_ago - int((days_ago - status_age) * step_i / (len(path_so_far) - 1))
                            else:
                                step_days_ago = status_age
                            ApplicationStatusHistory.objects.filter(pk=hist.pk).update(
                                changed_at=timezone.now() - timedelta(days=max(step_days_ago, 0))
                            )

            # Give the demo student an upcoming scheduled interview + a couple of saved jobs.
            interview_app = Application.objects.filter(student=student, job__title="Software Engineer").first()
            if interview_app and not interview_app.scheduled_interviews.exists():
                ScheduledInterview.objects.create(
                    application=interview_app, round_name="Technical Interview - Round 2",
                    scheduled_at=timezone.now() + timedelta(days=3, hours=2),
                    duration_minutes=45, mode=ScheduledInterview.ONLINE,
                    location_or_link="https://meet.google.com/campus-hire-demo",
                    created_by=interview_app.job.created_by,
                )

            for title in ["ML Engineer", "GraphQL API Developer"]:
                job = jobs_by_title.get(title)
                if job:
                    SavedJob.objects.get_or_create(student=student, job=job)

        recruiter1 = User.objects.filter(username="recruiter1").first()
        if recruiter1 and not recruiter1.company_name:
            recruiter1.company_name = "Google"
            recruiter1.save(update_fields=["company_name"])

    def _seed_synthetic_students(self, count, skills, jobs):
        jobs_by_branch_pool = {
            branch: [j for j in jobs if any(s.name in BRANCH_SKILL_POOL[branch] for s in j.skills.all())]
            for branch in BRANCHES
        }
        existing = User.objects.filter(role="student").count()
        if existing >= count:
            return

        to_create = count - existing
        for i in range(to_create):
            branch = random.choice(BRANCHES)
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            username = f"{first.lower()}{last.lower()}{existing + i}"
            student = User.objects.create_user(
                username=username,
                email=f"{username}@university.edu",
                password="Campus@123",
                first_name=first,
                last_name=last,
                role=User.ROLE_STUDENT,
                university=random.choice(["IIT Delhi", "IIT Bombay", "NIT Trichy", "BITS Pilani", "VIT Vellore", "Anna University"]),
                branch=branch,
                cgpa=round(random.uniform(6.0, 9.8), 1),
            )

            pool = BRANCH_SKILL_POOL[branch]
            picked = random.sample(pool, k=min(len(pool), random.randint(3, 6)))
            for skill_name in picked:
                StudentSkill.objects.create(
                    student=student, skill=skills[skill_name], level=random.randint(45, 95)
                )

            candidate_jobs = jobs_by_branch_pool.get(branch) or jobs
            num_apps = random.choices([0, 1, 2, 3, 4, 5], weights=[15, 20, 25, 20, 12, 8])[0]
            applied_jobs = random.sample(candidate_jobs, k=min(num_apps, len(candidate_jobs)))
            for job in applied_jobs:
                status = weighted_status(branch)
                app = Application.objects.create(student=student, job=job, status=status)
                days_ago = random.randint(2, 200)
                status_age = random.randint(0, min(days_ago, 30))
                backdate(app, days_ago, status_age)
                hist = ApplicationStatusHistory.objects.create(application=app, status=status)
                ApplicationStatusHistory.objects.filter(pk=hist.pk).update(
                    changed_at=timezone.now() - timedelta(days=status_age)
                )
