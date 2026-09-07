/* =========================================================
   LearnAble — reports.js
   Performance Reports page: pick a student, see aggregated stats,
   simple bar visualizations, and full session history.
========================================================= */

function renderReportsView(preselectStudentId){
  const el = document.getElementById("view-reports");
  const students = getStudents();
  const studentId = preselectStudentId || (students[0] && students[0].id) || null;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1>📊 Reports</h1>
        <p class="page-sub">Review activity history and Learning Performance for each student.</p>
      </div>
      ${students.length ? `
      <div class="form-row" style="min-width:220px;">
        <label for="report-student-select">Select student</label>
        <select id="report-student-select">
          ${students.map(s => `<option value="${s.id}" ${s.id === studentId ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}
        </select>
      </div>` : ""}
    </div>
    <div id="report-body"></div>
  `;

  if (!students.length){
    document.getElementById("report-body").innerHTML = `<div class="empty-state"><span class="empty-emoji">📄</span><p>Add a student to start seeing reports.</p></div>`;
    return;
  }

  const select = document.getElementById("report-student-select");
  select.addEventListener("change", () => renderReportBody(select.value));
  renderReportBody(studentId);
}

function renderReportBody(studentId){
  const container = document.getElementById("report-body");
  const student = getStudent(studentId);
  if (!student){ container.innerHTML = `<div class="empty-state"><p>Student not found.</p></div>`; return; }

  const sessions = getSessionsForStudent(studentId).sort((a,b) => b.date - a.date);

  if (!sessions.length){
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-emoji">🧾</span>
        <p>${escapeHtml(student.name)} hasn't completed any activities yet.</p>
        <a href="#play/${findActivity(findCategory(student.category).activities.find(a=>a.playable)?.id)?.id}/${student.id}" class="btn btn-primary">Start an Activity</a>
      </div>`;
    return;
  }

  const totalRounds = sessions.reduce((s,x) => s + (x.roundsCompleted||0), 0);
  const totalCorrect = sessions.reduce((s,x) => s + (x.correct||0), 0);
  const totalIncorrect = sessions.reduce((s,x) => s + (x.incorrect||0), 0);
  const totalMissed = sessions.reduce((s,x) => s + (x.missed||0), 0);
  const avgAccuracy = Math.round(sessions.reduce((s,x) => s + (x.accuracy||0), 0) / sessions.length);
  const avgResponse = +(sessions.reduce((s,x) => s + (x.avgResponseTime||0), 0) / sessions.length).toFixed(2);
  const totalHints = sessions.reduce((s,x) => s + (x.hintsUsed||0), 0);
  const totalDemos = sessions.reduce((s,x) => s + (x.teacherDemonstrations||0), 0);
  const totalDuration = sessions.reduce((s,x) => s + (x.durationSeconds||0), 0);

  // accuracy per activity (for simple bar chart)
  const byActivity = {};
  sessions.forEach(s => {
    if (!byActivity[s.activityName]) byActivity[s.activityName] = [];
    byActivity[s.activityName].push(s.accuracy);
  });
  const activityBars = Object.entries(byActivity).map(([name, accs]) => ({
    name, avg: Math.round(accs.reduce((a,b)=>a+b,0)/accs.length)
  }));

  const rec = learningRecommendation(avgAccuracy);

  container.innerHTML = `
    <div class="page-header">
      <h2 style="font-size:1.2rem;">${findCategory(student.category)?.icon || ""} ${escapeHtml(student.name)} ${supportBadge(student.supportLevel)}</h2>
    </div>

    <div class="grid grid-4" style="margin-bottom:18px;">
      <div class="card stat-card"><div class="stat-value">${sessions.length}</div><div class="stat-label">Activities Completed</div></div>
      <div class="card stat-card"><div class="stat-value">${totalRounds}</div><div class="stat-label">Rounds Completed</div></div>
      <div class="card stat-card"><div class="stat-value">${avgAccuracy}%</div><div class="stat-label">Average Accuracy</div></div>
      <div class="card stat-card"><div class="stat-value">${avgResponse}s</div><div class="stat-label">Avg. Response Time</div></div>
    </div>

    <div class="card feedback-banner ${rec.cls}" style="margin-bottom:18px;">
      📈 <strong>Learning Performance — ${rec.label}:</strong> ${rec.text}
      <div style="font-size:0.78rem; font-weight:500; margin-top:6px;">This score is explainable and based only on recorded activity data (accuracy, response time, completion, hints, demonstrations). It is not a diagnosis or clinical assessment — the teacher remains in control.</div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <h3>Response breakdown</h3>
        <div class="report-metric"><span>✅ Correct</span><strong>${totalCorrect}</strong></div>
        <div class="report-metric"><span>❌ Incorrect</span><strong>${totalIncorrect}</strong></div>
        <div class="report-metric"><span>⏭️ Missed</span><strong>${totalMissed}</strong></div>
        <div class="report-metric"><span>💡 Hints Used</span><strong>${totalHints}</strong></div>
        <div class="report-metric"><span>👩‍🏫 Teacher Demonstrations</span><strong>${totalDemos}</strong></div>
        <div class="report-metric"><span>⏱️ Total Activity Time</span><strong>${Math.round(totalDuration/60)} min</strong></div>
      </div>
      <div class="card">
        <h3>Accuracy by activity</h3>
        ${activityBars.map(b => `
          <div class="bar-row">
            <span class="bar-label">${escapeHtml(b.name)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${b.avg}%"></div></div>
            <span>${b.avg}%</span>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="card" style="margin-top:18px;">
      <h3>Activity history</h3>
      ${sessions.map(s => `
        <div class="session-row">
          <span><strong>${escapeHtml(s.activityName)}</strong> — ${new Date(s.date).toLocaleString()}</span>
          <span>${s.roundsCompleted} rounds · ${s.accuracy}% accuracy · ${s.avgResponseTime}s avg</span>
        </div>
      `).join("")}
    </div>
  `;
}
