/* =========================================================
   LearnAble — games_more.js  (Part A of the remaining games)
   Autism · ADHD · Dyslexia · Dyscalculia
   (Dyspraxia's "Sack Bear" reuses GAMES.sackBear from games.js.)

   Uses helpers from games_extra.js: alive, speakAlways, isModerate,
   elapsed, choiceRound, numberOptions, playTone, PALETTE.
   Every game reports through ctx.onRoundResult(), so sessions, accuracy
   and the Reports page work exactly like the other games.
========================================================= */

/* =========================================================
   AUTISM
========================================================= */

const MORE_TALK = [
  { say: "Hello!",                          good: "Hello!",              bad: ["Go away.", "Banana."] },
  { say: "Thank you for sharing your toy!", good: "You're welcome!",     bad: ["Give it back now!", "Bye."] },
  { say: "Can I play with you?",            good: "Yes, let's play!",    bad: ["No, go away.", "It is purple."] },
  { say: "Good morning!",                   good: "Good morning!",       bad: ["Good night.", "Banana."] },
  { say: "Ouch! I fell down.",              good: "Are you okay?",       bad: ["Ha ha ha!", "Look at my shoes."] },
  { say: "Goodbye! See you tomorrow!",      good: "Goodbye! See you!",   bad: ["Hello again!", "Banana."] },
  { say: "Please pass me the water.",       good: "Here you go.",        bad: ["No.", "I like trains."] }
];
const MORE_EMOTIONS = [
  { emoji: "😊", word: "Happy" }, { emoji: "😢", word: "Sad" }, { emoji: "😠", word: "Angry" },
  { emoji: "😮", word: "Surprised" }, { emoji: "😨", word: "Scared" }
];

/* Talking Friend — social conversation + recognising feelings.
   Odd rounds: choose a kind reply. Even rounds: name the feeling. */
GAMES.talkingFriend = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    runRounds(ctx, (ctx, round, stageEl) => {
      let replays = 0;
      if (round % 2 === 1){
        const s = pick(MORE_TALK);
        choiceRound(ctx, stageEl, {
          instruction: "Your friend is talking to you. What do you say back?",
          promptHtml: `
            <div class="big-emoji" aria-hidden="true">🧸</div>
            <div class="game-word" style="font-size:1.5rem;" id="tf-say">“${escapeHtml(s.say)}”</div>
            <button class="btn btn-accent" id="tf-replay">🔊 Hear it again</button>`,
          options: shuffle([s.good, ...s.bad]).map(t => ({ value: t, html: escapeHtml(t) })),
          correct: s.good,
          hintFlag: () => replays > 0,
          onReady: () => {
            speak(s.say);
            document.getElementById("tf-replay").addEventListener("click", () => { replays++; speak(s.say); });
          }
        });
      } else {
        const feel = pick(MORE_EMOTIONS);
        const others = sample(MORE_EMOTIONS.filter(e => e.word !== feel.word), moderate ? 2 : 3);
        choiceRound(ctx, stageEl, {
          instruction: "Look at your friend's face. How does your friend feel?",
          promptHtml: `<div class="big-emoji" role="img" aria-label="A friend's face" data-feeling="${feel.word}">${feel.emoji}</div>`,
          options: shuffle([feel, ...others]).map(e => ({ value: e.word, html: e.word })),
          correct: feel.word
        });
      }
    });
  }
};

