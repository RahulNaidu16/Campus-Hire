# Campus Hire — AI-Powered Campus Placement Management System

A full campus recruitment platform: Django REST API backend, multiple ML
features (job recommendations, placement prediction, resume ATS scoring,
skill-gap detection, AI mock interviews), and a React (Vite) frontend —
all wired together end to end, for both students and recruiters.

```
campus/
├── manage.py
├── db.sqlite3              # pre-seeded SQLite DB (skills, jobs, 320+ students, 16 recruiters)
├── requirements.txt
├── accounts/                # custom User model (student/recruiter), Skill, auth (JWT)
├── jobs/                    # Company, Job, Application, ApplicationStatusHistory, SavedJob
├── mlengine/                 # ML: recommender, placement model, resume analyzer, skill gap, mock-interview scorer
├── dashboard/                # student dashboard summary endpoint
├── analytics/                # org-wide + recruiter analytics endpoints
├── resumeai/                 # AI Resume Analysis endpoint
├── notifications/            # in-app notifications
├── interviews/                # recruiter-scheduled interviews
├── mockinterview/             # AI Mock Interview question bank + sessions
├── adminpanel/                 # admin-only platform management API
└── campus/
    ├── settings.py, urls.py  # Django project config
    └── frontend-new/         # React + Vite frontend
```

## What's included

### Student-facing
- **Smart Job Matching** — content-based ML recommender (scikit-learn `TfidfVectorizer`
  + cosine similarity) ranks every job against your skill profile (`mlengine/recommender.py`).
- **Placement Prediction** — a `LogisticRegression` model trained on synthetic-but-realistic
  data turns your skill match, applications, interviews and CGPA into a placement
  probability, plus **concrete improvement tips** grounded in real DB aggregates
  (`mlengine/placement_model.py`, `mlengine/improvement_tips.py`).
- **AI Resume Analysis** — paste or upload a `.pdf`/`.txt` resume and get an ATS score,
  section checklist, matched/missing keywords, and suggestions — tailored to a specific
  job if you pick one (`mlengine/resume_analyzer.py`, `resumeai/`).
- **Skill Gap Detection** — the highest-leverage skills you're missing across your
  best-matching jobs, each paired with a real curated learning resource (`mlengine/skill_gap.py`).
- **AI Mock Interview** — pick a role (or type a custom one), difficulty, and interview
  type (Technical / HR / Aptitude / Behavioral). The AI **reads each question aloud**
  (browser text-to-speech) and you can **answer by speaking** (browser speech-to-text,
  live-transcribed into the answer box, editable before submitting) or by typing.
  Optionally turn on **webcam video recording** to record yourself answering, for local
  self-review only. You get an instant, **explainable** 0-10 score with strengths/weaknesses
  and a sample answer, plus session history and topic-wise stats (`mockinterview/`,
  `mlengine/mock_interview_scorer.py`, `frontend-new/src/useVoice.js`,
  `frontend-new/src/useVideoRecorder.js`). *(See "About the Mock Interview scoring" below
  for an important honesty note.)*
- **Advanced Application Tracking** — full status timeline: Applied → Resume Shortlisted →
  Aptitude Test → Technical Interview → HR Interview → Selected/Rejected, with a visual
  stepper and complete status history (`jobs/models.py: ApplicationStatusHistory`).
- **Eligibility enforcement** — jobs can set a real minimum CGPA and/or a list of eligible
  branches; the Jobs page shows "Not Eligible" with the specific reason(s) and the apply
  endpoint rejects ineligible applications server-side (not just hidden in the UI).
- **Resume file storage** — uploading a `.pdf`/`.txt` resume now keeps the original file
  (not just the extracted text), downloadable later by you or by a recruiter you've applied
  to, via an access-controlled endpoint (not a public URL).
- **Interview accept/decline** — confirm or request a reschedule for any recruiter-scheduled
  interview right from your Dashboard; the recruiter gets notified either way.
- **Saved/Bookmarked Jobs**, **Company Profiles** (open roles + hiring stats per company),
  **Upcoming Interviews** (recruiter-scheduled), and **in-app + email Notifications**.

### Recruiter-facing
- **Recruiter Dashboard** — create / edit / close / delete job postings (title, skills,
  eligibility — now including an **enforced minimum CGPA and eligible-branches list**, not
  just descriptive text — experience, salary, openings, deadline); view & filter applicants
  (with their full profile, resume text, **and a download link for their original resume
  file**); update hiring stage per candidate (writes status history + notifies the student
  in-app and by email); **export applicants to CSV**.
- **Recruiter Analytics** — total jobs posted, total applications, shortlisted/selected/
  rejected counts, applications-per-job chart, hiring funnel, monthly recruitment activity.
- **Interview Scheduling** — schedule a round (date/time/mode/link) against a specific
  application; the student sees it on their dashboard, gets notified, and can confirm or
  request a reschedule (which notifies you back).
