import { useState, useEffect, useRef } from "react";

// ── Global keyframe injector ──────────────────────────────────────────────────
function GlobalStyles() {
  useEffect(() => {
    const id = "ch-global-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(32px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeInLeft {
        from { opacity: 0; transform: translateX(-32px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes fadeInRight {
        from { opacity: 0; transform: translateX(32px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-12px); }
      }
      @keyframes shimmer {
        0%   { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes pulseDot {
        0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.5); }
        50%       { box-shadow: 0 0 0 8px rgba(52,211,153,0); }
      }
      @keyframes marquee {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @keyframes gradientShift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.92); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes progressGrow {
        from { width: 0%; }
        to   { width: 87%; }
      }
      @keyframes countBadge {
        0%   { transform: scale(1); }
        50%  { transform: scale(1.08); }
        100% { transform: scale(1); }
      }

      .ch-reveal {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1),
                    transform 0.7s cubic-bezier(0.22,1,0.36,1);
      }
      .ch-reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }
      .ch-reveal-left {
        opacity: 0;
        transform: translateX(-28px);
        transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1),
                    transform 0.7s cubic-bezier(0.22,1,0.36,1);
      }
      .ch-reveal-left.visible {
        opacity: 1;
        transform: translateX(0);
      }
      .ch-reveal-right {
        opacity: 0;
        transform: translateX(28px);
        transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1),
                    transform 0.7s cubic-bezier(0.22,1,0.36,1);
      }
      .ch-reveal-right.visible {
        opacity: 1;
        transform: translateX(0);
      }

      .feat-card:hover {
        transform: translateY(-6px) !important;
        border-color: rgba(56,189,248,0.35) !important;
        box-shadow: 0 20px 60px rgba(14,165,233,0.12) !important;
      }
      .step-card:hover {
        transform: translateY(-4px) !important;
        border-color: rgba(56,189,248,0.3) !important;
      }
      .comp-card:hover {
        transform: translateY(-4px) scale(1.03) !important;
        border-color: rgba(56,189,248,0.3) !important;
        box-shadow: 0 12px 40px rgba(14,165,233,0.1) !important;
      }
      .test-card:hover {
        transform: translateY(-4px) !important;
        border-color: rgba(56,189,248,0.25) !important;
      }
      .btn-primary-hover:hover {
        transform: translateY(-2px) scale(1.02) !important;
        box-shadow: 0 8px 30px rgba(14,165,233,0.45) !important;
      }
      .btn-sec-hover:hover {
        background: rgba(255,255,255,0.1) !important;
        border-color: rgba(255,255,255,0.25) !important;
      }
      .apply-btn-hover:hover {
        background: rgba(14,165,233,0.3) !important;
      }
      .cta-btn-hover:hover {
        transform: translateY(-2px) scale(1.02) !important;
        box-shadow: 0 10px 36px rgba(14,165,233,0.45) !important;
      }
      .nav-link-hover:hover {
        color: #f1f5f9 !important;
      }
      .footer-link-hover:hover {
        color: #94a3b8 !important;
      }
      .soc-icon-hover:hover {
        background: rgba(56,189,248,0.1) !important;
        border-color: rgba(56,189,248,0.3) !important;
        color: #38bdf8 !important;
      }
      .progress-animated {
        animation: progressGrow 1.6s 0.6s cubic-bezier(0.22,1,0.36,1) both;
      }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

// ── Staggered children reveal ─────────────────────────────────────────────────
function useStaggerReveal(count, threshold = 0.1) {
  const ref = useRef(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const children = container.querySelectorAll(".stagger-child");
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          children.forEach((child, i) => {
            setTimeout(() => child.classList.add("visible"), i * 100);
          });
          obs.unobserve(e.target);
        }
      },
      { threshold }
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, [count]);
  return ref;
}