/* Shared card-flip memory board. */
function memoryPairsRound(ctx, stageEl, o){
  const faces = sample(o.pool, o.pairs);
  const cards = shuffle([...faces, ...faces]);
  const cols = cards.length <= 6 ? 3 : 4;
  stageEl.innerHTML = `
    <p class="game-instructions">${o.instruction}</p>
    ${o.limitMs ? `<div class="sack-timer" aria-hidden="true"><span id="mp-bar" style="width:100%"></span></div>` : ""}
    <div class="tap-grid" id="mp-grid" style="grid-template-columns:repeat(${cols}, 1fr); max-width:${cols * 110}px;">
      ${cards.map((f, i) => `<button class="tap-item mem-card" data-i="${i}" data-face="${f}" aria-label="Card ${i + 1}, face down">❓</button>`).join("")}
    </div>
    <div id="mp-info" style="font-weight:700;" aria-live="polite">Mistakes: 0</div>`;
  const grid = document.getElementById("mp-grid");
  const startTime = Date.now();
  let open = [], matched = 0, mistakes = 0, lock = false, done = false, timer;
  const finish = (res) => {
    if (done || !alive(stageEl)) return;
    done = true; clearTimeout(timer); res.responseTime = res.responseTime || elapsed(startTime);
    grid.querySelectorAll("button").forEach(b => b.disabled = true);
    ctx.onRoundResult(res);
  };
  if (o.limitMs){
    const bar = document.getElementById("mp-bar");
    bar.style.transition = `width ${o.limitMs}ms linear`;
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = "0%"; }));
    timer = setTimeout(() => finish({ correct: false, missed: true }), o.limitMs);
  }
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".mem-card");
    if (!btn || lock || done || btn.classList.contains("matched") || open.includes(btn)) return;
    btn.textContent = btn.dataset.face; btn.classList.add("flipped");
    open.push(btn);
    if (open.length < 2) return;
    const [a, b] = open;
    if (a.dataset.face === b.dataset.face){
      a.classList.add("matched"); b.classList.add("matched"); open = []; matched++;
      if (matched === o.pairs) finish({ correct: mistakes <= o.maxMistakes });
    } else {
      mistakes++; lock = true;
      document.getElementById("mp-info").textContent = `Mistakes: ${mistakes}`;
      setTimeout(() => {
        if (!alive(stageEl)) return;
        a.textContent = "❓"; b.textContent = "❓"; a.classList.remove("flipped"); b.classList.remove("flipped");
        open = []; lock = false;
      }, 900);
    }
  });
}

/* Memory Game (Autism) — calm, no timer. */
GAMES.autismMemory = {
  setupType: "rounds",
  start(ctx){
    const pairs = isModerate(ctx) ? 3 : 4;
    runRounds(ctx, (ctx, round, stageEl) => memoryPairsRound(ctx, stageEl, {
      instruction: "Flip two cards to find the matching pairs. Take your time!",
      pool: ["🍎", "🐶", "🚗", "⭐", "🌸", "🐟", "🏠", "🎈"],
      pairs, maxMistakes: pairs
    }));
  }
};

/* =========================================================
   ADHD
========================================================= */

const MORE_FRUITS = ["🍎", "🍌", "🍉", "🍇", "🍓", "🍊"];

/* Fruit Slice — 5 items pop up one at a time. Slice fruit, leave the bomb.
   Trains quick responses AND impulse control. A round is correct when at
   least 4 of the 5 decisions were right. */
GAMES.fruitSlice = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const showMs = moderate ? 2200 : 1600;
    const waveSize = 5, bombs = moderate ? 1 : 2;
    runRounds(ctx, (ctx, round, stageEl) => {
      const kinds = shuffle([...Array(waveSize - bombs).fill("fruit"), ...Array(bombs).fill("bomb")]);
      stageEl.innerHTML = `
        <p class="game-instructions">Tap the fruit to slice it! Do <strong>not</strong> tap the bomb 💣.</p>
        <div class="fruit-area" id="fs-area"></div>
        <div id="fs-count" style="font-weight:700;">Item 0 / ${waveSize}</div>`;
      const area = document.getElementById("fs-area");
      let idx = 0, right = 0, taps = 0, done = false;
      const latencies = [];
      const finishRound = () => {
        if (done || !alive(stageEl)) return;
        done = true;
        if (taps === 0){ ctx.onRoundResult({ correct: false, missed: true }); return; }
        const avg = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
        ctx.onRoundResult({ correct: right / waveSize >= 0.8, responseTime: +avg.toFixed(2) });
      };
      const next = () => {
        if (done || !alive(stageEl)) return;
        if (idx >= waveSize){ finishRound(); return; }
        const kind = kinds[idx]; idx++;
        document.getElementById("fs-count").textContent = `Item ${idx} / ${waveSize}`;
        const b = document.createElement("button");
        b.className = "fruit-item"; b.dataset.kind = kind;
        b.textContent = kind === "bomb" ? "💣" : pick(MORE_FRUITS);
        b.setAttribute("aria-label", kind === "bomb" ? "Bomb. Do not tap." : "Fruit. Tap to slice.");
        b.style.left = (4 + Math.random() * 68) + "%";
        b.style.top = (4 + Math.random() * 62) + "%";
        area.appendChild(b);
        const shownAt = Date.now();
        let resolved = false, timer;
        const resolve = (tapped) => {
          if (resolved || !alive(stageEl)) return;
          resolved = true; clearTimeout(timer);
          if (tapped){
            taps++; latencies.push(elapsed(shownAt));
            if (kind === "fruit"){ right++; b.classList.add("sliced"); } else b.classList.add("boom");
          } else if (kind === "bomb") right++;
          setTimeout(() => { b.remove(); next(); }, tapped ? 250 : 150);
        };
        b.addEventListener("click", () => resolve(true));
        timer = setTimeout(() => resolve(false), showMs);
      };
      next();
    });
  }
};

