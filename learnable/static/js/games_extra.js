/* =========================================================
   LearnAble — games_extra.js
   Sixteen additional playable games (two more per category).
   They reuse the same round harness (runRounds / finishSession) as the
   original games, so every session is saved with addSession() and
   shows up in Reports automatically.

   Autism ............ Color Matching, Shape Identifying
   ADHD .............. Color Tapping, Number Tapping
   Dyslexia .......... Letter Sound Matching, Rhymes / Songs
   Dyscalculia ....... Addition / Subtraction, Math Puzzles
   Dyspraxia ......... Color Matching (drag & drop), Tapping Count
   Visual Impairment . Sound Memory, Guided Audio
   Hearing Impairment  Pattern Recognition, Visual Memory
   Dysgraphia ........ Pattern Replication, Alphabet / Number Writing
========================================================= */

const PALETTE = [
  { name: "Red",    hex: "#e8695f" },
  { name: "Blue",   hex: "#4c86b8" },
  { name: "Green",  hex: "#4f9c6d" },
  { name: "Yellow", hex: "#f5c451" },
  { name: "Purple", hex: "#9b7fd1" },
  { name: "Orange", hex: "#f0a93b" },
  { name: "Pink",   hex: "#f19bc4" }
];

/* ---------------- Small shared helpers ---------------- */

/* True while the student is still on the play screen. Timers check this so
   a game that was exited never records results in the background. */
function alive(stageEl){
  return !!stageEl && stageEl.isConnected && window.location.hash.startsWith("#play/");
}

/* Like speak(), but ignores the "audio assistance" setting. Used by the
   games where sound IS the activity (Visual Impairment, letter sounds). */
function speakAlways(text){
  try{
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }catch(e){ /* captions stay visible */ }
}

const isModerate = (ctx) => ctx.student.supportLevel === "moderate";
const elapsed = (t0) => +((Date.now() - t0) / 1000).toFixed(2);

/* A standard "pick one answer" round. options: [{value, html, label, style}] */
function choiceRound(ctx, stageEl, o){
  const tap = o.style === "tap";
  stageEl.innerHTML = `
    <p class="game-instructions">${o.instruction}</p>
    ${o.promptHtml || ""}
    <div class="${tap ? "tap-grid" : "option-grid"}" id="choice-grid" role="group" aria-label="Answer choices"
         ${tap ? `style="grid-template-columns:repeat(${o.options.length === 4 ? 2 : Math.min(3, o.options.length)}, 1fr);${o.options.length === 4 ? "max-width:320px;" : ""}"` : ""}>
      ${o.options.map(opt => `
        <button class="${tap ? "tap-item" : "option-btn"}" data-val="${escapeHtml(opt.value)}"
                aria-label="${escapeHtml(opt.label || opt.value)}">${opt.html}</button>`).join("")}
    </div>`;
  const startTime = Date.now();
  if (o.onReady) o.onReady(stageEl);
  document.getElementById("choice-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-val]");
    if (!btn || btn.disabled) return;
    const correct = btn.dataset.val === String(o.correct);
    btn.classList.add(correct ? "correct-flash" : "incorrect-flash");
    stageEl.querySelectorAll("#choice-grid button").forEach(b => b.disabled = true);
    ctx.onRoundResult({
      correct,
      responseTime: elapsed(startTime),
      hintUsed: o.hintFlag ? o.hintFlag() : false
    });
  });
}

/* 4 distinct non-negative number options around the right answer. */
function numberOptions(correct, n, spread){
  const set = new Set([correct]);
  let guard = 0;
  while (set.size < n && guard++ < 200){
    const d = correct + Math.floor(Math.random() * (spread * 2 + 1)) - spread;
    if (d >= 0) set.add(d);
  }
  let k = 1;
  while (set.size < n) set.add(correct + k++);
  return shuffle([...set]);
}

/* Shared tracing canvas wiring (used by the two Dysgraphia games).
   Returns {points, clear}. Fills gaps between fast pointer moves so
   scoring doesn't depend on how quickly the child draws. */
function attachTracing(canvas, c2d, { color, width, redraw }){
  const points = [];
  let drawing = false, last = null;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height];
  };
  const add = (x, y) => {
    if (last){
      const dist = Math.hypot(x - last[0], y - last[1]);
      const steps = Math.floor(dist / 6);
      for (let i = 1; i <= steps; i++){
        points.push([last[0] + (x - last[0]) * i / (steps + 1), last[1] + (y - last[1]) * i / (steps + 1)]);
      }
    }
    points.push([x, y]);
    last = [x, y];
  };
  const style = () => { c2d.strokeStyle = color; c2d.lineWidth = width; c2d.lineCap = "round"; c2d.lineJoin = "round"; };
  canvas.addEventListener("pointerdown", (e) => {
    drawing = true; last = null;
    try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    const [x, y] = pos(e);
    style(); c2d.beginPath(); c2d.moveTo(x, y);
    add(x, y);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const [x, y] = pos(e);
    c2d.lineTo(x, y); c2d.stroke();
    add(x, y);
  });
  const stop = () => { drawing = false; last = null; };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
  canvas.addEventListener("pointerleave", () => { /* capture keeps drawing; nothing to do */ });
  return {
    points,
    clear(){ points.length = 0; last = null; redraw(); }
  };
}

