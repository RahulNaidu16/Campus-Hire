import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { useAuth } from "../AuthContext";
import * as api from "../api";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(15,23,42,0.96)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

const STATUS_OPTIONS = [
  { value: "applied", label: "Applied" },
  { value: "resume_shortlisted", label: "Resume Shortlisted" },
  { value: "aptitude_test", label: "Aptitude Test" },
  { value: "technical_interview", label: "Technical Interview" },
  { value: "hr_interview", label: "HR Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

const BRANCH_OPTIONS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];

const EMPTY_JOB = {
  title: "", location: "", job_type: "Full-time", salary_lpa: "", salary_display: "",
  description: "", eligibility_criteria: "", min_cgpa: "", eligible_branches: [],
  experience_required: "Fresher", openings: 1, deadline: "", skills: "",
};

// ── My Jobs tab ──────────────────────────────────────────────────────────
function JobsTab({ jobs, onEdit, onPostNew, onViewApplicants, onToggleClose, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ color: "#94a3b8", fontSize: 13.5 }}>{jobs.length} job posting(s)</div>
        <button onClick={onPostNew} style={s.primaryBtn}>+ Post New Job</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {jobs.map((job) => (
          <div key={job.id} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15.5 }}>{job.title}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                    background: job.is_active ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)",
                    color: job.is_active ? "#22c55e" : "#94a3b8",
                  }}>
                    {job.is_active ? "ACTIVE" : "CLOSED"}
                  </span>
                </div>
                <div style={{ color: "#94a3b8", fontSize: 12.5, marginTop: 4 }}>
                  {job.location} · {job.job_type} · {job.salary_display} · {job.openings} opening(s)
                </div>
                {(job.min_cgpa > 0 || job.eligible_branches) && (
                  <div style={{ color: "#fbbf24", fontSize: 11.5, marginTop: 4 }}>
                    🔒 {job.min_cgpa > 0 && `CGPA >= ${job.min_cgpa}`}
                    {job.min_cgpa > 0 && job.eligible_branches && " · "}
                    {job.eligible_branches && `Branches: ${job.eligible_branches}`}
                  </div>
                )}
                <div style={{ color: "#38bdf8", fontSize: 12.5, marginTop: 6, fontWeight: 600 }}>
                  {job.applicants} applicant(s)
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                <button onClick={() => onViewApplicants(job)} style={s.smallBtnPrimary}>View Applicants</button>
                <button onClick={() => onEdit(job)} style={s.smallBtn}>Edit</button>
                <button onClick={() => onToggleClose(job)} style={s.smallBtn}>{job.is_active ? "Close" : "Reopen"}</button>
                <button onClick={() => onDelete(job)} style={{ ...s.smallBtn, color: "#f87171" }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>You haven't posted any jobs yet.</div>}
      </div>
    </div>
  );
}

