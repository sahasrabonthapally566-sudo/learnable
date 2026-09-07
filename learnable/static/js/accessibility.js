/* =========================================================
   LearnAble — accessibility.js
   Applies persisted accessibility settings to the document and
   renders the Accessibility + Settings pages.
========================================================= */

function applySettings(){
  const s = getSettings();
  document.documentElement.style.setProperty("--font-scale", s.fontScale);
  document.body.classList.toggle("high-contrast", !!s.highContrast);
  document.body.classList.toggle("reduced-motion", !!s.reducedMotion);
  return s;
}

function updateSetting(key, value){
  const s = getSettings();
  s[key] = value;
  saveSettings(s);
  applySettings();
}

function renderAccessibilityView(){
  const el = document.getElementById("view-accessibility");
  const s = getSettings();
  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1>♿ Accessibility</h1>
        <p class="page-sub">Make LearnAble comfortable for every teacher and student.</p>
      </div>
    </div>
    <div class="card">
      <div class="a11y-row">
        <div>
          <div class="a11y-label">🔠 Text size</div>
          <div class="a11y-desc">Increase or decrease text size across the whole app.</div>
        </div>
        <div class="font-size-controls">
          <button id="font-dec" aria-label="Decrease text size">A−</button>
          <span id="font-scale-label">${Math.round(s.fontScale * 100)}%</span>
          <button id="font-inc" aria-label="Increase text size">A+</button>
        </div>
      </div>

      <div class="a11y-row">
        <div>
          <div class="a11y-label">🌓 High contrast</div>
          <div class="a11y-desc">Stronger color contrast for easier reading.</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="toggle-contrast" ${s.highContrast ? "checked" : ""}>
          <span class="slider" role="presentation"></span>
        </label>
      </div>

      <div class="a11y-row">
        <div>
          <div class="a11y-label">🎞️ Reduced motion</div>
          <div class="a11y-desc">Minimize animations and transitions.</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="toggle-motion" ${s.reducedMotion ? "checked" : ""}>
          <span class="slider" role="presentation"></span>
        </label>
      </div>

      <div class="a11y-row">
        <div>
          <div class="a11y-label">🔊 Audio assistance</div>
          <div class="a11y-desc">Enable spoken words/instructions where an activity supports it.</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="toggle-audio" ${s.audioAssistance ? "checked" : ""}>
          <span class="slider" role="presentation"></span>
        </label>
      </div>

      <div class="a11y-row">
        <div>
          <div class="a11y-label">💬 Captions / text alternatives</div>
          <div class="a11y-desc">Show text alongside audio and icon-only content.</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="toggle-captions" ${s.captions ? "checked" : ""}>
          <span class="slider" role="presentation"></span>
        </label>
      </div>
    </div>

    <div class="card" style="margin-top:18px;">
      <h3>Built-in accessibility</h3>
      <ul>
        <li>Full keyboard navigation with visible focus outlines</li>
        <li>Large, touch-friendly buttons throughout every game</li>
        <li>No information is communicated by color alone (icons + text pairs)</li>
        <li>Simple, consistent navigation and layout on every page</li>
      </ul>
    </div>
  `;

  document.getElementById("font-inc").addEventListener("click", () => {
    const cur = getSettings().fontScale;
    updateSetting("fontScale", Math.min(1.6, +(cur + 0.1).toFixed(1)));
    document.getElementById("font-scale-label").textContent = Math.round(getSettings().fontScale * 100) + "%";
  });
  document.getElementById("font-dec").addEventListener("click", () => {
    const cur = getSettings().fontScale;
    updateSetting("fontScale", Math.max(0.8, +(cur - 0.1).toFixed(1)));
    document.getElementById("font-scale-label").textContent = Math.round(getSettings().fontScale * 100) + "%";
  });
  document.getElementById("toggle-contrast").addEventListener("change", e => updateSetting("highContrast", e.target.checked));
  document.getElementById("toggle-motion").addEventListener("change", e => updateSetting("reducedMotion", e.target.checked));
  document.getElementById("toggle-audio").addEventListener("change", e => updateSetting("audioAssistance", e.target.checked));
  document.getElementById("toggle-captions").addEventListener("change", e => updateSetting("captions", e.target.checked));
}

function renderSettingsView(){
  const el = document.getElementById("view-settings");
  const teacher = getTeacher() || { name: "Teacher" };
  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1>⚙️ Settings</h1>
        <p class="page-sub">Manage your LearnAble profile and demo data.</p>
      </div>
    </div>

    <div class="card">
      <h3>Teacher profile</h3>
      <div class="form-row">
        <label for="settings-teacher-name">Display name</label>
        <input id="settings-teacher-name" type="text" value="${escapeHtml(teacher.name)}">
      </div>
      <button id="save-teacher-name" class="btn btn-primary">Save name</button>
    </div>

    <div class="card" style="margin-top:18px;">
      <h3>Demo data</h3>
      <p class="page-sub" style="margin-top:0;">This prototype stores everything in your browser (localStorage). You can reset it back to the original demo students and history at any time.</p>
      <button id="reset-demo-data" class="btn btn-outline">🔄 Reset demo data</button>
    </div>

    <div class="card" style="margin-top:18px;">
      <h3>About LearnAble</h3>
      <p class="page-sub" style="margin-top:0;">LearnAble is a teacher-led prototype that helps you assign adaptive learning activities and track performance for children with learning differences. Learning Performance scores are explainable and based only on activity data — LearnAble never provides a medical diagnosis or clinical assessment.</p>
    </div>
  `;

  document.getElementById("save-teacher-name").addEventListener("click", () => {
    const name = document.getElementById("settings-teacher-name").value.trim() || "Teacher";
    setTeacher(name);
    document.getElementById("header-teacher-name").textContent = name;
    showToast("Profile updated", "success");
  });

  document.getElementById("reset-demo-data").addEventListener("click", () => {
    if (!confirm("This will erase all current students and history and restore the original demo data. Continue?")) return;
    localStorage.removeItem(LA_KEYS.students);
    localStorage.removeItem(LA_KEYS.sessions);
    localStorage.removeItem(LA_KEYS.seeded);
    seedDemoDataIfNeeded();
    showToast("Demo data has been reset", "success");
    navigateTo("dashboard");
  });
}