/* Memory Game (ADHD) — same board, but against the clock. */
GAMES.adhdMemory = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const pairs = moderate ? 3 : 4;
    runRounds(ctx, (ctx, round, stageEl) => memoryPairsRound(ctx, stageEl, {
      instruction: "Find all the matching pairs before the time bar runs out!",
      pool: ["🍌", "🐱", "⚽", "🌙", "🍇", "🦋", "🚲", "🎁"],
      pairs, maxMistakes: pairs, limitMs: moderate ? 40000 : 35000
    }));
  }
};

/* Counting (ADHD) — touch each object once to count it (a steady, one-by-one
   routine), then choose the total. */
GAMES.adhdCounting = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    runRounds(ctx, (ctx, round, stageEl) => {
      const obj = pick(COUNT_OBJECT_POOL);
      const k = moderate ? 3 + Math.floor(Math.random() * 4) : 5 + Math.floor(Math.random() * 5);
      const spots = new Set(sample([...Array(12).keys()], k));
      const opts = numberOptions(k, 4, 2);
      stageEl.innerHTML = `
        <p class="game-instructions">Touch each picture <strong>once</strong> to count it. Then pick the total.</p>
        <div class="count-field" id="cf-field">
          ${[...Array(12).keys()].map(i => spots.has(i)
            ? `<button class="count-item" data-obj="1" aria-label="${obj.name}"><span class="count-emoji">${obj.emoji}</span><span class="count-badge"></span></button>`
            : `<span class="count-empty"></span>`).join("")}
        </div>
        <div class="option-grid" id="choice-grid" role="group" aria-label="How many?">
          ${opts.map(v => `<button class="option-btn" data-val="${v}">${v}</button>`).join("")}
        </div>`;
      const startTime = Date.now();
      let counted = 0, done = false;
      document.getElementById("cf-field").addEventListener("click", (e) => {
        const b = e.target.closest(".count-item");
        if (!b || b.classList.contains("counted") || done) return;
        counted++; b.classList.add("counted"); b.querySelector(".count-badge").textContent = counted;
      });
      document.getElementById("choice-grid").addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-val]");
        if (!btn || done || !alive(stageEl)) return;
        done = true;
        const correct = +btn.dataset.val === k;
        btn.classList.add(correct ? "correct-flash" : "incorrect-flash");
        stageEl.querySelectorAll("button").forEach(x => x.disabled = true);
        ctx.onRoundResult({ correct, responseTime: elapsed(startTime), hintUsed: false });
      });
    });
  }
};

const MORE_SIMILAR_SETS = [
  ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"],
  ["🍎", "🍊", "🍋", "🍐", "🍑", "🍒", "🍓", "🍉"],
  ["🚗", "🚕", "🚌", "🚑", "🚓", "🚒", "🚜", "🚲"]
];

