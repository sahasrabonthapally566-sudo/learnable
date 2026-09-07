/* =========================================================
   LearnAble — app.js
   Login flow, hash router, navigation wiring, and small shared
   utilities used across the other modules.
========================================================= */

function escapeHtml(str){
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function showToast(message, type){
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type || ""}`;
  toast.classList.remove("hidden");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.add("hidden"), 2600);
}

function navigateTo(route){
  window.location.hash = `#${route}`;
}

const VIEW_IDS = ["dashboard","students","student-profile","activities","game-setup","game-play","reports","accessibility","settings"];

function showView(viewKey){
  VIEW_IDS.forEach(id => {
    const el = document.getElementById(`view-${id}`);
    if (el) el.classList.toggle("hidden", id !== viewKey);
  });
  document.getElementById("main-content").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: getSettings().reducedMotion ? "auto" : "smooth" });
}

function setActiveNav(routeKey){
  document.querySelectorAll("[data-route]").forEach(a => {
    a.classList.toggle("active", a.dataset.route === routeKey);
  });
}

/* ---------------- Router ---------------- */

function handleRoute(){
  const hash = window.location.hash.replace(/^#/, "");
  const [path, a, b] = hash.split("/");
  const route = path || "dashboard";

  switch (route){
    case "dashboard":
      renderDashboardView(); showView("dashboard"); setActiveNav("dashboard"); break;
    case "students":
      renderStudentsView(); showView("students"); setActiveNav("students"); break;
    case "student":
      renderStudentProfileView(a); showView("student-profile"); setActiveNav("students"); break;
    case "activities":
      renderActivitiesView(a); showView("activities"); setActiveNav("activities"); break;
    case "play":
      startGameFlow(a, b); showView("game-play"); setActiveNav("activities"); break;
    case "reports":
      renderReportsView(a); showView("reports"); setActiveNav("reports"); break;
    case "accessibility":
      renderAccessibilityView(); showView("accessibility"); setActiveNav("accessibility"); break;
    case "settings":
      renderSettingsView(); showView("settings"); setActiveNav("settings"); break;
    default:
      renderDashboardView(); showView("dashboard"); setActiveNav("dashboard");
  }
}

/* ---------------- Login ---------------- */

function showAppShell(){
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app-shell").classList.remove("hidden");
  const teacher = getTeacher();
  document.getElementById("header-teacher-name").textContent = teacher ? teacher.name : "Teacher";
  handleRoute();
}

function initLogin(){
  const teacher = getTeacher();
  if (teacher){
    showAppShell();
    return;
  }
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("teacher-name").value.trim() || "Teacher";
    setTeacher(name);
    showAppShell();
  });
}

/* ---------------- Nav wiring ---------------- */

function initNav(){
  document.getElementById("nav-toggle").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const collapsed = sidebar.classList.toggle("collapsed");
    document.getElementById("nav-toggle").setAttribute("aria-expanded", String(!collapsed));
  });

  const profileBtn = document.getElementById("profile-btn");
  const dropdown = document.getElementById("profile-dropdown");
  profileBtn.addEventListener("click", () => {
    const expanded = profileBtn.getAttribute("aria-expanded") === "true";
    profileBtn.setAttribute("aria-expanded", String(!expanded));
    dropdown.classList.toggle("hidden");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".profile-menu")){
      dropdown.classList.add("hidden");
      profileBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    clearTeacher();
    document.getElementById("app-shell").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
  });
}

/* ---------------- Init ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  seedDemoDataIfNeeded();
  applySettings();
  initLogin();
  initNav();
  window.addEventListener("hashchange", handleRoute);

  if ("serviceWorker" in navigator){
    navigator.serviceWorker.register("/static/service-worker.js").catch(() => {
      // Offline support is a nice-to-have for this prototype; ignore failures (e.g. file:// usage).
    });
  }
});