/* How well did the child's line follow the guide?
   coverage  = share of guide points the line passed near
   precision = share of the line that stayed near the guide */
function traceScore(samples, drawn, radius){
  if (drawn.length < 5 || !samples.length) return { coverage: 0, precision: 0 };
  let covered = 0;
  for (const sp of samples){
    if (drawn.some(dp => Math.hypot(dp[0] - sp[0], dp[1] - sp[1]) < radius)) covered++;
  }
  let near = 0;
  for (const dp of drawn){
    if (samples.some(sp => Math.hypot(dp[0] - sp[0], dp[1] - sp[1]) < radius * 1.5)) near++;
  }
  return { coverage: covered / samples.length, precision: near / drawn.length };
}

/* =========================================================
   AUTISM
========================================================= */

/* Color Matching — match a colour to the identical colour. Predictable layout
   and the colour's name is shown so words and colours are paired. */
GAMES.autismColorMatching = {
  setupType: "rounds",
  start(ctx){
    const count = isModerate(ctx) ? 3 : 6;
    runRounds(ctx, (ctx, round, stageEl) => {
      const target = pick(PALETTE);
      const others = sample(PALETTE.filter(c => c.name !== target.name), count - 1);
      const options = shuffle([target, ...others]);
      choiceRound(ctx, stageEl, {
        style: "tap",
        instruction: "Tap the circle that has the same color:",
        promptHtml: `
          <span class="swatch-dot big" style="background:${target.hex}" role="img" aria-label="Target color ${target.name}"></span>
          <div class="game-word" style="font-size:1.6rem;">${target.name.toUpperCase()}</div>`,
        options: options.map(c => ({ value: c.name, label: c.name, html: `<span class="swatch-dot" style="background:${c.hex}"></span>` })),
        correct: target.name
      });
    });
  }
};