/* Object Recognition (ADHD) — visual search under a time limit. */
GAMES.findTheObject = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const limitMs = moderate ? 15000 : 12000;
    const cellCount = moderate ? 6 : 9;
    const targetCount = moderate ? 1 : 2;
    runRounds(ctx, (ctx, round, stageEl) => {
      const set = pick(MORE_SIMILAR_SETS);
      const target = pick(set);
      const others = sample(set.filter(x => x !== target), 3);
      const cells = shuffle([...Array(targetCount).fill(target), ...Array.from({ length: cellCount - targetCount }, () => pick(others))]);
      stageEl.innerHTML = `
        <p class="game-instructions">Find ${targetCount > 1 ? "<strong>both</strong>" : "the"} <span style="font-size:2rem;" data-target="${target}">${target}</span> — look carefully!</p>
        <div class="sack-timer" aria-hidden="true"><span id="fo-bar" style="width:100%"></span></div>
        <div class="tap-grid" id="fo-grid">
          ${cells.map(c => `<button class="tap-item" data-emoji="${c}" aria-label="Picture">${c}</button>`).join("")}
        </div>`;
      const startTime = Date.now();
      let found = 0, done = false, timer;
      const finish = (res) => {
        if (done || !alive(stageEl)) return;
        done = true; clearTimeout(timer);
        stageEl.querySelectorAll("#fo-grid button").forEach(b => b.disabled = true);
        ctx.onRoundResult(res);
      };
      const bar = document.getElementById("fo-bar");
      bar.style.transition = `width ${limitMs}ms linear`;
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = "0%"; }));
      timer = setTimeout(() => finish({ correct: false, missed: true }), limitMs);
      document.getElementById("fo-grid").addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-emoji]");
        if (!btn || btn.disabled || done) return;
        if (btn.dataset.emoji === target){
          btn.classList.add("correct-flash"); btn.disabled = true; found++;
          if (found === targetCount) finish({ correct: true, responseTime: elapsed(startTime) });
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

const MORE_PRON_EASY = [["cat", "cat"], ["dog", "dog"], ["sun", "sun"], ["book", "book"], ["apple", "ap·ple"], ["table", "ta·ble"], ["paper", "pa·per"]];
const MORE_PRON_HARD = [["butterfly", "but·ter·fly"], ["banana", "ba·na·na"], ["elephant", "el·e·phant"], ["computer", "com·pu·ter"], ["watermelon", "wa·ter·mel·on"], ["umbrella", "um·brel·la"]];

/* Pronunciation Practice — hear the word, say it aloud, a helper (teacher or
   parent) marks it. Accuracy = words the helper marked as clear. */
GAMES.pronunciation = {
  setupType: "rounds",
  start(ctx){
    const pool = isModerate(ctx) ? MORE_PRON_EASY : [...MORE_PRON_EASY, ...MORE_PRON_HARD];
    runRounds(ctx, (ctx, round, stageEl) => {
      const [word, syl] = pick(pool);
      let replays = 0;
      stageEl.innerHTML = `
        <p class="game-instructions">Listen, then say the word out loud.</p>
        <div class="game-word" id="pr-word" data-word="${word}">${word}</div>
        <div style="font-size:1.4rem; letter-spacing:2px;">${syl}</div>
        <button class="btn btn-accent" id="pr-listen">🔊 Hear it again</button>
        <div class="hint-box"><strong>Helper:</strong> how did the child say it?</div>
        <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
          <button class="btn btn-success" id="pr-good">✅ Said it clearly</button>
          <button class="btn btn-outline" id="pr-practice">🔁 Needs practice</button>
        </div>`;
      const startTime = Date.now();
      let done = false;
      speakAlways(word);
      document.getElementById("pr-listen").addEventListener("click", () => { replays++; speakAlways(word); });
      const mark = (correct) => {
        if (done || !alive(stageEl)) return;
        done = true;
        stageEl.querySelectorAll("button").forEach(b => b.disabled = true);
        ctx.onRoundResult({ correct, responseTime: elapsed(startTime), hintUsed: replays > 0 });
      };
      document.getElementById("pr-good").addEventListener("click", () => mark(true));
      document.getElementById("pr-practice").addEventListener("click", () => mark(false));
    });
  }
};

const MORE_COLOR_THINGS = [
  { emoji: "🍌", word: "Banana", color: "Yellow" }, { emoji: "🍎", word: "Apple", color: "Red" },
  { emoji: "🌿", word: "Leaf", color: "Green" },    { emoji: "🌊", word: "Sea", color: "Blue" },
  { emoji: "🍊", word: "Orange", color: "Orange" }, { emoji: "🍇", word: "Grapes", color: "Purple" },
  { emoji: "🐷", word: "Pig", color: "Pink" },      { emoji: "🐸", word: "Frog", color: "Green" },
  { emoji: "🍓", word: "Strawberry", color: "Red" }, { emoji: "🌻", word: "Sunflower", color: "Yellow" }
];

/* Color Association — link a word + picture with its usual colour. */
GAMES.colorAssociation = {
  setupType: "rounds",
  start(ctx){
    const count = isModerate(ctx) ? 3 : 4;
    runRounds(ctx, (ctx, round, stageEl) => {
      const t = pick(MORE_COLOR_THINGS);
      const target = PALETTE.find(c => c.name === t.color);
      const others = sample(PALETTE.filter(c => c.name !== t.color), count - 1);
      let replays = 0;
      choiceRound(ctx, stageEl, {
        style: "tap",
        instruction: "What color is it usually?",
        promptHtml: `
          <div class="big-emoji" aria-hidden="true">${t.emoji}</div>
          <div class="game-word" id="ca-word" data-word="${t.word}">${t.word.toUpperCase()}</div>
          <button class="btn btn-accent" id="ca-replay">🔊 Hear it</button>`,
        options: shuffle([target, ...others]).map(c => ({
          value: c.name, label: c.name,
          html: `<span class="swatch-dot" style="background:${c.hex}"></span><div style="font-size:0.85rem; font-weight:700;">${c.name}</div>`
        })),
        correct: t.color,
        hintFlag: () => replays > 0,
        onReady: () => {
          speak(t.word);
          document.getElementById("ca-replay").addEventListener("click", () => { replays++; speak(t.word); });
        }
      });
    });
  }
};

/* Rhythm Activities — listen to a short beat, then tap it back. Compares the
   gaps between beats as proportions, so tempo doesn't have to match exactly. */
GAMES.rhythmTap = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const patterns = moderate
      ? [[600, 600], [500, 500], [400, 800], [800, 400]]
      : [[400, 400, 800], [800, 400, 400], [400, 800, 400], [600, 300, 300], [300, 300, 600]];
    runRounds(ctx, (ctx, round, stageEl) => {
      const gaps = pick(patterns);
      const n = gaps.length + 1;
      stageEl.innerHTML = `
        <p class="game-instructions">Press <strong>Listen</strong>, then tap the drum with the <strong>same rhythm</strong>.</p>
        <button class="btn btn-accent btn-large" id="rt-listen" style="max-width:240px;">🔊 Listen</button>
        <button class="big-tap-btn" id="rt-drum" aria-label="Drum" data-beats="${n}" disabled>🥁</button>
        <div id="rt-status" style="font-weight:700;" aria-live="polite">Press Listen first. (${n} beats)</div>`;
      const drum = document.getElementById("rt-drum");
      const status = (t) => { const s = document.getElementById("rt-status"); if (s) s.textContent = t; };
      let listens = 0, taps = [], playing = false, done = false, readyAt = null;
      const flash = () => { drum.classList.add("lit"); setTimeout(() => drum.classList.remove("lit"), 180); };
      document.getElementById("rt-listen").addEventListener("click", () => {
        if (playing || done || taps.length) return;
        playing = true; listens++; drum.disabled = true; status("Listen…");
        const times = [0];
        gaps.forEach(g => times.push(times[times.length - 1] + g));
        times.forEach((t, i) => setTimeout(() => {
          if (!alive(stageEl)) return;
          playTone(220, 140); flash();
          if (i === times.length - 1) setTimeout(() => {
            if (!alive(stageEl)) return;
            playing = false; drum.disabled = false; readyAt = Date.now();
            status(`Your turn! Tap ${n} times.`);
          }, 500);
        }, t));
      });
      drum.addEventListener("click", () => {
        if (done || playing || !alive(stageEl)) return;
        taps.push(performance.now()); playTone(220, 120); flash();
        if (taps.length < n) return;
        done = true; drum.disabled = true;
        const actual = taps.slice(1).map((t, i) => t - taps[i]);
        const sumA = actual.reduce((a, b) => a + b, 0), sumE = gaps.reduce((a, b) => a + b, 0);
        const ok = sumA < sumE * 4 && actual.every((a, i) => Math.abs(a / sumA - gaps[i] / sumE) < 0.15);
        ctx.onRoundResult({ correct: ok, responseTime: elapsed(readyAt || Date.now()), hintUsed: listens > 1 });
      });
    });
  }
};