// ── Post / Edit job form ────────────────────────────────────────────────
function JobFormTab({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleBranch = (branch) => {
    setForm((f) => {
      const current = Array.isArray(f.eligible_branches) ? f.eligible_branches : [];
      const next = current.includes(branch) ? current.filter((b) => b !== branch) : [...current, branch];
      return { ...f, eligible_branches: next };
    });
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.title || !form.location || !form.salary_display) {
      setError("Please fill in at least title, location and salary.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        salary_lpa: parseFloat(form.salary_lpa) || 0,
        openings: parseInt(form.openings, 10) || 1,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        deadline: form.deadline || null,
        min_cgpa: parseFloat(form.min_cgpa) || 0,
        eligible_branches: Array.isArray(form.eligible_branches) ? form.eligible_branches.join(",") : form.eligible_branches,
      };
      await onSaved(payload, form.id);
    } catch (err) {
      setError(err.message || "Could not save job posting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={s.card}>
        <div style={s.fieldRow}>
          <Field label="Job Title / Role *">
            <input style={s.input} value={form.title} onChange={set("title")} placeholder="Software Engineer" />
          </Field>
          <Field label="Location *">
            <input style={s.input} value={form.location} onChange={set("location")} placeholder="Bangalore" />
          </Field>
        </div>
        <div style={s.fieldRow}>
          <Field label="Job Type">
            <select style={s.input} value={form.job_type} onChange={set("job_type")}>
              {["Full-time", "Internship", "Part-time", "Remote", "Hybrid"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Experience Required">
            <input style={s.input} value={form.experience_required} onChange={set("experience_required")} placeholder="Fresher / 0-2 years" />
          </Field>
        </div>
        <div style={s.fieldRow}>
          <Field label="Salary (LPA, numeric for filtering) *">
            <input style={s.input} type="number" value={form.salary_lpa} onChange={set("salary_lpa")} placeholder="18" />
          </Field>
          <Field label="Salary Display *">
            <input style={s.input} value={form.salary_display} onChange={set("salary_display")} placeholder="18 LPA or 80K/mo" />
          </Field>
        </div>
        <div style={s.fieldRow}>
          <Field label="Number of Openings">
            <input style={s.input} type="number" min="1" value={form.openings} onChange={set("openings")} />
          </Field>
          <Field label="Application Deadline">
            <input style={s.input} type="date" value={form.deadline || ""} onChange={set("deadline")} />
          </Field>
        </div>
        <Field label="Eligibility Criteria (descriptive text shown to students)">
          <input style={s.input} value={form.eligibility_criteria} onChange={set("eligibility_criteria")} placeholder="B.Tech/B.E, CGPA >= 7.0" />
        </Field>
        <div style={s.fieldRow}>
          <Field label="Minimum CGPA (enforced - 0 = no minimum)">
            <input style={s.input} type="number" step="0.1" min="0" max="10" value={form.min_cgpa} onChange={set("min_cgpa")} placeholder="7.0" />
          </Field>
          <Field label="Eligible Branches (enforced - none selected = open to all)">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
              {BRANCH_OPTIONS.map((b) => (
                <button
                  key={b} type="button" onClick={() => toggleBranch(b)}
                  style={pillBtnStyle((form.eligible_branches || []).includes(b))}
                >
                  {b}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <Field label="Required Skills (comma-separated)">
          <input style={s.input} value={form.skills} onChange={set("skills")} placeholder="React, Node, SQL" />
        </Field>
        <Field label="Job Description">
          <textarea style={{ ...s.input, minHeight: 110, resize: "vertical" }} value={form.description} onChange={set("description")} />
        </Field>

        {error && <div style={s.errorBox}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={handleSubmit} disabled={saving} style={s.primaryBtn}>
            {saving ? "Saving…" : form.id ? "Save Changes" : "Post Job"}
          </button>
          <button onClick={onCancel} style={s.smallBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14, flex: 1 }}>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function pillBtnStyle(active) {
  return {
    padding: "6px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
    background: active ? "linear-gradient(135deg, #0ea5e9, #6366f1)" : "rgba(15,23,42,0.6)",
    color: active ? "#fff" : "#94a3b8",
    border: active ? "none" : "1px solid rgba(148,163,184,0.2)",
  };
}

// ── Applicants tab ───────────────────────────────────────────────────────
function ApplicantCard({ app, onStatusChange }) {
  const [status, setStatus] = useState(app.status);
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await onStatusChange(app.id, status, note);
      setNote("");
    } finally {
      setSaving(false);
    }
  };

  const profile = app.student_profile;

  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{app.student_name}</div>
          <div style={{ color: "#94a3b8", fontSize: 12.5 }}>
            {profile?.university} · {profile?.branch} · CGPA {profile?.cgpa} · {profile?.email}
          </div>
          {profile?.skills?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {profile.skills.slice(0, 6).map((sk) => (
                <span key={sk.name} style={s.skillChip}>{sk.name} · {sk.level}%</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", color: "#64748b", fontSize: 11.5 }}>
          Applied {new Date(app.applied_at).toLocaleDateString()}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 6 }}>
            <div onClick={() => setShowResume((r) => !r)} style={{ color: "#fbbf24", cursor: "pointer" }}>
              {showResume ? "Hide resume ▲" : "📄 View Resume ▼"}
            </div>
            <div onClick={() => setExpanded((e) => !e)} style={{ color: "#38bdf8", cursor: "pointer" }}>
              {expanded ? "Hide history ▲" : "History ▼"}
            </div>
          </div>
        </div>
      </div>

      {showResume && (
        <div style={{
          marginTop: 14, padding: "12px 14px", borderRadius: 10,
          background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)",
        }}>
          {profile?.has_resume_file && (
            <button
              onClick={() => api.downloadResumeFile(profile.resume_file_user_id, `${app.student_name}-resume`).catch(() => {})}
              style={{ ...s.smallBtn, marginBottom: 10, color: "#fbbf24", borderColor: "rgba(251,191,36,0.3)" }}
            >
              ⬇ Download original resume file
            </button>
          )}
          {profile?.resume_text ? (
            <div style={{ color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 260, overflowY: "auto" }}>
              {profile.resume_text}
            </div>
          ) : (
            <div style={{ color: "#64748b", fontSize: 12.5, fontStyle: "italic" }}>
              This candidate hasn't uploaded a resume yet.
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...s.input, width: "auto", padding: "7px 10px", fontSize: 12.5 }}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)"
          style={{ ...s.input, width: 180, padding: "7px 10px", fontSize: 12.5 }}
        />
        <button onClick={handleUpdate} disabled={saving || status === app.status} style={s.smallBtnPrimary}>
          {saving ? "Updating…" : "Update Stage"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(148,163,184,0.12)" }}>
          {app.status_history.map((h) => (
            <div key={h.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: "#e2e8f0" }}>{h.status_display}{h.note && ` — ${h.note}`}</span>
              <span style={{ color: "#64748b" }}>{new Date(h.changed_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantsTab({ jobs, selectedJobId, setSelectedJobId }) {
  const [applicants, setApplicants] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!selectedJobId) { setApplicants([]); return; }
    setLoading(true);
    api.fetchApplicants({ jobId: selectedJobId, status: statusFilter }).then(setApplicants).finally(() => setLoading(false));
  };

  useEffect(load, [selectedJobId, statusFilter]);

  const handleStatusChange = async (appId, status, note) => {
    await api.updateApplicationStatus(appId, status, note);
    load();
  };

  const handleExport = () => {
    const job = jobs.find((j) => j.id === Number(selectedJobId));
    api.downloadApplicantsCsv(selectedJobId, `${job?.title || "applicants"}.csv`).catch(() => {});
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <select value={selectedJobId || ""} onChange={(e) => setSelectedJobId(e.target.value)} style={s.input}>
          <option value="">Select a job…</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} ({j.applicants})</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={s.input}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {selectedJobId && <button onClick={handleExport} style={s.smallBtn}>⬇ Export CSV</button>}
      </div>

      {!selectedJobId && <div style={{ color: "#64748b", fontSize: 13 }}>Select a job above to view its applicants.</div>}
      {loading && <div style={{ color: "#64748b", fontSize: 13 }}>Loading applicants…</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {applicants.map((app) => (
          <ApplicantCard key={app.id} app={app} onStatusChange={handleStatusChange} />
        ))}
        {selectedJobId && !loading && applicants.length === 0 && (
          <div style={{ color: "#64748b", fontSize: 13 }}>No applicants match this filter yet.</div>
        )}
      </div>
    </div>
  );
}

// ── Analytics tab ────────────────────────────────────────────────────────
function RecruiterAnalyticsTab() {
  const [data, setData] = useState(null);

  useEffect(() => { api.fetchRecruiterAnalytics().then(setData).catch(() => {}); }, []);

  if (!data) return <div style={{ color: "#64748b" }}>Loading analytics…</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 22 }}>
        {data.cards.map((c) => (
          <div key={c.label} style={s.statCard}>
            <div style={{ fontSize: 20 }}>{c.icon}</div>
            <div style={{ color: "#f1f5f9", fontSize: 24, fontWeight: 700, marginTop: 6 }}>{c.value}</div>
            <div style={{ color: "#94a3b8", fontSize: 11.5 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ ...s.card, flex: 1, minWidth: 320 }}>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Applications per job</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.applications_per_job} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="job" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="applications" name="Applications" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...s.card, flex: 1, minWidth: 320 }}>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Hiring funnel</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.hiring_funnel} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="stage" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Candidates" radius={[6, 6, 0, 0]}>
                {data.hiring_funnel.map((_, i) => <Cell key={i} fill={["#6366f1", "#0ea5e9", "#22c55e"][i % 3]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...s.card, flex: 1, minWidth: 320 }}>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Monthly recruitment activity</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.monthly_activity} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(15,23,42,0.9)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="applications" name="Applications" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: "#7c3aed" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────
export default function RecruiterDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const loadJobs = () => api.fetchMyJobs().then(setJobs).catch(() => {});

  useEffect(() => { if (user) loadJobs(); }, [user]);

  if (!user) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <p style={{ marginBottom: 16 }}>Please sign in with a recruiter account.</p>
          <button onClick={() => onNavigate && onNavigate("login")} style={s.linkBtn}>Sign in →</button>
        </div>
      </div>
    );
  }
  if (user.role !== "recruiter") {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#94a3b8" }}>The Recruiter Dashboard is only available for recruiter accounts.</div>
      </div>
    );
  }

  const handleSaveJob = async (payload, id) => {
    if (id) await api.updateJob(id, payload);
    else await api.createJob(payload);
    setTab("jobs");
    setEditingJob(null);
    loadJobs();
  };

  const handleToggleClose = async (job) => {
    await api.updateJob(job.id, { is_active: !job.is_active });
    loadJobs();
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    await api.deleteJob(job.id);
    loadJobs();
  };

  const tabs = [
    { key: "jobs", label: "My Jobs" },
    { key: "applicants", label: "Applicants" },
    { key: "analytics", label: "Analytics" },
  ];

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.content}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={s.title}>Recruiter Dashboard</h1>
          <p style={s.subtitle}>{user.company_name || "Your company"} · manage postings, applicants, and hiring stats.</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setEditingJob(null); }}
              style={{
                ...s.tabBtn,
                color: tab === t.key ? "#38bdf8" : "#94a3b8",
                borderBottom: tab === t.key ? "2px solid #38bdf8" : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "jobs" && !editingJob && (
          <JobsTab
            jobs={jobs}
            onPostNew={() => setEditingJob(EMPTY_JOB)}
            onEdit={(job) => setEditingJob({
              ...EMPTY_JOB, ...job,
              skills: (job.tags || []).join(", "),
              deadline: job.deadline || "",
              eligible_branches: (job.eligible_branches || "").split(",").map((b) => b.trim()).filter(Boolean),
            })}
            onViewApplicants={(job) => { setSelectedJobId(String(job.id)); setTab("applicants"); }}
            onToggleClose={handleToggleClose}
            onDelete={handleDelete}
          />
        )}

        {tab === "jobs" && editingJob && (
          <JobFormTab initial={editingJob} onSaved={handleSaveJob} onCancel={() => setEditingJob(null)} />
        )}

        {tab === "applicants" && (
          <ApplicantsTab jobs={jobs} selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} />
        )}

        {tab === "analytics" && <RecruiterAnalyticsTab />}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#050814", color: "#e2e8f0", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" },
  blob1: { position: "absolute", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,.2) 0%,transparent 70%)", pointerEvents: "none" },
  blob2: { position: "absolute", bottom: -80, right: -80, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.16) 0%,transparent 70%)", pointerEvents: "none" },
  content: { position: "relative", maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" },
  title: { fontSize: 30, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  subtitle: { color: "#94a3b8", marginTop: 8, fontSize: 14.5 },
  card: { background: "rgba(15,23,42,0.92)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 16, padding: "18px 20px", backdropFilter: "blur(12px)" },
  statCard: { background: "rgba(15,23,42,0.92)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 14, padding: "16px 18px" },
  tabBtn: { background: "none", border: "none", padding: "10px 6px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  primaryBtn: {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none",
    borderRadius: 10, padding: "10px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
  },
  smallBtn: {
    background: "transparent", border: "1px solid rgba(148,163,184,0.25)", color: "#94a3b8",
    borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  },
  smallBtnPrimary: {
    background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8",
    borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
  },
  input: {
    background: "rgba(5,8,20,0.6)", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 10,
    color: "#e2e8f0", fontSize: 13, padding: "10px 12px", boxSizing: "border-box", width: "100%",
    fontFamily: "'Inter', sans-serif",
  },
  fieldRow: { display: "flex", gap: 14 },
  skillChip: {
    fontSize: 11, fontWeight: 600, color: "#94a3b8", background: "rgba(148,163,184,0.1)",
    padding: "3px 9px", borderRadius: 999,
  },
  errorBox: {
    padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 13, marginTop: 8,
  },
  linkBtn: { background: "none", border: "none", color: "#38bdf8", fontSize: 14, cursor: "pointer", fontWeight: 600 },
};