const SHAPE_SVGS = {
  circle:    `<circle cx="50" cy="50" r="42"/>`,
  square:    `<rect x="12" y="12" width="76" height="76"/>`,
  triangle:  `<polygon points="50,10 92,88 8,88"/>`,
  rectangle: `<rect x="4" y="26" width="92" height="48"/>`,
  star:      `<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"/>`,
  diamond:   `<polygon points="50,4 94,50 50,96 6,50"/>`,
  oval:      `<ellipse cx="50" cy="50" rx="46" ry="30"/>`
};
function shapeSvg(name, size, fill){
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="${fill}" role="img" aria-label="${name}">${SHAPE_SVGS[name]}</svg>`;
}

/* Shape Identifying — name the shape that is shown. */
GAMES.shapeIdentifying = {
  setupType: "rounds",
  start(ctx){
    const pool = isModerate(ctx) ? ["circle", "square", "triangle", "star"] : Object.keys(SHAPE_SVGS);
    const count = isModerate(ctx) ? 3 : 4;
    runRounds(ctx, (ctx, round, stageEl) => {
      const target = pick(pool);
      const others = sample(pool.filter(s => s !== target), count - 1);
      choiceRound(ctx, stageEl, {
        instruction: "What shape is this?",
        promptHtml: `<div>${shapeSvg(target, 130, pick(PALETTE).hex)}</div>`,
        options: shuffle([target, ...others]).map(s => ({ value: s, html: s.toUpperCase() })),
        correct: target
      });
    });
  }
};

/* =========================================================
   ADHD
========================================================= */

/* Color Tapping — sustained attention + impulse control: tap ONLY the target
   colour. A wrong tap ends the round; running out of time counts as missed. */
GAMES.colorTapping = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const limitMs = moderate ? 15000 : 12000;
    const targetCount = moderate ? 3 : 4;
    runRounds(ctx, (ctx, round, stageEl) => {
      const target = pick(PALETTE);
      const others = sample(PALETTE.filter(c => c.name !== target.name), 3);
      const cells = shuffle([
        ...Array(targetCount).fill(target),
        ...Array.from({ length: 9 - targetCount }, () => pick(others))
      ]);
      stageEl.innerHTML = `
        <p class="game-instructions">Tap <strong>every ${target.name.toUpperCase()}</strong> circle. Don't tap the other colors!</p>
        <div class="sack-timer" aria-hidden="true"><span id="ct-bar" style="width:100%"></span></div>
        <div class="tap-grid" id="ct-grid">
          ${cells.map(c => `<button class="tap-item" data-color="${c.name}" aria-label="${c.name}"><span class="swatch-dot" style="background:${c.hex}"></span></button>`).join("")}
        </div>
        <div id="ct-found" style="font-weight:700;">Found 0 / ${targetCount}</div>`;
      const startTime = Date.now();
      let found = 0, done = false, timer;
      const finish = (res) => {
        if (done || !alive(stageEl)) return;
        done = true; clearTimeout(timer);
        stageEl.querySelectorAll("#ct-grid button").forEach(b => b.disabled = true);
        ctx.onRoundResult(res);
      };
      const bar = document.getElementById("ct-bar");
      if (!getSettings().reducedMotion){
        bar.style.transition = `width ${limitMs}ms linear`;
        requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = "0%"; }));
      }
      timer = setTimeout(() => finish({ correct: false, missed: true }), limitMs);
      document.getElementById("ct-grid").addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-color]");
        if (!btn || btn.disabled || done) return;
        if (btn.dataset.color === target.name){
          btn.classList.add("correct-flash"); btn.disabled = true; found++;
          document.getElementById("ct-found").textContent = `Found ${found} / ${targetCount}`;
          if (found === targetCount) finish({ correct: true, responseTime: elapsed(startTime) });
        } else {
          btn.classList.add("incorrect-flash");
          finish({ correct: false, responseTime: elapsed(startTime) });
        }
      });
    });
  }
};

/* Number Tapping — tap 1, 2, 3 … in order (focus + working memory). */
GAMES.numberTapping = {
  setupType: "rounds",
  start(ctx){
    const base = isModerate(ctx) ? 3 : 4;
    runRounds(ctx, (ctx, round, stageEl) => {
      const n = Math.min(7, base + Math.floor((round - 1) / 4));
      const nums = shuffle(Array.from({ length: n }, (_, i) => i + 1));
      stageEl.innerHTML = `
        <p class="game-instructions">Tap the numbers <strong>in order</strong>, starting with 1.</p>
        <div class="tap-grid" id="nt-grid">
          ${nums.map(v => `<button class="tap-item" data-n="${v}" aria-label="Number ${v}" style="font-weight:800;">${v}</button>`).join("")}
        </div>
        <div id="nt-next" style="font-weight:700;">Next: 1</div>`;
      const startTime = Date.now();
      let expected = 1, done = false;
      const finish = (res) => {
        if (done || !alive(stageEl)) return;
        done = true;
        stageEl.querySelectorAll("#nt-grid button").forEach(b => b.disabled = true);
        ctx.onRoundResult(res);
      };
      document.getElementById("nt-grid").addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-n]");
        if (!btn || btn.disabled || done) return;
        if (+btn.dataset.n === expected){
          btn.classList.add("correct-flash"); btn.disabled = true;
          expected++;
          if (expected > n) finish({ correct: true, responseTime: elapsed(startTime) });
          else document.getElementById("nt-next").textContent = `Next: ${expected}`;
        } else {
          btn.classList.add("incorrect-flash");
          finish({ correct: false, responseTime: elapsed(startTime) });
        }
      });
    });
  }
};

/* =========================================================
   DYSLEXIA
========================================================= */

const LETTER_SOUND_POOL = [
  { letter: "A", word: "Apple", emoji: "🍎" }, { letter: "B", word: "Ball", emoji: "⚽" },
  { letter: "C", word: "Cat", emoji: "🐱" },   { letter: "D", word: "Dog", emoji: "🐶" },
  { letter: "F", word: "Fish", emoji: "🐟" },  { letter: "M", word: "Moon", emoji: "🌙" },
  { letter: "S", word: "Sun", emoji: "☀️" },   { letter: "T", word: "Tree", emoji: "🌳" }
];

/* Letter Sound Matching — hear a word, pick the letter it starts with. */
GAMES.letterSound = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => {
      const target = pick(LETTER_SOUND_POOL);
      const others = sample(LETTER_SOUND_POOL.filter(l => l.letter !== target.letter), 3);
      let replays = 0;
      choiceRound(ctx, stageEl, {
        instruction: "Listen. Which letter does this word start with?",
        promptHtml: `
          <div class="big-emoji" aria-hidden="true">${target.emoji}</div>
          <button class="btn btn-accent" id="ls-replay">🔊 Hear the word</button>`,
        options: shuffle([target, ...others]).map(l => ({ value: l.letter, label: `Letter ${l.letter}`, html: l.letter })),
        correct: target.letter,
        hintFlag: () => replays > 0,
        onReady: () => {
          speakAlways(target.word);
          document.getElementById("ls-replay").addEventListener("click", () => { replays++; speakAlways(target.word); });
        }
      });
    });
  }
};

const RHYME_GROUPS = [
  ["CAT", "HAT", "BAT"], ["DOG", "LOG", "FROG"], ["SUN", "FUN", "RUN"],
  ["TREE", "BEE", "KEY"], ["BALL", "WALL", "TALL"], ["STAR", "CAR", "JAR"],
  ["BED", "RED", "HEAD"], ["CAKE", "LAKE", "SNAKE"]
];

/* Rhymes / Songs — phonological awareness: which word rhymes? */
GAMES.rhymeTime = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => {
      const gi = Math.floor(Math.random() * RHYME_GROUPS.length);
      const group = RHYME_GROUPS[gi];
      const target = pick(group);
      const answer = pick(group.filter(w => w !== target));
      const distractors = sample(RHYME_GROUPS.filter((_, i) => i !== gi), 3).map(g => pick(g));
      let replays = 0;
      choiceRound(ctx, stageEl, {
        instruction: "🎵 Which word rhymes with:",
        promptHtml: `
          <div class="game-word">${target}</div>
          <button class="btn btn-accent" id="rh-replay">🔊 Hear it</button>`,
        options: shuffle([answer, ...distractors]).map(w => ({ value: w, html: w })),
        correct: answer,
        hintFlag: () => replays > 0,
        onReady: () => {
          speak(target);
          document.getElementById("rh-replay").addEventListener("click", () => { replays++; speak(target); });
        }
      });
    });
  }
};

/* =========================================================
   DYSCALCULIA
========================================================= */

/* Addition / Subtraction — always shown with pictures so the numbers
   stay concrete. Moderate: adding within 5. Mild: add or subtract within 10. */
GAMES.addSub = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    runRounds(ctx, (ctx, round, stageEl) => {
      const obj = pick(COUNT_OBJECT_POOL);
      let a, b, op, answer;
      if (moderate || Math.random() < 0.5){
        op = "+";
        const max = moderate ? 5 : 10;
        a = 1 + Math.floor(Math.random() * (max - 1));
        b = 1 + Math.floor(Math.random() * (max - a));
        answer = a + b;
      } else {
        op = "−";
        a = 2 + Math.floor(Math.random() * 9);
        b = 1 + Math.floor(Math.random() * (a - 1));
        answer = a - b;
      }
      const row = (n) => Array.from({ length: n }, () => `<span>${obj.emoji}</span>`).join("");
      choiceRound(ctx, stageEl, {
        instruction: op === "+" ? `How many ${obj.name} in all?` : `Take some ${obj.name} away. How many are left?`,
        promptHtml: `
          <div class="counting-objects">${row(a)}</div>
          <div class="game-word">${a} ${op} ${b} = ?</div>
          ${op === "+" ? `<div class="counting-objects">${row(b)}</div>` : `<div class="hint-box">Take away ${b}</div>`}`,
        options: numberOptions(answer, 4, 3).map(v => ({ value: String(v), html: String(v) })),
        correct: String(answer)
      });
    });
  }
};

/* Math Puzzles — find the missing number in a counting pattern. */
GAMES.mathPuzzles = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    runRounds(ctx, (ctx, round, stageEl) => {
      const step = moderate ? pick([1, 2]) : pick([2, 3, 4, 5]);
      const start = moderate ? 1 + Math.floor(Math.random() * 6) : 1 + Math.floor(Math.random() * 10);
      const len = moderate ? 4 : 5;
      const seq = Array.from({ length: len }, (_, i) => start + i * step);
      const hole = 1 + Math.floor(Math.random() * (len - 1));
      const answer = seq[hole];
      const shown = seq.map((v, i) => i === hole ? "❓" : v).join("  ·  ");
      choiceRound(ctx, stageEl, {
        instruction: "Which number is missing from the pattern?",
        promptHtml: `<div class="game-word" aria-label="Number pattern with one missing">${shown}</div>`,
        options: numberOptions(answer, 4, Math.max(2, step)).map(v => ({ value: String(v), html: String(v) })),
        correct: String(answer)
      });
    });
  }
};

/* =========================================================
   DYSPRAXIA
========================================================= */

/* Color Matching (drag & drop) — drag the ball into the matching basket.
   Big targets, forgiving drop zones. Tap-the-ball-then-tap-the-basket also
   works for children who find dragging difficult. */
GAMES.dragColorMatch = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => {
      const baskets = sample(PALETTE, 3);
      const target = pick(baskets);
      stageEl.innerHTML = `
        <p class="game-instructions">Drag the ball into the basket with the <strong>same color</strong>. (Or tap the ball, then tap the basket.)</p>
        <div class="drag-zone">
          <div class="drag-ball" id="dm-ball" role="button" tabindex="0" aria-label="${target.name} ball. Drag or press Enter to pick up."
               style="background:${target.hex}"></div>
        </div>
        <div class="basket-row" id="dm-baskets">
          ${baskets.map(c => `<button class="basket" data-color="${c.name}" aria-label="${c.name} basket" style="border-color:${c.hex}; background:${c.hex}33;">🧺<span>${c.name}</span></button>`).join("")}
        </div>`;
      const startTime = Date.now();
      const ball = document.getElementById("dm-ball");
      let selected = false, dragging = false, moved = false, sx = 0, sy = 0, done = false;

      const drop = (basketEl) => {
        if (done || !alive(stageEl)) return;
        done = true;
        const correct = basketEl.dataset.color === target.name;
        basketEl.classList.add(correct ? "correct-flash" : "incorrect-flash");
        ball.style.transform = ""; ball.classList.remove("dragging", "selected");
        stageEl.querySelectorAll("#dm-baskets button").forEach(b => b.disabled = true);
        ctx.onRoundResult({ correct, responseTime: elapsed(startTime) });
      };
      const basketAt = (x, y) => document.elementsFromPoint(x, y).find(el => el.classList && el.classList.contains("basket"));

      ball.addEventListener("pointerdown", (e) => {
        if (done) return;
        dragging = true; moved = false; sx = e.clientX; sy = e.clientY;
        try{ ball.setPointerCapture(e.pointerId); }catch(_){}
        ball.classList.add("dragging");
      });
      ball.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.hypot(dx, dy) > 6) moved = true;
        ball.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      const endDrag = (e) => {
        if (!dragging) return;
        dragging = false; ball.classList.remove("dragging");
        if (moved){
          const hit = basketAt(e.clientX, e.clientY);
          ball.style.transform = "";
          if (hit) drop(hit);
        } else {
          selected = !selected;
          ball.classList.toggle("selected", selected);
        }
      };
      ball.addEventListener("pointerup", endDrag);
      ball.addEventListener("pointercancel", () => { dragging = false; ball.style.transform = ""; ball.classList.remove("dragging"); });
      ball.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " "){ e.preventDefault(); selected = !selected; ball.classList.toggle("selected", selected); }
      });
      document.getElementById("dm-baskets").addEventListener("click", (e) => {
        const b = e.target.closest(".basket");
        if (b && selected && !b.disabled) drop(b);
      });
    });
  }
};

/* Tapping Count — tap the big button exactly N times (motor control + counting). */
GAMES.tappingCount = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    runRounds(ctx, (ctx, round, stageEl) => {
      const target = moderate ? 2 + Math.floor(Math.random() * 5) : 3 + Math.floor(Math.random() * 8);
      stageEl.innerHTML = `
        <p class="game-instructions">Tap the big button exactly <strong>${target}</strong> times, then press Done.</p>
        <div class="game-word" id="tc-target">Goal: ${target}</div>
        <button class="big-tap-btn" id="tc-btn" aria-label="Tap button">👆</button>
        <div class="game-word" id="tc-count" aria-live="polite">0</div>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-outline" id="tc-reset">↺ Start over</button>
          <button class="btn btn-success" id="tc-done">✅ Done</button>
        </div>`;
      const startTime = Date.now();
      let count = 0, done = false;
      const show = () => { document.getElementById("tc-count").textContent = String(count); };
      document.getElementById("tc-btn").addEventListener("click", () => { if (!done){ count++; show(); } });
      document.getElementById("tc-reset").addEventListener("click", () => { if (!done){ count = 0; show(); } });
      document.getElementById("tc-done").addEventListener("click", () => {
        if (done || !alive(stageEl)) return;
        done = true;
        if (count === 0){ ctx.onRoundResult({ correct: false, missed: true, responseTime: elapsed(startTime) }); return; }
        ctx.onRoundResult({ correct: count === target, responseTime: elapsed(startTime) });
      });
    });
  }
};

/* =========================================================
   VISUAL IMPAIRMENT  (audio-first, big high-contrast controls)
========================================================= */

let _audioCtx = null;
function playTone(freq, ms){
  try{
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    _audioCtx = _audioCtx || new AC();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    const osc = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    osc.type = "sine"; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, _audioCtx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, _audioCtx.currentTime + ms / 1000);
    osc.connect(gain); gain.connect(_audioCtx.destination);
    osc.start(); osc.stop(_audioCtx.currentTime + ms / 1000 + 0.05);
  }catch(e){ /* silent fallback — pads still flash */ }
}

const SOUND_PADS = [
  { n: 1, freq: 262, color: "#e8695f", name: "Sound 1, low" },
  { n: 2, freq: 330, color: "#f5c451", name: "Sound 2" },
  { n: 3, freq: 392, color: "#4f9c6d", name: "Sound 3" },
  { n: 4, freq: 523, color: "#4c86b8", name: "Sound 4, high" }
];

/* Sound Memory — hear a tune made of 4 different tones, then repeat it. */
GAMES.soundMemory = {
  setupType: "rounds",
  start(ctx){
    const base = isModerate(ctx) ? 2 : 3;
    runRounds(ctx, (ctx, round, stageEl) => {
      const len = Math.min(6, base + Math.floor((round - 1) / 4));
      const seq = Array.from({ length: len }, () => 1 + Math.floor(Math.random() * 4));
      stageEl.innerHTML = `
        <p class="game-instructions">Press <strong>Listen</strong>. Then repeat the ${len} sounds in the same order.</p>
        <button class="btn btn-accent btn-large" id="sm-listen" style="max-width:260px;">🔊 Listen</button>
        <div class="sound-pads" id="sm-pads" role="group" aria-label="Sound pads">
          ${SOUND_PADS.map(p => `<button class="sound-pad" data-n="${p.n}" aria-label="${p.name}" style="background:${p.color}" disabled>${p.n}</button>`).join("")}
        </div>
        <div id="sm-status" style="font-weight:700;" aria-live="polite">Press Listen to begin.</div>`;
      let listens = 0, inputIdx = 0, done = false, started = null, playing = false;
      const pads = () => [...stageEl.querySelectorAll(".sound-pad")];
      const status = (t) => { const s = document.getElementById("sm-status"); if (s) s.textContent = t; };
      const flash = (n) => {
        const el = stageEl.querySelector(`.sound-pad[data-n="${n}"]`);
        if (!el) return;
        el.classList.add("lit"); setTimeout(() => el.classList.remove("lit"), 350);
      };
      const finish = (res) => {
        if (done || !alive(stageEl)) return;
        done = true; pads().forEach(p => p.disabled = true);
        ctx.onRoundResult(res);
      };
      document.getElementById("sm-listen").addEventListener("click", () => {
        if (playing || done || inputIdx > 0) return;
        playing = true; listens++;
        pads().forEach(p => p.disabled = true);
        status("Listen…");
        seq.forEach((n, i) => setTimeout(() => {
          if (!alive(stageEl)) return;
          playTone(SOUND_PADS[n - 1].freq, 450); flash(n);
          if (i === seq.length - 1) setTimeout(() => {
            if (!alive(stageEl)) return;
            playing = false; started = Date.now();
            pads().forEach(p => p.disabled = false);
            status("Your turn! Repeat the sounds.");
          }, 600);
        }, i * 750));
      });
      document.getElementById("sm-pads").addEventListener("click", (e) => {
        const pad = e.target.closest(".sound-pad");
        if (!pad || pad.disabled || done || playing) return;
        const n = +pad.dataset.n;
        playTone(SOUND_PADS[n - 1].freq, 350); flash(n);
        if (n !== seq[inputIdx]){
          pad.classList.add("incorrect-flash");
          finish({ correct: false, responseTime: elapsed(started || Date.now()), hintUsed: listens > 1 });
          return;
        }
        inputIdx++;
        if (inputIdx === seq.length) finish({ correct: true, responseTime: elapsed(started || Date.now()), hintUsed: listens > 1 });
      });
    });
  }
};

/* Guided Audio — a spoken instruction is the only clue about what to press. */
GAMES.guidedAudio = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const spots = ["top", "left", "right", "bottom"];
    runRounds(ctx, (ctx, round, stageEl) => {
      // moderate: colours stay with their position so the layout is learnable
      const fixed = [PALETTE[0], PALETTE[1], PALETTE[2], PALETTE[3]];
      const colors = moderate ? fixed : shuffle(fixed);
      const layout = spots.map((s, i) => ({ spot: s, color: colors[i] }));
      const target = pick(layout);
      const byColor = !moderate && Math.random() < 0.5;
      const text = byColor ? `Tap the ${target.color.name} button.` : `Tap the button at the ${target.spot.toUpperCase()}.`;
      let replays = 0;
      stageEl.innerHTML = `
        <p class="game-instructions" id="ga-text">${text}</p>
        <button class="btn btn-accent" id="ga-replay">🔊 Hear it again</button>
        <div class="guided-grid" id="ga-grid" role="group" aria-label="Buttons">
          ${layout.map(l => `<button class="guided-pad pad-${l.spot}" data-spot="${l.spot}" aria-label="${l.color.name} button, ${l.spot}" style="background:${l.color.hex}">${l.color.name}</button>`).join("")}
        </div>`;
      const startTime = Date.now();
      speakAlways(text);
      document.getElementById("ga-replay").addEventListener("click", () => { replays++; speakAlways(text); });
      document.getElementById("ga-grid").addEventListener("click", (e) => {
        const btn = e.target.closest(".guided-pad");
        if (!btn || btn.disabled) return;
        const correct = btn.dataset.spot === target.spot;
        btn.classList.add(correct ? "correct-flash" : "incorrect-flash");
        stageEl.querySelectorAll(".guided-pad").forEach(b => b.disabled = true);
        ctx.onRoundResult({ correct, responseTime: elapsed(startTime), hintUsed: replays > 0 });
      });
    });
  }
};

/* =========================================================
   HEARING IMPAIRMENT  (entirely visual — no audio needed)
========================================================= */

const PATTERN_SETS = [
  ["🔴", "🔵", "🟢", "🟡", "🟣"],
  ["⭐", "🌙", "❤️", "🍎", "🌸"],
  ["🐶", "🐱", "🐟", "🐦", "🐢"]
];

/* Pattern Recognition — what comes next in the pattern? */
GAMES.patternRecognition = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    runRounds(ctx, (ctx, round, stageEl) => {
      const set = pick(PATTERN_SETS);
      const kind = moderate ? "AB" : pick(["AB", "AAB", "ABC"]);
      const [A, B, C] = shuffle(set);
      const cycle = kind === "AB" ? [A, B] : kind === "AAB" ? [A, A, B] : [A, B, C];
      const full = [...cycle, ...cycle, ...cycle];
      const hideIdx = full.length - 1;
      const answer = full[hideIdx];
      const shown = full.slice(0, hideIdx);
      const used = new Set(cycle);
      const options = shuffle([...used, ...sample(set.filter(x => !used.has(x)), 4 - used.size)]);
      choiceRound(ctx, stageEl, {
        style: "tap",
        instruction: "What comes next in the pattern?",
        promptHtml: `<div class="pattern-row" role="img" aria-label="Pattern with the last item missing">${shown.map(s => `<span>${s}</span>`).join("")}<span class="pattern-q">❓</span></div>`,
        options: options.map(s => ({ value: s, label: s, html: s })),
        correct: answer
      });
    });
  }
};

const MEMORY_POOL = ["🍎", "🍌", "🐶", "🐱", "⭐", "🌙", "🚗", "🏠", "⚽", "🌸", "🐟", "🎈", "🍇", "🦋"];

/* Visual Memory — study some pictures, they disappear, then spot one you saw. */
GAMES.visualMemory = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const n = moderate ? 3 : 5;
    const studyMs = moderate ? 5000 : 4000;
    runRounds(ctx, (ctx, round, stageEl) => {
      const items = sample(MEMORY_POOL, n);
      const answer = pick(items);
      const distractors = sample(MEMORY_POOL.filter(x => !items.includes(x)), 3);
      stageEl.innerHTML = `
        <p class="game-instructions">Look carefully and remember these pictures!</p>
        <div class="memory-grid" id="vm-items">${items.map(s => `<span>${s}</span>`).join("")}</div>
        <div class="sack-timer" aria-hidden="true"><span id="vm-bar" style="width:100%"></span></div>`;
      const bar = document.getElementById("vm-bar");
      if (!getSettings().reducedMotion){
        bar.style.transition = `width ${studyMs}ms linear`;
        requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = "0%"; }));
      }
      setTimeout(() => {
        if (!alive(stageEl)) return;
        choiceRound(ctx, stageEl, {
          style: "tap",
          instruction: "Which picture was in the group you saw?",
          options: shuffle([answer, ...distractors]).map(s => ({ value: s, label: s, html: s })),
          correct: answer
        });
      }, studyMs);
    });
  }
};

/* =========================================================
   DYSGRAPHIA  (pre-writing & number formation)
========================================================= */

/* Pre-writing pattern paths, drawn on a 360×240 canvas. */
function patternPoints(kind){
  const pts = [];
  if (kind === "line"){
    for (let x = 40; x <= 320; x += 5) pts.push([x, 120]);
  } else if (kind === "zigzag"){
    const peaks = 6, w = 280 / peaks;
    for (let i = 0; i < peaks; i++){
      const x0 = 40 + i * w, up = i % 2 === 0;
      for (let t = 0; t <= 1; t += 0.05) pts.push([x0 + t * w, (up ? 170 : 70) + t * (up ? -100 : 100)]);
    }
  } else if (kind === "wave"){
    for (let x = 40; x <= 320; x += 4) pts.push([x, 120 + 55 * Math.sin((x - 40) / 280 * Math.PI * 4)]);
  } else if (kind === "loops"){
    for (let t = 0; t <= Math.PI * 4; t += 0.08) pts.push([50 + 16 * t - 28 * Math.sin(t), 120 - 28 * Math.cos(t)]);
  }
  return pts;
}

function drawGuidePath(c2d, pts){
  c2d.save();
  c2d.setLineDash([8, 8]); c2d.strokeStyle = "#c9bfa8"; c2d.lineWidth = 3; c2d.lineCap = "round";
  c2d.beginPath();
  pts.forEach((p, i) => i ? c2d.lineTo(p[0], p[1]) : c2d.moveTo(p[0], p[1]));
  c2d.stroke();
  c2d.setLineDash([]);
  c2d.fillStyle = "#4f9c6d";            // start marker
  c2d.beginPath(); c2d.arc(pts[0][0], pts[0][1], 8, 0, Math.PI * 2); c2d.fill();
  c2d.restore();
}

/* Pattern Replication — copy the line pattern by tracing it. */
GAMES.patternReplication = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const kinds = moderate ? ["line", "zigzag", "wave"] : ["line", "zigzag", "wave", "loops"];
    const radius = moderate ? 26 : 20;
    runRounds(ctx, (ctx, round, stageEl) => {
      const kind = kinds[(round - 1) % kinds.length];
      const label = { line: "straight line", zigzag: "zigzag", wave: "wave", loops: "loop pattern" }[kind];
      stageEl.innerHTML = `
        <p class="game-instructions">Trace the dotted <strong>${label}</strong>. Start at the green dot.</p>
        <canvas id="pr-canvas" class="trace-canvas" width="360" height="240"></canvas>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-outline" id="pr-clear">🧽 Clear</button>
          <button class="btn btn-primary" id="pr-done">✅ Done Tracing</button>
        </div>`;
      const canvas = document.getElementById("pr-canvas");
      const c2d = canvas.getContext("2d");
      const guide = patternPoints(kind);
      const redraw = () => { c2d.clearRect(0, 0, canvas.width, canvas.height); drawGuidePath(c2d, guide); };
      redraw();
      canvas.__samples = guide;            // exposed for automated tests
      const tracer = attachTracing(canvas, c2d, { color: "#4c86b8", width: 6, redraw });
      const startTime = Date.now();
      let done = false;
      document.getElementById("pr-clear").addEventListener("click", () => { if (!done) tracer.clear(); });
      document.getElementById("pr-done").addEventListener("click", () => {
        if (done || !alive(stageEl)) return;
        done = true;
        if (tracer.points.length < 5){ ctx.onRoundResult({ correct: false, missed: true, responseTime: elapsed(startTime) }); return; }
        const s = traceScore(guide, tracer.points, radius);
        ctx.onRoundResult({ correct: s.coverage >= 0.55 && s.precision >= 0.6, responseTime: elapsed(startTime) });
      });
    });
  }
};

/* Alphabet / Number Writing — trace the dotted number. Scored on how much of
   the number's shape was covered while staying on it. */
GAMES.numberWriting = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const digits = moderate ? ["1", "2", "3", "4", "5", "7"] : ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const radius = moderate ? 28 : 22;
    runRounds(ctx, (ctx, round, stageEl) => {
      const digit = pick(digits);
      stageEl.innerHTML = `
        <p class="game-instructions">Trace the number <strong>${digit}</strong> with your finger or mouse.</p>
        <canvas id="nw-canvas" class="trace-canvas" width="320" height="280"></canvas>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-outline" id="nw-clear">🧽 Clear</button>
          <button class="btn btn-primary" id="nw-done">✅ Done Writing</button>
        </div>`;
      const canvas = document.getElementById("nw-canvas");
      const c2d = canvas.getContext("2d");
      const W = canvas.width, H = canvas.height;
      const fontSpec = "bold 220px sans-serif";

      // Sample points inside the glyph from an off-screen render.
      const off = document.createElement("canvas"); off.width = W; off.height = H;
      const o2d = off.getContext("2d");
      o2d.font = fontSpec; o2d.textAlign = "center"; o2d.textBaseline = "middle";
      o2d.fillText(digit, W / 2, H / 2 + 10);
      const data = o2d.getImageData(0, 0, W, H).data;
      const samples = [];
      for (let y = 0; y < H; y += 7) for (let x = 0; x < W; x += 7){
        if (data[(y * W + x) * 4 + 3] > 128) samples.push([x, y]);
      }
      canvas.__samples = samples;          // exposed for automated tests

      const redraw = () => {
        c2d.clearRect(0, 0, W, H);
        c2d.save();
        c2d.setLineDash([6, 7]); c2d.strokeStyle = "#c9bfa8"; c2d.lineWidth = 2;
        c2d.font = fontSpec; c2d.textAlign = "center"; c2d.textBaseline = "middle";
        c2d.strokeText(digit, W / 2, H / 2 + 10);
        c2d.restore();
      };
      redraw();
      const tracer = attachTracing(canvas, c2d, { color: "#4c86b8", width: 7, redraw });
      const startTime = Date.now();
      let done = false;
      document.getElementById("nw-clear").addEventListener("click", () => { if (!done) tracer.clear(); });
      document.getElementById("nw-done").addEventListener("click", () => {
        if (done || !alive(stageEl)) return;
        done = true;
        if (tracer.points.length < 5){ ctx.onRoundResult({ correct: false, missed: true, responseTime: elapsed(startTime) }); return; }
        const s = traceScore(samples, tracer.points, radius);
        ctx.onRoundResult({ correct: s.coverage >= 0.6 && s.precision >= 0.6, responseTime: elapsed(startTime) });
      });
    });
  }
};
