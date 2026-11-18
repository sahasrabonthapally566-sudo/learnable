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
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  if (window.refreshNavLayout) window.refreshNavLayout();   // header is measurable now
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
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("nav-toggle");
  const backdrop = document.getElementById("nav-backdrop");
  const header = document.querySelector(".app-header");
  const smallScreen = window.matchMedia("(max-width: 900px)");

  /* On small screens the sidebar is a slide-out drawer (closed by default).
     On wide screens it is always docked, so "open" is simply always true. */
  // Measure the real header height (it is 0 while the login screen is showing).
  function updateHeaderHeight(){
    if (header.offsetHeight > 0) document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
  }
  window.refreshNavLayout = updateHeaderHeight;      // called again once the app shell is shown
  function setMenu(open){
    updateHeaderHeight();
    sidebar.classList.toggle("collapsed", !open);
    toggle.setAttribute("aria-expanded", String(open));
    backdrop.classList.toggle("show", open && smallScreen.matches);
    sidebar.inert = smallScreen.matches && !open;      // closed drawer isn't reachable by Tab
  }
  const isOpen = () => !sidebar.classList.contains("collapsed");
  function syncToScreen(){
    setMenu(!smallScreen.matches);                      // closed on phones, docked on desktop
  }

  toggle.addEventListener("click", () => setMenu(!isOpen()));

  // Choosing a section closes the drawer right away so the page behind is visible.
  // (Listening to the click, not the hash, also covers tapping the section you're already on.)
  sidebar.addEventListener("click", (e) => {
    if (e.target.closest("a") && smallScreen.matches) setMenu(false);
  });
  backdrop.addEventListener("click", () => setMenu(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && smallScreen.matches && isOpen()){ setMenu(false); toggle.focus(); }
  });
  smallScreen.addEventListener("change", syncToScreen);
  window.addEventListener("resize", updateHeaderHeight);
  syncToScreen();

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
