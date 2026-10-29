/* =========================================================
   LearnAble — games.js  (Part 1 of 2)
   Activity Library, game setup/teacher-mode flow, and the shared
   round harness used by every playable game. Individual game
   implementations live in the GAMES object at the bottom of Part 2.
========================================================= */

/* ---------------- Activity Library ---------------- */
/* Activities are only shown once a specific student is selected, and only
   that student's own activities (their learning category) are listed. */

function renderActivitiesView(selectedStudentId){
  const el = document.getElementById("view-activities");
  const students = getStudents();
  const student = selectedStudentId ? getStudent(selectedStudentId) : null;
  const category = student ? findCategory(student.category) : null;

  const subtitle = student
    ? `Choose an activity for <strong>${escapeHtml(student.name)}</strong>.`
    : "Select a student to see their activities.";

  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1>🎯 Activity Library</h1>
        <p class="page-sub">${subtitle}</p>
      </div>
      ${students.length ? `
      <div class="form-row" style="min-width:220px;">
        <label for="activity-student-select">Select student</label>
        <select id="activity-student-select">
          <option value="" ${student ? "" : "selected"}>— Choose a student —</option>
          ${students.map(s => `<option value="${s.id}" ${student && s.id === student.id ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}
        </select>
      </div>` : ""}
    </div>
    <div id="activity-categories"></div>
  `;

  const wrap = document.getElementById("activity-categories");

  if (!students.length){
    wrap.innerHTML = `<div class="empty-state"><span class="empty-emoji">🧸</span>
      <p>No students yet. Add a student to see their activities.</p>
      <a href="#students" class="btn btn-primary">Go to Students</a></div>`;
    return;
  }

  const select = document.getElementById("activity-student-select");
  select.addEventListener("change", () => {
    window.location.hash = select.value ? `#activities/${select.value}` : "#activities";
  });

  if (!student){
    wrap.innerHTML = `<div class="empty-state"><span class="empty-emoji">👆</span>
      <p>Choose a student above to see the activities for them.</p></div>`;
    return;
  }

  if (!category){
    wrap.innerHTML = `<div class="empty-state"><span class="empty-emoji">🤔</span>
      <p>${escapeHtml(student.name)} doesn't have a learning category yet. Edit their profile to choose one.</p>
      <a href="#student/${student.id}" class="btn btn-primary">Open profile</a></div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="category-block">
      <h2 class="category-title">${category.icon} ${category.label} activities for ${escapeHtml(student.name)}</h2>
      <div class="grid grid-4">
        ${category.activities.map(act => `
          <div class="card activity-tile ${act.playable ? "playable" : "soon"}">
            <div class="emoji">${act.playable ? "🟢" : "⏳"}</div>
            <div style="font-weight:700;">${escapeHtml(act.name)}</div>
            ${act.playable
              ? `<button class="btn btn-primary btn-sm" data-activity="${act.id}">▶️ Play</button>`
              : `<span class="badge badge-soon">Coming Soon</span>`}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-activity]");
    if (!btn) return;
    window.location.hash = `#play/${btn.dataset.activity}/${student.id}`;
  });
}

/* ---------------- Text-to-speech helper ---------------- */

function speak(text){
  try{
    if (!getSettings().audioAssistance) return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }catch(e){ /* fail silently — captions/text remain visible */ }
}

/* ---------------- Game setup + teacher-mode flow ---------------- */

const TEACHER_MODE_EXCLUDED = ["animalSounds", "visualStorytelling"];

