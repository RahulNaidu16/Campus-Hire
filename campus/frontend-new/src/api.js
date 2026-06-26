// Thin fetch-based client for the Campus Hire Django REST API.
// Tokens are persisted in localStorage so the session survives a page reload.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const TOKEN_KEY = "campushire_access_token";
const REFRESH_KEY = "campushire_refresh_token";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens({ access: data.access });
    return data.access;
  } catch {
    return null;
  }
}

async function request(path, { method = "GET", body, auth = true, retry = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request(path, { method, body, auth, retry: false });
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.detail || data.error)) ||
      (data && typeof data === "object" && Object.values(data)[0]) ||
      "Something went wrong. Please try again.";
    const err = new Error(Array.isArray(message) ? message[0] : String(message));
    err.data = data;
    err.status = res.status;
    throw err;
  }

  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────
export async function login(usernameOrEmail, password) {
  const data = await request("/auth/login/", {
    method: "POST",
    auth: false,
    body: { username: usernameOrEmail, password },
  });
  setTokens(data);
  return data.user;
}

export async function register(payload) {
  const data = await request("/auth/register/", {
    method: "POST",
    auth: false,
    body: payload,
  });
  setTokens(data);
  return data.user;
}

export function logout() {
  clearTokens();
}

export function fetchMe() {
  return request("/auth/me/");
}

export function updateMe(payload) {
  return request("/auth/me/", { method: "PATCH", body: payload });
}

export function fetchSkillsCatalog() {
  return request("/skills/", { auth: false });
}

// ── Jobs ─────────────────────────────────────────────────────────────────
export function fetchJobs(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "All") {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return request(`/jobs/${query ? `?${query}` : ""}`, { auth: true });
}

export function fetchJobMeta() {
  return request("/jobs/meta/", { auth: false });
}

export function fetchRecommendedJobs(limit = 6) {
  return request(`/jobs/recommendations/?limit=${limit}`);
}

export function applyToJob(jobId) {
  return request(`/jobs/${jobId}/apply/`, { method: "POST" });
}

export function fetchMyApplications() {
  return request("/applications/");
}

export function updateApplicationStatus(applicationId, status, note = "") {
  return request(`/applications/${applicationId}/status/`, { method: "PATCH", body: { status, note } });
}

export function toggleSavedJob(jobId) {
  return request(`/jobs/${jobId}/save/`, { method: "POST" });
}

export function fetchSavedJobs() {
  return request("/jobs/saved/");
}

// ── Companies ────────────────────────────────────────────────────────────
export function fetchCompanies() {
  return request("/jobs/companies/", { auth: false });
}

export function fetchCompanyDetail(companyId) {
  return request(`/jobs/companies/${companyId}/`, { auth: false });
}

// ── Recruiter job management ────────────────────────────────────────────
export function fetchMyJobs() {
  return request("/jobs/mine/");
}

export function createJob(payload) {
  return request("/jobs/", { method: "POST", body: payload });
}

export function updateJob(jobId, payload) {
  return request(`/jobs/${jobId}/edit/`, { method: "PATCH", body: payload });
}

export function deleteJob(jobId) {
  return request(`/jobs/${jobId}/edit/`, { method: "DELETE" });
}

export function fetchApplicants({ jobId, status } = {}) {
  const params = new URLSearchParams();
  if (jobId) params.set("job_id", jobId);
  if (status) params.set("status", status);
  const query = params.toString();
  return request(`/applications/${query ? `?${query}` : ""}`);
}

export async function downloadApplicantsCsv(jobId, filename) {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/applicants/export/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Could not export applicants.");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "applicants.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadResumeFile(userId, filename) {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/resume/file/${userId}/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || "Could not download this resume.");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "resume";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ── Dashboard / analytics ───────────────────────────────────────────────
export function fetchDashboardSummary() {
  return request("/dashboard/summary/");
}

export function fetchAnalyticsOverview() {
  return request("/analytics/overview/", { auth: false });
}

export function fetchRecruiterAnalytics() {
  return request("/analytics/recruiter/");
}

// ── Admin panel ──────────────────────────────────────────────────────────
export function fetchAdminOverview() {
  return request("/admin/overview/");
}

export function fetchAdminStudents(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/admin/students/${q ? `?${q}` : ""}`);
}

export function fetchAdminRecruiters(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/admin/recruiters/${q ? `?${q}` : ""}`);
}

export function setUserActive(userId, isActive) {
  return request(`/admin/users/${userId}/`, { method: "PATCH", body: { is_active: isActive } });
}

export function deleteUser(userId) {
  return request(`/admin/users/${userId}/`, { method: "DELETE" });
}

// ── Notifications ────────────────────────────────────────────────────────
export function fetchNotifications() {
  return request("/notifications/");
}

export function markNotificationRead(id) {
  return request(`/notifications/${id}/read/`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return request("/notifications/read-all/", { method: "POST" });
}

// ── Interview scheduling ─────────────────────────────────────────────────
export function fetchScheduledInterviews() {
  return request("/interviews/");
}

export function scheduleInterview(payload) {
  return request("/interviews/", { method: "POST", body: payload });
}

export function respondToInterview(interviewId, response, message = "") {
  return request(`/interviews/${interviewId}/respond/`, { method: "PATCH", body: { response, message } });
}

// ── AI Mock Interview ────────────────────────────────────────────────────
export function fetchMockInterviewRoles() {
  return request("/mockinterview/roles/", { auth: false });
}

export function startMockInterview(payload) {
  return request("/mockinterview/sessions/", { method: "POST", body: payload });
}

export function submitMockAnswer(sessionId, payload) {
  return request(`/mockinterview/sessions/${sessionId}/answer/`, { method: "POST", body: payload });
}

export function completeMockSession(sessionId) {
  return request(`/mockinterview/sessions/${sessionId}/complete/`, { method: "POST" });
}

export function fetchMockSession(sessionId) {
  return request(`/mockinterview/sessions/${sessionId}/`);
}

export function fetchMockHistory() {
  return request("/mockinterview/sessions/history/");
}

export function fetchMockStats() {
  return request("/mockinterview/stats/");
}

// ── Resume analysis ─────────────────────────────────────────────────────
export async function analyzeResume({ text, file, jobId }) {
  const formData = new FormData();
  if (file) formData.append("resume_file", file);
  if (text) formData.append("resume_text", text);
  if (jobId) formData.append("job_id", jobId);

  const token = getAccessToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/resume/analyze/`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data?.detail || "Could not analyze your resume. Please try again.";
    throw new Error(message);
  }
  return data;
}

export { API_BASE_URL };
