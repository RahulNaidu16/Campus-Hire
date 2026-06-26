import { useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import * as api from "../api";
import { useSpeechRecognition, useSpeechSynthesis } from "../useVoice";
import { useVideoRecorder } from "../useVideoRecorder";

const DIFFICULTY_TIME = { easy: 90, medium: 120, hard: 180 };
const TYPES = [
  { value: "technical", label: "Technical" },
  { value: "hr", label: "HR" },
  { value: "aptitude", label: "Aptitude" },
  { value: "behavioral", label: "Behavioral" },
];
const DIFFICULTIES = ["easy", "medium", "hard"];

function ScoreRing({ value = 0, size = 120 }) {
  const r = size / 2 - 10, circ = 2 * Math.PI * r;
  const pct = Math.min(10, value) / 10;
  const offset = circ - pct * circ;
  const color = value >= 7 ? "#22c55e" : value >= 4 ? "#fbbf24" : "#f87171";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e1b4b" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">{value}</text>
      <text x={size / 2} y={size / 2 + 18} textAnchor="middle" fill="#94a3b8" fontSize="11">/ 10</text>
    </svg>
  );
}

// ── Setup screen ─────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState("Software Engineer");
  const [customRole, setCustomRole] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [interviewType, setInterviewType] = useState("technical");
  const [numQuestions, setNumQuestions] = useState(5);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.fetchMockInterviewRoles().then((d) => setRoles(d.roles || [])).catch(() => {});
  }, []);

  const handleStart = async () => {
    setError("");
    const finalRole = useCustom ? customRole.trim() : role;
    if (useCustom && !finalRole) {
      setError("Please type a custom role.");
      return;
    }
    setStarting(true);
    try {
      const session = await api.startMockInterview({
        role: finalRole, difficulty, interview_type: interviewType, num_questions: numQuestions,
      });
      onStart(session, { role: finalRole, difficulty, interviewType });
    } catch (err) {
      setError(err.message || "Could not start the interview.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={s.card}>
        <Field label="Job Role">
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button onClick={() => setUseCustom(false)} style={pillBtn(!useCustom)}>Choose from list</button>
            <button onClick={() => setUseCustom(true)} style={pillBtn(useCustom)}>Custom role</button>
          </div>
          {!useCustom ? (
            <select style={s.input} value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          ) : (
            <input style={s.input} value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="e.g. Blockchain Engineer" />
          )}
        </Field>

        <Field label="Interview Type">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TYPES.map((t) => (
              <button key={t.value} onClick={() => setInterviewType(t.value)} style={pillBtn(interviewType === t.value)}>{t.label}</button>
            ))}
          </div>
        </Field>

        <Field label="Difficulty">
          <div style={{ display: "flex", gap: 8 }}>
            {DIFFICULTIES.map((d) => (
              <button key={d} onClick={() => setDifficulty(d)} style={pillBtn(difficulty === d)}>{d[0].toUpperCase() + d.slice(1)}</button>
            ))}
          </div>
        </Field>

        <Field label="Number of questions">
          <div style={{ display: "flex", gap: 8 }}>
            {[3, 5, 7].map((n) => (
              <button key={n} onClick={() => setNumQuestions(n)} style={pillBtn(numQuestions === n)}>{n}</button>
            ))}
          </div>
        </Field>

        {error && <div style={s.errorBox}>{error}</div>}

        <button onClick={handleStart} disabled={starting} style={{ ...s.primaryBtn, width: "100%", marginTop: 10, padding: "13px 0" }}>
          {starting ? "Preparing questions…" : "Start Mock Interview →"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#cbd5e1", marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

function pillBtn(active) {
  return {
    padding: "8px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    background: active ? "linear-gradient(135deg, #0ea5e9, #6366f1)" : "rgba(15,23,42,0.6)",
    color: active ? "#fff" : "#94a3b8",
    border: active ? "none" : "1px solid rgba(148,163,184,0.2)",
  };
}

// ── Interview runner ─────────────────────────────────────────────────────
function InterviewRunner({ session, meta, onFinished }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DIFFICULTY_TIME[meta.difficulty] || 120);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [autoRead, setAutoRead] = useState(true);
  const timerRef = useRef(null);
  const videoUrlsRef = useRef({}); // questionId -> object URL, kept alive until the whole session ends

  const tts = useSpeechSynthesis();
  const stt = useSpeechRecognition({ onTranscriptChange: setAnswer });
  const video = useVideoRecorder();

  const questions = session.questions;
  const question = questions[index];

  useEffect(() => {
    setTimeLeft(DIFFICULTY_TIME[meta.difficulty] || 120);
    setStartedAt(Date.now());
    clearInterval(timerRef.current);
    stt.stop();
    if (autoRead) tts.speak(question.question_text);
    if (video.cameraOn) video.startRecording();
    if (!feedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Capture each question's finished recording URL as soon as it's ready.
  useEffect(() => {
    if (video.recordedUrl) videoUrlsRef.current[question.id] = video.recordedUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.recordedUrl]);

  useEffect(() => {
    if (timeLeft === 0 && !feedback) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      tts.stop();
      stt.stop();
      video.disableCamera();
      // Note: we deliberately do NOT revoke the recorded video object URLs here -
      // they're handed off via onFinished() for playback on the Summary screen.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (feedback) return;
    clearInterval(timerRef.current);
    stt.stop();
    tts.stop();
    video.stopRecording();
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startedAt) / 1000);
    try {
      const result = await api.submitMockAnswer(session.session_id, {
        question_id: question.id, answer_text: answer, time_taken_seconds: timeTaken,
      });
      setFeedback(result);
    } catch (err) {
      setFeedback({ score: 0, strengths: [], weaknesses: [err.message || "Could not score this answer."], suggested_answer: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    tts.stop();
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswer("");
      setFeedback(null);
    } else {
      video.disableCamera();
      api.completeMockSession(session.session_id).then((result) => {
        onFinished({ ...result, videoUrls: { ...videoUrlsRef.current } });
      });
    }
  };

  const toggleRecording = () => {
    if (stt.listening) {
      stt.stop();
    } else {
      tts.stop();
      stt.start(answer);
    }
  };

  const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>Question {index + 1} of {questions.length}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 11.5, cursor: "pointer" }}>
            <input type="checkbox" checked={autoRead} onChange={(e) => setAutoRead(e.target.checked)} />
            Auto-read questions
          </label>
          {video.supported && (
            <button
              onClick={async () => {
                if (video.cameraOn) {
                  video.disableCamera();
                } else {
                  await video.enableCamera();
                  if (!feedback) video.startRecording();
                }
              }}
              style={{
                ...s.smallBtn, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6,
                background: video.cameraOn ? "rgba(239,68,68,0.12)" : "rgba(148,163,184,0.1)",
                border: video.cameraOn ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(148,163,184,0.2)",
                color: video.cameraOn ? "#f87171" : "#94a3b8",
              }}
            >
              🎥 {video.cameraOn ? "Turn Camera Off" : "Record Video Too"}
            </button>
          )}
          <span style={{
            color: timeLeft < 20 ? "#f87171" : "#38bdf8", fontWeight: 700, fontSize: 14,
            fontFamily: "monospace",
          }}>
            ⏱ {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {video.error && <div style={{ ...s.errorBox, marginBottom: 12 }}>{video.error}</div>}

      {video.cameraOn && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ position: "relative", width: 160, height: 120, borderRadius: 12, overflow: "hidden", background: "#000", flexShrink: 0 }}>
            <video ref={video.videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {video.recording && (
              <span style={{
                position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 5,
                background: "rgba(0,0,0,0.5)", borderRadius: 999, padding: "3px 8px",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f87171", animation: "pulse 1s infinite" }} />
                <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>REC</span>
              </span>
            )}
          </div>
          <span style={{ color: "#64748b", fontSize: 11.5, maxWidth: 280 }}>
            Recording locally in your browser for self-review only - never uploaded anywhere.
          </span>
        </div>
      )}

      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={s.badge}>{question.interview_type}</span>
            <span style={s.badge}>{question.difficulty}</span>
            {question.question_format === "coding" && <span style={{ ...s.badge, color: "#fbbf24" }}>coding</span>}
          </div>
          {tts.supported && (
            <button onClick={() => tts.speak(question.question_text)} style={s.iconBtn} title="Read question aloud">
              🔊
            </button>
          )}
        </div>
        <div style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginBottom: 16 }}>
          {question.question_text}
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!!feedback}
          placeholder={stt.supported ? "Type, or tap the mic to speak your answer…" : "Type your answer here…"}
          style={{ ...s.input, minHeight: 140, resize: "vertical", opacity: feedback ? 0.7 : 1 }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          {stt.supported ? (
            <button
              onClick={toggleRecording}
              disabled={!!feedback}
              style={{
                ...s.smallBtn,
                background: stt.listening ? "rgba(239,68,68,0.15)" : "rgba(56,189,248,0.15)",
                border: stt.listening ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(56,189,248,0.3)",
                color: stt.listening ? "#f87171" : "#38bdf8",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {stt.listening && (
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#f87171",
                  display: "inline-block", animation: "pulse 1s infinite",
                }} />
              )}
              {stt.listening ? "Stop Recording" : "🎤 Speak Your Answer"}
            </button>
          ) : (
            <span style={{ color: "#64748b", fontSize: 11.5 }}>
              Voice input isn't supported in this browser (try Chrome or Edge) - you can type your answer instead.
            </span>
          )}
          {stt.error && <span style={{ color: "#f87171", fontSize: 11.5 }}>{stt.error}</span>}
        </div>

        {!feedback && (
          <button onClick={handleSubmit} disabled={submitting} style={{ ...s.primaryBtn, marginTop: 14 }}>
            {submitting ? "Scoring…" : "Submit Answer"}
          </button>
        )}

        {feedback && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(148,163,184,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
              <ScoreRing value={feedback.score} size={84} />
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>Your score</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>Rule-based scoring on keyword coverage, depth and structure</div>
              </div>
              {video.recordedUrl && (
                <video
                  src={video.recordedUrl} controls
                  style={{ width: 180, borderRadius: 10, marginLeft: "auto" }}
                />
              )}
            </div>

            {feedback.strengths?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Strengths</div>
                {feedback.strengths.map((st, i) => <div key={i} style={{ color: "#cbd5e1", fontSize: 12.5 }}>✓ {st}</div>)}
              </div>
            )}
            {feedback.weaknesses?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Areas to improve</div>
                {feedback.weaknesses.map((w, i) => <div key={i} style={{ color: "#cbd5e1", fontSize: 12.5 }}>→ {w}</div>)}
              </div>
            )}
            {feedback.suggested_answer && (
              <div style={{ marginTop: 10, padding: 12, background: "rgba(56,189,248,0.06)", borderRadius: 10 }}>
                <div style={{ color: "#38bdf8", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Sample strong answer</div>
                <div style={{ color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.5 }}>{feedback.suggested_answer}</div>
              </div>
            )}

            <button onClick={handleNext} style={{ ...s.primaryBtn, marginTop: 16 }}>
              {index + 1 < questions.length ? "Next Question →" : "Finish Interview"}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}

// ── Summary screen ───────────────────────────────────────────────────────
function SummaryScreen({ result, onRestart, onHistory }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ ...s.card, display: "flex", alignItems: "center", gap: 24, marginBottom: 16 }}>
        <ScoreRing value={result.average_score} size={110} />
        <div>
          <div style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700 }}>Interview complete!</div>
          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
            {result.role} · {result.interview_type} · {result.difficulty} · {result.question_count} question(s)
          </div>
        </div>
      </div>

      {result.answers.map((a, i) => (
        <div key={a.id} style={{ ...s.card, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600 }}>Q{i + 1}: {a.question_text}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              {result.videoUrls?.[a.question] && (
                <video src={result.videoUrls[a.question]} controls style={{ width: 140, borderRadius: 8 }} />
              )}
              <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 13 }}>{a.score}/10</span>
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onRestart} style={s.primaryBtn}>Take Another Interview</button>
        <button onClick={onHistory} style={s.smallBtn}>View History & Stats</button>
      </div>
    </div>
  );
}

// ── History screen ───────────────────────────────────────────────────────
function HistoryScreen({ onRestart }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.fetchMockStats().then(setStats).catch(() => {});
    api.fetchMockHistory().then(setHistory).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 720 }}>
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          <StatBox label="Total Interviews" value={stats.total_interviews} />
          <StatBox label="Average Score" value={`${stats.average_score}/10`} />
          <StatBox label="Best Score" value={`${stats.best_score}/10`} />
          <StatBox label="Strong Areas" value={stats.strong_areas?.join(", ") || "—"} small />
          <StatBox label="Weak Areas" value={stats.weak_areas?.join(", ") || "—"} small />
        </div>
      )}

      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Past sessions</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {history.map((h) => (
          <div key={h.id} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13.5 }}>{h.role}</div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>{h.interview_type} · {h.difficulty} · {h.question_count} questions · {new Date(h.completed_at).toLocaleDateString()}</div>
            </div>
            <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: 14 }}>{h.average_score}/10</div>
          </div>
        ))}
        {history.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>No completed interviews yet.</div>}
      </div>

      <button onClick={onRestart} style={{ ...s.primaryBtn, marginTop: 20 }}>Take a New Interview</button>
    </div>
  );
}