function startGameFlow(activityId, studentId){
  const activity = findActivity(activityId);
  const student = getStudent(studentId);
  const el = document.getElementById("view-game-play");

  if (!activity || !activity.playable){
    el.innerHTML = `<div class="empty-state"><span class="empty-emoji">🚧</span><p>This activity is coming soon!</p><a href="#activities" class="btn btn-primary">Back to Activities</a></div>`;
    return;
  }
  if (!student){
    el.innerHTML = `<div class="empty-state"><span class="empty-emoji">🔍</span><p>Student not found.</p><a href="#students" class="btn btn-primary">Back to Students</a></div>`;
    return;
  }

  const gameDef = GAMES[activity.gameKey];
  const isDuration = gameDef.setupType === "duration";
  const options = isDuration ? [30, 60, 90, 120] : [5, 10, 15, 20];
  let selected = options[1];

  const teacherModeEligible = !TEACHER_MODE_EXCLUDED.includes(activity.gameKey) && student.supportLevel === "moderate";

  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1>${activity.categoryIcon} ${escapeHtml(activity.name)}</h1>
        <p class="page-sub">Setting up for <strong>${escapeHtml(student.name)}</strong> · ${supportBadge(student.supportLevel)}</p>
      </div>
      <a href="#activities/${student.id}" class="btn btn-outline">← Back to Library</a>
    </div>

    <div class="card">
      <h3>${isDuration ? "⏱️ Choose activity duration" : "🔁 Choose number of rounds"}</h3>
      <p class="page-sub" style="margin-top:-6px;">Pick what fits the time available today.</p>
      <div class="setup-config" id="setup-chips" role="group" aria-label="${isDuration ? "Duration in seconds" : "Number of rounds"}">
        ${options.map((o, i) => `<button class="chip ${i === 1 ? "selected" : ""}" data-value="${o}">${o}${isDuration ? "s" : " rounds"}</button>`).join("")}
      </div>
    </div>

    ${teacherModeEligible ? `
    <div class="card" style="margin-top:16px;">
      <h3>👩‍🏫 Teacher Mode available</h3>
      <p class="page-sub" style="margin-top:-6px;">${escapeHtml(student.name)} uses <strong>Moderate</strong> support. You can demonstrate the activity first, then hand it to the student.</p>
    </div>` : ""}

    <div class="form-actions" style="justify-content:flex-start; margin-top:20px;">
      ${teacherModeEligible ? `<button class="btn btn-secondary btn-large" id="btn-teacher-demo" style="max-width:280px;">👩‍🏫 Start with Teacher Demo</button>` : ""}
      <button class="btn btn-primary btn-large" id="btn-start-student" style="max-width:280px;">${teacherModeEligible ? "▶️ Skip to Student Mode" : "▶️ Start Activity"}</button>
    </div>
  `;

  document.getElementById("setup-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    document.querySelectorAll("#setup-chips .chip").forEach(c => c.classList.remove("selected"));
    chip.classList.add("selected");
    selected = +chip.dataset.value;
  });

  function buildCtx(){
    return {
      student, activity, gameKey: activity.gameKey,
      rounds: isDuration ? null : selected,
      durationSeconds: isDuration ? selected : null,
      stats: { correct: 0, incorrect: 0, missed: 0, responseTimes: [], hintsUsed: 0, teacherDemonstrations: 0 },
      startedAt: Date.now()
    };
  }

  const startBtn = document.getElementById("btn-start-student");
  startBtn.addEventListener("click", () => launchGame(buildCtx()));

  const demoBtn = document.getElementById("btn-teacher-demo");
  if (demoBtn){
    demoBtn.addEventListener("click", () => showTeacherDemoScreen(buildCtx()));
  }
}

function showTeacherDemoScreen(ctx){
  const el = document.getElementById("view-game-play");
  el.innerHTML = `
    <div class="game-topbar">
      <div class="gt-left">🦉 LearnAble · ${escapeHtml(ctx.student.name)} · ${escapeHtml(ctx.activity.name)}</div>
      <div class="gt-round">Teacher Demo</div>
    </div>
    <div class="game-stage">
      <div style="font-size:3rem;">👩‍🏫✨</div>
      <p class="game-instructions">Demonstrate the activity to ${escapeHtml(ctx.student.name)} now. When you're finished, mark the demonstration complete.</p>
      <button class="btn btn-success btn-large" id="demo-complete" style="max-width:320px;">✅ Demonstration Complete</button>
    </div>
  `;
  document.getElementById("demo-complete").addEventListener("click", () => {
    ctx.stats.teacherDemonstrations += 1;
    showToast("Teacher demonstration recorded", "success");
    launchGame(ctx);
  });
}

function launchGame(ctx){
  ctx.startedAt = Date.now();
  const gameDef = GAMES[ctx.gameKey];
  gameDef.start(ctx);
}

/* ---------------- Shared game shell + round harness ---------------- */

function gameTopbar(ctx, roundLabel){
  return `
    <div class="game-topbar">
      <div class="gt-left">🦉 LearnAble · ${escapeHtml(ctx.student.name)} · ${escapeHtml(ctx.activity.name)}</div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="gt-round">${roundLabel}</span>
        <button class="btn btn-outline btn-sm" id="game-exit-btn">✖ Exit</button>
      </div>
    </div>
  `;
}

function wireExitButton(ctx){
  const btn = document.getElementById("game-exit-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (confirm("Exit this activity? Progress so far will not be saved.")){
      window.speechSynthesis && window.speechSynthesis.cancel();
      window.location.hash = `#activities/${ctx.student.id}`;
    }
  });
}

