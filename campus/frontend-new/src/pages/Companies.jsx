import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import * as api from "../api";

function CompanyCard({ company, onClick }) {
  return (
    <div onClick={onClick} style={{ ...s.card, cursor: "pointer", transition: "transform 0.2s, border-color 0.2s" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{
          width: 50, height: 50, borderRadius: 14, background: company.color || "#0ea5e9",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          fontWeight: 700, fontSize: 20, flexShrink: 0,
        }}>
          {company.initial}
        </div>
        <div>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>{company.name}</div>
          <div style={{ color: "#94a3b8", fontSize: 12.5 }}>{company.industry} · {company.hq_location}</div>
        </div>
      </div>
      <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 14, lineHeight: 1.5, minHeight: 40 }}>
        {company.description?.slice(0, 110)}{company.description?.length > 110 ? "…" : ""}
      </p>
      <div style={{ display: "flex", gap: 18, marginTop: 14, fontSize: 12.5 }}>
        <span style={{ color: "#38bdf8", fontWeight: 700 }}>{company.active_jobs_count} <span style={{ color: "#64748b", fontWeight: 500 }}>open roles</span></span>
        <span style={{ color: "#22c55e", fontWeight: 700 }}>{company.total_hires} <span style={{ color: "#64748b", fontWeight: 500 }}>hired</span></span>
      </div>
    </div>
  );
}

function CompanyDetail({ company, onBack, onApply, onSave, onNavigate, savedIds, appliedIds }) {
  return (
    <div>
      <div onClick={onBack} style={{ color: "#38bdf8", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 }}>
        ← Back to companies
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 8 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: company.color || "#0ea5e9",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          fontWeight: 700, fontSize: 26, flexShrink: 0,
        }}>
          {company.initial}
        </div>
        <div>
          <h1 style={{ ...s.title, fontSize: 26 }}>{company.name}</h1>
          <div style={{ color: "#94a3b8", fontSize: 13.5 }}>{company.industry} · {company.hq_location}</div>
        </div>
      </div>
      <p style={{ color: "#cbd5e1", fontSize: 14.5, lineHeight: 1.6, margin: "16px 0 24px", maxWidth: 700 }}>
        {company.description}
      </p>
      <div style={{ display: "flex", gap: 28, marginBottom: 28 }}>
        <div>
          <div style={{ color: "#38bdf8", fontSize: 24, fontWeight: 700 }}>{company.active_jobs_count}</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>Active job openings</div>
        </div>
        <div>
          <div style={{ color: "#22c55e", fontSize: 24, fontWeight: 700 }}>{company.total_hires}</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>Students hired</div>
        </div>
      </div>

      <h3 style={{ color: "#f1f5f9", fontSize: 17, marginBottom: 14 }}>Open positions</h3>
      {(!company.jobs || company.jobs.length === 0) && (
        <div style={{ color: "#64748b", fontSize: 13 }}>No active openings right now - check back soon.</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(company.jobs || []).map((job) => (
          <div key={job.id} style={s.jobRow}>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{job.title}</div>
              <div style={{ color: "#94a3b8", fontSize: 12.5 }}>{job.location} · {job.job_type} · {job.salary_display}</div>
              {job.deadline && <div style={{ color: "#fbbf24", fontSize: 11.5, marginTop: 4 }}>Deadline: {job.deadline}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {job.match !== null && job.match !== undefined && (
                <span style={{ color: "#38bdf8", fontSize: 12.5, fontWeight: 700 }}>{job.match}% match</span>
              )}
              <button
                onClick={() => onSave(job.id)}
                style={{ ...s.smallBtn, background: "transparent", border: "1px solid rgba(148,163,184,0.25)", color: savedIds.has(job.id) ? "#fbbf24" : "#94a3b8" }}
              >
                {savedIds.has(job.id) ? "★ Saved" : "☆ Save"}
              </button>
              <button
                onClick={() => onApply(job.id)}
                disabled={appliedIds.has(job.id)}
                style={{
                  ...s.smallBtn,
                  background: appliedIds.has(job.id) ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #0ea5e9, #6366f1)",
                  color: appliedIds.has(job.id) ? "#22c55e" : "#fff", border: "none",
                  cursor: appliedIds.has(job.id) ? "default" : "pointer",
                }}
              >
                {appliedIds.has(job.id) ? "Applied ✓" : "Apply"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Companies({ onNavigate }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());

  useEffect(() => {
    api.fetchCompanies().then(setCompanies).finally(() => setLoading(false));
  }, []);

  const openCompany = (id) => {
    api.fetchCompanyDetail(id).then((data) => {
      setSelected(data);
      const saved = new Set((data.jobs || []).filter((j) => j.is_saved).map((j) => j.id));
      const applied = new Set((data.jobs || []).filter((j) => j.has_applied).map((j) => j.id));
      setSavedIds(saved);
      setAppliedIds(applied);
    });
  };

  const handleApply = (jobId) => {
    if (!user) { onNavigate && onNavigate("login"); return; }
    api.applyToJob(jobId).then(() => setAppliedIds((s) => new Set([...s, jobId]))).catch(() => {});
  };

  const handleSave = (jobId) => {
    if (!user) { onNavigate && onNavigate("login"); return; }
    api.toggleSavedJob(jobId).then((r) => {
      setSavedIds((s) => {
        const next = new Set(s);
        if (r.saved) next.add(jobId); else next.delete(jobId);
        return next;
      });
    }).catch(() => {});
  };

  const filtered = companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.content}>
        {!selected ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={s.title}>Companies</h1>
              <p style={s.subtitle}>Explore hiring companies, their open roles, and placement stats.</p>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies…"
              style={s.search}
            />
            {loading && <div style={{ color: "#64748b", marginTop: 20 }}>Loading companies…</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 20 }}>
              {filtered.map((c) => (
                <CompanyCard key={c.id} company={c} onClick={() => openCompany(c.id)} />
              ))}
            </div>
          </>
        ) : (
          <CompanyDetail
            company={selected}
            onBack={() => setSelected(null)}
            onApply={handleApply}
            onSave={handleSave}
            onNavigate={onNavigate}
            savedIds={savedIds}
            appliedIds={appliedIds}
          />
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#050814", color: "#e2e8f0", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" },
  blob1: { position: "absolute", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,.2) 0%,transparent 70%)", pointerEvents: "none" },
  blob2: { position: "absolute", bottom: -80, right: -80, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.16) 0%,transparent 70%)", pointerEvents: "none" },
  content: { position: "relative", maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" },
  title: { fontSize: 32, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  subtitle: { color: "#94a3b8", marginTop: 8, fontSize: 15 },
  search: {
    width: "100%", maxWidth: 380, background: "rgba(15,23,42,0.7)", border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 12, color: "#e2e8f0", fontSize: 13.5, padding: "11px 16px", boxSizing: "border-box",
  },
  card: { background: "rgba(15,23,42,0.92)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 18, padding: "20px 22px", backdropFilter: "blur(12px)" },
  jobRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
    background: "rgba(15,23,42,0.92)", border: "1px solid rgba(56,189,248,0.1)", borderRadius: 14, padding: "14px 18px",
  },
  smallBtn: { padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" },
};
