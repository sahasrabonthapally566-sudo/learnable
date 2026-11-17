/* =========================================================
   LearnAble — games_more2.js  (Part B of the remaining games)
   Visual Impairment · Hearing Impairment · Dysgraphia

   Needs games_extra.js (helpers) and games_more.js (storyRound).
========================================================= */

/* ---------------- Generated sound effects (Web Audio) ----------------
   No audio files are needed: every sound is synthesised in the browser. */

function moreAudio(){
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  _audioCtx = _audioCtx || new AC();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}
function fxTone(ac, { freq, freq2, start = 0, dur = 0.3, type = "sine", vol = 0.3 }){
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t0);
  if (freq2) osc.frequency.linearRampToValueAtTime(freq2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(ac.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}
function fxNoise(ac, { start = 0, dur = 1, filter = "highpass", freq = 1000, freq2, vol = 0.3 }){
  const t0 = ac.currentTime + start;
  const src = ac.createBufferSource();
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  src.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = filter; f.frequency.setValueAtTime(freq, t0);
  if (freq2) f.frequency.linearRampToValueAtTime(freq2, t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.1, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(ac.destination);
  src.start(t0); src.stop(t0 + dur + 0.05);
}
const SOUND_FX = {
  horn:     ac => { fxTone(ac, { freq: 420, dur: 0.22, type: "square", vol: 0.18 }); fxTone(ac, { freq: 420, start: 0.34, dur: 0.22, type: "square", vol: 0.18 }); },
  bell:     ac => { [0, 0.22, 0.44].forEach(s => fxTone(ac, { freq: 1760, start: s, dur: 0.35, vol: 0.3 })); },
  siren:    ac => { [0, 0.4, 0.8].forEach((s, i) => fxTone(ac, { freq: i % 2 ? 900 : 650, freq2: i % 2 ? 650 : 900, start: s, dur: 0.4, vol: 0.25 })); },
  train:    ac => { for (let i = 0; i < 6; i++) fxTone(ac, { freq: 90, start: i * 0.22, dur: 0.12, type: "square", vol: 0.22 }); fxTone(ac, { freq: 900, start: 1.4, dur: 0.5, vol: 0.2 }); },
  bird:     ac => { [0, 0.25, 0.5].forEach(s => fxTone(ac, { freq: 2200, freq2: 3300, start: s, dur: 0.14, vol: 0.25 })); },
  rain:     ac => fxNoise(ac, { dur: 1.8, filter: "highpass", freq: 1500, vol: 0.25 }),
  thunder:  ac => fxNoise(ac, { dur: 2.0, filter: "lowpass", freq: 160, vol: 0.7 }),
  wind:     ac => fxNoise(ac, { dur: 2.0, filter: "bandpass", freq: 400, freq2: 1000, vol: 0.4 }),
  drum:     ac => fxTone(ac, { freq: 140, freq2: 60, dur: 0.28, vol: 0.55 }),
  clap:     ac => fxNoise(ac, { dur: 0.14, filter: "bandpass", freq: 1500, vol: 0.5 }),
  whistle:  ac => fxTone(ac, { freq: 1500, freq2: 2500, dur: 0.4, vol: 0.25 }),
  chime:    ac => fxTone(ac, { freq: 1200, dur: 0.5, vol: 0.3 })
};
const SOUND_FX_MS = { horn: 700, bell: 800, siren: 1250, train: 2000, bird: 800, rain: 1800, thunder: 2000, wind: 2000, drum: 350, clap: 250, whistle: 450, chime: 550 };

/* Global on purpose (callers use the bare name) so it can be swapped in tests. */
function playSoundEffect(name){
  try{ const ac = moreAudio(); if (ac && SOUND_FX[name]) SOUND_FX[name](ac); }
  catch(e){ /* audio unsupported — the text labels still work */ }
}

/* =========================================================
   VISUAL IMPAIRMENT  (audio-first)
========================================================= */

/* Shared "what made this sound?" round. */
function soundGuessRound(ctx, stageEl, items, target, instruction){
  let replays = 0;
  choiceRound(ctx, stageEl, {
    instruction,
    promptHtml: `<button class="btn btn-accent btn-large" id="sg-play" style="max-width:260px;" data-sound="${target.fx}">🔊 Play the sound</button>`,
    options: items.map(it => ({ value: it.fx, label: it.label, html: `${it.emoji} ${it.label}` })),
    correct: target.fx,
    hintFlag: () => replays > 0,
    onReady: () => {
      speakAlways("Listen carefully.");
      setTimeout(() => { if (alive(stageEl)) playSoundEffect(target.fx); }, 900);
      document.getElementById("sg-play").addEventListener("click", () => { replays++; playSoundEffect(target.fx); });
    }
  });
}

const TRAFFIC_ITEMS = [
  { fx: "horn", label: "Car horn", emoji: "🚗" }, { fx: "bell", label: "Bicycle bell", emoji: "🚲" },
  { fx: "siren", label: "Ambulance siren", emoji: "🚑" }, { fx: "train", label: "Train", emoji: "🚂" }
];
const NATURE_ITEMS = [
  { fx: "bird", label: "Bird", emoji: "🐦" }, { fx: "rain", label: "Rain", emoji: "🌧️" },
  { fx: "thunder", label: "Thunder", emoji: "⛈️" }, { fx: "wind", label: "Wind", emoji: "💨" }
];

/* Traffic Sounds — street safety: which vehicle made the sound? */
GAMES.trafficSounds = {
  setupType: "rounds",
  start(ctx){
    const pool = isModerate(ctx) ? TRAFFIC_ITEMS.slice(0, 3) : TRAFFIC_ITEMS;
    runRounds(ctx, (ctx, round, stageEl) => {
      const target = pick(pool);
      soundGuessRound(ctx, stageEl, shuffle(pool), target, "Listen. Which one made this sound?");
    });
  }
};

/* Nature Sounds */
GAMES.natureSounds = {
  setupType: "rounds",
  start(ctx){
    const pool = isModerate(ctx) ? NATURE_ITEMS.slice(0, 3) : NATURE_ITEMS;
    runRounds(ctx, (ctx, round, stageEl) => {
      const target = pick(pool);
      soundGuessRound(ctx, stageEl, shuffle(pool), target, "Listen. What nature sound is this?");
    });
  }
};

const MORE_AUDIO_STORIES = [
  { text: "Listen to the rain on the roof. Ben makes hot chocolate and sits by the window.",
    q: "What is Ben drinking?", a: "Hot chocolate", wrong: ["Orange juice", "Cold milk"] },
  { text: "Priya hears a drum. Boom, boom, boom! A parade is coming down her street.",
    q: "What is coming down the street?", a: "A parade", wrong: ["A train", "A boat"] },
  { text: "The farmer wakes up early. The rooster sings, and the cows say moo.",
    q: "Which animal sings in the morning?", a: "The rooster", wrong: ["The cow", "The fish"] },
  { text: "Kabir smells fresh bread. His grandmother is baking in the kitchen.",
    q: "Where is Kabir's grandmother?", a: "In the kitchen", wrong: ["At the park", "In the garden"] },
  { text: "Leela feels something soft and furry. It is her kitten. It purrs when she pets it.",
    q: "What is Leela petting?", a: "Her kitten", wrong: ["A puppy", "A rabbit"] },
  { text: "The school bell rings. The children line up and walk quietly to class.",
    q: "What do the children do when the bell rings?", a: "Line up", wrong: ["Go to sleep", "Run outside"] }
];

/* Storytelling (Visual Impairment) — the story and question are read aloud. */
GAMES.audioStory = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => storyRound(ctx, stageEl, pick(MORE_AUDIO_STORIES), {
      instruction: "Listen to the story. Then pick the right answer.", forceAudio: true
    }));
  }
};