function renderStage(ctx, roundLabel, stageHtml, bottomHtml){
  const el = document.getElementById("view-game-play");
  el.innerHTML = `
    ${gameTopbar(ctx, roundLabel)}
    <div class="game-stage" id="game-stage">${stageHtml}</div>
    <div class="game-bottom">${bottomHtml || ""}</div>
  `;
  wireExitButton(ctx);
  return document.getElementById("game-stage");
}

function showFeedbackThen(stageEl, correct, cb){
  const s = getSettings();
  const banner = document.createElement("div");
  banner.className = `feedback-banner ${correct ? "good" : "meh"}`;
  banner.textContent = correct
    ? pick(["Great job! 🌟", "Excellent! 🎉", "You got it! 👏"])
    : pick(["Good effort! Let's try the next one! 💪", "Keep going, you're learning! 🌱"]);
  stageEl.appendChild(banner);
  setTimeout(cb, s.reducedMotion ? 500 : 1100);
}

function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr){ const a = [...arr]; for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i+1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function sample(arr, n){ return shuffle(arr).slice(0, n); }

/* Runs a round-based game. roundFn(ctx, roundNumber, stageEl) must call
   ctx.onRoundResult({correct, missed, responseTime, hintUsed}) exactly once. */
function runRounds(ctx, roundFn){
  let round = 0;
  function nextRound(){
    round++;
    if (round > ctx.rounds){ finishSession(ctx); return; }
    const stageEl = renderStage(ctx, `Round ${round} / ${ctx.rounds}`, "");
    ctx.onRoundResult = (result) => {
      if (result.correct) ctx.stats.correct++;
      else if (result.missed) ctx.stats.missed++;
      else ctx.stats.incorrect++;
      if (result.responseTime) ctx.stats.responseTimes.push(result.responseTime);
      if (result.hintUsed) ctx.stats.hintsUsed++;
      showFeedbackThen(stageEl, !!result.correct, nextRound);
    };
    roundFn(ctx, round, stageEl);
  }
  nextRound();
}

function finishSession(ctx){
  window.speechSynthesis && window.speechSynthesis.cancel();
  const totalAttempts = ctx.stats.correct + ctx.stats.incorrect + ctx.stats.missed;
  const accuracy = totalAttempts ? Math.round((ctx.stats.correct / totalAttempts) * 100) : 0;
  const avgResponseTime = ctx.stats.responseTimes.length
    ? +(ctx.stats.responseTimes.reduce((a,b) => a+b, 0) / ctx.stats.responseTimes.length).toFixed(2)
    : 0;
  const durationSeconds = Math.round((Date.now() - ctx.startedAt) / 1000);

  const session = addSession({
    studentId: ctx.student.id,
    studentName: ctx.student.name,
    categoryKey: ctx.activity.categoryKey,
    activityId: ctx.activity.id,
    activityName: ctx.activity.name,
    supportLevel: ctx.student.supportLevel,
    roundsConfigured: ctx.rounds || null,
    roundsCompleted: totalAttempts,
    correct: ctx.stats.correct,
    incorrect: ctx.stats.incorrect,
    missed: ctx.stats.missed,
    accuracy,
    avgResponseTime,
    hintsUsed: ctx.stats.hintsUsed,
    teacherDemonstrations: ctx.stats.teacherDemonstrations,
    durationSeconds
  });

  renderSessionSummary(ctx, session, accuracy);
}

function learningRecommendation(accuracy){
  if (accuracy >= 80) return { label: "Strong performance", text: "Try a slightly more challenging activity.", cls: "good" };
  if (accuracy >= 55) return { label: "Developing", text: "Continue practicing at the current level.", cls: "meh" };
  return { label: "Needs support", text: "Consider additional teacher guidance.", cls: "meh" };
}

function renderSessionSummary(ctx, session, accuracy){
  const el = document.getElementById("view-game-play");
  const rec = learningRecommendation(accuracy);
  el.innerHTML = `
    <div class="game-stage" style="min-height:300px;">
      <div style="font-size:3.4rem;">🎉</div>
      <h2>Activity Complete!</h2>
      <p class="game-instructions">${escapeHtml(ctx.student.name)} finished <strong>${escapeHtml(ctx.activity.name)}</strong>.</p>
      <div class="grid grid-3" style="width:100%; max-width:520px;">
        <div class="card stat-card"><div class="stat-value">${accuracy}%</div><div class="stat-label">Accuracy</div></div>
        <div class="card stat-card"><div class="stat-value">${session.correct}</div><div class="stat-label">Correct</div></div>
        <div class="card stat-card"><div class="stat-value">${session.avgResponseTime}s</div><div class="stat-label">Avg. Response</div></div>
      </div>
      <div class="feedback-banner ${rec.cls}" style="max-width:480px;">
        📈 <strong>Learning Performance — ${rec.label}:</strong> ${rec.text}
        <div style="font-size:0.78rem; font-weight:500; margin-top:6px;">Not a diagnosis — a transparent summary of this activity's data. The teacher decides what happens next.</div>
      </div>
      <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
        <button class="btn btn-primary" id="summary-again">🔁 Play Again</button>
        <button class="btn btn-secondary" id="summary-report">📊 View Report</button>
        <a href="#dashboard" class="btn btn-outline">🏠 Dashboard</a>
      </div>
    </div>
  `;
  document.getElementById("summary-again").addEventListener("click", () => {
    // The URL is already #play/<activity>/<student>, so re-assigning the hash
    // would not fire hashchange. Restart the setup screen directly instead.
    startGameFlow(ctx.activity.id, ctx.student.id);
  });
  document.getElementById("summary-report").addEventListener("click", () => {
    window.location.hash = `#reports/${ctx.student.id}`;
  });
}

/* =========================================================
   LearnAble — games.js  (Part 2 of 2)
   The 8 fully playable game implementations.
========================================================= */

const OBJECT_POOL = [
  { word: "CHAIR", emoji: "🪑" }, { word: "TOOTHBRUSH", emoji: "🪥" },
  { word: "SPOON", emoji: "🥄" }, { word: "SOAP", emoji: "🧼" },
  { word: "BOTTLE", emoji: "🍼" }, { word: "BOOK", emoji: "📖" },
  { word: "BALL", emoji: "⚽" }, { word: "CUP", emoji: "☕" },
  { word: "SOCK", emoji: "🧦" }
];

const SOUND_WORD_POOL = [
  { word: "APPLE", emoji: "🍎" }, { word: "BANANA", emoji: "🍌" },
  { word: "CAT", emoji: "🐱" }, { word: "DOG", emoji: "🐶" },
  { word: "SUN", emoji: "☀️" }, { word: "BALL", emoji: "⚽" },
  { word: "BOOK", emoji: "📖" }, { word: "HOUSE", emoji: "🏠" },
  { word: "FISH", emoji: "🐟" }, { word: "TREE", emoji: "🌳" }
];

const COUNT_OBJECT_POOL = [
  { name: "apples", emoji: "🍎" }, { name: "bananas", emoji: "🍌" },
  { name: "umbrellas", emoji: "☂️" }, { name: "stars", emoji: "⭐" },
  { name: "balls", emoji: "⚽" }, { name: "flowers", emoji: "🌸" }
];

const ANIMAL_SOUND_POOL = [
  { name: "Dog", emoji: "🐶", sound: "Woof! Woof!" },
  { name: "Cat", emoji: "🐱", sound: "Meow!" },
  { name: "Cow", emoji: "🐮", sound: "Moo!" },
  { name: "Lion", emoji: "🦁", sound: "Roar!" },
  { name: "Elephant", emoji: "🐘", sound: "Toot!" },
  { name: "Bird", emoji: "🐦", sound: "Tweet tweet!" },
  { name: "Horse", emoji: "🐴", sound: "Neigh!" }
];

const VISUAL_STORY_POOL = [
  { name: "Sun", emoji: "☀️" }, { name: "Moon", emoji: "🌙" },
  { name: "Flowers", emoji: "💐" }, { name: "Fruits", emoji: "🍇" },
  { name: "House", emoji: "🏠" }, { name: "Bird", emoji: "🐦" },
  { name: "Tree", emoji: "🌳" }, { name: "Ball", emoji: "⚽" }
];

const TRACE_COLORS = [
  { name: "PINK", hex: "#f19bc4" }, { name: "RED", hex: "#e8695f" },
  { name: "BLUE", hex: "#6ea8d8" }, { name: "YELLOW", hex: "#f5c451" }
];

const LETTER_POOL = ["A","B","C","D","E","F","G","H"];

const GAMES = {};

/* ---------- 1. AUTISM — Regular Things ---------- */
GAMES.regularThings = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => {
      const target = pick(OBJECT_POOL);
      const distractors = sample(OBJECT_POOL.filter(o => o.word !== target.word), 5);
      const tiles = shuffle([target, ...distractors]);
      stageEl.innerHTML = `
        <p class="game-instructions">Tap the picture that matches the word:</p>
        <div class="game-word">${target.word}</div>
        <div class="tap-grid" id="rt-grid">
          ${tiles.map(t => `<button class="tap-item" data-word="${t.word}" aria-label="${t.word}">${t.emoji}</button>`).join("")}
        </div>
      `;
      const startTime = Date.now();
      document.getElementById("rt-grid").addEventListener("click", (e) => {
        const btn = e.target.closest(".tap-item");
        if (!btn) return;
        const correct = btn.dataset.word === target.word;
        btn.classList.add(correct ? "correct-flash" : "incorrect-flash");
        document.querySelectorAll("#rt-grid .tap-item").forEach(b => b.disabled = true);
        ctx.onRoundResult({ correct, responseTime: +((Date.now() - startTime)/1000).toFixed(2) });
      }, { once: false });
    });
  }
};