/* Short stories used by both reading-based and audio-based story games. */
const MORE_STORIES = [
  { text: "Mia has a red kite. The wind is strong. She runs to the park to fly it.",
    q: "Where does Mia fly her kite?", a: "In the park", wrong: ["At school", "On the beach"] },
  { text: "Sam feeds his dog every morning. The dog's name is Bruno. Bruno wags his tail.",
    q: "What is the dog's name?", a: "Bruno", wrong: ["Max", "Rocky"] },
  { text: "It is raining outside. Ria takes her yellow umbrella and walks to school.",
    q: "What color is Ria's umbrella?", a: "Yellow", wrong: ["Red", "Blue"] },
  { text: "Ravi planted a seed. He gave it water and sunlight. After many days, a flower grew.",
    q: "What did the seed need to grow?", a: "Water and sunlight", wrong: ["Toys and games", "Music and snow"] },
  { text: "Tina baked a cake for her grandmother. It had three candles. They sang a happy song.",
    q: "How many candles were on the cake?", a: "Three", wrong: ["Five", "Two"] },
  { text: "A little bird built a nest in a tall tree. She laid two blue eggs inside it.",
    q: "Where did the bird build her nest?", a: "In a tall tree", wrong: ["On the ground", "In a boat"] },
  { text: "Arun and his sister went to the market. They bought apples, bread and milk.",
    q: "Who went to the market?", a: "Arun and his sister", wrong: ["Arun and his teacher", "Only his sister"] },
  { text: "The sun went down and the stars came out. Dev put on his pajamas and went to bed.",
    q: "What did Dev do when the stars came out?", a: "He went to bed", wrong: ["He played football", "He ate lunch"] }
];