- Recruiters are linked to a real `Company` record (auto-created from their company name
  at registration), so their jobs show up correctly on that company's public profile page.

### Admin
- **In-app Admin Dashboard** (`/admin` page in the app, not just Django admin) — platform
  overview (totals, most active companies), a searchable/filterable Students table and
  Recruiters table (now **paginated**, 25 per page, since there are 300+ students), with
  **suspend/reactivate** and **delete** actions per account. Gated by Django's own
  `is_staff`/`is_superuser` flags (`adminpanel/`) — log in with the seeded `admin` /
  `Admin@123` superuser account to see it; you're redirected there automatically.
- Full **Django admin** (`/admin/`) is also still available for deeper data management
  (companies, jobs, applications with inline status history, the mock-interview question
  bank, etc.) — we didn't duplicate every model's CRUD into the custom admin page, since
  Django admin already covers that ground.

### A note on dark mode
Earlier versions of this README said only some newer pages didn't respect the light/dark
toggle. On closer inspection that undersold the problem: **13 of the app's 15 pages were
already hardcoded dark from the start** — only the Navbar and Profile page ever actually
responded to the toggle. Rather than spend a huge amount of effort retrofitting a
half-finished light theme into every page, we removed the toggle and standardized on the
one theme that's actually fully designed and consistent everywhere. If you want a real
light mode later, it'd need to be built out properly across every page, not patched back in.

## What was intentionally simplified (being upfront about it)

- **Mock interview scoring is rule-based, not a generative LLM.** It scores keyword
  coverage against a curated answer key, plus length/structure heuristics — the same
  honest approach as the resume analyzer. It's real, explainable, and reproducible, but it
  is not "AI" in the LLM-grading-free-text sense, since that would require a separate
  hosted LLM API this project doesn't depend on.
- **Coding interview questions are explain-your-approach, not an execution sandbox.**
  There's no code runner; coding questions are scored the same way as concept questions
  (explanation quality), not by running test cases against submitted code.
- **Notifications are in-app/polled, not real-time push.** The bell icon polls every 30s;
  there's no WebSocket/SSE layer.
- **No recruiter-candidate messaging** was built in this pass.
- **Voice answers use the browser's built-in Speech Recognition API** (Chrome/Edge) —
  it's not supported in Firefox/Safari, so the mic button is hidden there and typing is
  always available as a fallback. The browser handles the audio-to-text conversion itself
  (no audio is sent to our backend); only the resulting transcript reaches the app.
- **Optional webcam video recording during Mock Interview is entirely client-side.**
  Click "Record Video Too" and each question's answer is recorded (via `getUserMedia` +
  `MediaRecorder`) for self-review right there in the browser — playable immediately after
  you submit, and again in the end-of-session summary. **Nothing is uploaded** to our
  backend or anywhere else; the moment you close the tab, the recording is gone (there's
  no "save to my account" - by design, to avoid needing video storage infrastructure this
  project doesn't have). Requires Chrome/Edge/Firefox with camera+mic permission; hidden
  automatically if the browser doesn't support it.

## 1. Backend setup

```bash
cd campus
python3 -m venv venv
source venv/bin/activate          # venv\Scripts\activate on Windows
pip install -r requirements.txt
```

The repo already ships a seeded `db.sqlite3` and a trained ML model
(`mlengine/ml_models/placement_model.joblib`), so you can just run the server:

```bash
python manage.py runserver
```

The API is now live at `http://127.0.0.1:8000/api/`. Django admin is at
`http://127.0.0.1:8000/admin/` (superuser: `admin` / `Admin@123`).

### Resetting / regenerating data (optional)

```bash
rm db.sqlite3
python manage.py migrate
python manage.py seed_data --students 320     # skills, companies, jobs, recruiters, demo + synthetic users
python manage.py seed_questions                # AI Mock Interview question bank (83 questions)
python manage.py train_models                  # trains the placement-probability model
python manage.py createsuperuser
```

### Demo accounts

| Role      | Username / email                       | Password      |
|-----------|------------------------------------------|----------------|
| Admin     | `admin` / `admin@campushire.com`         | `Admin@123`    |
| Student   | `aarav` / `aarav@university.edu`         | `Campus@123`   |
| Recruiter | `recruiter1` / `recruiter1@google.com`   | `Campus@123`   |

There's also one auto-generated recruiter per other seeded company (e.g. `recruiter_microsoft`,
`recruiter_amazon`, ...), all with password `Campus@123`, plus 320+ synthetic student accounts
(also `Campus@123`) for populating analytics — usernames look like `priyasharma12`.

## 2. Frontend setup

```bash
cd campus/campus/frontend-new
npm install
npm run dev
```

This starts the Vite dev server (usually `http://localhost:5173`). A `.env` file is
already set up with `VITE_API_BASE_URL=http://127.0.0.1:8000/api`.

