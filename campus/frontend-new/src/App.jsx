import { useState, useEffect } from "react";
import Navbar from "./pages/Navbar";
import Home from "./pages/Home";
import JobListings from "./pages/Jobs";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/profile";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import Applications from "./pages/Applications";
import Companies from "./pages/Companies";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import MockInterview from "./pages/MockInterview";
import AdminDashboard from "./pages/AdminDashboard";
import Footer from "./components/Footer";
import { useAuth } from "./AuthContext";

function GlobalStyles() {
  useEffect(() => {
    const id = "app-global-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

      @keyframes fadeInUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-32px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes fadeInRight { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
      @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      @keyframes pulseDot { 0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.5); } 50% { box-shadow: 0 0 0 8px rgba(52,211,153,0); } }
      @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      @keyframes progressGrow { from { width: 0%; } to { width: 87%; } }
      @keyframes countBadge { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }

      body { margin: 0; min-height: 100vh; background: #050814; color: #e2e8f0; font-family: 'Inter', sans-serif; }
      .btn-primary-hover:hover { transform: translateY(-2px) scale(1.02) !important; box-shadow: 0 8px 30px rgba(14,165,233,0.45) !important; }
      .btn-sec-hover:hover { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.25) !important; }
      .apply-btn-hover:hover { background: rgba(14,165,233,0.3) !important; }
      .cta-btn-hover:hover { transform: translateY(-2px) scale(1.02) !important; box-shadow: 0 10px 36px rgba(14,165,233,0.45) !important; }
      .nav-link-hover:hover { color: #f1f5f9 !important; }
      .footer-link-hover:hover { color: #94a3b8 !important; }
      .soc-icon-hover:hover { background: rgba(56,189,248,0.1) !important; border-color: rgba(56,189,248,0.3) !important; color: #38bdf8 !important; }
      .progress-animated { animation: progressGrow 1.6s 0.6s cubic-bezier(0.22,1,0.36,1) both; }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}

function App() {
  const [page, setPage] = useState("home");
  const { user, logout, loading } = useAuth();

  const navigate = (target) => {
    const protectedPages = ["dashboard", "profile", "resume", "applications", "mockinterview", "recruiter", "admin"];
    if (protectedPages.includes(target) && !user && !loading) {
      setPage("login");
      return;
    }
    setPage(target);
  };

  const handleAuthed = (authedUser) => {
    if (authedUser?.is_staff || authedUser?.is_superuser) setPage("admin");
    else setPage(authedUser?.role === "recruiter" ? "recruiter" : "dashboard");
  };

  const handleLogout = () => {
    logout();
    setPage("home");
  };

  return (
    <>
      <GlobalStyles />
      <Navbar
        currentPage={page}
        onNavigate={navigate}
        user={user}
        onLogout={handleLogout}
      />
      {page === "jobs" && <JobListings currentPage={page} onNavigate={navigate} />}
      {page === "dashboard" && <Dashboard currentPage={page} onNavigate={navigate} />}
      {page === "analytics" && <Analytics currentPage={page} onNavigate={navigate} />}
      {page === "home" && <Home currentPage={page} onNavigate={navigate} />}
      {page === "login" && <Login onNavigate={navigate} onSuccess={handleAuthed} />}
      {page === "register" && <Register onNavigate={navigate} onSuccess={handleAuthed} />}
      {page === "profile" && <Profile currentPage={page} onNavigate={navigate} />}
      {page === "resume" && <ResumeAnalyzer currentPage={page} onNavigate={navigate} />}
      {page === "applications" && <Applications currentPage={page} onNavigate={navigate} />}
      {page === "companies" && <Companies currentPage={page} onNavigate={navigate} />}
      {page === "recruiter" && <RecruiterDashboard currentPage={page} onNavigate={navigate} />}
      {page === "mockinterview" && <MockInterview currentPage={page} onNavigate={navigate} />}
      {page === "admin" && <AdminDashboard currentPage={page} onNavigate={navigate} />}
      <Footer onNavigate={navigate} />
    </>
  );
}

export default App;