/* Shared story round: read/listen, then answer a question. */
function storyRound(ctx, stageEl, story, o){
  let replays = 0;
  choiceRound(ctx, stageEl, {
    instruction: o.instruction,
    promptHtml: `
      <div class="story-card" id="st-text">${escapeHtml(story.text)}</div>
      <button class="btn btn-accent" id="st-listen">🔊 Listen to the story</button>
      <div class="game-word" style="font-size:1.4rem;" id="st-q">${escapeHtml(story.q)}</div>`,
    options: shuffle([story.a, ...story.wrong]).map(t => ({ value: t, html: escapeHtml(t) })),
    correct: story.a,
    hintFlag: () => replays > 0,
    onReady: () => {
      const say = () => o.forceAudio ? speakAlways(`${story.text} ${story.q}`) : speak(story.text);
      say();
      document.getElementById("st-listen").addEventListener("click", () => { replays++; say(); });
    }
  });
}

/* Storytelling (Dyslexia) — read along (big text + audio), answer a question. */
GAMES.readingStory = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => storyRound(ctx, stageEl, pick(MORE_STORIES), {
      instruction: "Read the story (or press Listen). Then answer the question."
    }));
  }
};

const MORE_PAGES = [
  { emoji: "🐱", before: "The cat sat on the", after: ".", a: "mat", wrong: ["sky", "moon"] },
  { emoji: "☀️", before: "The", after: "is bright and hot.", a: "sun", wrong: ["dog", "bed"] },
  { emoji: "🐟", before: "A fish can", after: "in water.", a: "swim", wrong: ["fly", "dig"] },
  { emoji: "🐦", before: "A bird can", after: "high in the sky.", a: "fly", wrong: ["swim", "sleep"] },
  { emoji: "🍎", before: "I eat a red", after: ".", a: "apple", wrong: ["chair", "shoe"] },
  { emoji: "🌧️", before: "When it rains, I use an", after: ".", a: "umbrella", wrong: ["apple", "ladder"] },
  { emoji: "🚌", before: "The bus takes us to", after: ".", a: "school", wrong: ["the moon", "the sea floor"] },
  { emoji: "🛏️", before: "At night I sleep in my", after: ".", a: "bed", wrong: ["shoe", "cup"] }
];

