import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import * as api from "../api";

// ── Global styles ─────────────────────────────────────────────────────────────
function GlobalStyles() {
  useEffect(() => {
    const id = "jl-global-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

      @keyframes gradientShift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-10px); }
      }

      .jl-nav-link:hover    { color: #f1f5f9 !important; }
      .jl-footer-link:hover { color: #94a3b8 !important; }
      .jl-soc-icon:hover {
        background: rgba(56,189,248,0.1) !important;
        border-color: rgba(56,189,248,0.3) !important;
        color: #38bdf8 !important;
      }
      .jl-skill-btn:hover {
        border-color: rgba(14,165,233,0.5) !important;
        color: #38bdf8 !important;
      }
      .jl-apply-btn:hover {
        background: linear-gradient(135deg,#0ea5e9,#6366f1) !important;
        color: #fff !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 16px rgba(14,165,233,0.35) !important;
      }
      .jl-card:hover {
        transform: translateY(-4px) !important;
        border-color: rgba(56,189,248,0.3) !important;
        box-shadow: 0 16px 48px rgba(14,165,233,0.1) !important;
      }
      .jl-cta-btn:hover {
        transform: translateY(-2px) scale(1.02) !important;
        box-shadow: 0 10px 36px rgba(14,165,233,0.45) !important;
      }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const DEFAULT_SKILLS    = ["React","Python","ML","Node","AWS","SQL","TypeScript","Docker"];
const DEFAULT_LOCATIONS = ["All","Bangalore","Hyderabad","Pune","Mumbai","Chennai","Remote"];

function matchBadge(pct) {
  if (pct == null) return { bg:"rgba(148,163,184,0.12)", color:"#94a3b8", border:"rgba(148,163,184,0.25)" };
  if (pct >= 90) return { bg:"rgba(52,211,153,0.15)", color:"#34d399", border:"rgba(52,211,153,0.3)" };
  if (pct >= 80) return { bg:"rgba(14,165,233,0.12)", color:"#38bdf8", border:"rgba(14,165,233,0.3)" };
  return          { bg:"rgba(251,191,36,0.12)",  color:"#fbbf24", border:"rgba(251,191,36,0.3)"  };
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
function IconSearch({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IconFilter({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
function IconPin({ color }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconBriefcase({ color }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function IconRupee({ color }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 8h12M6 13l10 8M6 13h3a4 4 0 0 0 0-8" />
    </svg>
  );
}
function IconClock({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}
function IconUsers({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function RadioOption({ label, checked, onChange }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7, cursor:"pointer" }}>
      <div
        onClick={onChange}
        style={{
          width:15, height:15, borderRadius:"50%",
          border:"2px solid " + (checked ? "#38bdf8" : "rgba(255,255,255,0.2)"),
          background: checked ? "#38bdf8" : "transparent",
          flexShrink:0, position:"relative", cursor:"pointer",
          transition:"all 0.15s",
        }}
      >
        {checked && (
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            width:5, height:5, borderRadius:"50%", background:"#050814",
          }} />
        )}
      </div>
      <span style={{ fontSize:13, color: checked ? "#e2e8f0" : "#64748b" }}>{label}</span>
    </label>
  );
}

function FilterSection({ label, children }) {
  return (
    <div style={{ marginBottom:"1.4rem" }}>
      <div style={{
        fontSize:10, fontWeight:700, textTransform:"uppercase",
        letterSpacing:"0.08em", color:"#38bdf8", marginBottom:10,
      }}>
        {label}
      </div>
      {children}
      <div style={{ height:1, background:"rgba(255,255,255,0.05)", marginTop:14 }} />
    </div>
  );
}

function JobCard({ job, onApply, applying, isAuthed, onToggleSave, savingId }) {
  const badge = matchBadge(job.match);
  return (
    <div className="jl-card" style={{
      background:"rgba(15,23,42,0.76)",
      border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:18,
      padding:"22px 22px 18px",
      cursor:"pointer",
      transition:"transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
      position:"relative",
    }}>
      {/* Match badge */}
      <div style={{
        position:"absolute", top:16, right:16,
        background:badge.bg,
        border:"1px solid " + badge.border,
        color:badge.color,
        fontSize:11, fontWeight:700,
        padding:"3px 10px", borderRadius:20,
        letterSpacing:"0.2px",
      }}>
        {job.match == null ? "Sign in for match" : `${job.match}% match`}
      </div>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, paddingRight:64 }}>
        <div style={{
          width:44, height:44, borderRadius:12,
          background: job.color + "22",
          border:"1px solid " + job.color + "55",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:800, fontSize:17, color:job.color, flexShrink:0,
        }}>
          {job.initial}
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:15, color:"#f8fafc", marginBottom:2 }}>{job.title}</div>
          <div style={{ fontSize:13, color:"#94a3b8" }}>{job.company}</div>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display:"flex", gap:14, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748b" }}>
          <IconPin color="#64748b" /> {job.location}
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748b" }}>
          <IconBriefcase color="#64748b" /> {job.type}
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748b" }}>
          <IconRupee color="#64748b" /> {job.salary}
        </span>
      </div>

      {/* Tags */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
        {job.tags.map((tag) => (
          <span key={tag} style={{
            fontSize:11, padding:"3px 10px", borderRadius:20,
            background:"rgba(14,165,233,0.08)",
            border:"1px solid rgba(14,165,233,0.15)",
            color:"#7dd3fc", fontWeight:500,
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:12,
      }}>
        <div style={{ display:"flex", gap:14 }}>
          <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748b" }}>
            <IconUsers color="#64748b" /> {job.applicants.toLocaleString()}
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748b" }}>
            <IconClock color="#64748b" /> {job.posted}
          </span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button
            disabled={savingId}
            onClick={(e) => { e.stopPropagation(); onToggleSave && onToggleSave(job); }}
            title={job.is_saved ? "Remove from saved jobs" : "Save job"}
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 15, color: job.is_saved ? "#fbbf24" : "#64748b", flexShrink: 0,
            }}
          >
            {job.is_saved ? "★" : "☆"}
          </button>
          <button
            className="jl-apply-btn"
            disabled={job.has_applied || applying || job.is_eligible === false}
            onClick={(e) => { e.stopPropagation(); onApply && onApply(job); }}
            title={job.is_eligible === false ? job.ineligible_reasons.join(" · ") : undefined}
            style={{
              background: job.has_applied ? "rgba(52,211,153,0.12)" : job.is_eligible === false ? "rgba(148,163,184,0.1)" : "rgba(14,165,233,0.12)",
              border:"1px solid " + (job.has_applied ? "rgba(52,211,153,0.3)" : job.is_eligible === false ? "rgba(148,163,184,0.2)" : "rgba(14,165,233,0.3)"),
              color: job.has_applied ? "#34d399" : job.is_eligible === false ? "#94a3b8" : "#38bdf8", fontWeight:600, fontSize:12,
              cursor: (job.has_applied || job.is_eligible === false) ? "default" : "pointer", borderRadius:8, padding:"6px 16px",
              transition:"all 0.2s ease", opacity: applying ? 0.6 : 1,
            }}
          >
            {job.has_applied ? "Applied ✓" : job.is_eligible === false ? "Not Eligible" : applying ? "Applying..." : isAuthed ? "Apply Now" : "Sign in to apply"}
          </button>
        </div>
      </div>
      {job.is_eligible === false && (
        <div style={{ color: "#fbbf24", fontSize: 11, marginTop: 8, lineHeight: 1.4 }}>
          🔒 {job.ineligible_reasons.join(" · ")}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function JobListings({ currentPage = "jobs", onNavigate }) {
  const { user } = useAuth();
  const [location, setLocation]             = useState("All");
  const [jobType, setJobType]               = useState("All");
  const [minPkg, setMinPkg]                 = useState(0);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [search, setSearch]                 = useState("");

  const [jobs, setJobs]         = useState([]);
  const [meta, setMeta]         = useState({ locations: [], job_types: [], skills: [] });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [applyingId, setApplyingId] = useState(null);

  const toggleSkill = (s) =>
    setSelectedSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  useEffect(() => {
    api.fetchJobMeta().then(setMeta).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      api
        .fetchJobs({
          location: location === "All" ? "" : location,
          job_type: jobType === "All" ? "" : jobType,
          min_salary: minPkg > 0 ? minPkg : "",
          skills: selectedSkills.join(","),
          search,
        })
        .then((data) => {
          if (cancelled) return;
          setJobs(
            data.map((j) => ({
              ...j,
              type: j.job_type,
              salary: j.salary_display,
            }))
          );
        })
        .catch((err) => !cancelled && setError(err.message || "Could not load jobs."))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [location, jobType, minPkg, selectedSkills, search]);

  const handleApply = async (job) => {
    if (!user) {
      onNavigate && onNavigate("login");
      return;
    }
    if (user.role !== "student") return;
    setApplyingId(job.id);
    try {
      await api.applyToJob(job.id);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, has_applied: true } : j)));
    } catch (err) {
      const reasons = err.data?.reasons;
      setError(reasons?.length ? `${err.message} (${reasons.join("; ")})` : (err.message || "Could not apply to this job."));
    } finally {
      setApplyingId(null);
    }
  };

  const [savingId, setSavingId] = useState(null);
  const handleToggleSave = async (job) => {
    if (!user) {
      onNavigate && onNavigate("login");
      return;
    }
    setSavingId(job.id);
    try {
      const result = await api.toggleSavedJob(job.id);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_saved: result.saved } : j)));
    } catch (err) {
      setError(err.message || "Could not update saved jobs.");
    } finally {
      setSavingId(null);
    }
  };

  const locations = meta.locations.length ? ["All", ...meta.locations] : DEFAULT_LOCATIONS;
  const skillOptions = meta.skills.length ? meta.skills.slice(0, 12) : DEFAULT_SKILLS;
  const filtered = jobs;

  return (
    <div style={{ minHeight:"100vh", background:"#050814", color:"#e2e8f0", fontFamily:"'Inter', sans-serif", overflowX:"hidden" }}>
      <GlobalStyles />

      {/* ── Page header ── */}
      <div style={{
        position:"relative", overflow:"hidden",
        background:"radial-gradient(circle at 20% 40%, rgba(14,165,233,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.1) 0%, transparent 45%)",
        borderBottom:"1px solid rgba(56,189,248,0.08)",
        padding:"48px 24px 40px",
      }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:4, color:"#38bdf8", textTransform:"uppercase", marginBottom:12 }}>
            OPPORTUNITIES
          </p>
          <h1 style={{
            fontSize:42, fontWeight:800, letterSpacing:"-1px",
            background:"linear-gradient(135deg, #f8fafc 0%, #38bdf8 60%, #818cf8 100%)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            animation:"gradientShift 4s ease infinite",
            margin:"0 0 10px",
          }}>
            Job Listings
          </h1>
          <p style={{ fontSize:15, color:"#94a3b8", margin:0 }}>
            {filtered.length} opportunities matching your profile
          </p>
        </div>
      </div>

      {/* ── Layout ── */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"32px 24px", display:"flex", gap:"24px" }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width:224, flexShrink:0,
          background:"rgba(15,23,42,0.76)",
          border:"1px solid rgba(56,189,248,0.1)",
          borderRadius:18, padding:"22px 18px",
          height:"fit-content",
          position:"sticky", top:80,
          backdropFilter:"blur(12px)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
            <div style={{
              width:28, height:28, borderRadius:8,
              background:"rgba(14,165,233,0.1)",
              border:"1px solid rgba(14,165,233,0.2)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <IconFilter color="#38bdf8" />
            </div>
            <span style={{ fontWeight:700, fontSize:14, color:"#f8fafc" }}>Filters</span>
          </div>

          <FilterSection label="Location">
            {locations.map((loc) => (
              <RadioOption key={loc} label={loc} checked={location === loc} onChange={() => setLocation(loc)} />
            ))}
          </FilterSection>

          <FilterSection label="Job Type">
            {["All","Full-time","Internship"].map((t) => (
              <RadioOption key={t} label={t} checked={jobType === t} onChange={() => setJobType(t)} />
            ))}
          </FilterSection>

          <FilterSection label="Min Package">
            <input
              type="range" min={0} max={30} value={minPkg}
              onChange={(e) => setMinPkg(Number(e.target.value))}
              style={{ width:"100%", accentColor:"#0ea5e9", marginBottom:6 }}
            />
            <span style={{ fontSize:12, color:"#64748b" }}>
              {minPkg > 0 ? minPkg + "+ LPA" : "Any"}
            </span>
          </FilterSection>

          <div style={{ marginBottom:"1rem" }}>
            <div style={{
              fontSize:10, fontWeight:700, textTransform:"uppercase",
              letterSpacing:"0.08em", color:"#38bdf8", marginBottom:10,
            }}>Skills</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {skillOptions.map((s) => (
                <button
                  key={s}
                  className="jl-skill-btn"
                  onClick={() => toggleSkill(s)}
                  style={{
                    padding:"4px 10px", borderRadius:20, fontSize:11, cursor:"pointer",
                    border:"1px solid " + (selectedSkills.includes(s) ? "rgba(14,165,233,0.5)" : "rgba(255,255,255,0.1)"),
                    background: selectedSkills.includes(s) ? "rgba(14,165,233,0.12)" : "transparent",
                    color: selectedSkills.includes(s) ? "#38bdf8" : "#64748b",
                    fontWeight: selectedSkills.includes(s) ? 600 : 400,
                    transition:"all 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex:1, minWidth:0 }}>
          {/* Search */}
          <div style={{ position:"relative", marginBottom:"1.5rem" }}>
            <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }}>
              <IconSearch color="#64748b" />
            </div>
            <input
              type="text"
              placeholder="Search roles, companies, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width:"100%", padding:"13px 16px 13px 42px",
                background:"rgba(15,23,42,0.76)",
                border:"1px solid rgba(56,189,248,0.12)",
                borderRadius:12, color:"#e2e8f0", fontSize:14,
                outline:"none", boxSizing:"border-box",
                backdropFilter:"blur(12px)",
                transition:"border-color 0.2s ease",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(14,165,233,0.4)"; }}
              onBlur={(e)  => { e.target.style.borderColor = "rgba(56,189,248,0.12)"; }}
            />
          </div>

          {/* Job Grid */}
          {loading ? (
            <div style={{ textAlign:"center", padding:"4rem 0", color:"#64748b", fontSize:14 }}>
              Loading jobs…
            </div>
          ) : (
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",
              gap:"16px",
            }}>
              {filtered.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={handleApply}
                  applying={applyingId === job.id}
                  isAuthed={!!user}
                  onToggleSave={handleToggleSave}
                  savingId={savingId === job.id}
                />
              ))}
            </div>
          )}

          {error && (
            <div style={{ marginTop:16, fontSize:13, color:"#fca5a5" }}>{error}</div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{
              textAlign:"center", padding:"5rem 2rem",
              background:"rgba(15,23,42,0.5)", borderRadius:18,
              border:"1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0", marginBottom:6 }}>No jobs found</div>
              <div style={{ fontSize:13, color:"#64748b" }}>Try adjusting your filters or search query</div>
            </div>
          )}
        </main>
      </div>

      {/* ── CTA Banner ── */}
      <div style={{ padding:"48px 24px 64px", maxWidth:1280, margin:"0 auto" }}>
        <section style={{
          position:"relative", overflow:"hidden",
          background:"linear-gradient(135deg, rgba(14,165,233,0.14), rgba(99,102,241,0.14))",
          border:"1px solid rgba(14,165,233,0.22)",
          borderRadius:22, padding:"44px 36px",
          display:"flex", alignItems:"center",
          justifyContent:"space-between", gap:40,
        }}>
          <div style={{
            position:"absolute", top:"-50%", left:"-10%",
            width:"40%", height:"200%",
            background:"radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 60%)",
            pointerEvents:"none",
          }} />
          <div>
            <h2 style={{ fontSize:28, fontWeight:700, color:"#f8fafc", maxWidth:520, lineHeight:1.25, marginBottom:10, letterSpacing:"-0.4px" }}>
              Join 10,000+ students already using Campus Hire
            </h2>
            <p style={{ fontSize:15, color:"#dbeafe", margin:0 }}>Plan, apply and get placed — all in one platform.</p>
          </div>
          <button
            className="jl-cta-btn"
            onClick={() => onNavigate && onNavigate(user ? "profile" : "register")}
            style={{
            background:"linear-gradient(135deg,#0ea5e9,#6366f1)",
            color:"#fff", border:"none", borderRadius:10,
            padding:"15px 30px", fontSize:15, fontWeight:700,
            cursor:"pointer", whiteSpace:"nowrap",
            boxShadow:"0 4px 20px rgba(14,165,233,0.3)",
            position:"relative", zIndex:1,
            transition:"all 0.25s ease",
          }}>
            {user ? "Update your profile" : "Create your free account"}
          </button>
        </section>
      </div>
    </div>
  );
}