/* ---------- 2. ADHD — Sack Bear ---------- */
GAMES.sackBear = {
  setupType: "duration",
  start(ctx){
    const el = document.getElementById("view-game-play");
    const maxResponseMs = ctx.student.supportLevel === "moderate" ? 2000 : 1500;
    const endAt = Date.now() + ctx.durationSeconds * 1000;
    let roundNum = 0;
    let awaitingClick = false;
    let roundTimer, tickTimer, targetHole = null;

    function renderBoard(secondsLeft){
      return `
        <p class="game-instructions">Tap the hole where 🐻 pops up before time runs out!</p>
        <div class="sack-target" id="sack-target-label">Watching for the bear...</div>
        <div class="sack-grid" id="sack-grid">
          ${Array.from({length:9}, (_,i) => `<div class="sack-hole" data-pos="${i+1}"><span class="hole-num">${i+1}</span></div>`).join("")}
        </div>
        <div style="font-size:0.85rem; color:var(--color-text-soft);">Time remaining in game: ${secondsLeft}s</div>
      `;
    }

    function tickOverallTimer(){
      const secondsLeft = Math.max(0, Math.round((endAt - Date.now())/1000));
      const label = document.querySelector("#game-stage")?.lastElementChild;
      if (label) label.textContent = `Time remaining in game: ${secondsLeft}s`;
      if (Date.now() >= endAt){
        clearInterval(tickTimer);
        clearTimeout(roundTimer);
        finishSession(ctx);
        return;
      }
    }

    function nextTarget(stageEl){
      if (Date.now() >= endAt){ clearInterval(tickTimer); finishSession(ctx); return; }
      roundNum++;
      targetHole = 1 + Math.floor(Math.random() * 9);
      const holes = stageEl.querySelectorAll(".sack-hole");
      holes.forEach(h => h.classList.remove("active"));
      const activeHole = stageEl.querySelector(`.sack-hole[data-pos="${targetHole}"]`);
      activeHole.classList.add("active");
      activeHole.innerHTML = `<span class="peek">🐻</span>`;
      document.getElementById("sack-target-label").textContent = `Target: ${targetHole}`;
      const shownAt = Date.now();
      awaitingClick = true;

      roundTimer = setTimeout(() => {
        if (!awaitingClick) return;
        awaitingClick = false;
        ctx.stats.missed++;
        activeHole.innerHTML = `<span class="hole-num">${targetHole}</span>`;
        activeHole.classList.remove("active");
        setTimeout(() => nextTarget(stageEl), 1000);
      }, maxResponseMs);

      stageEl.onclick = (e) => {
        const hole = e.target.closest(".sack-hole");
        if (!hole || !awaitingClick) return;
        awaitingClick = false;
        clearTimeout(roundTimer);
        const tappedPos = +hole.dataset.pos;
        const correct = tappedPos === targetHole;
        const rt = +((Date.now() - shownAt)/1000).toFixed(2);
        ctx.stats.responseTimes.push(rt);
        if (correct) ctx.stats.correct++; else ctx.stats.incorrect++;
        holes.forEach(h => { h.classList.remove("active"); h.innerHTML = `<span class="hole-num">${h.dataset.pos}</span>`; });
        setTimeout(() => nextTarget(stageEl), 1000);
      };
    }

    const stageEl = renderStage(ctx, `⏱ ${ctx.durationSeconds}s game`, renderBoard(ctx.durationSeconds));
    tickTimer = setInterval(tickOverallTimer, 500);
    nextTarget(stageEl);
  }
};