const SEQ_SOUNDS = [
  { fx: "chime", label: "Chime", emoji: "🔔" }, { fx: "drum", label: "Drum", emoji: "🥁" },
  { fx: "whistle", label: "Whistle", emoji: "🎶" }, { fx: "clap", label: "Clap", emoji: "👏" }
];

/* Sequential Sounds — hear sounds in a row, then say the order they came in. */
GAMES.sequentialSounds = {
  setupType: "rounds",
  start(ctx){
    const len = isModerate(ctx) ? 2 : 3;
    runRounds(ctx, (ctx, round, stageEl) => {
      const seq = sample(SEQ_SOUNDS, len);
      const key = (arr) => arr.map(s => s.fx).join(">");
      const label = (arr) => arr.map(s => `${s.emoji} ${s.label}`).join(" → ");
      const options = [seq, [...seq].reverse()];
      let guard = 0;
      while (options.length < 3 && guard++ < 50){
        const alt = shuffle(seq);
        const swap = [...seq]; swap[Math.floor(Math.random() * len)] = pick(SEQ_SOUNDS.filter(s => !seq.includes(s)));
        const cand = Math.random() < 0.5 ? alt : swap;
        if (!options.some(o => key(o) === key(cand))) options.push(cand);
      }
      let listens = 0, playing = false;
      const play = () => {
        if (playing) return;
        playing = true; listens++;
        let t = 0;
        seq.forEach((s, i) => {
          setTimeout(() => { if (alive(stageEl)) playSoundEffect(s.fx); }, t);
          t += SOUND_FX_MS[s.fx] + 350;
        });
        setTimeout(() => {
          playing = false;
          if (!alive(stageEl)) return;
          stageEl.querySelectorAll("#choice-grid button").forEach(b => b.disabled = false);
          const st = document.getElementById("sq-status"); if (st) st.textContent = "Which order did you hear?";
        }, t);
      };
      choiceRound(ctx, stageEl, {
        instruction: `Listen to ${len} sounds in a row. Then pick the order you heard.`,
        promptHtml: `<button class="btn btn-accent btn-large" id="sq-listen" style="max-width:260px;">🔊 Listen</button>
                     <div id="sq-status" style="font-weight:700;" aria-live="polite">Press Listen first.</div>`,
        options: shuffle(options).map(o => ({ value: key(o), label: label(o), html: label(o) })),
        correct: key(seq),
        hintFlag: () => listens > 1,
        onReady: () => {
          stageEl.querySelectorAll("#choice-grid button").forEach(b => b.disabled = true);
          document.getElementById("sq-listen").addEventListener("click", play);
        }
      });
    });
  }
};

