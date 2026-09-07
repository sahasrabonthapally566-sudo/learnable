/* =========================================================
   LearnAble — students.js
   Student list, add/edit/delete modal, and individual profile view.
========================================================= */

function supportBadge(level){
  const cls = level === "moderate" ? "badge-moderate" : "badge-mild";
  const label = level === "moderate" ? "Moderate" : "Mild";
  return `<span class="badge ${cls}">${label}</span>`;
}

function studentRecentAccuracy(studentId){
  const sessions = getSessionsForStudent(studentId).sort((a,b) => b.date - a.date);
  if (!sessions.length) return null;
  return sessions[0].accuracy;
}

function renderStudentCard(s, { withActions = true } = {}){
  const cat = findCategory(s.category);
  const acc = studentRecentAccuracy(s.id);
  return `
    <div class="card student-card" data-student-id="${s.id}">
      <div class="student-card-top">
        <div class="student-avatar" aria-hidden="true">${cat ? cat.icon : "🙂"}</div>
        <div>
          <div class="student-name">${escapeHtml(s.name)}</div>
          <div class="student-meta">Age ${s.age} · ${cat ? cat.label : "—"}</div>
        </div>
      </div>
      <div>${supportBadge(s.supportLevel)}</div>
      <div class="student-meta">${acc !== null ? `Last accuracy: <strong>${acc}%</strong>` : "No activity yet"}</div>
      ${withActions ? `
      <div class="student-actions">
        <button class="btn btn-primary btn-sm" data-action="view-profile" data-id="${s.id}">👤 Profile</button>
        <button class="btn btn-secondary btn-sm" data-action="start-activity" data-id="${s.id}">▶️ Start Activity</button>
      </div>` : ""}
    </div>
  `;
}

function renderStudentsView(){
  const el = document.getElementById("view-students");
  const students = getStudents();

  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1>🧒 Students</h1>
        <p class="page-sub">Manage student profiles and support levels.</p>
      </div>
      <button id="open-add-student" class="btn btn-primary">➕ Add Student</button>
    </div>
    <div id="students-grid" class="grid grid-3"></div>
  `;

  const grid = document.getElementById("students-grid");
  if (!students.length){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <span class="empty-emoji">🧸</span>
      <p>No students yet. Add your first student to get started!</p>
    </div>`;
  } else {
    grid.innerHTML = students.map(s => `
      <div class="card student-card">
        <div class="student-card-top">
          <div class="student-avatar" aria-hidden="true">${findCategory(s.category)?.icon || "🙂"}</div>
          <div>
            <div class="student-name">${escapeHtml(s.name)}</div>
            <div class="student-meta">Age ${s.age} · ${findCategory(s.category)?.label || "—"}</div>
          </div>
        </div>
        <div>${supportBadge(s.supportLevel)}</div>
        <div class="student-actions">
          <button class="btn btn-primary btn-sm" data-action="view-profile" data-id="${s.id}">👤 Profile</button>
          <button class="btn btn-secondary btn-sm" data-action="start-activity" data-id="${s.id}">▶️ Start</button>
          <button class="btn btn-outline btn-sm" data-action="edit-student" data-id="${s.id}">✏️ Edit</button>
          <button class="btn btn-error btn-sm" data-action="delete-student" data-id="${s.id}">🗑️ Delete</button>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("open-add-student").addEventListener("click", () => openStudentModal());

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === "view-profile") { window.location.hash = `#student/${id}`; }
    else if (action === "start-activity") { window.location.hash = `#activities/${id}`; }
    else if (action === "edit-student") { openStudentModal(getStudent(id)); }
    else if (action === "delete-student") {
      const s = getStudent(id);
      if (confirm(`Delete ${s.name}'s profile and all history? This cannot be undone.`)){
        deleteStudent(id);
        showToast(`${s.name} was removed`, "success");
        renderStudentsView();
      }
    }
  });
}