/* ---------- 3. DYSLEXIA — Word Recognition by Sound ---------- */
GAMES.wordRecognition = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => {
      const target = pick(SOUND_WORD_POOL);
      const distractors = sample(SOUND_WORD_POOL.filter(w => w.word !== target.word), 3);
      const options = shuffle([target, ...distractors]);
      stageEl.innerHTML = `
        <p class="game-instructions">Listen carefully, then tap the word you heard.</p>
        <button class="btn btn-accent btn-large" id="wr-replay" style="max-width:220px;">🔊 Play Word</button>
        <div class="option-grid" id="wr-options">
          ${options.map(o => `<button class="option-btn" data-word="${o.word}">${o.word}</button>`).join("")}
        </div>
      `;
      let startTime = Date.now();
      const playWord = () => { speak(target.word); startTime = Date.now(); };
      playWord();
      document.getElementById("wr-replay").addEventListener("click", playWord);
      document.getElementById("wr-options").addEventListener("click", (e) => {
        const btn = e.target.closest(".option-btn");
        if (!btn) return;
        const correct = btn.dataset.word === target.word;
        btn.classList.add(correct ? "correct-flash" : "incorrect-flash");
        document.querySelectorAll("#wr-options .option-btn").forEach(b => b.disabled = true);
        ctx.onRoundResult({ correct, responseTime: +((Date.now() - startTime)/1000).toFixed(2) });
      });
    });
  }
};