/* =========================================================
   HEARING IMPAIRMENT  (all visual)
========================================================= */

const MORE_ALPHABET = [
  { l: "A", emoji: "🍎", word: "Apple" }, { l: "B", emoji: "⚽", word: "Ball" }, { l: "C", emoji: "🐱", word: "Cat" },
  { l: "D", emoji: "🐶", word: "Dog" }, { l: "E", emoji: "🐘", word: "Elephant" }, { l: "F", emoji: "🐟", word: "Fish" },
  { l: "G", emoji: "🍇", word: "Grapes" }, { l: "H", emoji: "🏠", word: "House" }, { l: "M", emoji: "🌙", word: "Moon" },
  { l: "S", emoji: "☀️", word: "Sun" }, { l: "T", emoji: "🌳", word: "Tree" }
];

/* Alphabet Visual — match a big letter to the picture that starts with it. */
GAMES.alphabetVisual = {
  setupType: "rounds",
  start(ctx){
    const count = isModerate(ctx) ? 3 : 4;
    runRounds(ctx, (ctx, round, stageEl) => {
      const t = pick(MORE_ALPHABET);
      const others = sample(MORE_ALPHABET.filter(x => x.l !== t.l), count - 1);
      choiceRound(ctx, stageEl, {
        style: "tap",
        instruction: "Which picture starts with this letter?",
        promptHtml: `<div class="game-word" style="font-size:4rem;" id="av-letter" data-letter="${t.l}">${t.l} ${t.l.toLowerCase()}</div>`,
        options: shuffle([t, ...others]).map(x => ({
          value: x.l, label: x.word,
          html: `<div style="font-size:2.4rem;">${x.emoji}</div><div style="font-size:0.85rem;font-weight:700;">${x.word}</div>`
        })),
        correct: t.l
      });
    });
  }
};

const MORE_MIX = [
  { a: "Red", b: "Yellow", r: "Orange" }, { a: "Blue", b: "Yellow", r: "Green" },
  { a: "Red", b: "Blue", r: "Purple" },   { a: "Red", b: "White", r: "Pink" }
];
const MORE_HEX = Object.assign({ White: "#ffffff" }, ...PALETTE.map(c => ({ [c.name]: c.hex })));

