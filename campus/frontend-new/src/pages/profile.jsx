import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import * as api from "../api";

const BRANCHES = [
  { value: "CSE", label: "Computer Science" },
  { value: "IT", label: "Information Technology" },
  { value: "ECE", label: "Electronics & Communication" },
  { value: "EEE", label: "Electrical & Electronics" },
  { value: "MECH", label: "Mechanical" },
  { value: "CIVIL", label: "Civil" },
];

export default function Profile({ onNavigate }) {
  const { user, updateProfile } = useAuth();
  const isDark = true;

  const [skills, setSkills] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [profile, setProfile] = useState({
    university: "", branch: "", cgpa: "", bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setSkills((user.skills || []).map(s => ({ name: s.name, level: s.level })));
      setProfile({
        university: user.university || "",
        branch: user.branch || "",
        cgpa: user.cgpa || "",
        bio: user.bio || "",
      });
    }
    api.fetchSkillsCatalog().then(setCatalog).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
        Loading your profile…
      </div>
    );
  }

  const addSkill = () => {
    const name = newSkill.trim();
    if (!name) return;
    if (skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      setNewSkill("");
      return;
    }
    setSkills([...skills, { name, level: 70 }]);
    setNewSkill("");
  };

  const updateLevel = (name, level) => {
    setSkills(skills.map(s => (s.name === name ? { ...s, level } : s)));
  };

  const removeSkill = (name) => {
    setSkills(skills.filter(s => s.name !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateProfile({
        university: profile.university,
        branch: profile.branch,
        cgpa: profile.cgpa === "" ? 0 : parseFloat(profile.cgpa),
        bio: profile.bio,
        skills: skills.map(s => ({ name: s.name, level: s.level })),
      });
      setMessage("Profile updated — your job recommendations have been refreshed!");
    } catch (err) {
      setMessage(err.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const bg = isDark ? "#050814" : "#f8fafc";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15,23,42,0.08)";
  const text = isDark ? "#e2e8f0" : "#0f172a";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "10px 12px",
    background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(15,23,42,0.1)",
    borderRadius: 10, color: text, fontSize: 14, fontFamily: "'Inter', sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'Inter', sans-serif", padding: "48px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>Your profile</h1>
        <p style={{ color: subText, margin: "0 0 32px", fontSize: 14 }}>
          Keep your skills up to date — our ML recommendation engine uses them to rank the best-fit jobs for you.
        </p>

        {/* Basic info card */}
        <div style={{ background: cardBg, border, borderRadius: 18, padding: 28, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, color: "#fff",
            }}>
              {(user.first_name || user.username)[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{user.full_name}</div>
              <div style={{ fontSize: 13, color: subText }}>{user.email} · {user.role}</div>
            </div>
          </div>

          {user.role === "student" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: subText, display: "block", marginBottom: 6 }}>University</label>
                <input style={inputStyle} value={profile.university} onChange={e => setProfile(p => ({ ...p, university: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: subText, display: "block", marginBottom: 6 }}>Branch</label>
                <select style={inputStyle} value={profile.branch} onChange={e => setProfile(p => ({ ...p, branch: e.target.value }))}>
                  <option value="">Select branch</option>
                  {BRANCHES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: subText, display: "block", marginBottom: 6 }}>CGPA</label>
                <input style={inputStyle} type="number" step="0.1" min="0" max="10" value={profile.cgpa} onChange={e => setProfile(p => ({ ...p, cgpa: e.target.value }))} />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: subText, display: "block", marginBottom: 6 }}>Bio</label>
            <textarea
              style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              placeholder="A short summary about you..."
            />
          </div>
        </div>

        {/* Skills card */}
        {user.role === "student" && (
          <div style={{ background: cardBg, border, borderRadius: 18, padding: 28, marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Skills & proficiency</div>
            <div style={{ fontSize: 13, color: subText, marginBottom: 20 }}>
              Drag the sliders to reflect your real proficiency — higher-weighted skills count more in your match score.
            </div>

            {skills.length === 0 && (
              <div style={{ fontSize: 13, color: subText, marginBottom: 16 }}>
                You haven't added any skills yet. Add a few below to start getting personalized job matches.
              </div>
            )}

            {skills.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 130, fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <input
                  type="range" min="10" max="100" value={s.level}
                  onChange={e => updateLevel(s.name, parseInt(e.target.value, 10))}
                  style={{ flex: 1, accentColor: "#0ea5e9" }}
                />
                <div style={{ width: 40, fontSize: 13, color: subText, textAlign: "right" }}>{s.level}%</div>
                <button
                  onClick={() => removeSkill(s.name)}
                  style={{
                    background: "transparent", border: "none", color: "#f87171",
                    cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 4px",
                  }}
                  title="Remove skill"
                >
                  ×
                </button>
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <input
                list="skills-catalog"
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Add a skill (e.g. React, Python, AWS)"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              />
              <datalist id="skills-catalog">
                {catalog.map(s => <option key={s.id} value={s.name} />)}
              </datalist>
              <button
                onClick={addSkill}
                style={{
                  padding: "10px 18px", borderRadius: 10, border: "none",
                  background: "rgba(14,165,233,0.18)", color: "#38bdf8",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                + Add
              </button>
            </div>
          </div>
        )}

        {/* Resume card */}
        {user.role === "student" && (
          <div style={{ background: cardBg, border, borderRadius: 18, padding: 28, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📄 Resume</div>
                <div style={{ fontSize: 13, color: subText, marginBottom: 10 }}>
                  Upload or paste your resume to get an instant ATS score, section feedback, and keyword gaps.
                </div>
                {user.resume_text ? (
                  <div style={{
                    fontSize: 12.5, color: subText, background: isDark ? "rgba(255,255,255,0.03)" : "#f1f5f9",
                    border, borderRadius: 10, padding: "10px 12px", maxHeight: 60, overflow: "hidden",
                  }}>
                    {user.resume_text.slice(0, 160)}{user.resume_text.length > 160 ? "…" : ""}
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: subText, fontStyle: "italic" }}>No resume on file yet.</div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => onNavigate && onNavigate("resume")}
                  style={{
                    padding: "10px 18px", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                  }}
                >
                  {user.resume_text ? "Manage & Re-analyze →" : "Upload & Analyze →"}
                </button>
                {user.has_resume_file && (
                  <button
                    onClick={() => api.downloadResumeFile(user.id, user.resume_file_name).catch(() => {})}
                    style={{
                      padding: "8px 18px", borderRadius: 10, border, background: "transparent",
                      color: subText, fontWeight: 600, fontSize: 12.5, cursor: "pointer",
                    }}
                  >
                    ⬇ Download {user.resume_file_name}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {message && (
          <div style={{
            marginBottom: 16, padding: "12px 16px", borderRadius: 10,
            background: message.includes("refreshed") ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${message.includes("refreshed") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: message.includes("refreshed") ? "#86efac" : "#fca5a5", fontSize: 13,
          }}>
            {message}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "12px 28px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {user.role === "student" && (
            <button
              onClick={() => onNavigate && onNavigate("dashboard")}
              style={{
                padding: "12px 28px", borderRadius: 12,
                border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(15,23,42,0.12)",
                background: "transparent", color: text, fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              View dashboard →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