function openStudentModal(existing){
  const isEdit = !!existing;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">${isEdit ? "✏️ Edit Student" : "➕ Add Student"}</h2>
      <form id="student-form">
        <div class="form-row">
          <label for="f-name">Student name</label>
          <input id="f-name" type="text" required value="${isEdit ? escapeHtml(existing.name) : ""}">
        </div>
        <div class="form-row">
          <label for="f-age">Age</label>
          <input id="f-age" type="number" min="3" max="18" required value="${isEdit ? existing.age : 7}">
        </div>
        <div class="form-row">
          <label for="f-category">Learning category</label>
          <select id="f-category">
            ${CATEGORIES.map(c => `<option value="${c.key}" ${isEdit && existing.category === c.key ? "selected" : ""}>${c.icon} ${c.label}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <label for="f-support">Support level</label>
          <select id="f-support">
            <option value="mild" ${isEdit && existing.supportLevel === "mild" ? "selected" : ""}>Mild</option>
            <option value="moderate" ${isEdit && existing.supportLevel === "moderate" ? "selected" : ""}>Moderate</option>
          </select>
        </div>
        <div class="form-row">
          <label for="f-notes">Teacher notes (optional)</label>
          <textarea id="f-notes" rows="3">${isEdit ? escapeHtml(existing.notes || "") : ""}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" id="modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? "Save Changes" : "Add Student"}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById("f-name").focus();

  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById("modal-cancel").addEventListener("click", () => overlay.remove());

  document.getElementById("student-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("f-name").value.trim();
    const age = +document.getElementById("f-age").value;
    const category = document.getElementById("f-category").value;
    const supportLevel = document.getElementById("f-support").value;
    const notes = document.getElementById("f-notes").value.trim();

    if (!name || !age){ showToast("Please fill in the student's name and age", "error"); return; }

    if (isEdit){
      updateStudent(existing.id, { name, age, category, supportLevel, notes });
      showToast("Student updated", "success");
    } else {
      addStudent({ name, age, category, supportLevel, notes });
      showToast("Student added", "success");
    }
    overlay.remove();
    // Refresh whichever view is currently visible
    if (window.location.hash.startsWith("#students") || window.location.hash === "") renderStudentsView();
    if (window.location.hash.startsWith("#dashboard")) renderDashboardView();
  });
}

function renderStudentProfileView(studentId){
  const el = document.getElementById("view-student-profile");
  const s = getStudent(studentId);
  if (!s){
    el.innerHTML = `<div class="empty-state"><span class="empty-emoji">🔍</span><p>Student not found.</p>
      <a href="#students" class="btn btn-primary">Back to Students</a></div>`;
    return;
  }
  const cat = findCategory(s.category);
  const sessions = getSessionsForStudent(s.id).sort((a,b) => b.date - a.date);
  const totalRounds = sessions.reduce((sum, x) => sum + (x.roundsCompleted || 0), 0);
  const avgAcc = sessions.length ? Math.round(sessions.reduce((sum,x) => sum + (x.accuracy||0), 0) / sessions.length) : 0;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1>${cat ? cat.icon : "🙂"} ${escapeHtml(s.name)}</h1>
        <p class="page-sub">Age ${s.age} · ${cat ? cat.label : "—"} ${supportBadge(s.supportLevel)}</p>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-secondary" id="profile-start-activity">▶️ Start Activity</button>
        <a href="#students" class="btn btn-outline">← Back</a>
      </div>
    </div>

    <div class="grid grid-3" style="margin-bottom:18px;">
      <div class="card stat-card"><div class="stat-icon">🎯</div><div class="stat-value">${sessions.length}</div><div class="stat-label">Activities Completed</div></div>
      <div class="card stat-card"><div class="stat-icon">🔁</div><div class="stat-value">${totalRounds}</div><div class="stat-label">Total Rounds</div></div>
      <div class="card stat-card"><div class="stat-icon">✅</div><div class="stat-value">${avgAcc}%</div><div class="stat-label">Average Accuracy</div></div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <h3>Teacher notes</h3>
        <p>${s.notes ? escapeHtml(s.notes) : "<em>No notes yet.</em>"}</p>
        <button class="btn btn-outline btn-sm" id="profile-edit">✏️ Edit Profile</button>
      </div>
      <div class="card">
        <h3>Recent activity</h3>
        ${sessions.length ? sessions.slice(0,5).map(sess => `
          <div class="session-row">
            <span>${escapeHtml(sess.activityName)}</span>
            <span>${new Date(sess.date).toLocaleDateString()} · ${sess.accuracy}%</span>
          </div>
        `).join("") : "<p><em>No sessions recorded yet.</em></p>"}
        <a href="#reports/${s.id}" class="btn btn-primary btn-sm" style="margin-top:10px;">📊 Full Report</a>
      </div>
    </div>
  `;

  document.getElementById("profile-start-activity").addEventListener("click", () => {
    window.location.hash = `#activities/${s.id}`;
  });
  document.getElementById("profile-edit").addEventListener("click", () => openStudentModal(s));
}
