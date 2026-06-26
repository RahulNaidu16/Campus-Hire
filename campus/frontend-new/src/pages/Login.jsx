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
      @keyframes gradientShift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .sp-input:focus { outline: none; border-color: rgba(139,92,246,0.6) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }
      .sp-btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
      .sp-btn-social:hover { background: rgba(255,255,255,0.08) !important; }
      .sp-nav-link:hover { color: #f1f5f9 !important; }
      .sp-theme-toggle:hover { background: rgba(255,255,255,0.08) !important; }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}

export default function Login({ onNavigate, onSuccess }) {
  const { login } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      if (onSuccess) onSuccess(loggedInUser);
      else if (onNavigate) onNavigate("dashboard");
    } catch (err) {
      setError(err.message || "Could not sign in. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
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
        background: "transparent",
      }}>
        {/* Left panel */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "60px 48px",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(14,165,233,0.15)",
            borderRadius: 24, padding: "44px 40px",
            maxWidth: 460, width: "100%",
            boxShadow: "0 20px 50px rgba(8,13,33,0.35)",
          }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(79,70,229,0.25))",
                border: "1px solid rgba(139,92,246,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.4px" }}>Welcome back</h1>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Enter your details to continue.</p>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 7 }}>Email</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input
                  className="sp-input"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "11px 14px 11px 38px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 10, color: "#e2e8f0", fontSize: 14,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 7 }}>Password</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  className="sp-input"
                  type={showPwd ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "11px 40px 11px 38px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 10, color: "#e2e8f0", fontSize: 14,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
                <button
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 0, color: "#64748b",
                  }}
                >
                  {showPwd ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{ accentColor: "#7c3aed", width: 15, height: 15 }}
                />
                Remember me
              </label>
              <span style={{ fontSize: 13, color: "#7c3aed", cursor: "pointer", fontWeight: 500 }}>Forgot password?</span>
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

            {/* Sign in btn */}
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
              {submitting ? "Signing in..." : "Sign in"}
            </button>

            {/* OR divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: 12, color: "#475569" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* Social buttons */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <button className="sp-btn-social" style={{
                flex: 1, padding: "10px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0", fontSize: 14, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.15s", fontFamily: "'Inter', sans-serif",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>
              <button className="sp-btn-social" style={{
                flex: 1, padding: "10px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0", fontSize: 14, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.15s", fontFamily: "'Inter', sans-serif",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: "#475569", margin: 0 }}>
              Don't have an account?{" "}
              <span
                onClick={() => onNavigate && onNavigate("register")}
                style={{ color: "#a78bfa", cursor: "pointer", fontWeight: 500 }}
              >
                Sign up
              </span>
            </p>
            <p style={{ textAlign: "center", fontSize: 12, color: "#3f4a5e", marginTop: 14, marginBottom: 0 }}>
              Demo account: aarav@university.edu / Campus@123
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          width: 420, flexShrink: 0,
          background: "rgba(255,255,255,0.015)",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 48,
        }}>
          <div>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.16))",
              border: "1px solid rgba(14,165,233,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 28,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#f8fafc", lineHeight: 1.3, marginBottom: 16, letterSpacing: "-0.5px" }}>
              Welcome back, ready to land your next offer?
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
              Pick up where you left off — your applications, interviews and resume insights are waiting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}