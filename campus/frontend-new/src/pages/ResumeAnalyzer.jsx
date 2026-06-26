import { useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import * as api from "../api";

function ScoreRing({ value = 0 }) {
  const r = 58, circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 75 ? "#22c55e" : value >= 50 ? "#fbbf24" : "#f87171";
  return (
    <svg width="148" height="148" viewBox="0 0 148 148">
      <circle cx="74" cy="74" r={r} fill="none" stroke="#1e1b4b" strokeWidth="12" />
      <circle
        cx="74" cy="74" r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 74 74)" style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="74" y="70" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="700">{value}</text>
      <text x="74" y="92" textAnchor="middle" fill="#94a3b8" fontSize="12">ATS score</text>
    </svg>
  );
}

export default function ResumeAnalyzer({ onNavigate }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.resume_text) setResumeText(user.resume_text);
  }, [user]);

  useEffect(() => {
    api.fetchJobs({}).then(setJobs).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setFileName(file.name);
    setResumeText(""); // file takes precedence over pasted text
  };

  const clearFile = () => {
    setPendingFile(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    setError("");
    if (!pendingFile && !resumeText.trim()) {
      setError("Paste your resume text or upload a .pdf/.txt file first.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.analyzeResume({
        text: pendingFile ? "" : resumeText,
        file: pendingFile,
        jobId: jobId || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not analyze your resume.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <p style={{ marginBottom: 16 }}>Please sign in to analyze your resume.</p>
          <button style={s.linkBtn} onClick={() => onNavigate && onNavigate("login")}>Sign in →</button>
        </div>
      </div>
    );
  }

  if (user.role !== "student") {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>Resume analysis is available for student accounts.</div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.content}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={s.title}>AI Resume Analysis</h1>
          <p style={s.subtitle}>
            Instant ATS scoring, keyword optimization and section-level feedback — tailored to a specific job if you pick one.
          </p>
        </div>

        <div style={s.twoCol}>
          {/* LEFT: input form */}
          <div style={{ flex: 1, minWidth: 320, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={s.card}>
              <div style={s.cardTitle}>1. Paste or upload your resume</div>
              <textarea
                value={resumeText}
                onChange={(e) => { setResumeText(e.target.value); if (pendingFile) clearFile(); }}
                placeholder="Paste your resume text here…"
                style={s.textarea}
                disabled={!!pendingFile}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="resume-file-input"
                />
                <label htmlFor="resume-file-input" style={s.uploadBtn}>📎 Upload .pdf / .txt instead</label>
                {fileName && (
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>
                    {fileName} <span style={{ color: "#f87171", cursor: "pointer" }} onClick={clearFile}>✕</span>
                  </span>
                )}
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardTitle}>2. Target a specific job (optional)</div>
              <select value={jobId} onChange={(e) => setJobId(e.target.value)} style={s.select}>
                <option value="">General — check against your own skill profile</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} @ {j.company}</option>
                ))}
              </select>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <button style={s.analyzeBtn} onClick={handleAnalyze} disabled={loading}>
              {loading ? "Analyzing…" : "Analyze Resume →"}
            </button>
          </div>

          {/* RIGHT: results */}
          <div style={{ flex: 1, minWidth: 320 }}>
            {!result && (
              <div style={{ ...s.card, textAlign: "center", color: "#64748b", padding: "60px 24px" }}>
                Your ATS score, section feedback and keyword gaps will show up here.
              </div>
            )}

            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ ...s.card, display: "flex", alignItems: "center", gap: 28 }}>
                  <ScoreRing value={result.overall_score} />
                  <div>
                    <div style={s.cardTitle}>
                      {result.target_job ? `vs. ${result.target_job.title} @ ${result.target_job.company}` : "General profile check"}
                    </div>
                    <div style={s.cardSub}>{result.word_count} words analyzed</div>
                  </div>
                </div>

                <div style={s.card}>
                  <div style={{ ...s.cardTitle, marginBottom: 12 }}>Section checklist</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.section_feedback.map((sf) => (
                      <div key={sf.section} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: sf.present ? "#22c55e" : "#f87171", fontSize: 14, marginTop: 1 }}>
                          {sf.present ? "✓" : "✕"}
                        </span>
                        <div>
                          <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{sf.section}</div>
                          <div style={{ color: "#94a3b8", fontSize: 12 }}>{sf.feedback}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={s.card}>
                  <div style={{ ...s.cardTitle, marginBottom: 12 }}>Keyword match</div>
                  {result.matched_keywords.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>Found in your resume</div>
                      <div style={s.chipRow}>
                        {result.matched_keywords.map((k) => (
                          <span key={k} style={{ ...s.chip, color: "#22c55e", borderColor: "rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.1)" }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.missing_keywords.length > 0 && (
                    <div>
                      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>Missing</div>
                      <div style={s.chipRow}>
                        {result.missing_keywords.map((k) => (
                          <span key={k} style={{ ...s.chip, color: "#fbbf24", borderColor: "rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.1)" }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.matched_keywords.length === 0 && result.missing_keywords.length === 0 && (
                    <div style={{ color: "#64748b", fontSize: 13 }}>Add skills to your profile to enable keyword matching.</div>
                  )}
                </div>

                <div style={s.card}>
                  <div style={{ ...s.cardTitle, marginBottom: 12 }}>Suggestions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.suggestions.map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "#38bdf8", fontSize: 14, lineHeight: "20px" }}>→</span>
                        <span style={{ color: "#cbd5e1", fontSize: 13, lineHeight: "20px" }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
  content: { position: "relative", maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" },
  title: { fontSize: 32, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  subtitle: { color: "#94a3b8", marginTop: 8, fontSize: 15, maxWidth: 640 },
  twoCol: { display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" },
  card: { background: "rgba(15,23,42,0.92)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 20, padding: "22px 24px", backdropFilter: "blur(12px)" },
  cardTitle: { color: "#f1f5f9", fontWeight: 700, fontSize: 15 },
  cardSub: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  textarea: {
    width: "100%", minHeight: 220, marginTop: 12, background: "rgba(5,8,20,0.6)",
    border: "1px solid rgba(148,163,184,0.18)", borderRadius: 12, color: "#e2e8f0",
    fontSize: 13, padding: 14, resize: "vertical", fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box",
  },
  uploadBtn: {
    cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 600,
    border: "1px solid rgba(56,189,248,0.3)", borderRadius: 10, padding: "8px 14px",
  },
  select: {
    width: "100%", marginTop: 12, background: "rgba(5,8,20,0.6)",
    border: "1px solid rgba(148,163,184,0.18)", borderRadius: 10, color: "#e2e8f0",
    fontSize: 13, padding: "10px 12px", boxSizing: "border-box",
  },
  errorBox: {
    padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 13,
  },
  analyzeBtn: {
    padding: "14px 0", background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", boxShadow: "0 12px 28px rgba(14,165,233,0.28)",
  },
  linkBtn: { background: "none", border: "none", color: "#38bdf8", fontSize: 14, cursor: "pointer", fontWeight: 600 },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, border: "1px solid" },
};
