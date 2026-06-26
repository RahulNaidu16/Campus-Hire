import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "../AuthContext";
import * as api from "../api";

const STATUS_COLORS = {
  Applied: "#34d399", Shortlisted: "#60a5fa", Interview: "#a78bfa", Selected: "#fbbf24", Rejected: "#f87171",
};

function ProbabilityRing({ value = 0 }) {
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1e1b4b" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="12"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 70 70)" />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <text x="70" y="65" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">{value}%</text>
      <text x="70" y="84" textAnchor="middle" fill="#94a3b8" fontSize="11">Likely placed</text>
    </svg>
  );
}

export default function Dashboard({ currentPage = "dashboard", onNavigate }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respondingId, setRespondingId] = useState(null);

  const loadDashboard = () => {
    setLoading(true);
    api
      .fetchDashboardSummary()
      .then(setData)
      .catch((err) => setError(err.message || "Could not load your dashboard."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "student") {
      setLoading(false);
      return;
    }
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleInterviewResponse = async (interviewId, response) => {
    setRespondingId(interviewId);
    try {
      await api.respondToInterview(interviewId, response);
      loadDashboard();
    } catch (err) {
      setError(err.message || "Could not send your response.");
    } finally {
      setRespondingId(null);
    }
  };

  if (!user) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <p style={{ marginBottom: 16 }}>Please sign in to view your dashboard.</p>
          <button style={s.viewDetails} onClick={() => onNavigate && onNavigate("login")}>Sign in →</button>
        </div>
      </div>
    );
  }

  if (user.role !== "student") {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          The dashboard is available for student accounts.
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#94a3b8" }}>{error || "Loading your dashboard…"}</div>
      </div>
    );
  }

  const recommendedJobs = (data.recommended_jobs || []).map((j) => ({
    id: j.id, role: j.title, company: j.company, location: j.location,
    salary: j.salary_display, match: j.match, initial: j.initial, color: j.color,
  }));

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.content}>

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={s.greeting}>Hi, {data.greeting_name}</h1>
          <p style={s.greetingSub}>Here is a snapshot of your placement journey.</p>
        </div>

        {/* Stat cards */}
        <div style={s.statsGrid}>
          {data.stats.map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={s.statLabel}>{st.label}</span>
                <span style={{ fontSize: 20 }}>{st.icon}</span>
              </div>
              <div style={s.statValue}>{st.value}</div>
            </div>
          ))}
        </div>

        {/* Main two-column layout */}
        <div style={s.twoCol}>

          {/* LEFT column */}
          <div style={{ flex: 2, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Activity chart */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <div>
                  <div style={s.cardTitle}>Application activity</div>
                  <div style={s.cardSub}>Applications vs interviews over time</div>
                </div>
                <span style={{ fontSize: 20 }}>📈</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.activity_data}>
                  <XAxis dataKey="month" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "rgba(15,23,42,0.96)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 8 }}
                    labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#e2e8f0" }} />
                  <Line type="monotone" dataKey="applications" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="interviews" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Placement probability */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <div>
                  <div style={s.cardTitle}>Placement probability</div>
                  <div style={s.cardSub}>ML-predicted from your profile & activity</div>
                  <button style={s.viewDetails} onClick={() => onNavigate && onNavigate("profile")}>Improve my profile →</button>
                </div>
                <ProbabilityRing value={data.placement_probability} />
              </div>
            </div>

            {/* Improvement tips */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <div>
                  <div style={s.cardTitle}>Tips to improve your chances</div>
                  <div style={s.cardSub}>Concrete, data-driven next steps</div>
                </div>
                <span style={{ fontSize: 20 }}>💡</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(data.improvement_tips || []).map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#38bdf8", fontSize: 14, lineHeight: "20px" }}>→</span>
                    <span style={{ color: "#cbd5e1", fontSize: 13, lineHeight: "20px" }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT sidebar */}
          <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Resume analysis promo */}
            <div style={{ ...s.card, background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(56,189,248,0.1))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={s.cardTitle}>📄 Score your resume</div>
                  <div style={{ ...s.cardSub, marginBottom: 12 }}>Get an instant ATS score, section feedback and keyword gaps.</div>
                  <button style={s.viewDetails} onClick={() => onNavigate && onNavigate("resume")}>Analyze now →</button>
                </div>
              </div>
            </div>

            {/* Recommended Jobs */}
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={s.cardTitle}>Recommended jobs</div>
                <button
                  style={s.seeAllBtn}
                  onClick={() => onNavigate && onNavigate("jobs")}
                >
                  See all →
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recommendedJobs.length === 0 && (
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    Add some skills to your profile to get personalized recommendations.
                  </div>
                )}
                {recommendedJobs.map((job) => (
                  <div key={job.id} style={s.jobRow}>
                    <div style={{
                      ...s.avatar,
                      background: `linear-gradient(135deg, ${job.color}44, ${job.color}18)`,
                      border: `1px solid ${job.color}44`,
                      color: job.color,
                    }}>
                      {job.initial}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={s.jobRole}>{job.role}</div>
                      <div style={s.jobMeta}>{job.company} · {job.location} · {job.salary}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: job.match >= 90 ? "#22c55e" : "#a78bfa", fontWeight: 700, fontSize: 16 }}>
                        {job.match}%
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 11 }}>match</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Levels */}
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={s.cardTitle}>Skill levels</div>
                <button style={s.seeAllBtn} onClick={() => onNavigate && onNavigate("profile")}>Edit →</button>
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {data.skills.length === 0 && (
                  <div style={{ color: "#64748b", fontSize: 13 }}>No skills added yet.</div>
                )}
                {data.skills.map((sk) => (
                  <div key={sk.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ color: "#cbd5e1", fontSize: 13 }}>{sk.name}</span>
                      <span style={{ color: "#94a3b8", fontSize: 13 }}>{sk.level}%</span>
                    </div>
                    <div style={s.barBg}><div style={{ ...s.barFill, width: `${sk.level}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Interviews */}
            {(data.upcoming_interviews || []).length > 0 && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div>
                    <div style={s.cardTitle}>Upcoming interviews</div>
                    <div style={s.cardSub}>Scheduled by recruiters - don't miss these</div>
                  </div>
                  <span style={{ fontSize: 20 }}>📅</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {data.upcoming_interviews.map((iv) => (
                    <div key={iv.id} style={{ paddingBottom: 12, borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div>
                          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>{iv.round_name}</div>
                          <div style={{ color: "#64748b", fontSize: 11.5 }}>{iv.job_title} · {iv.company}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "#38bdf8", fontSize: 12, fontWeight: 700 }}>
                            {new Date(iv.scheduled_at).toLocaleDateString()}
                          </div>
                          <div style={{ color: "#64748b", fontSize: 11 }}>
                            {new Date(iv.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {iv.mode}
                          </div>
                        </div>
                      </div>
                      {iv.student_response === "pending" ? (
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            onClick={() => handleInterviewResponse(iv.id, "confirmed")}
                            disabled={respondingId === iv.id}
                            style={{
                              padding: "5px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                              background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e",
                            }}
                          >
                            ✓ Confirm
                          </button>
                          <button
                            onClick={() => handleInterviewResponse(iv.id, "decline_requested")}
                            disabled={respondingId === iv.id}
                            style={{
                              padding: "5px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                              background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24",
                            }}
                          >
                            Request Reschedule
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          marginTop: 8, fontSize: 11.5, fontWeight: 600,
                          color: iv.student_response === "confirmed" ? "#22c55e" : "#fbbf24",
                        }}>
                          {iv.student_response === "confirmed" ? "✓ You confirmed this interview" : "↻ Reschedule requested - waiting on recruiter"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Gap Detection */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <div>
                  <div style={s.cardTitle}>Skills to learn next</div>
                  <div style={s.cardSub}>Highest-leverage gaps across your best-matching jobs</div>
                </div>
                <span style={{ fontSize: 20 }}>⚡</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(data.skill_gap || []).length === 0 && (
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    No major skill gaps detected for your top-matching jobs — nice work!
                  </div>
                )}
                {(data.skill_gap || []).map((g) => (
                  <div key={g.skill} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div>
                      <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>{g.skill}</div>
                      <div style={{ color: "#64748b", fontSize: 11 }}>Needed in {g.appears_in_jobs} of your top matches</div>
                    </div>
                    <a
                      href={g.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#38bdf8", fontSize: 12, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}
                    >
                      Learn →
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div style={s.card}>
              <div style={s.cardTitle}>Activity feed</div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 16 }}>
                {data.activity_feed.length === 0 && (
                  <div style={{ color: "#64748b", fontSize: 13 }}>No applications yet — browse jobs to get started.</div>
                )}
                {data.activity_feed.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS_COLORS[a.status] || "#94a3b8", marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{a.status} — {a.role}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{a.company} · {a.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#050814", color: "#e2e8f0", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" },
  blob1: { position: "absolute", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,.24) 0%,transparent 70%)", pointerEvents: "none" },
  blob2: { position: "absolute", bottom: -80, right: -80, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.18) 0%,transparent 70%)", pointerEvents: "none" },
  content: { position: "relative", maxWidth: 1280, margin: "0 auto", padding: "48px 24px 80px" },
  greeting: { fontSize: 34, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  greetingSub: { color: "#94a3b8", marginTop: 6, fontSize: 15 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18, marginBottom: 24 },
  statCard: { background: "rgba(15,23,42,0.92)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 20, padding: "22px 24px", backdropFilter: "blur(12px)" },
  statLabel: { color: "#94a3b8", fontSize: 13, fontWeight: 500 },
  statValue: { fontSize: 34, fontWeight: 700, color: "#f1f5f9", marginTop: 8, letterSpacing: "-1px" },
  statSub: { color: "#38bdf8", fontSize: 12, marginTop: 4 },
  twoCol: { display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" },
  card: { background: "rgba(15,23,42,0.92)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 20, padding: "22px 24px", backdropFilter: "blur(12px)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  cardTitle: { color: "#f1f5f9", fontWeight: 700, fontSize: 15 },
  cardSub: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  viewDetails: { background: "none", border: "none", color: "#38bdf8", fontSize: 13, cursor: "pointer", marginTop: 14, padding: 0, fontWeight: 600 },
  seeAllBtn: { background: "none", border: "none", color: "#38bdf8", fontSize: 13, cursor: "pointer", padding: 0, fontWeight: 600 },
  jobRow: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  jobRole: { color: "#f1f5f9", fontWeight: 600, fontSize: 13 },
  jobMeta: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  barBg: { height: 6, background: "rgba(15,23,42,0.8)", borderRadius: 999, overflow: "hidden" },
  barFill: { height: "100%", background: "linear-gradient(90deg,#0ea5e9,#6366f1)", borderRadius: 999 },
};
