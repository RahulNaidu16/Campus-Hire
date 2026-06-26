import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import * as api from "../api";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "resume_shortlisted", label: "Resume Shortlisted" },
  { value: "aptitude_test", label: "Aptitude Test" },
  { value: "technical_interview", label: "Technical Interview" },
  { value: "hr_interview", label: "HR Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

function Stepper({ app }) {
  if (app.status === "rejected") {
    return (
      <div style={{
        padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 12.5, fontWeight: 600,
      }}>
        ✕ Not selected for this role
      </div>
    );
  }

  const stages = app.stage_order;
  const currentIdx = app.stage_index;

  return (
    <div style={{ display: "flex", alignItems: "center", overflowX: "auto", paddingBottom: 4 }}>
      {stages.map((stage, i) => {
        const done = i < currentIdx;
        const current = i === currentIdx;
        const color = done ? "#22c55e" : current ? "#38bdf8" : "#334155";
        return (
          <div key={stage.value} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 86 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", background: color,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done || current ? "#04101e" : "#94a3b8", fontSize: 11, fontWeight: 700,
                border: current ? "2px solid #38bdf8" : "none",
                boxShadow: current ? "0 0 0 4px rgba(56,189,248,0.18)" : "none",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 10.5, marginTop: 6, textAlign: "center", color: current ? "#e2e8f0" : "#64748b",
                fontWeight: current ? 700 : 500,
              }}>
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div style={{ width: 28, height: 2, background: i < currentIdx ? "#22c55e" : "#1e293b", marginBottom: 16 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ApplicationCard({ app }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, background: app.color || "#0ea5e9",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            fontWeight: 700, fontSize: 18, flexShrink: 0,
          }}>
            {app.initial}
          </div>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{app.job_title}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>{app.company} · {app.location} · {app.salary_display}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#64748b", fontSize: 11.5 }}>Applied {new Date(app.applied_at).toLocaleDateString()}</div>
          <div
            onClick={() => setExpanded((e) => !e)}
            style={{ color: "#38bdf8", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 4 }}
          >
            {expanded ? "Hide history ▲" : "View history ▼"}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <Stepper app={app} />
      </div>

      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(148,163,184,0.12)" }}>
          <div style={{ color: "#cbd5e1", fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>Status history</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {app.status_history.map((h) => (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "#e2e8f0" }}>
                  {h.status_display}
                  {h.note && <span style={{ color: "#64748b" }}> — {h.note}</span>}
                </span>
                <span style={{ color: "#64748b", flexShrink: 0, marginLeft: 12 }}>
                  {new Date(h.changed_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SavedJobCard({ saved, onApply, onUnsave, applied }) {
  const job = saved.job;
  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, background: job.color || "#0ea5e9",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            fontWeight: 700, fontSize: 18, flexShrink: 0,
          }}>
            {job.initial}
          </div>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{job.title}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>{job.company} · {job.location} · {job.salary_display}</div>
            {job.match !== null && job.match !== undefined && (
              <div style={{ color: "#38bdf8", fontSize: 12, fontWeight: 700, marginTop: 4 }}>{job.match}% match</div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onUnsave(job.id)} style={{ ...s.filterChip, background: "transparent", border: "1px solid rgba(148,163,184,0.25)", color: "#94a3b8" }}>
            ★ Unsave
          </button>
          <button
            onClick={() => onApply(job.id)}
            disabled={applied}
            style={{
              ...s.filterChip, border: "none",
              background: applied ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #0ea5e9, #6366f1)",
              color: applied ? "#22c55e" : "#fff",
            }}
          >
            {applied ? "Applied ✓" : "Apply Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Applications({ onNavigate }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("applications");
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([api.fetchMyApplications(), api.fetchSavedJobs()])
      .then(([apps, saved]) => {
        setApplications(apps);
        setSavedJobs(saved);
        setAppliedIds(new Set(apps.map((a) => a.job_id)));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleApply = (jobId) => {
    api.applyToJob(jobId).then(() => setAppliedIds((s) => new Set([...s, jobId]))).catch(() => {});
  };

  const handleUnsave = (jobId) => {
    api.toggleSavedJob(jobId).then(() => setSavedJobs((prev) => prev.filter((s) => s.job.id !== jobId))).catch(() => {});
  };

  if (!user) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <p style={{ marginBottom: 16 }}>Please sign in to view your applications.</p>
          <button style={s.linkBtn} onClick={() => onNavigate && onNavigate("login")}>Sign in →</button>
        </div>
      </div>
    );
  }

  const filtered = filter ? applications.filter((a) => a.status === filter) : applications;

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.content}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={s.title}>My Applications</h1>
          <p style={s.subtitle}>Track every stage — applied, shortlisted, interviews, offer — in one place.</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
          {[{ key: "applications", label: `Applied Jobs (${applications.length})` }, { key: "saved", label: `Saved Jobs (${savedJobs.length})` }].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: "none", border: "none", padding: "10px 6px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                color: tab === t.key ? "#38bdf8" : "#94a3b8",
                borderBottom: tab === t.key ? "2px solid #38bdf8" : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div style={{ color: "#64748b" }}>Loading…</div>}
        {error && <div style={s.errorBox}>{error}</div>}

        {!loading && tab === "applications" && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  style={{
                    ...s.filterChip,
                    background: filter === f.value ? "linear-gradient(135deg, #0ea5e9, #6366f1)" : "rgba(15,23,42,0.6)",
                    color: filter === f.value ? "#fff" : "#94a3b8",
                    border: filter === f.value ? "none" : "1px solid rgba(148,163,184,0.18)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ ...s.card, textAlign: "center", color: "#64748b", padding: "60px 24px" }}>
                No applications {filter ? "in this stage" : "yet"}. <span onClick={() => onNavigate && onNavigate("jobs")} style={{ color: "#38bdf8", cursor: "pointer" }}>Browse jobs →</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filtered.map((app) => <ApplicationCard key={app.id} app={app} />)}
            </div>
          </>
        )}

        {!loading && tab === "saved" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {savedJobs.length === 0 && (
              <div style={{ ...s.card, textAlign: "center", color: "#64748b", padding: "60px 24px" }}>
                No saved jobs yet. <span onClick={() => onNavigate && onNavigate("jobs")} style={{ color: "#38bdf8", cursor: "pointer" }}>Browse jobs →</span>
              </div>
            )}
            {savedJobs.map((saved) => (
              <SavedJobCard
                key={saved.id} saved={saved} onApply={handleApply} onUnsave={handleUnsave}
                applied={appliedIds.has(saved.job.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#050814", color: "#e2e8f0", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" },
  blob1: { position: "absolute", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,.2) 0%,transparent 70%)", pointerEvents: "none" },
  blob2: { position: "absolute", bottom: -80, right: -80, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.16) 0%,transparent 70%)", pointerEvents: "none" },
  content: { position: "relative", maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" },
  title: { fontSize: 32, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  subtitle: { color: "#94a3b8", marginTop: 8, fontSize: 15 },
  card: { background: "rgba(15,23,42,0.92)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 18, padding: "20px 22px", backdropFilter: "blur(12px)" },
  filterChip: { padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  errorBox: { padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 13, marginBottom: 16 },
  linkBtn: { background: "none", border: "none", color: "#38bdf8", fontSize: 14, cursor: "pointer", fontWeight: 600 },
};