/* ---------- 4. DYSCALCULIA — Counting Objects ---------- */
GAMES.countingObjects = {
  setupType: "rounds",
  start(ctx){
    const mild = ctx.student.supportLevel === "mild";
    runRounds(ctx, (ctx, round, stageEl) => {
      const obj = pick(COUNT_OBJECT_POOL);
      const count = 3 + Math.floor(Math.random() * 8); // 3-10
      const questionText = mild
        ? pick([`How many ${obj.name}?`, `How many objects can you count?`])
        : `How many ${obj.name}?`;

      const distractorSet = new Set([count]);
      while (distractorSet.size < 4){
        const d = Math.max(1, count + (Math.floor(Math.random()*5) - 2));
        distractorSet.add(d);
      }
      const options = shuffle([...distractorSet]);

      const objectsHtml = Array.from({length: count}, () => {
        const style = mild
          ? `position:relative; top:${Math.floor(Math.random()*14 - 7)}px; left:${Math.floor(Math.random()*14 - 7)}px;`
          : "";
        return `<span style="${style}">${obj.emoji}</span>`;
      }).join("");

      stageEl.innerHTML = `
        <p class="game-instructions">${questionText}</p>
        <div class="counting-objects ${mild ? "scattered" : ""}">${objectsHtml}</div>
        <div class="option-grid" id="co-options">
          ${options.map(o => `<button class="option-btn" data-val="${o}">${o}</button>`).join("")}
        </div>
      `;
      const startTime = Date.now();
      document.getElementById("co-options").addEventListener("click", (e) => {
        const btn = e.target.closest(".option-btn");
        if (!btn) return;
        const correct = +btn.dataset.val === count;
        btn.classList.add(correct ? "correct-flash" : "incorrect-flash");
        document.querySelectorAll("#co-options .option-btn").forEach(b => b.disabled = true);
        ctx.onRoundResult({ correct, responseTime: +((Date.now() - startTime)/1000).toFixed(2) });
      });
    });
  }
};

/* ---------- 5. DYSPRAXIA — Shape Tracing ---------- */
function shapeSamplePoints(shape, w, h){
  const pts = [];
  const cx = w/2, cy = h/2;
  if (shape === "circle"){
    const r = Math.min(w,h)/2 - 20;
    for (let a = 0; a < 360; a += 6) pts.push([cx + r*Math.cos(a*Math.PI/180), cy + r*Math.sin(a*Math.PI/180)]);
  } else if (shape === "square" || shape === "rectangle"){
    const rw = shape === "square" ? Math.min(w,h)-60 : w-60, rh = shape === "square" ? Math.min(w,h)-60 : h-100;
    const x0 = cx - rw/2, y0 = cy - rh/2;
    for (let t=0;t<=1;t+=0.02){ pts.push([x0+t*rw, y0]); pts.push([x0+t*rw, y0+rh]); pts.push([x0, y0+t*rh]); pts.push([x0+rw, y0+t*rh]); }
  } else if (shape === "triangle"){
    const p1=[cx, cy-90], p2=[cx-100, cy+70], p3=[cx+100, cy+70];
    [[p1,p2],[p2,p3],[p3,p1]].forEach(([a,b]) => { for (let t=0;t<=1;t+=0.03) pts.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t]); });
  }
  return pts;
}
function drawDottedShape(cctx, shape, w, h){
  cctx.save();
  cctx.setLineDash([8,8]);
  cctx.strokeStyle = "#c9bfa8";
  cctx.lineWidth = 3;
  cctx.beginPath();
  const cx=w/2, cy=h/2;
  if (shape === "circle"){ cctx.arc(cx, cy, Math.min(w,h)/2-20, 0, Math.PI*2); }
  else if (shape === "square"){ const s=Math.min(w,h)-60; cctx.rect(cx-s/2, cy-s/2, s, s); }
  else if (shape === "rectangle"){ cctx.rect(cx-(w-60)/2, cy-(h-100)/2, w-60, h-100); }
  else if (shape === "triangle"){ cctx.moveTo(cx, cy-90); cctx.lineTo(cx-100, cy+70); cctx.lineTo(cx+100, cy+70); cctx.closePath(); }
  cctx.stroke();
  cctx.restore();
}