/* Interactive Storybooks — turn the pages; tap the word that finishes each
   sentence. The blank fills in when the answer is right. */
GAMES.storybook = {
  setupType: "rounds",
  start(ctx){
    runRounds(ctx, (ctx, round, stageEl) => {
      const pg = pick(MORE_PAGES);
      let replays = 0;
      const fullSentence = `${pg.before} ${pg.a} ${pg.after}`.replace(" .", ".");
      stageEl.innerHTML = `
        <p class="game-instructions">📖 Page ${round}. Which word finishes the sentence?</p>
        <div class="big-emoji" aria-hidden="true">${pg.emoji}</div>
        <div class="story-card" id="sb-sentence">${escapeHtml(pg.before)} <span class="story-blank" id="sb-blank">_____</span> ${escapeHtml(pg.after)}</div>
        <button class="btn btn-accent" id="sb-listen">🔊 Read to me</button>
        <div class="option-grid" id="choice-grid" role="group" aria-label="Words">
          ${shuffle([pg.a, ...pg.wrong]).map(w => `<button class="option-btn" data-val="${escapeHtml(w)}">${escapeHtml(w)}</button>`).join("")}
        </div>`;
      const startTime = Date.now();
      let done = false;
      speak(`${pg.before} blank ${pg.after}`);
      document.getElementById("sb-listen").addEventListener("click", () => { replays++; speak(`${pg.before} blank ${pg.after}`); });
      document.getElementById("choice-grid").addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-val]");
        if (!btn || done || !alive(stageEl)) return;
        done = true;
        const correct = btn.dataset.val === pg.a;
        btn.classList.add(correct ? "correct-flash" : "incorrect-flash");
        if (correct){ const bl = document.getElementById("sb-blank"); bl.textContent = pg.a; bl.classList.add("filled"); speak(fullSentence); }
        stageEl.querySelectorAll("#choice-grid button").forEach(b => b.disabled = true);
        ctx.onRoundResult({ correct, responseTime: elapsed(startTime), hintUsed: replays > 0 });
      });
    });
  }
};

/* =========================================================
   DYSCALCULIA
========================================================= */

/* Multiplication / Division — always with pictures of equal groups. */
GAMES.mulDiv = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    runRounds(ctx, (ctx, round, stageEl) => {
      const obj = pick(COUNT_OBJECT_POOL);
      const divide = !moderate && round % 2 === 0;
      const a = moderate ? 1 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 4); // groups
      const b = moderate ? 1 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 4); // per group
      let prompt, answer, instruction;
      if (!divide){
        answer = a * b;
        instruction = `${a} group${a > 1 ? "s" : ""} with ${b} ${obj.name} in each. How many ${obj.name} in all?`;
        prompt = `
          <div class="group-row" aria-hidden="true">
            ${Array.from({ length: a }, () => `<div class="group-box">${Array.from({ length: b }, () => `<span>${obj.emoji}</span>`).join("")}</div>`).join("")}
          </div>
          <div class="game-word" id="md-eq">${a} × ${b} = ?</div>`;
      } else {
        const total = a * b;
        answer = b;
        instruction = `Share ${total} ${obj.name} equally between ${a} friends. How many does each friend get?`;
        prompt = `
          <div class="counting-objects" aria-hidden="true">${Array.from({ length: total }, () => `<span>${obj.emoji}</span>`).join("")}</div>
          <div class="game-word" id="md-eq">${total} ÷ ${a} = ?</div>`;
      }
      choiceRound(ctx, stageEl, {
        instruction, promptHtml: prompt,
        options: numberOptions(answer, 4, 3).map(v => ({ value: String(v), html: String(v) })),
        correct: String(answer)
      });
    });
  }
};

/* Board / Card Games — odd rounds: move a token along a board by the dice
   roll; even rounds: pick the higher (or lower) card. */
