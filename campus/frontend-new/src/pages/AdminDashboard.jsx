import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import * as api from "../api";

const BRANCHES = ["", "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];

function OverviewTab() {
  const [data, setData] = useState(null);

  useEffect(() => { api.fetchAdminOverview().then(setData).catch(() => {}); }, []);

  if (!data) return <div style={{ color: "#64748b" }}>Loading overview…</div>;

  const cards = [
    { label: "Total Students", value: data.total_students, icon: "🎓" },
    { label: "Total Recruiters", value: data.total_recruiters, icon: "🧑‍💼" },
    { label: "Total Jobs", value: data.total_jobs, icon: "💼" },
    { label: "Active Jobs", value: data.active_jobs, icon: "✅" },
    { label: "Total Applications", value: data.total_applications, icon: "📨" },
    { label: "Placement Statistics", value: data.total_placed, icon: "🏆" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {cards.map((c) => (
          <div key={c.label} style={s.statCard}>
            <div style={{ fontSize: 20 }}>{c.icon}</div>
            <div style={{ color: "#f1f5f9", fontSize: 24, fontWeight: 700, marginTop: 6 }}>{c.value}</div>
            <div style={{ color: "#94a3b8", fontSize: 11.5 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Most active companies</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.most_active_companies.map((c) => (
            <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#e2e8f0" }}>{c.name}</span>
              <span style={{ color: "#94a3b8" }}>{c.jobs_posted} jobs posted · <span style={{ color: "#22c55e", fontWeight: 700 }}>{c.hires} hires</span></span>
            </div>
          ))}
          {data.most_active_companies.length === 0 && <div style={{ color: "#64748b", fontSize: 12.5 }}>No hires recorded yet.</div>}
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, setPage, count, pageSize = 25 }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, justifyContent: "flex-end" }}>
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={s.smallBtn}>← Prev</button>
      <span style={{ color: "#64748b", fontSize: 12 }}>Page {page} of {totalPages} ({count} total)</span>
      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={s.smallBtn}>Next →</button>
    </div>
  );
}

function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.fetchAdminStudents({ search, branch, page }).then((d) => {
      setStudents(d.results);
      setCount(d.count);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, branch, page]);

  useEffect(() => { setPage(1); }, [search, branch]);

  const handleToggleActive = async (student) => {
    await api.setUserActive(student.id, !student.is_active);
    load();
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete student "${student.full_name}"? This cannot be undone.`)) return;
    await api.deleteUser(student.id);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, university…" style={{ ...s.input, maxWidth: 320 }} />
        <select value={branch} onChange={(e) => setBranch(e.target.value)} style={s.input}>
          {BRANCHES.map((b) => <option key={b} value={b}>{b || "All branches"}</option>)}
        </select>
        <span style={{ color: "#64748b", fontSize: 12.5, alignSelf: "center" }}>{count} student(s) total</span>
      </div>

      {loading && <div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <thead>
            <tr>
              {["Name", "University", "Branch", "CGPA", "Applications", "Placed", "Status", "Actions"].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st.id}>
                <td style={s.td}>
                  <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{st.full_name}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>{st.email}</div>
                </td>
                <td style={s.td}>{st.university}</td>
                <td style={s.td}>{st.branch}</td>
                <td style={s.td}>{st.cgpa}</td>
                <td style={s.td}>{st.applications_count}</td>
                <td style={s.td}>{st.selected_count > 0 ? <span style={{ color: "#22c55e", fontWeight: 700 }}>✓ {st.selected_count}</span> : "—"}</td>
                <td style={s.td}>
                  <span style={{ ...s.statusPill, background: st.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: st.is_active ? "#22c55e" : "#f87171" }}>
                    {st.is_active ? "Active" : "Suspended"}
                  </span>
                </td>
                <td style={s.td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleToggleActive(st)} style={s.smallBtn}>{st.is_active ? "Suspend" : "Reactivate"}</button>
                    <button onClick={() => handleDelete(st)} style={{ ...s.smallBtn, color: "#f87171" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && students.length === 0 && <div style={{ color: "#64748b", fontSize: 13, padding: 16 }}>No students match this search.</div>}
      </div>
      <Pagination page={page} setPage={setPage} count={count} />
    </div>
  );
}

function RecruitersTab() {
  const [recruiters, setRecruiters] = useState([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.fetchAdminRecruiters({ search, page }).then((d) => {
      setRecruiters(d.results);
      setCount(d.count);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  useEffect(() => { setPage(1); }, [search]);

  const handleToggleActive = async (recruiter) => {
    await api.setUserActive(recruiter.id, !recruiter.is_active);
    load();
  };

  const handleDelete = async (recruiter) => {
    if (!window.confirm(`Delete recruiter "${recruiter.full_name}"? Their job postings will remain but unowned. This cannot be undone.`)) return;
    await api.deleteUser(recruiter.id);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, company…" style={{ ...s.input, maxWidth: 320 }} />
        <span style={{ color: "#64748b", fontSize: 12.5, alignSelf: "center" }}>{count} recruiter(s) total</span>
      </div>

      {loading && <div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <thead>
            <tr>
              {["Name", "Company", "Jobs Posted", "Status", "Actions"].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recruiters.map((r) => (
              <tr key={r.id}>
                <td style={s.td}>
                  <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{r.full_name}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>{r.email}</div>
                </td>
                <td style={s.td}>{r.company || r.company_name || "—"}</td>
                <td style={s.td}>{r.jobs_count}</td>
                <td style={s.td}>
                  <span style={{ ...s.statusPill, background: r.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: r.is_active ? "#22c55e" : "#f87171" }}>
                    {r.is_active ? "Active" : "Suspended"}
                  </span>
                </td>
                <td style={s.td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleToggleActive(r)} style={s.smallBtn}>{r.is_active ? "Suspend" : "Reactivate"}</button>
                    <button onClick={() => handleDelete(r)} style={{ ...s.smallBtn, color: "#f87171" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && recruiters.length === 0 && <div style={{ color: "#64748b", fontSize: 13, padding: 16 }}>No recruiters match this search.</div>}
      </div>
      <Pagination page={page} setPage={setPage} count={count} />
    </div>
  );
}

export default function AdminDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");

  if (!user) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <p style={{ marginBottom: 16 }}>Please sign in with an admin account.</p>
          <button onClick={() => onNavigate && onNavigate("login")} style={s.linkBtn}>Sign in →</button>
        </div>
      </div>
    );
  }
  if (!user.is_staff && !user.is_superuser) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#94a3b8", textAlign: "center", maxWidth: 420, padding: 24 }}>
          This page is only available to platform admins. If you believe you should have
          access, ask an existing admin to grant your account staff access via Django admin.
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "students", label: "Students" },
    { key: "recruiters", label: "Recruiters" },
  ];

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.content}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={s.title}>Admin Dashboard</h1>
          <p style={s.subtitle}>Manage students and recruiters across the whole platform.</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
          {tabs.map((t) => (
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

        {tab === "overview" && <OverviewTab />}
        {tab === "students" && <StudentsTab />}
        {tab === "recruiters" && <RecruitersTab />}
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
  input: {
    background: "rgba(5,8,20,0.6)", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 10,
    color: "#e2e8f0", fontSize: 13, padding: "10px 12px", boxSizing: "border-box",
    fontFamily: "'Inter', sans-serif",
  },
  smallBtn: {
    background: "transparent", border: "1px solid rgba(148,163,184,0.25)", color: "#94a3b8",
    borderRadius: 8, padding: "5px 11px", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 700 },
  th: {
    textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
    padding: "8px 12px", borderBottom: "1px solid rgba(148,163,184,0.15)",
  },
  td: {
    padding: "12px", borderBottom: "1px solid rgba(148,163,184,0.08)", fontSize: 12.5, color: "#cbd5e1",
    verticalAlign: "middle",
  },
  statusPill: { fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999 },
  linkBtn: { background: "none", border: "none", color: "#38bdf8", fontSize: 14, cursor: "pointer", fontWeight: 600 },
};