GAMES.shapeTracing = {
  setupType: "rounds",
  start(ctx){
    const shapes = ["circle", "square", "triangle", "rectangle"];
    runRounds(ctx, (ctx, round, stageEl) => {
      const shape = shapes[(round-1) % shapes.length];
      stageEl.innerHTML = `
        <p class="game-instructions">Trace the dotted ${shape} with your mouse or finger.</p>
        <canvas id="trace-canvas" class="trace-canvas" width="360" height="300"></canvas>
        <button class="btn btn-primary" id="trace-done">✅ Done Tracing</button>
      `;
      const canvas = document.getElementById("trace-canvas");
      const c2d = canvas.getContext("2d");
      drawDottedShape(c2d, shape, canvas.width, canvas.height);
      c2d.strokeStyle = "#6ea8d8";
      c2d.lineWidth = 5;
      c2d.lineCap = "round";

      const samplePoints = shapeSamplePoints(shape, canvas.width, canvas.height);
      const drawnPoints = [];
      let drawing = false;
      const startTime = Date.now();

      function pos(e){
        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
        const cy = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
        return [cx, cy];
      }
      canvas.addEventListener("pointerdown", (e) => {
        drawing = true;
        const [x,y] = pos(e);
        c2d.beginPath(); c2d.moveTo(x,y);
        drawnPoints.push([x,y]);
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!drawing) return;
        const [x,y] = pos(e);
        c2d.lineTo(x,y); c2d.stroke();
        drawnPoints.push([x,y]);
      });
      window.addEventListener("pointerup", () => { drawing = false; }, { once: true });

      document.getElementById("trace-done").addEventListener("click", () => {
        let covered = 0;
        if (drawnPoints.length > 3){
          samplePoints.forEach(sp => {
            const near = drawnPoints.some(dp => Math.hypot(dp[0]-sp[0], dp[1]-sp[1]) < 22);
            if (near) covered++;
          });
        }
        const coverage = samplePoints.length ? covered / samplePoints.length : 0;
        const correct = coverage >= 0.35;
        const missed = drawnPoints.length < 3;
        ctx.onRoundResult({ correct: !missed && correct, missed, responseTime: +((Date.now()-startTime)/1000).toFixed(2) });
      });
    });
  }
};

/* ---------- 6. VISUAL IMPAIRMENT — Animal Sounds (teacher-evaluated) ---------- */
GAMES.animalSounds = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => {
      const animal = pick(ANIMAL_SOUND_POOL);
      stageEl.innerHTML = `
        <p class="game-instructions">Play the sound. Ask the student: "What animal makes this sound?"</p>
        <button class="btn btn-accent btn-large" id="as-play" style="max-width:240px;">🔊 Play Animal Sound</button>
        <div class="hint-box">Teacher hint (not shown to student): <strong>${animal.name}</strong> ${animal.emoji}</div>
        <p class="game-instructions">Listen to the student's spoken answer, then mark the result:</p>
        <div class="evaluator-buttons">
          <button class="btn btn-success btn-large" id="as-correct">✅ Correct</button>
          <button class="btn btn-error btn-large" id="as-incorrect">❌ Incorrect</button>
        </div>
      `;
      const startTime = Date.now();
      const playSound = () => speak(animal.sound);
      document.getElementById("as-play").addEventListener("click", playSound);
      playSound();
      const finishRound = (correct) => {
        ctx.onRoundResult({ correct, responseTime: +((Date.now()-startTime)/1000).toFixed(2) });
      };
      document.getElementById("as-correct").addEventListener("click", () => finishRound(true));
      document.getElementById("as-incorrect").addEventListener("click", () => finishRound(false));
    });
  }
};