/* Color Games — which colour do you get when you mix two colours? */
GAMES.colorMixing = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const mixes = moderate ? MORE_MIX.slice(0, 3) : MORE_MIX;
    const count = moderate ? 3 : 4;
    const swatch = (n) => `<div style="text-align:center;"><span class="swatch-dot" style="background:${MORE_HEX[n]}"></span><div style="font-size:0.85rem;font-weight:700;">${n}</div></div>`;
    runRounds(ctx, (ctx, round, stageEl) => {
      const m = pick(mixes);
      const results = ["Orange", "Green", "Purple", "Pink", "Red", "Blue", "Yellow"];
      const others = sample(results.filter(c => c !== m.r), count - 1);
      choiceRound(ctx, stageEl, {
        style: "tap",
        instruction: "What color do you make when you mix these two?",
        promptHtml: `<div style="display:flex; gap:14px; align-items:center; justify-content:center;" id="cm-mix" data-a="${m.a}" data-b="${m.b}">
                       ${swatch(m.a)}<span class="game-word">+</span>${swatch(m.b)}<span class="game-word">= ❓</span></div>`,
        options: shuffle([m.r, ...others]).map(n => ({ value: n, label: n, html: swatch(n) })),
        correct: m.r
      });
    });
  }
};

const MORE_SHAPE_PATHS = Object.assign({}, SHAPE_SVGS, {
  pentagon: `<polygon points="50,6 95,38 78,92 22,92 5,38"/>`,
  hexagon:  `<polygon points="28,8 72,8 96,50 72,92 28,92 4,50"/>`
});
const MORE_SIDES = { triangle: 3, square: 4, pentagon: 5, hexagon: 6 };
function shapeSvgMore(name, size, fill){
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="${fill}" role="img" aria-label="${name}">${MORE_SHAPE_PATHS[name]}</svg>`;
}

/* Shape Games — odd rounds: count the sides; even rounds: match the shadow. */
GAMES.shapeGames = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    runRounds(ctx, (ctx, round, stageEl) => {
      if (round % 2 === 1){
        const pool = moderate ? ["triangle", "square", "pentagon"] : ["triangle", "square", "pentagon", "hexagon"];
        const shape = pick(pool);
        choiceRound(ctx, stageEl, {
          instruction: "How many sides does this shape have?",
          promptHtml: `<div data-shape="${shape}">${shapeSvgMore(shape, 130, pick(PALETTE).hex)}</div>`,
          options: pool.map(s => ({ value: String(MORE_SIDES[s]), html: String(MORE_SIDES[s]) })),
          correct: String(MORE_SIDES[shape])
        });
      } else {
        const names = Object.keys(MORE_SHAPE_PATHS);
        const target = pick(names);
        const others = sample(names.filter(n => n !== target), moderate ? 2 : 3);
        choiceRound(ctx, stageEl, {
          style: "tap",
          instruction: "Which shape matches this shadow?",
          promptHtml: `<div data-shadow="${target}">${shapeSvgMore(target, 130, "#2b2b2b")}</div>`,
          options: shuffle([target, ...others]).map(n => ({ value: n, label: n, html: shapeSvgMore(n, 70, pick(PALETTE).hex) })),
          correct: target
        });
      }
    });
  }
};

const MORE_OBJECTS = [
  { emoji: "🪑", word: "CHAIR" }, { emoji: "🚗", word: "CAR" }, { emoji: "🏠", word: "HOUSE" }, { emoji: "⚽", word: "BALL" },
  { emoji: "📖", word: "BOOK" }, { emoji: "🌳", word: "TREE" }, { emoji: "☕", word: "CUP" }, { emoji: "🎈", word: "BALLOON" },
  { emoji: "🚲", word: "BICYCLE" }, { emoji: "⏰", word: "CLOCK" }, { emoji: "🐟", word: "FISH" }, { emoji: "🍎", word: "APPLE" },
  { emoji: "🔑", word: "KEY" }, { emoji: "🎒", word: "BAG" }
];

/* Object Recognition (Hearing) — match a picture with its written word. */
GAMES.objectWords = {
  setupType: "rounds",
  start(ctx){
    const count = isModerate(ctx) ? 3 : 4;
    runRounds(ctx, (ctx, round, stageEl) => {
      const t = pick(MORE_OBJECTS);
      const others = sample(MORE_OBJECTS.filter(o => o.word !== t.word), count - 1);
      choiceRound(ctx, stageEl, {
        instruction: "What is this? Pick the right word.",
        promptHtml: `<div class="big-emoji" role="img" aria-label="Picture" data-emoji="${t.emoji}">${t.emoji}</div>`,
        options: shuffle([t, ...others]).map(o => ({ value: o.word, html: o.word })),
        correct: t.word
      });
    });
  }
};

/* Number Games — compare two groups by looking: which has more / fewer? */
GAMES.quantityCompare = {
  setupType: "rounds",
  start(ctx){
    const hi = isModerate(ctx) ? 6 : 9;
    runRounds(ctx, (ctx, round, stageEl) => {
      const obj = pick(COUNT_OBJECT_POOL);
      let a = 1 + Math.floor(Math.random() * hi), b;
      do { b = 1 + Math.floor(Math.random() * hi); } while (b === a);
      const more = Math.random() < 0.5;
      const group = (n) => `<div style="display:flex; flex-wrap:wrap; gap:4px; justify-content:center; font-size:1.7rem; max-width:200px;">${Array.from({ length: n }, () => `<span>${obj.emoji}</span>`).join("")}</div>`;
      choiceRound(ctx, stageEl, {
        style: "tap",
        instruction: `Look at both groups. Tap the group with <strong>${more ? "MORE" : "FEWER"}</strong>.`,
        promptHtml: `<div id="qc-mode" data-mode="${more ? "more" : "fewer"}" style="display:none"></div>`,
        options: [{ value: "left", n: a }, { value: "right", n: b }].map(o => ({ value: o.value, label: `${o.value} group`, html: `<span data-count="${o.n}">${group(o.n)}</span>` })),
        correct: (more ? a > b : a < b) ? "left" : "right"
      });
    });
  }
};

/* =========================================================
   DYSGRAPHIA
========================================================= */

const MORE_DRAW_PROMPTS = [
  ["a sun", "☀️"], ["a house", "🏠"], ["a flower", "🌸"], ["a fish", "🐟"], ["a tree", "🌳"], ["a happy face", "😊"]
];
const MORE_INK = [
  { name: "Black", hex: "#2b2b2b" }, { name: "Red", hex: "#e8695f" }, { name: "Blue", hex: "#4c86b8" },
  { name: "Green", hex: "#4f9c6d" }, { name: "Yellow", hex: "#f5c451" }
];

/* Free Drawing — draw the prompt with a finger or mouse. The computer can't
   judge a drawing, so a helper marks whether it shows the prompt. */
GAMES.freeDrawing = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => {
      const [name, emoji] = pick(MORE_DRAW_PROMPTS);
      stageEl.innerHTML = `
        <p class="game-instructions">Draw <strong>${name}</strong> ${emoji}</p>
        <canvas id="fd-canvas" class="trace-canvas" width="360" height="260"></canvas>
        <div class="palette" id="fd-palette" role="group" aria-label="Pen colors">
          ${MORE_INK.map((c, i) => `<button class="palette-btn${i === 0 ? " active" : ""}" data-color="${c.hex}" aria-label="${c.name} pen" style="background:${c.hex}"></button>`).join("")}
        </div>
        <div id="fd-controls" style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
          <button class="btn btn-outline" id="fd-clear">🧽 Clear</button>
          <button class="btn btn-primary" id="fd-done">✅ Done Drawing</button>
          <button class="btn btn-outline" id="fd-skip">Skip</button>
        </div>
        <div id="fd-msg" style="font-weight:700;" aria-live="polite"></div>`;
      const canvas = document.getElementById("fd-canvas");
      const c2d = canvas.getContext("2d");
      let color = MORE_INK[0].hex, drawing = false, pts = 0, done = false;
      const startTime = Date.now();
      const pos = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height]; };
      canvas.addEventListener("pointerdown", (e) => {
        if (done) return;
        drawing = true; try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
        const [x, y] = pos(e);
        c2d.strokeStyle = color; c2d.lineWidth = 6; c2d.lineCap = "round"; c2d.lineJoin = "round";
        c2d.beginPath(); c2d.moveTo(x, y); c2d.lineTo(x + 0.1, y + 0.1); c2d.stroke(); pts++;
      });
      canvas.addEventListener("pointermove", (e) => { if (!drawing) return; const [x, y] = pos(e); c2d.lineTo(x, y); c2d.stroke(); pts++; });
      const stop = () => { drawing = false; };
      canvas.addEventListener("pointerup", stop); canvas.addEventListener("pointercancel", stop);
      document.getElementById("fd-palette").addEventListener("click", (e) => {
        const b = e.target.closest(".palette-btn"); if (!b) return;
        color = b.dataset.color;
        stageEl.querySelectorAll(".palette-btn").forEach(x => x.classList.toggle("active", x === b));
      });
      document.getElementById("fd-clear").addEventListener("click", () => { if (done) return; c2d.clearRect(0, 0, canvas.width, canvas.height); pts = 0; });
      document.getElementById("fd-skip").addEventListener("click", () => {
        if (done || !alive(stageEl)) return;
        done = true; ctx.onRoundResult({ correct: false, missed: true });
      });
      document.getElementById("fd-done").addEventListener("click", () => {
        if (done || !alive(stageEl)) return;
        if (pts < 15){ document.getElementById("fd-msg").textContent = "Draw a little more first!"; return; }
        const took = elapsed(startTime);
        document.getElementById("fd-controls").innerHTML = `
          <div class="hint-box"><strong>Helper:</strong> does the drawing show ${name}?</div>
          <button class="btn btn-success" id="fd-yes">✅ Yes</button>
          <button class="btn btn-outline" id="fd-no">🔁 Not yet</button>`;
        document.getElementById("fd-msg").textContent = "";
        const mark = (correct) => {
          if (done || !alive(stageEl)) return;
          done = true; ctx.onRoundResult({ correct, responseTime: took });
        };
        document.getElementById("fd-yes").addEventListener("click", () => mark(true));
        document.getElementById("fd-no").addEventListener("click", () => mark(false));
      });
    });
  }
};

const MORE_HW_EASY = ["ON", "UP", "GO", "NO", "IN"];
const MORE_HW_HARD = ["CAT", "SUN", "DOG", "MOM", "BED", "HAT"];

/* Handwriting Practice — trace a short word. Scored by how much of the word's
   shape was covered while staying on the letters. */
GAMES.handwriting = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const words = moderate ? MORE_HW_EASY : MORE_HW_HARD;
    const radius = moderate ? 26 : 20;
    runRounds(ctx, (ctx, round, stageEl) => {
      const word = pick(words);
      stageEl.innerHTML = `
        <p class="game-instructions">Trace the word <strong>${word}</strong> with your finger or mouse.</p>
        <canvas id="hw-canvas" class="trace-canvas" width="400" height="200"></canvas>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-outline" id="hw-clear">🧽 Clear</button>
          <button class="btn btn-primary" id="hw-done">✅ Done Writing</button>
        </div>`;
      const canvas = document.getElementById("hw-canvas");
      const c2d = canvas.getContext("2d");
      const W = canvas.width, H = canvas.height;
      const font = "bold 120px sans-serif";
      const off = document.createElement("canvas"); off.width = W; off.height = H;
      const o2d = off.getContext("2d");
      o2d.font = font; o2d.textAlign = "center"; o2d.textBaseline = "middle"; o2d.fillText(word, W / 2, H / 2 + 8);
      const data = o2d.getImageData(0, 0, W, H).data;
      const samples = [];
      for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x += 6) if (data[(y * W + x) * 4 + 3] > 128) samples.push([x, y]);
      canvas.__samples = samples;
      const redraw = () => {
        c2d.clearRect(0, 0, W, H);
        c2d.save(); c2d.setLineDash([6, 7]); c2d.strokeStyle = "#c9bfa8"; c2d.lineWidth = 2;
        c2d.font = font; c2d.textAlign = "center"; c2d.textBaseline = "middle"; c2d.strokeText(word, W / 2, H / 2 + 8); c2d.restore();
      };
      redraw();
      const tracer = attachTracing(canvas, c2d, { color: "#4c86b8", width: 7, redraw });
      const startTime = Date.now();
      let done = false;
      document.getElementById("hw-clear").addEventListener("click", () => { if (!done) tracer.clear(); });
      document.getElementById("hw-done").addEventListener("click", () => {
        if (done || !alive(stageEl)) return;
        done = true;
        if (tracer.points.length < 5){ ctx.onRoundResult({ correct: false, missed: true, responseTime: elapsed(startTime) }); return; }
        const s = traceScore(samples, tracer.points, radius);
        ctx.onRoundResult({ correct: s.coverage >= 0.55 && s.precision >= 0.6, responseTime: elapsed(startTime) });
      });
    });
  }
};

const MORE_PICTURES = {
  house: {
    name: "house",
    svg: `<polygon class="region" data-part="roof" points="20,90 100,30 180,90"/>
          <rect class="region" data-part="wall" x="40" y="90" width="120" height="90"/>
          <rect class="region" data-part="door" x="88" y="125" width="28" height="55"/>
          <rect class="region" data-part="window" x="55" y="105" width="25" height="25"/>`,
    parts: ["roof", "wall", "door", "window"]
  },
  flower: {
    name: "flower",
    svg: `<g class="region" data-part="petals"><circle cx="100" cy="55" r="24"/><circle cx="100" cy="125" r="24"/><circle cx="65" cy="90" r="24"/><circle cx="135" cy="90" r="24"/></g>
          <circle class="region" data-part="center" cx="100" cy="90" r="18"/>
          <rect class="region" data-part="stem" x="96" y="145" width="8" height="45"/>
          <ellipse class="region" data-part="leaf" cx="130" cy="170" rx="22" ry="10"/>`,
    parts: ["petals", "center", "stem", "leaf"]
  },
  tree: {
    name: "tree",
    svg: `<circle class="region" data-part="crown" cx="100" cy="70" r="52"/>
          <rect class="region" data-part="trunk" x="88" y="118" width="24" height="65"/>
          <circle class="region" data-part="apple" cx="122" cy="85" r="9"/>`,
    parts: ["crown", "trunk", "apple"]
  }
};
const MORE_PAINTS = [...PALETTE.slice(0, 6).map(c => ({ name: c.name, hex: c.hex })), { name: "Brown", hex: "#8b5a2b" }];

/* Coloring Challenges — follow colouring instructions (fine-motor control and
   careful reading). Correct when every instructed part has the right colour. */
GAMES.coloringChallenge = {
  setupType: "rounds",
  start(ctx){
    const taskCount = isModerate(ctx) ? 2 : 3;
    runRounds(ctx, (ctx, round, stageEl) => {
      const pic = pick(Object.values(MORE_PICTURES));
      const parts = sample(pic.parts, taskCount);
      const tasks = parts.map(p => ({ part: p, paint: pick(MORE_PAINTS) }));
      stageEl.innerHTML = `
        <p class="game-instructions">Follow the instructions to color the ${pic.name}. Pick a color, then tap a part.</p>
        <ul class="color-tasks" id="cc-tasks">
          ${tasks.map(t => `<li data-part="${t.part}" data-color="${t.paint.name}">Color the <strong>${t.part.toUpperCase()}</strong> <strong>${t.paint.name.toUpperCase()}</strong></li>`).join("")}
        </ul>
        <svg viewBox="0 0 200 200" width="220" height="220" id="cc-svg" role="img" aria-label="A ${pic.name} to color" style="background:#fff; border-radius:12px;">${pic.svg}</svg>
        <div class="palette" id="cc-palette" role="group" aria-label="Paint colors">
          ${MORE_PAINTS.map(c => `<button class="palette-btn" data-color="${c.name}" aria-label="${c.name}" style="background:${c.hex}"></button>`).join("")}
        </div>
        <button class="btn btn-primary" id="cc-done">✅ Done Coloring</button>`;
      const svg = document.getElementById("cc-svg");
      svg.querySelectorAll(".region").forEach(r => {
        const kids = r.tagName.toLowerCase() === "g" ? r.querySelectorAll("*") : [r];
        kids.forEach(k => { k.setAttribute("fill", "#ffffff"); k.setAttribute("stroke", "#333"); k.setAttribute("stroke-width", "3"); });
      });
      const hexOf = Object.fromEntries(MORE_PAINTS.map(c => [c.name, c.hex]));
      const painted = {};
      let selected = null, done = false;
      const startTime = Date.now();
      document.getElementById("cc-palette").addEventListener("click", (e) => {
        const b = e.target.closest(".palette-btn"); if (!b) return;
        selected = b.dataset.color;
        stageEl.querySelectorAll(".palette-btn").forEach(x => x.classList.toggle("active", x === b));
      });
      svg.addEventListener("click", (e) => {
        const r = e.target.closest(".region");
        if (!r || !selected || done) return;
        const kids = r.tagName.toLowerCase() === "g" ? r.querySelectorAll("*") : [r];
        kids.forEach(k => k.setAttribute("fill", hexOf[selected]));
        painted[r.dataset.part] = selected;
      });
      document.getElementById("cc-done").addEventListener("click", () => {
        if (done || !alive(stageEl)) return;
        done = true;
        if (!Object.keys(painted).length){ ctx.onRoundResult({ correct: false, missed: true, responseTime: elapsed(startTime) }); return; }
        const ok = tasks.every(t => painted[t.part] === t.paint.name);
        ctx.onRoundResult({ correct: ok, responseTime: elapsed(startTime) });
      });
    });
  }
};

/* Memory Strengthening — study a shape, it disappears, then draw it from
   memory. Scored by how closely the drawing follows the shape. */
function memoryShapePoints(kind){
  const pts = [];
  const seg = (x1, y1, x2, y2) => { const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 5)); for (let i = 0; i <= n; i++) pts.push([x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]); };
  if (kind === "circle"){ for (let a = 0; a <= Math.PI * 2; a += 0.07) pts.push([180 + 70 * Math.cos(a), 120 + 70 * Math.sin(a)]); }
  else if (kind === "square"){ seg(110, 60, 250, 60); seg(250, 60, 250, 180); seg(250, 180, 110, 180); seg(110, 180, 110, 60); }
  else if (kind === "triangle"){ seg(180, 45, 260, 190); seg(260, 190, 100, 190); seg(100, 190, 180, 45); }
  else return patternPoints(kind);
  return pts;
}

GAMES.shapeMemoryDraw = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const kinds = moderate ? ["circle", "square", "triangle"] : ["circle", "square", "triangle", "zigzag", "wave", "loops"];
    const studyMs = moderate ? 4000 : 3000;
    const radius = moderate ? 34 : 28;
    runRounds(ctx, (ctx, round, stageEl) => {
      const kind = pick(kinds);
      const guide = memoryShapePoints(kind);
      stageEl.innerHTML = `
        <p class="game-instructions" id="ms-text">Look carefully at this shape and remember it!</p>
        <div class="sack-timer" aria-hidden="true"><span id="ms-bar" style="width:100%"></span></div>
        <canvas id="ms-canvas" class="trace-canvas" width="360" height="240"></canvas>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-outline" id="ms-clear" disabled>🧽 Clear</button>
          <button class="btn btn-primary" id="ms-done" disabled>✅ Done</button>
        </div>`;
      const canvas = document.getElementById("ms-canvas");
      const c2d = canvas.getContext("2d");
      canvas.__samples = guide;
      c2d.strokeStyle = "#4c86b8"; c2d.lineWidth = 6; c2d.lineCap = "round"; c2d.lineJoin = "round";
      c2d.beginPath(); guide.forEach((p, i) => i ? c2d.lineTo(p[0], p[1]) : c2d.moveTo(p[0], p[1])); c2d.stroke();
      const bar = document.getElementById("ms-bar");
      if (!getSettings().reducedMotion){
        bar.style.transition = `width ${studyMs}ms linear`;
        requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = "0%"; }));
      }
      let done = false, tracer = null, startTime = null;
      setTimeout(() => {
        if (!alive(stageEl)) return;
        c2d.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById("ms-text").textContent = "Now draw the shape from memory!";
        document.getElementById("ms-clear").disabled = false;
        document.getElementById("ms-done").disabled = false;
        tracer = attachTracing(canvas, c2d, { color: "#e8695f", width: 6, redraw: () => c2d.clearRect(0, 0, canvas.width, canvas.height) });
        startTime = Date.now();
      }, studyMs);
      document.getElementById("ms-clear").addEventListener("click", () => { if (tracer && !done) tracer.clear(); });
      document.getElementById("ms-done").addEventListener("click", () => {
        if (done || !tracer || !alive(stageEl)) return;
        done = true;
        if (tracer.points.length < 5){ ctx.onRoundResult({ correct: false, missed: true, responseTime: elapsed(startTime) }); return; }
        const s = traceScore(guide, tracer.points, radius);
        ctx.onRoundResult({ correct: s.coverage >= 0.5 && s.precision >= 0.55, responseTime: elapsed(startTime) });
      });
    });
  }
};
