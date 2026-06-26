import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import * as api from "../api";

const RATIO_COLORS = { Placed: "#7c3aed", "In Process": "#06b6d4" };

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(15,23,42,0.96)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

// ── Analytics Page ────────────────────────────────────────────────────────────
const STAT_COLORS = ["#7c3aed", "#22c55e", "#06b6d4", "#f59e0b"];

export default function Analytics({ currentPage = "analytics", onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.fetchAnalyticsOverview().then(setData).catch((err) => setError(err.message || "Could not load analytics."));
  }, []);

  if (!data) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#94a3b8" }}>{error || "Loading analytics…"}</div>
      </div>
    );
  }

  const stats = data.stats.map((st, i) => ({ ...st, color: STAT_COLORS[i % STAT_COLORS.length] }));
  const deptData = data.dept_data;
  const monthlyData = data.monthly_data;
  const hiringData = data.hiring_data;
  const placementRatio = data.placement_ratio.map((p) => ({ ...p, color: RATIO_COLORS[p.name] || "#7c3aed" }));
  const placedPct = placementRatio.find((p) => p.name === "Placed")?.value ?? 0;

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />

      <div style={s.content}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={s.pageTitle}>Analytics Dashboard</h1>
          <p style={s.pageSub}>Insights across departments, recruiters and the placement funnel.</p>
        </div>

        {/* Stat cards */}
        <div style={s.statsGrid}>
          {stats.map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={s.statLabel}>{st.label}</span>
                <span style={{
                  fontSize: 20, background: `${st.color}22`,
                  borderRadius: 10, padding: "6px 8px", lineHeight: 1,
                }}>{st.icon}</span>
              </div>
              <div style={s.statValue}>{st.value}</div>
            </div>
          ))}
        </div>

        {/* Row 1: Dept bar + Monthly line */}
        <div style={s.row}>
          {/* Department-wise placements */}
          <div style={{ ...s.card, flex: 1 }}>
            <div style={s.cardTitle}>Department-wise placements</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="dept" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="placed" name="Placed" radius={[6, 6, 0, 0]}>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#7c3aed" : "#4c1d95"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {deptData.length === 0 && <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginTop: -100 }}>No placements recorded yet.</div>}
          </div>

          {/* Monthly applications and interviews */}
          <div style={{ ...s.card, flex: 1 }}>
            <div style={s.cardTitle}>Monthly applications and interviews</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(15,23,42,0.9)" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="applications" name="Applications"
                  stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: "#7c3aed" }} />
                <Line type="monotone" dataKey="interviews" name="Interviews"
                  stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: "#06b6d4" }} />
              </LineChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center" }}>
              {[{ label: "Applications", color: "#7c3aed" }, { label: "Interviews", color: "#06b6d4" }].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Hiring companies bar + Placement ratio donut */}
        <div style={s.row}>
          {/* Top hiring companies */}
          <div style={{ ...s.card, flex: 1 }}>
            <div style={s.cardTitle}>Top hiring companies</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={hiringData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <XAxis type="number" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis dataKey="company" type="category" stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 13 }} width={72} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hires" name="Hires" radius={[0, 6, 6, 0]} fill="#6d28d9">
                  {hiringData.map((_, i) => (
                    <Cell key={i} fill={`rgba(109,40,217,${1 - i * 0.1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Placement ratio donut */}
          <div style={{ ...s.card, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ ...s.cardTitle, alignSelf: "flex-start" }}>Placement ratio</div>
            <div style={{ position: "relative", marginTop: 16 }}>
              <PieChart width={260} height={260}>
                <Pie
                  data={placementRatio}
                  cx={130} cy={130}
                  innerRadius={75}
                  outerRadius={115}
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {placementRatio.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              {/* Centre label */}
              <div style={s.donutCenter}>
                <div style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 700 }}>{placedPct}%</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Placed</div>
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
              {placementRatio.map((p) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.color }} />
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "#050814",
    color: "#e2e8f0",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
  },
  blob1: {
    position: "absolute", top: -120, left: -120,
    width: 420, height: 420, borderRadius: "50%",
    background: "radial-gradient(circle,rgba(56,189,248,.24) 0%,transparent 70%)",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute", bottom: -80, right: -80,
    width: 340, height: 340, borderRadius: "50%",
    background: "radial-gradient(circle,rgba(124,58,237,.18) 0%,transparent 70%)",
    pointerEvents: "none",
  },
  content: {
    position: "relative",
    maxWidth: 1200,
    margin: "0 auto",
    padding: "48px 24px 80px",
  },
  pageTitle: {
    fontSize: 34, fontWeight: 700, color: "#f1f5f9", margin: 0,
  },
  pageSub: {
    color: "#94a3b8", fontSize: 15, marginTop: 6,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: 14,
    marginBottom: 22,
  },
  statCard: {
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(56,189,248,0.12)",
    borderRadius: 20,
    padding: "20px 22px",
    backdropFilter: "blur(12px)",
  },
  statLabel: { color: "#94a3b8", fontSize: 13, fontWeight: 500 },
  statValue: {
    fontSize: 34, fontWeight: 700, color: "#f1f5f9",
    marginTop: 8, letterSpacing: "-1px",
  },
  statSub: { fontSize: 12, marginTop: 4, fontWeight: 500, color: "#38bdf8" },
  row: {
    display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap",
  },
  card: {
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(56,189,248,0.12)",
    borderRadius: 20,
    padding: "22px 24px",
    backdropFilter: "blur(12px)",
    minWidth: 280,
  },
  cardTitle: {
    color: "#f1f5f9", fontWeight: 700, fontSize: 15, marginBottom: 4,
  },
  donutCenter: {
    position: "absolute",
    top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    textAlign: "center",
    pointerEvents: "none",
  },
};