function StatBox({ label, value, small }) {
  return (
    <div style={s.statCard}>
      <div style={{ color: "#f1f5f9", fontSize: small ? 13 : 22, fontWeight: 700 }}>{value}</div>
      <div style={{ color: "#94a3b8", fontSize: 11.5, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────
export default function MockInterview({ onNavigate }) {
  const { user } = useAuth();
  const [mode, setMode] = useState("setup");
  const [session, setSession] = useState(null);
  const [meta, setMeta] = useState(null);
  const [result, setResult] = useState(null);

  if (!user) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <p style={{ marginBottom: 16 }}>Please sign in to take a mock interview.</p>
          <button onClick={() => onNavigate && onNavigate("login")} style={s.linkBtn}>Sign in →</button>
        </div>
      </div>
    );
  }

  const handleStart = (sess, m) => { setSession(sess); setMeta(m); setMode("interview"); };
  const handleFinished = (finalResult) => { setResult({ ...finalResult, ...meta }); setMode("summary"); };

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.content}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={s.title}>AI Mock Interview</h1>
          <p style={s.subtitle}>
            The AI reads each question aloud and you can answer by speaking or typing - then get instant,
            explainable feedback (not a black box: every score traces back to your actual answer).
          </p>
        </div>

        {mode === "setup" && <SetupScreen onStart={handleStart} />}
        {mode === "interview" && <InterviewRunner session={session} meta={meta} onFinished={handleFinished} />}
        {mode === "summary" && (
          <SummaryScreen result={result} onRestart={() => setMode("setup")} onHistory={() => setMode("history")} />
        )}
        {mode === "history" && <HistoryScreen onRestart={() => setMode("setup")} />}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#050814", color: "#e2e8f0", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" },
  blob1: { position: "absolute", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,.2) 0%,transparent 70%)", pointerEvents: "none" },
  blob2: { position: "absolute", bottom: -80, right: -80, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.16) 0%,transparent 70%)", pointerEvents: "none" },
  content: { position: "relative", maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" },
  title: { fontSize: 30, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  subtitle: { color: "#94a3b8", marginTop: 8, fontSize: 14.5, maxWidth: 620 },
  card: { background: "rgba(15,23,42,0.92)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 18, padding: "20px 22px", backdropFilter: "blur(12px)" },
  statCard: { background: "rgba(15,23,42,0.92)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 14, padding: "14px 16px", textAlign: "center" },
  badge: {
    fontSize: 10.5, fontWeight: 700, color: "#94a3b8", background: "rgba(148,163,184,0.12)",
    padding: "3px 9px", borderRadius: 999, textTransform: "uppercase",
  },
  input: {
    background: "rgba(5,8,20,0.6)", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 10,
    color: "#e2e8f0", fontSize: 13.5, padding: "11px 14px", boxSizing: "border-box", width: "100%",
    fontFamily: "'Inter', sans-serif",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none",
    borderRadius: 10, padding: "10px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
  },
  smallBtn: {
    background: "transparent", border: "1px solid rgba(148,163,184,0.25)", color: "#94a3b8",
    borderRadius: 8, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  },
  iconBtn: {
    background: "rgba(148,163,184,0.1)", border: "none", borderRadius: 8, width: 34, height: 34,
    fontSize: 15, cursor: "pointer", flexShrink: 0,
  },
  errorBox: {
    padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 13, marginBottom: 10,
  },
  linkBtn: { background: "none", border: "none", color: "#38bdf8", fontSize: 14, cursor: "pointer", fontWeight: 600 },
};