GAMES.boardCards = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    runRounds(ctx, (ctx, round, stageEl) => {
      if (round % 2 === 1){
        const maxDice = moderate ? 4 : 6;
        const d = 1 + Math.floor(Math.random() * maxDice);
        const s = 1 + Math.floor(Math.random() * (12 - d));
        const land = s + d;
        const opts = [...new Set([land, land - 1, land + 1, land + 2].filter(v => v >= 1 && v <= 12))].slice(0, 4);
        while (opts.length < 4){ const v = 1 + Math.floor(Math.random() * 12); if (!opts.includes(v)) opts.push(v); }
        choiceRound(ctx, stageEl, {
          instruction: `🎲 Your token is on square ${s}. You rolled a ${d}. Where does it land?`,
          promptHtml: `
            <div class="board-row" id="bc-board" data-start="${s}" data-dice="${d}" role="img" aria-label="Board with 12 squares">
              ${Array.from({ length: 12 }, (_, i) => `<span class="board-sq${i + 1 === s ? " token" : ""}">${i + 1 === s ? "🧸" : i + 1}</span>`).join("")}
            </div>
            <div class="game-word">🎲 ${d}</div>`,
          options: shuffle(opts).map(v => ({ value: String(v), html: String(v) })),
          correct: String(land)
        });
      } else {
        const max = moderate ? 9 : 20;
        let x = 1 + Math.floor(Math.random() * max), y;
        do { y = 1 + Math.floor(Math.random() * max); } while (y === x);
        const higher = Math.random() < 0.5;
        choiceRound(ctx, stageEl, {
          style: "tap",
          instruction: `🃏 Tap the <strong>${higher ? "HIGHER" : "LOWER"}</strong> card.`,
          promptHtml: `<div id="bc-mode" data-mode="${higher ? "higher" : "lower"}" style="display:none"></div>`,
          options: [x, y].map(v => ({ value: String(v), label: `Card ${v}`, html: `<span style="font-size:2.4rem;font-weight:800;">${v}</span>` })),
          correct: String(higher ? Math.max(x, y) : Math.min(x, y))
        });
      }
    });
  }
};

/* Digital Puzzles — pick the two number tiles that add up to the target. */
GAMES.makeTheSum = {
  setupType: "rounds",
  start(ctx){
    const moderate = isModerate(ctx);
    const hi = moderate ? 5 : 9;
    runRounds(ctx, (ctx, round, stageEl) => {
      const x = 1 + Math.floor(Math.random() * hi), y = 1 + Math.floor(Math.random() * hi);
      const target = x + y;
      const tiles = shuffle([x, y, ...Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * hi))]);
      stageEl.innerHTML = `
        <p class="game-instructions">🧩 Pick <strong>two tiles</strong> that add up to:</p>
        <div class="game-word" id="ms-target" data-target="${target}">${target}</div>
        <div class="tap-grid" id="ms-grid" style="grid-template-columns:repeat(3, 1fr);">
          ${tiles.map((v, i) => `<button class="tap-item" data-v="${v}" data-i="${i}" style="font-size:2rem;font-weight:800;" aria-label="Tile ${v}">${v}</button>`).join("")}
        </div>
        <div id="ms-info" style="font-weight:700;" aria-live="polite">Pick 2 tiles</div>`;
      const startTime = Date.now();
      let chosen = [], done = false;
      document.getElementById("ms-grid").addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-v]");
        if (!btn || done || !alive(stageEl)) return;
        if (chosen.includes(btn)){ chosen = chosen.filter(b => b !== btn); btn.classList.remove("selected-tile"); }
        else { chosen.push(btn); btn.classList.add("selected-tile"); }
        const sum = chosen.reduce((a, b) => a + +b.dataset.v, 0);
        document.getElementById("ms-info").textContent = chosen.length ? `Picked: ${chosen.map(b => b.dataset.v).join(" + ")}` : "Pick 2 tiles";
        if (chosen.length === 2){
          done = true;
          const correct = sum === target;
          chosen.forEach(b => b.classList.add(correct ? "correct-flash" : "incorrect-flash"));
          stageEl.querySelectorAll("#ms-grid button").forEach(b => b.disabled = true);
          ctx.onRoundResult({ correct, responseTime: elapsed(startTime) });
        }
      });
    });
  }
};