// ── Animated counter ──────────────────────────────────────────────────────────
function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const ease = (t) => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(ease(progress) * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ── Stats section ─────────────────────────────────────────────────────────────
function StatsSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const students   = useCountUp(10000, 2200, visible);
  const companies  = useCountUp(500,   2000, visible);
  const placements = useCountUp(4500,  2100, visible);
  const rate       = useCountUp(95,    1800, visible);
  const stats = [
    { value: students,   suffix: "+", label: "Students Enrolled" },
    { value: companies,  suffix: "+", label: "Hiring Partners" },
    { value: placements, suffix: "+", label: "Placements Made" },
    { value: rate,       suffix: "%", label: "Success Rate" },
  ];
  return (
    <div ref={ref} style={S.statsGrid}>
      {stats.map((s, i) => (
        <div key={s.label} style={{ ...S.statItem, transitionDelay: `${i * 120}ms`, ...(visible ? { opacity: 1, transform: "translateY(0)" } : { opacity: 0, transform: "translateY(20px)" }), transition: "opacity 0.6s ease, transform 0.6s ease" }}>
          <span style={S.statValue}>{s.value.toLocaleString()}{s.suffix}</span>
          <span style={S.statLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Marquee recruiter strip ───────────────────────────────────────────────────
function RecruiterMarquee({ companies }) {
  const doubled = [...companies, ...companies];
  return (
    <div style={{ overflow: "hidden", width: "100%", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 80, height: "100%", background: "linear-gradient(to right, #050814, transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 0, width: 80, height: "100%", background: "linear-gradient(to left, #050814, transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ display: "flex", gap: 14, animation: "marquee 28s linear infinite", width: "max-content" }}>
        {doubled.map((c, i) => (
          <div key={i} className="comp-card" style={S.companyCard}>
            <div style={{ ...S.companyLogo, background: c.color }}>{c.letter}</div>
            <span style={S.companyName}>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Home({ currentPage = "home", onNavigate }) {
  const companies = [
    { letter: "G", name: "Google",    color: "#4285F4" },
    { letter: "M", name: "Microsoft", color: "#00A4EF" },
    { letter: "A", name: "Amazon",    color: "#FF9900" },
    { letter: "I", name: "Infosys",   color: "#007CC2" },
    { letter: "T", name: "TCS",       color: "#6B4FBB" },
    { letter: "A", name: "Accenture", color: "#A100FF" },
    { letter: "D", name: "Deloitte",  color: "#86BC25" },
    { letter: "W", name: "Wipro",     color: "#E31837" },
    { letter: "F", name: "Flipkart",  color: "#F74F00" },
    { letter: "Z", name: "Zoho",      color: "#E42527" },
  ];

  const features = [
    { icon: "📄", title: "AI Resume Analysis",   desc: "Instant ATS scoring, keyword optimization and section-level feedback tailored to each job.", page: "resume" },
    { icon: "🎯", title: "Smart Job Matching",   desc: "Personalized recommendations based on your skills, CGPA and career interests.", page: "jobs" },
    { icon: "📊", title: "Placement Prediction", desc: "ML-driven placement probability scores with concrete improvement steps.", page: "dashboard" },
    { icon: "✅", title: "Application Tracking", desc: "Track every stage — applied, shortlisted, interview, offer — in one unified view.", page: "applications" },
    { icon: "📈", title: "Analytics Dashboard",  desc: "Department, recruiter and trend analytics for students and placement admins.", page: "analytics" },
    { icon: "⚡", title: "Skill Gap Detection",  desc: "Pinpoint missing skills for target roles with curated learning paths.", page: "dashboard" },
  ];

  const steps = [
    { num: "01", title: "Build your profile",   desc: "Add education, skills, projects & certifications." },
    { num: "02", title: "AI resume review",     desc: "Optimize your resume for ATS and recruiter scans." },
    { num: "03", title: "Apply with one click", desc: "Discover matched jobs and apply instantly." },
    { num: "04", title: "Track & prepare",      desc: "Monitor progress and prep with AI-driven insights." },
    { num: "05", title: "Get placed",           desc: "Land offers and celebrate your next chapter.", icon: "🎓" },
  ];

  const testimonials = [
    { text: "Campus Hire helped me track 40+ applications and land my dream offer. The AI resume feedback was genuinely game-changing.", name: "Priya S.", role: "SDE @ Google" },
    { text: "The placement prediction was eerily accurate. I knew exactly which skills to focus on before final placements.", name: "Rohan M.", role: "PM @ Microsoft" },
    { text: "Cleanest placement platform I've used. The analytics dashboard kept me motivated throughout the whole process.", name: "Ananya K.", role: "Analyst @ Deloitte" },
    { text: "From resume to selection — every step was clear and beautifully designed. I'd recommend it to every student.", name: "Vikram T.", role: "Engineer @ Amazon" },
  ];

  const featRef   = useStaggerReveal(6);
  const stepsRef  = useStaggerReveal(5);
  const testRef   = useStaggerReveal(4);
  const recruiterRef = useReveal(0.1);
  const statsRef  = useReveal(0.2);
  const ctaRef    = useReveal(0.2);

  return (
    <div style={S.page}>
      <GlobalStyles />

      {/* ── HERO ── */}
      <section style={S.hero}>
        <div style={S.heroBg} />
        {/* Floating orbs */}
        <div style={S.orb1} />
        <div style={S.orb2} />
        <div style={S.heroContent}>
          {/* LEFT */}
          <div style={{ ...S.heroLeft, animation: "fadeInLeft 0.9s cubic-bezier(0.22,1,0.36,1) both" }}>
            <div style={S.trustBadge}>
              🎓 &nbsp;Trusted by 50+ universities across India
            </div>
            <h1 style={S.heroTitle}>
              Launch Your<br />
              <span style={S.heroGradient}>Dream Career</span>
            </h1>
            <p style={S.heroSubtitle}>
              The AI-powered placement portal connecting students to top recruiters
              with smart matching, resume insights and placement prediction.
            </p>
            <div style={S.heroCtas}>
              <button
              className="btn-primary-hover"
              style={{ ...S.btnPrimary, transition: "all 0.25s ease" }}
              onClick={() => onNavigate && onNavigate("register")}
            >
                Get started free →
              </button>
              <button
                className="btn-sec-hover"
                style={{ ...S.btnSecondary, transition: "all 0.25s ease" }}
                onClick={() => onNavigate && onNavigate("jobs")}
              >
                Browse jobs
              </button>
            </div>
            <div style={S.socialProof}>
              <div style={S.avatarRow}>
                {["AS", "PM", "RV", "AK"].map((a) => (
                  <div key={a} style={S.avatar}>{a}</div>
                ))}
              </div>
              <div>
                <div style={S.stars}>★★★★★</div>
                <div style={S.socialText}>10,000+ students placed</div>
              </div>
            </div>
          </div>

          {/* RIGHT — floating dashboard card */}
          <div style={{ ...S.heroRight, animation: "fadeInRight 1s 0.15s cubic-bezier(0.22,1,0.36,1) both" }}>
            <div style={{ ...S.placementCard, animation: "fadeInRight 1s 0.15s cubic-bezier(0.22,1,0.36,1) both, float 5s 1.5s ease-in-out infinite" }}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Placement Dashboard</span>
                <span style={{ ...S.cardBadge, animation: "countBadge 2s 2s ease-in-out 3" }}>↑ +12% this month</span>
              </div>
              <div style={S.metricsRow}>
                {[["Applications","32"], ["Interviews","8"], ["Offers","2"]].map(([l, v]) => (
                  <div key={l} style={S.metric}>
                    <div style={S.metricValue}>{v}</div>
                    <div style={S.metricLabel}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={S.resumeRow}>
                <span style={S.resumeLabel}>Resume Score</span>
                <span style={S.resumeScore}>87 / 100</span>
              </div>
              <div style={S.progressBar}>
                <div className="progress-animated" style={S.progressFill} />
              </div>
              <div style={S.jobRow}>
                <div style={S.jobLogo}>G</div>
                <div>
                  <div style={S.jobTitle}>Google · SDE II</div>
                  <div style={S.jobMeta}>94% match · ₹28 LPA</div>
                </div>
                <button className="apply-btn-hover" style={{ ...S.applyBtn, transition: "background 0.2s ease" }}>Apply</button>
              </div>
              <div style={S.aiSuggests}>
                <span style={{ color: "#64748b" }}>AI SUGGESTS</span>
                <span style={{ marginLeft: 8, color: "#38bdf8" }}>+3 skills to add</span>
              </div>
            </div>
            <div style={{ ...S.shortlistBadge, animation: "scaleIn 0.6s 1.1s cubic-bezier(0.22,1,0.36,1) both" }}>
              <span style={{ ...S.shortlistDot, animation: "pulseDot 2s 1.8s ease-in-out infinite" }}>✓</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>Shortlisted</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Microsoft · PM Role</div>
              </div>
            </div>
          </div>
        </div>

        {/* scroll hint */}
        <div style={S.scrollHint}>
          <div style={S.scrollDot} />
        </div>
      </section>

      {/* ── STATS ── */}
      <div ref={statsRef} style={S.statsSection}>
        <StatsSection />
      </div>

      {/* ── TOP RECRUITERS — marquee ── */}
      <section ref={recruiterRef} className="ch-reveal" style={S.section}>
        <p style={S.eyebrow}>TOP RECRUITERS</p>
        <h2 style={S.sectionTitle}>Hiring partners who trust Campus Hire</h2>
        <RecruiterMarquee companies={companies} />
      </section>

      {/* ── FEATURES ── */}
      <section style={S.section}>
        <div className="ch-reveal" ref={useReveal(0.1)}>
          <p style={S.eyebrow}>FEATURES</p>
          <h2 style={S.sectionTitle}>From resume to offer letter — every step powered by AI</h2>
        </div>
        <div ref={featRef} style={S.featuresGrid}>
          {features.map((f) => (
            <div
              key={f.title}
              className="feat-card stagger-child ch-reveal"
              style={{ ...S.featureCard, cursor: "pointer", transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease" }}
              onClick={() => onNavigate && onNavigate(f.page)}
            >
              <div style={S.featureIcon}>{f.icon}</div>
              <h3 style={S.featureTitle}>{f.title}</h3>
              <p style={S.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={S.section}>
        <div className="ch-reveal" ref={useReveal(0.1)}>
          <p style={S.eyebrow}>HOW IT WORKS</p>
          <h2 style={S.sectionTitle}>Placement simplified in 5 steps</h2>
        </div>
        <div ref={stepsRef} style={S.stepsGrid}>
          {steps.map((s, i) => (
            <div key={s.num} className="step-card stagger-child ch-reveal" style={{ ...S.stepCard, transition: "transform 0.3s ease, border-color 0.3s ease", transitionDelay: `${i * 80}ms` }}>
              <div style={S.stepNum}>{s.num}</div>
              <h3 style={S.stepTitle}>{s.title}</h3>
              <p style={S.stepDesc}>{s.desc}</p>
              {s.icon ? <div style={S.stepIcon}>{s.icon}</div> : null}
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={S.section}>
        <div className="ch-reveal" ref={useReveal(0.1)}>
          <p style={S.eyebrow}>TESTIMONIALS</p>
          <h2 style={S.sectionTitle}>Students who got placed with Campus Hire</h2>
        </div>
        <div ref={testRef} style={S.testimonialsGrid}>
          {testimonials.map((t, i) => (
            <div key={t.name} className="test-card stagger-child ch-reveal" style={{ ...S.testimonialCard, transition: "transform 0.3s ease, border-color 0.3s ease", transitionDelay: `${i * 100}ms` }}>
              <div style={S.quoteIcon}>"</div>
              <p style={S.testimonialText}>{t.text}</p>
              <div style={S.testimonialAuthor}>
                <strong style={{ color: "#f1f5f9" }}>{t.name}</strong>
                <span style={{ color: "#38bdf8", marginLeft: 6 }}>{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <div ref={ctaRef} className="ch-reveal" style={{ padding: "0 24px" }}>
        <section style={S.ctaBanner}>
          <div style={S.ctaGlow} />
          <div>
            <h2 style={S.ctaTitle}>Join 10,000+ students already using Campus Hire</h2>
            <p style={S.ctaSubtitle}>Plan, apply and get placed — all in one platform.</p>
          </div>
          <button className="cta-btn-hover" style={{ ...S.ctaBtn, transition: "all 0.25s ease" }}>
            Create your free account →
          </button>
        </section>
      </div>

    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page: {
    background: "#050814",
    color: "#e2e8f0",
    fontFamily: "'Inter', sans-serif",
    minHeight: "100vh",
    overflowX: "hidden",
  },

  // HERO
  hero: {
    position: "relative",
    overflow: "hidden",
    padding: "80px 24px 64px",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  heroBg: {
    position: "absolute",
    inset: 0,
    background: `
      radial-gradient(circle at 20% 20%, rgba(56,189,248,0.18), transparent 26%),
      radial-gradient(circle at 82% 14%, rgba(124,58,237,0.16), transparent 30%),
      radial-gradient(circle at 50% 88%, rgba(168,85,247,0.08), transparent 24%),
      linear-gradient(180deg, rgba(4,6,20,0.95) 0%, rgba(5,8,20,0.98) 100%)
    `,
    pointerEvents: "none",
  },
  orb1: {
    position: "absolute",
    top: "10%",
    left: "5%",
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
    animation: "float 7s ease-in-out infinite",
  },
  orb2: {
    position: "absolute",
    bottom: "15%",
    right: "8%",
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
    animation: "float 9s 2s ease-in-out infinite",
  },
  heroContent: {
    display: "flex",
    gap: 56,
    alignItems: "center",
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  heroLeft:  { flex: 1 },
  heroRight: { flex: 1, position: "relative" },

  trustBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(14,165,233,0.1)",
    border: "1px solid rgba(14,165,233,0.3)",
    borderRadius: 20,
    padding: "6px 16px",
    fontSize: 13,
    color: "#38bdf8",
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: 700,
    lineHeight: 1.08,
    margin: "0 0 20px",
    color: "#f8fafc",
    letterSpacing: "-1.5px",
  },
  heroGradient: {
    background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 55%, #c084fc 100%)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animation: "gradientShift 4s ease infinite",
  },
  heroSubtitle: {
    fontSize: 17,
    color: "#dbeafe",
    lineHeight: 1.8,
    marginBottom: 36,
    maxWidth: 520,
  },
  heroCtas: { display: "flex", gap: 14, marginBottom: 36 },
  btnPrimary: {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "14px 28px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(14,165,233,0.35)",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.05)",
    color: "#cbd5e1",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 10,
    padding: "14px 28px",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
  },
  socialProof: { display: "flex", alignItems: "center", gap: 14 },
  avatarRow:   { display: "flex" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    marginLeft: -9,
    border: "2px solid #050814",
  },
  stars:      { color: "#fbbf24", fontSize: 14, letterSpacing: 1 },
  socialText: { fontSize: 12, color: "#475569", marginTop: 2 },

  scrollHint: {
    position: "absolute",
    bottom: 32,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    opacity: 0.4,
  },
  scrollDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#38bdf8",
    animation: "float 1.6s ease-in-out infinite",
  },

  // PLACEMENT CARD
  placementCard: {
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(56,189,248,0.18)",
    borderRadius: 26,
    padding: 28,
    backdropFilter: "blur(24px)",
    boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(56,189,248,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: { fontWeight: 600, fontSize: 14, color: "#e2e8f0" },
  cardBadge: {
    fontSize: 12,
    color: "#34d399",
    background: "rgba(52,211,153,0.1)",
    border: "1px solid rgba(52,211,153,0.2)",
    borderRadius: 12,
    padding: "3px 10px",
  },
  metricsRow: { display: "flex", gap: 10, marginBottom: 20 },
  metric: {
    flex: 1,
    background: "rgba(14,165,233,0.06)",
    border: "1px solid rgba(14,165,233,0.12)",
    borderRadius: 10,
    padding: 12,
    textAlign: "center",
  },
  metricValue: { fontSize: 28, fontWeight: 800, color: "#f1f5f9" },
  metricLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  resumeRow:   { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  resumeLabel: { fontSize: 13, color: "#94a3b8" },
  resumeScore: { fontSize: 13, fontWeight: 600, color: "#38bdf8" },
  progressBar: {
    background: "rgba(255,255,255,0.07)",
    borderRadius: 4,
    height: 6,
    marginBottom: 18,
    overflow: "hidden",
  },
  progressFill: {
    background: "linear-gradient(90deg, #0ea5e9, #818cf8)",
    height: "100%",
    borderRadius: 4,
    width: "87%",
  },
  jobRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: 12,
  },
  jobLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "#4285F4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  jobTitle: { fontSize: 13, fontWeight: 600, color: "#e2e8f0" },
  jobMeta:  { fontSize: 11, color: "#94a3b8" },
  applyBtn: {
    marginLeft: "auto",
    background: "rgba(14,165,233,0.15)",
    border: "1px solid rgba(14,165,233,0.3)",
    color: "#38bdf8",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    borderRadius: 6,
    padding: "5px 12px",
  },
  aiSuggests: { fontSize: 11, marginTop: 12 },
  shortlistBadge: {
    position: "absolute",
    top: -18,
    right: -14,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(15,23,42,0.96)",
    border: "1px solid rgba(52,211,153,0.35)",
    borderRadius: 12,
    padding: "8px 16px",
    boxShadow: "0 4px 24px rgba(52,211,153,0.18)",
  },
  shortlistDot: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#34d399",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    color: "#0f1117",
    fontWeight: 700,
  },

  // STATS
  statsSection: {
    background: "rgba(15,23,42,0.72)",
    borderTop: "1px solid rgba(56,189,248,0.12)",
    borderBottom: "1px solid rgba(56,189,248,0.12)",
    padding: "52px 24px",
    backdropFilter: "blur(16px)",
  },
  statsGrid: {
    display: "flex",
    justifyContent: "space-around",
    gap: 32,
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
    flexWrap: "wrap",
  },
  statItem:  { textAlign: "center" },
  statValue: {
    display: "block",
    fontSize: 52,
    fontWeight: 900,
    background: "linear-gradient(135deg, #38bdf8, #818cf8)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animation: "gradientShift 4s ease infinite",
    lineHeight: 1,
  },
  statLabel: { fontSize: 14, color: "#cbd5e1", marginTop: 8, letterSpacing: "0.3px" },

  // SECTIONS
  section: {
    padding: "72px 24px",
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 4,
    color: "#38bdf8",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 48,
    lineHeight: 1.15,
    letterSpacing: "-0.5px",
  },

  // COMPANIES
  companyCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: "22px 28px",
    minWidth: 104,
    flexShrink: 0,
    cursor: "default",
    transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
  },
  companyName: { fontSize: 12, color: "#cbd5e1" },

  // FEATURES
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 18,
  },
  featureCard: {
    background: "rgba(15,23,42,0.76)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 22,
    padding: 28,
  },
  featureIcon: {
    width: 48,
    height: 48,
    background: "rgba(14,165,233,0.1)",
    border: "1px solid rgba(14,165,233,0.2)",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    marginBottom: 18,
  },
  featureTitle: { fontSize: 16, fontWeight: 700, color: "#f8fafc", marginBottom: 8 },
  featureDesc:  { fontSize: 14, color: "#dbeafe", lineHeight: 1.7 },

  // STEPS
  stepsGrid: { display: "flex", gap: 12 },
  stepCard: {
    flex: 1,
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 24,
  },
  stepIcon: {
    marginTop: 18,
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(56,189,248,0.1)",
    border: "1px solid rgba(56,189,248,0.18)",
    color: "#38bdf8",
    fontSize: 22,
  },
  stepNum:   { fontSize: 28, fontWeight: 900, color: "rgba(14,165,233,0.3)", marginBottom: 14, lineHeight: 1 },
  stepTitle: { fontSize: 14, fontWeight: 700, color: "#f8fafc", marginBottom: 8 },
  stepDesc:  { fontSize: 13, color: "#dbeafe", lineHeight: 1.65 },

  // TESTIMONIALS
  testimonialsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 18,
  },
  testimonialCard: {
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 26,
  },
  quoteIcon: {
    fontSize: 36,
    color: "#0ea5e9",
    fontFamily: "Georgia, serif",
    lineHeight: 1,
    marginBottom: 14,
    opacity: 0.7,
  },
  testimonialText:   { fontSize: 14, color: "#dbeafe", lineHeight: 1.8, marginBottom: 18 },
  testimonialAuthor: { fontSize: 13, color: "#cbd5e1" },

  // CTA
  ctaBanner: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(99,102,241,0.14))",
    border: "1px solid rgba(14,165,233,0.22)",
    borderRadius: 22,
    padding: "44px 36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 40,
    marginBottom: 0,
  },
  ctaGlow: {
    position: "absolute",
    top: "-50%",
    left: "-10%",
    width: "40%",
    height: "200%",
    background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 60%)",
    pointerEvents: "none",
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#f8fafc",
    maxWidth: 520,
    lineHeight: 1.25,
    marginBottom: 10,
    letterSpacing: "-0.4px",
  },
  ctaSubtitle: { fontSize: 15, color: "#dbeafe", margin: 0 },
  ctaBtn: {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "15px 30px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 20px rgba(14,165,233,0.3)",
    position: "relative",
    zIndex: 1,
  },

  // FOOTER
  footer: {
    background: "#04060c",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "64px 24px 32px",
    marginTop: 48,
  },
  footerTop:    { display: "flex", gap: 80, marginBottom: 52, maxWidth: 1280, margin: "0 auto 52px" },
  footerBrand:  { flex: 2 },
  footerLogo: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 12,
    letterSpacing: "-0.3px",
  },
  footerTagline: {
    fontSize: 14,
    color: "#dbeafe",
    lineHeight: 1.75,
    marginBottom: 20,
    maxWidth: 280,
  },
  footerSocials: { display: "flex", gap: 10 },
  socialIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    cursor: "pointer",
    color: "#cbd5e1",
  },
  footerCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  footerColHead: {
    fontSize: 13,
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 4,
    letterSpacing: "0.3px",
  },
  footerLink: {
    fontSize: 14,
    color: "#dbeafe",
    textDecoration: "none",
  },
  footerBottom: {
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 24,
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    maxWidth: 1280,
    margin: "0 auto",
  },
};