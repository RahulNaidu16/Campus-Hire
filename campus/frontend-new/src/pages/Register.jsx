import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";

function GlobalStyles() {
  useEffect(() => {
    const id = "sp-auth-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      .sp-input:focus { outline: none; border-color: rgba(139,92,246,0.6) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }
      .sp-btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
      .sp-role-card:hover { border-color: rgba(139,92,246,0.4) !important; }
      .sp-nav-link:hover { color: #f1f5f9 !important; }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}

const STATS = [
  { value: "10k+", label: "students" },
  { value: "500+", label: "companies" },
  { value: "95%",  label: "success" },
  { value: "4.5k", label: "offers" },
];

export default function Register({ onNavigate, onSuccess }) {
  const { register } = useAuth();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", university: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.firstName || !form.email || !form.password) {
      setError("Please fill in your name, email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const newUser = await register({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email.trim(),
        password: form.password,
        role,
        university: role === "student" ? form.university : "",
        company_name: role === "recruiter" ? form.university : "",
      });
      if (onSuccess) onSuccess(newUser);
      else if (onNavigate) onNavigate("dashboard");
    } catch (err) {
      setError(err.message || "Could not create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "11px 14px 11px 38px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10, color: "#e2e8f0", fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "'Inter', sans-serif",
  };

  const iconWrap = {
    position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(circle at 20% 20%, rgba(56,189,248,0.18), transparent 25%),
                   radial-gradient(circle at 82% 14%, rgba(124,58,237,0.16), transparent 30%),
                   radial-gradient(circle at 50% 88%, rgba(168,85,247,0.08), transparent 24%),
                   linear-gradient(180deg, rgba(4,6,20,0.95) 0%, rgba(5,8,20,0.98) 100%)`,
      fontFamily: "'Inter', sans-serif",
      color: "#e2e8f0",
    }}>
      <GlobalStyles />

      <div style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex", alignItems: "stretch",
        background: "radial-gradient(ellipse at 10% 60%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 45%)",
      }}>
        {/* Left — form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 48px" }}>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(14,165,233,0.15)",
            borderRadius: 24, padding: "44px 40px",
            maxWidth: 480, width: "100%",
            boxShadow: "0 20px 50px rgba(8,13,33,0.35)",
          }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.4px" }}>Create account</h1>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 28px" }}>Start your placement journey in 30 seconds.</p>

            {/* First + Last */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 7 }}>First name</label>
                <div style={{ position: "relative" }}>
                  <div style={iconWrap}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <input className="sp-input" type="text" placeholder="Aarav" value={form.firstName} onChange={set("firstName")} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 7 }}>Last name</label>
                <div style={{ position: "relative" }}>
                  <div style={iconWrap}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <input className="sp-input" type="text" placeholder="Sharma" value={form.lastName} onChange={set("lastName")} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 7 }}>Email</label>
              <div style={{ position: "relative" }}>
                <div style={iconWrap}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input className="sp-input" type="email" placeholder="you@university.edu" value={form.email} onChange={set("email")} style={inputStyle} />
              </div>
            </div>

            {/* University / Company label adapts to role */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 7 }}>
                {role === "recruiter" ? "Company name" : "University and branch"}
              </label>
              <div style={{ position: "relative" }}>
                <div style={iconWrap}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <input className="sp-input" type="text" placeholder={role === "recruiter" ? "Google" : "IIT Delhi"} value={form.university} onChange={set("university")} style={inputStyle} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 7 }}>Password</label>
              <div style={{ position: "relative" }}>
                <div style={iconWrap}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input className="sp-input" type="password" placeholder="Password" value={form.password} onChange={set("password")} style={inputStyle} />
              </div>
            </div>

            {/* Role selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { id: "student",   label: "Student",   sub: "Apply for jobs" },
                { id: "recruiter", label: "Recruiter", sub: "Hire talent" },
              ].map(r => (
                <button
                  key={r.id}
                  className="sp-role-card"
                  onClick={() => setRole(r.id)}
                  style={{
                    padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                    background: role === r.id ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${role === r.id ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"}`,
                    transition: "border-color 0.15s, background 0.15s",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: role === r.id ? "#a78bfa" : "#cbd5e1", marginBottom: 3 }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{r.sub}</div>
                </button>
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                marginBottom: 16, padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="sp-btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%", padding: "14px 0",
                background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                border: "none", borderRadius: 14, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: submitting ? "default" : "pointer",
                opacity: submitting ? 0.7 : 1,
                marginBottom: 20, transition: "opacity 0.2s, transform 0.2s",
                fontFamily: "'Inter', sans-serif",
                boxShadow: "0 12px 28px rgba(14,165,233,0.28)",
              }}
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "#475569", margin: 0 }}>
              Already have an account?{" "}
              <span
                onClick={() => onNavigate && onNavigate("login")}
                style={{ color: "#a78bfa", cursor: "pointer", fontWeight: 500 }}
              >
                Sign in
              </span>
            </p>
          </div>
        </div>

        {/* Right — stats */}
        <div style={{
          width: 380, flexShrink: 0,
          background: "rgba(14,165,233,0.05)",
          borderLeft: "1px solid rgba(14,165,233,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 48,
        }}>
          <div style={{ width: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              {STATS.map(s => (
                <div key={s.label} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, padding: "22px 18px",
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#a78bfa", marginBottom: 4, letterSpacing: "-0.5px" }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0 }}>
              From resume to offer, every step is clear and beautifully designed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}