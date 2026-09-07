/* =========================================================
   LearnAble — dashboard.js
   Teacher dashboard: summary stats, student overview, quick actions.
========================================================= */

function isSameDay(ts, ref){
  const a = new Date(ts), b = new Date(ref);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function computeDashboardStats(){
  const students = getStudents();
  const sessions = getSessions();
  const today = Date.now();
  const todaySessions = sessions.filter(s => isSameDay(s.date, today));

  const activitiesToday = todaySessions.length;
  const avgAccuracy = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length)
    : 0;

  // "Needing attention": most recent session accuracy below 60%, or no activity in the last 7 days
  const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
  let needingAttention = 0;
  students.forEach(s => {
    const studentSessions = getSessionsForStudent(s.id).sort((a,b) => b.date - a.date);
    if (!studentSessions.length) return;
    const latest = studentSessions[0];
    if (latest.accuracy < 60 || latest.date < weekAgo) needingAttention++;
  });

  return {
    totalStudents: students.length,
    activitiesToday,
    avgAccuracy,
    needingAttention
  };
}

function renderDashboardView(){
  const el = document.getElementById("view-dashboard");
  const teacher = getTeacher() || { name: "Teacher" };
  const stats = computeDashboardStats();
  const students = getStudents();

  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1>👋 Welcome back, ${escapeHtml(teacher.name)}!</h1>
        <p class="page-sub">Here's how your class is doing today.</p>
      </div>
    </div>

    <div class="grid grid-4" style="margin-bottom:22px;">
      <div class="card stat-card"><div class="stat-icon">🧒</div><div class="stat-value">${stats.totalStudents}</div><div class="stat-label">Total Students</div></div>
      <div class="card stat-card"><div class="stat-icon">🎯</div><div class="stat-value">${stats.activitiesToday}</div><div class="stat-label">Activities Completed Today</div></div>
      <div class="card stat-card"><div class="stat-icon">✅</div><div class="stat-value">${stats.avgAccuracy}%</div><div class="stat-label">Average Accuracy</div></div>
      <div class="card stat-card"><div class="stat-icon">💛</div><div class="stat-value">${stats.needingAttention}</div><div class="stat-label">Students Needing Attention</div></div>
    </div>

    <div class="page-header">
      <h2 style="font-size:1.2rem; color:var(--color-primary-dark);">Quick actions</h2>
    </div>
    <div class="grid grid-4" style="margin-bottom:26px;">
      <button class="btn btn-primary btn-large" id="qa-add-student">➕ Add Student</button>
      <button class="btn btn-secondary btn-large" id="qa-start-activity">▶️ Start Activity</button>
      <button class="btn btn-accent btn-large" id="qa-view-reports">📊 View Reports</button>
      <button class="btn btn-outline btn-large" id="qa-activity-library">🎯 Activity Library</button>
    </div>

    <div class="page-header">
      <h2 style="font-size:1.2rem; color:var(--color-primary-dark);">Your students</h2>
      <a href="#students" class="btn btn-outline btn-sm">See all</a>
    </div>
    <div id="dashboard-students" class="grid grid-4"></div>
  `;

  const grid = document.getElementById("dashboard-students");
  if (!students.length){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <span class="empty-emoji">🧸</span><p>No students yet. Click "Add Student" to get started!</p>
    </div>`;
  } else {
    grid.innerHTML = students.slice(0, 8).map(s => {
      const acc = studentRecentAccuracy(s.id) ?? 0;
      const cat = findCategory(s.category);
      return `
      <div class="card student-card">
        <div class="student-card-top">
          <div class="student-avatar" aria-hidden="true">${cat ? cat.icon : "🙂"}</div>
          <div>
            <div class="student-name">${escapeHtml(s.name)}</div>
            <div class="student-meta">Age ${s.age} · ${cat ? cat.label : "—"}</div>
          </div>
        </div>
        <div>${supportBadge(s.supportLevel)}</div>
        <div class="progress-bar" aria-label="Recent accuracy ${acc}%"><span style="width:${acc}%"></span></div>
        <div class="student-meta">${acc}% recent accuracy</div>
        <div class="student-actions">
          <button class="btn btn-primary btn-sm" data-id="${s.id}" data-action="profile">👤 Profile</button>
          <button class="btn btn-secondary btn-sm" data-id="${s.id}" data-action="start">▶️ Start</button>
        </div>
      </div>`;
    }).join("");
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "profile") window.location.hash = `#student/${btn.dataset.id}`;
    if (btn.dataset.action === "start") window.location.hash = `#activities/${btn.dataset.id}`;
  });

  document.getElementById("qa-add-student").addEventListener("click", () => {
    window.location.hash = "#students";
    setTimeout(() => openStudentModal(), 50);
  });
  document.getElementById("qa-start-activity").addEventListener("click", () => { window.location.hash = "#activities"; });
  document.getElementById("qa-view-reports").addEventListener("click", () => { window.location.hash = "#reports"; });
  document.getElementById("qa-activity-library").addEventListener("click", () => { window.location.hash = "#activities"; });
}