Sign in as the demo student to see Jobs/Dashboard/Applications/Mock Interview/Companies/
Analytics; sign in as `recruiter1` for the Recruiter Dashboard; sign in as `admin` for the
in-app Admin Dashboard (you'll be redirected there automatically).

## 3. Key API endpoints

| Area | Method | Endpoint | Notes |
|---|---|---|---|
| Auth | POST | `/api/auth/register/` | role: `student` or `recruiter` |
| Auth | POST | `/api/auth/login/` | accepts username or email |
| Auth | GET/PATCH | `/api/auth/me/` | profile + skills |
| Jobs | GET | `/api/jobs/` | filters: `location`, `job_type`, `min_salary`, `max_salary`, `company`, `skills`, `search` |
| Jobs | GET | `/api/jobs/recommendations/` | ML-ranked, student only |
| Jobs | POST | `/api/jobs/<id>/apply/` | student only |
| Jobs | POST | `/api/jobs/<id>/save/` | toggle bookmark |
| Jobs | GET | `/api/jobs/saved/` | your saved jobs |
| Jobs | GET/POST | `/api/jobs/mine/`, `/api/jobs/` | recruiter's own jobs / create |
| Jobs | PATCH/DELETE | `/api/jobs/<id>/edit/` | recruiter edit/close/delete |
| Jobs | GET | `/api/jobs/companies/`, `/api/jobs/companies/<id>/` | company list/profile |
| Jobs | GET | `/api/jobs/<id>/applicants/export/` | CSV export, recruiter only |
| Applications | GET | `/api/applications/` | yours, or applicants for recruiters (`?job_id=&status=`) |
| Applications | PATCH | `/api/applications/<id>/status/` | recruiter updates hiring stage |
| Dashboard | GET | `/api/dashboard/summary/` | stats, recommendations, skill gap, tips, upcoming interviews |
| Analytics | GET | `/api/analytics/overview/`, `/api/analytics/recruiter/` | org-wide / recruiter-only |
| Resume | POST | `/api/resume/analyze/` | multipart: `resume_text` or `resume_file`, optional `job_id` |
| Resume | GET | `/api/resume/file/<user_id>/` | download original file - self, or a recruiter with an application from that student |
| Notifications | GET/POST | `/api/notifications/`, `/<id>/read/`, `/read-all/` | |
| Interviews | GET/POST | `/api/interviews/` | recruiter schedules, student views upcoming |
| Interviews | PATCH | `/api/interviews/<id>/respond/` | student confirms or requests reschedule |
| Mock Interview | GET | `/api/mockinterview/roles/` | available roles |
| Mock Interview | POST | `/api/mockinterview/sessions/` | start a session |
| Mock Interview | POST | `/api/mockinterview/sessions/<id>/answer/` | score one answer |
| Mock Interview | POST | `/api/mockinterview/sessions/<id>/complete/` | finalize, get average score |
| Mock Interview | GET | `/api/mockinterview/sessions/history/`, `/stats/` | |
| Admin | GET | `/api/admin/overview/` | platform totals, most active companies |
| Admin | GET | `/api/admin/students/`, `/api/admin/recruiters/` | paginated (25/page); `?search=`, students also `?branch=`, `?page=` |
| Admin | PATCH/DELETE | `/api/admin/users/<id>/` | suspend/reactivate (`is_active`) or delete an account |

## Notes

- `SECRET_KEY`/`DEBUG`/`ALLOWED_HOSTS` are read from environment variables in
  `campus/settings.py` (with sensible local-dev defaults) — set `DJANGO_DEBUG=False`
  and a real `DJANGO_SECRET_KEY` before deploying.
- CORS is fully open (`CORS_ALLOW_ALL_ORIGINS=True`) for local development; tighten
  this for production.
- Application status flow: `applied → resume_shortlisted → aptitude_test →
  technical_interview → hr_interview → selected`, with `rejected` as a terminal branch
  from any stage.
- **Email** defaults to the console backend - notification emails print to the
  `runserver` log instead of actually sending, so no SMTP setup is needed for local dev
  or this demo. To send real email in production, set `DJANGO_EMAIL_BACKEND=smtp` plus
  `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`,
  and `DEFAULT_FROM_EMAIL` as environment variables.
- **Resume files** are saved under `MEDIA_ROOT` (`media/resumes/`) and served via Django's
  `/media/` URL in `DEBUG` mode for convenience - that raw URL has **no access control**.
  The actual access-controlled path apps should use is `/api/resume/file/<user_id>/`. In
  any real deployment, disable direct `/media/` serving (or front it with signed URLs) and
  rely only on the API endpoint.
- **Pagination**: most list endpoints intentionally return everything at once (job counts
  and per-recruiter applicant counts are small enough that pagination would just add
  complexity for no real benefit). The Admin Students/Recruiters lists are the one place
  with genuinely large row counts (300+), so those are paginated (25/page) - the only
  place in the API that returns the `{count, next, previous, results}` DRF pagination
  shape instead of a plain array.