/* ---------- 7. HEARING IMPAIRMENT — Visual Storytelling (teacher-evaluated) ---------- */
GAMES.visualStorytelling = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => {
      const item = pick(VISUAL_STORY_POOL);
      stageEl.innerHTML = `
        <p class="game-instructions">Show the picture. Ask the student to respond using sign language.</p>
        <div class="big-emoji">${item.emoji}</div>
        <div class="hint-box">Picture: <strong>${item.name}</strong></div>
        <p class="game-instructions">Evaluate the student's signed response:</p>
        <div class="evaluator-buttons">
          <button class="btn btn-success btn-large" id="vs-correct">✅ Correct</button>
          <button class="btn btn-error btn-large" id="vs-incorrect">❌ Incorrect</button>
        </div>
      `;
      const startTime = Date.now();
      const finishRound = (correct) => ctx.onRoundResult({ correct, responseTime: +((Date.now()-startTime)/1000).toFixed(2) });
      document.getElementById("vs-correct").addEventListener("click", () => finishRound(true));
      document.getElementById("vs-incorrect").addEventListener("click", () => finishRound(false));
    });
  }
};

/* ---------- 8. DYSGRAPHIA — Letter Tracing ---------- */
GAMES.letterTracing = {
  setupType: "rounds",
  start(ctx){
    const mild = ctx.student.supportLevel === "mild";
    runRounds(ctx, (ctx, round, stageEl) => {
      const letter = LETTER_POOL[Math.floor(Math.random()*LETTER_POOL.length)];
      const instructedColor = mild ? pick(TRACE_COLORS) : null;

      stageEl.innerHTML = `
        <p class="game-instructions">${mild ? `Trace the letter using <strong>${instructedColor.name}</strong>.` : "Trace the dotted letter."}</p>
        ${mild ? `<div class="color-swatches" id="lt-colors" role="group" aria-label="Choose a color">
          ${TRACE_COLORS.map(c => `<button class="color-swatch" data-name="${c.name}" style="background:${c.hex}" aria-label="${c.name}"></button>`).join("")}
        </div>` : ""}
        <canvas id="letter-canvas" class="trace-canvas" width="320" height="280"></canvas>
        <button class="btn btn-primary" id="letter-done">✅ Done Tracing</button>
      `;
      const canvas = document.getElementById("letter-canvas");
      const c2d = canvas.getContext("2d");
      function drawLetterOutline(){
        c2d.clearRect(0,0,canvas.width,canvas.height);
        c2d.save();
        c2d.setLineDash([6,7]);
        c2d.strokeStyle = "#c9bfa8";
        c2d.font = "bold 220px sans-serif";
        c2d.textAlign = "center";
        c2d.textBaseline = "middle";
        c2d.lineWidth = 2;
        c2d.strokeText(letter, canvas.width/2, canvas.height/2 + 10);
        c2d.restore();
      }
      drawLetterOutline();

      let selectedColor = mild ? null : "#6ea8d8";
      let chosenColorName = null;
      let traced = false;
      const startTime = Date.now();

      if (mild){
        document.getElementById("lt-colors").addEventListener("click", (e) => {
          const sw = e.target.closest(".color-swatch");
          if (!sw) return;
          document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
          sw.classList.add("selected");
          const chosen = TRACE_COLORS.find(c => c.name === sw.dataset.name);
          selectedColor = chosen.hex;
          chosenColorName = chosen.name;
        });
      }

      c2d.lineCap = "round";
      function pos(e){
        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
        const cy = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
        return [cx, cy];
      }
      let drawing = false;
      canvas.addEventListener("pointerdown", (e) => {
        if (mild && !selectedColor){ showToast("Please choose a color first", "error"); return; }
        drawing = true; traced = true;
        c2d.strokeStyle = selectedColor || "#6ea8d8";
        c2d.lineWidth = 6;
        const [x,y] = pos(e);
        c2d.beginPath(); c2d.moveTo(x,y);
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!drawing) return;
        const [x,y] = pos(e);
        c2d.lineTo(x,y); c2d.stroke();
      });
      window.addEventListener("pointerup", () => { drawing = false; }, { once: true });

      document.getElementById("letter-done").addEventListener("click", () => {
        const missed = !traced;
        const colorCorrect = mild ? (chosenColorName === instructedColor.name) : true;
        const correct = !missed && colorCorrect;
        ctx.onRoundResult({ correct, missed, responseTime: +((Date.now()-startTime)/1000).toFixed(2) });
      });
    });
  }
};
