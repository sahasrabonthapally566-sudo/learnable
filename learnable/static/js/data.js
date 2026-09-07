/* =========================================================
   LearnAble — data.js
   Categories, activity catalog, storage helpers, demo data.
   All persistence uses localStorage so the app works offline
   and survives refreshes.
========================================================= */

const LA_KEYS = {
  students: "la_students",
  sessions: "la_sessions",
  settings: "la_settings",
  teacher: "la_teacher",
  seeded: "la_seeded_v1"
};

function uid(prefix){
  return prefix + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

/* ---------------- Category & activity catalog ---------------- */
/* Each activity has a stable id. `playable: true` activities have a
   matching implementation in games.js (GAMES[gameKey]). Everything else
   renders as "Coming Soon" in the Activity Library. */

const CATEGORIES = [
  {
    key: "autism", label: "Autism", icon: "🧩",
    activities: [
      { id: "autism_talking_friend", name: "Talking Friend", playable: false },
      { id: "autism_color_matching", name: "Color Matching", playable: false },
      { id: "autism_shape_identifying", name: "Shape Identifying", playable: false },
      { id: "autism_regular_things", name: "Regular Things", playable: true, gameKey: "regularThings" },
      { id: "autism_memory_game", name: "Memory Game", playable: false }
    ]
  },
  {
    key: "adhd", label: "ADHD", icon: "⚡",
    activities: [
      { id: "adhd_sack_bear", name: "Sack Bear", playable: true, gameKey: "sackBear" },
      { id: "adhd_fruit_slice", name: "Fruit Slice", playable: false },
      { id: "adhd_color_tapping", name: "Color Tapping", playable: false },
      { id: "adhd_number_tapping", name: "Number Tapping", playable: false },
      { id: "adhd_memory_game", name: "Memory Game", playable: false },
      { id: "adhd_counting", name: "Counting", playable: false },
      { id: "adhd_object_recognition", name: "Object Recognition", playable: false }
    ]
  },
  {
    key: "dyslexia", label: "Dyslexia", icon: "🔤",
    activities: [
      { id: "dyslexia_pronunciation", name: "Pronunciation Practice", playable: false },
      { id: "dyslexia_letter_sound", name: "Letter Sound Matching", playable: false },
      { id: "dyslexia_word_recognition", name: "Word Recognition by Sound", playable: true, gameKey: "wordRecognition" },
      { id: "dyslexia_color_association", name: "Color Association", playable: false },
      { id: "dyslexia_rhymes", name: "Rhymes / Songs", playable: false },
      { id: "dyslexia_rhythm", name: "Rhythm Activities", playable: false },
      { id: "dyslexia_storytelling", name: "Storytelling", playable: false },
      { id: "dyslexia_interactive_storybooks", name: "Interactive Storybooks", playable: false }
    ]
  },
  {
    key: "dyscalculia", label: "Dyscalculia", icon: "🔢",
    activities: [
      { id: "dyscalculia_counting_objects", name: "Counting Objects", playable: true, gameKey: "countingObjects" },
      { id: "dyscalculia_add_sub", name: "Addition / Subtraction", playable: false },
      { id: "dyscalculia_mul_div", name: "Multiplication / Division", playable: false },
      { id: "dyscalculia_math_puzzles", name: "Math Puzzles", playable: false },
      { id: "dyscalculia_board_games", name: "Board / Card Games", playable: false },
      { id: "dyscalculia_digital_puzzles", name: "Digital Puzzles", playable: false }
    ]
  },
  {
    key: "dyspraxia", label: "Dyspraxia", icon: "🤸",
    activities: [
      { id: "dyspraxia_color_matching", name: "Color Matching", playable: false },
      { id: "dyspraxia_shape_tracing", name: "Shape Tracing", playable: true, gameKey: "shapeTracing" },
      { id: "dyspraxia_tapping_count", name: "Tapping Count", playable: false },
      { id: "dyspraxia_sack_bear", name: "Sack Bear", playable: false }
    ]
  },
  {
    key: "visual", label: "Visual Impairment", icon: "🎧",
    activities: [
      { id: "visual_animal_sounds", name: "Animal Sounds", playable: true, gameKey: "animalSounds" },
      { id: "visual_traffic_sounds", name: "Traffic Sounds", playable: false },
      { id: "visual_nature_sounds", name: "Nature Sounds", playable: false },
      { id: "visual_storytelling", name: "Storytelling", playable: false },
      { id: "visual_guided_audio", name: "Guided Audio", playable: false },
      { id: "visual_sound_memory", name: "Sound Memory", playable: false },
      { id: "visual_sequential_sounds", name: "Sequential Sounds", playable: false }
    ]
  },
  {
    key: "hearing", label: "Hearing Impairment", icon: "👀",
    activities: [
      { id: "hearing_alphabet_visual", name: "Alphabet Visual", playable: false },
      { id: "hearing_color_games", name: "Color Games", playable: false },
      { id: "hearing_shape_games", name: "Shape Games", playable: false },
      { id: "hearing_pattern_recognition", name: "Pattern Recognition", playable: false },
      { id: "hearing_object_recognition", name: "Object Recognition", playable: false },
      { id: "hearing_visual_storytelling", name: "Visual Storytelling", playable: true, gameKey: "visualStorytelling" },
      { id: "hearing_visual_memory", name: "Visual Memory", playable: false },
      { id: "hearing_number_games", name: "Number Games", playable: false }
    ]
  },
  {
    key: "dysgraphia", label: "Dysgraphia", icon: "✍️",
    activities: [
      { id: "dysgraphia_free_drawing", name: "Free Drawing", playable: false },
      { id: "dysgraphia_letter_tracing", name: "Letter Tracing", playable: true, gameKey: "letterTracing" },
      { id: "dysgraphia_handwriting", name: "Handwriting Practice", playable: false },
      { id: "dysgraphia_coloring", name: "Coloring Challenges", playable: false },
      { id: "dysgraphia_pattern_replication", name: "Pattern Replication", playable: false },
      { id: "dysgraphia_alphabet_writing", name: "Alphabet / Number Writing", playable: false },
      { id: "dysgraphia_memory_strengthening", name: "Memory Strengthening", playable: false }
    ]
  }
];

function findActivity(activityId){
  for (const cat of CATEGORIES){
    const act = cat.activities.find(a => a.id === activityId);
    if (act) return { ...act, categoryKey: cat.key, categoryLabel: cat.label, categoryIcon: cat.icon };
  }
  return null;
}

function findCategory(key){ return CATEGORIES.find(c => c.key === key); }

/* ---------------- Storage helpers ---------------- */

function laGet(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function laSet(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch(e){ console.error("LearnAble storage error", e); return false; }
}

/* Students */
function getStudents(){ return laGet(LA_KEYS.students, []); }
function saveStudents(list){ return laSet(LA_KEYS.students, list); }
function getStudent(id){ return getStudents().find(s => s.id === id) || null; }
function addStudent(student){
  const list = getStudents();
  const newStudent = {
    id: uid("stu"),
    name: student.name,
    age: student.age,
    category: student.category,
    supportLevel: student.supportLevel,
    notes: student.notes || "",
    createdAt: Date.now()
  };
  list.push(newStudent);
  saveStudents(list);
  return newStudent;
}
function updateStudent(id, patch){
  const list = getStudents();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  saveStudents(list);
  return list[idx];
}
function deleteStudent(id){
  saveStudents(getStudents().filter(s => s.id !== id));
  const sessions = getSessions().filter(s => s.studentId !== id);
  laSet(LA_KEYS.sessions, sessions);
}

/* Sessions (activity history) */
function getSessions(){ return laGet(LA_KEYS.sessions, []); }
function addSession(session){
  const list = getSessions();
  const record = {
    id: uid("ses"),
    date: Date.now(),
    ...session
  };
  list.unshift(record);
  laSet(LA_KEYS.sessions, list);
  return record;
}
function getSessionsForStudent(studentId){
  return getSessions().filter(s => s.studentId === studentId);
}

/* Settings (accessibility) */
const DEFAULT_SETTINGS = {
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  audioAssistance: true,
  captions: true
};
function getSettings(){ return { ...DEFAULT_SETTINGS, ...laGet(LA_KEYS.settings, {}) }; }
function saveSettings(settings){ laSet(LA_KEYS.settings, settings); }

/* Teacher (simulated auth) */
function getTeacher(){ return laGet(LA_KEYS.teacher, null); }
function setTeacher(name){ laSet(LA_KEYS.teacher, { name, loggedInAt: Date.now() }); }
function clearTeacher(){ localStorage.removeItem(LA_KEYS.teacher); }

/* ---------------- Demo data seeding ---------------- */

const DEMO_STUDENTS = [
  { name: "Aarav", age: 7, category: "adhd", supportLevel: "moderate", notes: "Responds well to short, high-energy activities." },
  { name: "Anaya", age: 6, category: "autism", supportLevel: "mild", notes: "Enjoys routine-based tasks and clear instructions." },
  { name: "Riya", age: 9, category: "dyslexia", supportLevel: "moderate", notes: "Benefits from audio support alongside text." },
  { name: "Kabir", age: 8, category: "dyscalculia", supportLevel: "mild", notes: "Prefers visual counting aids." },
  { name: "Meera", age: 5, category: "dyspraxia", supportLevel: "moderate", notes: "Needs larger tracing targets and extra time." },
  { name: "Vihaan", age: 10, category: "visual", supportLevel: "mild", notes: "Strong auditory memory." },
  { name: "Tara", age: 11, category: "hearing", supportLevel: "mild", notes: "Communicates confidently using sign language." },
  { name: "Arjun", age: 7, category: "dysgraphia", supportLevel: "moderate", notes: "Working on pencil grip and letter formation." }
];

function seedDemoDataIfNeeded(){
  if (laGet(LA_KEYS.seeded, false)) return;

  const students = DEMO_STUDENTS.map(s => ({
    id: uid("stu"),
    name: s.name, age: s.age, category: s.category, supportLevel: s.supportLevel,
    notes: s.notes, createdAt: Date.now()
  }));
  saveStudents(students);

  // Give each student a small amount of sample history so
  // the dashboard and reports look realistic immediately.
  const sessions = [];
  const activityByCategory = {
    adhd: findActivity("adhd_sack_bear"),
    autism: findActivity("autism_regular_things"),
    dyslexia: findActivity("dyslexia_word_recognition"),
    dyscalculia: findActivity("dyscalculia_counting_objects"),
    dyspraxia: findActivity("dyspraxia_shape_tracing"),
    visual: findActivity("visual_animal_sounds"),
    hearing: findActivity("hearing_visual_storytelling"),
    dysgraphia: findActivity("dysgraphia_letter_tracing")
  };

  students.forEach((s, i) => {
    const act = activityByCategory[s.category];
    if (!act) return;
    const daysAgo = [0, 1, 2, 4].reverse();
    daysAgo.forEach((d, j) => {
      const rounds = 5 + (j % 3) * 5;
      const correct = Math.max(1, Math.round(rounds * (0.55 + 0.08 * j + (i % 3) * 0.03)));
      const incorrect = Math.max(0, rounds - correct - (j === 0 ? 1 : 0));
      const missed = Math.max(0, rounds - correct - incorrect);
      sessions.push({
        id: uid("ses"),
        studentId: s.id,
        studentName: s.name,
        categoryKey: s.category,
        activityId: act.id,
        activityName: act.name,
        supportLevel: s.supportLevel,
        roundsConfigured: rounds,
        roundsCompleted: rounds,
        correct, incorrect, missed,
        accuracy: Math.round((correct / rounds) * 100),
        avgResponseTime: +(1.4 + Math.random() * 1.8).toFixed(2),
        hintsUsed: j === 0 ? 1 : 0,
        teacherDemonstrations: s.supportLevel === "moderate" ? 1 : 0,
        durationSeconds: 40 + rounds * 6,
        date: Date.now() - d * 24 * 60 * 60 * 1000 - j * 60 * 60 * 1000
      });
    });
  });
  laSet(LA_KEYS.sessions, sessions);
  laSet(LA_KEYS.seeded, true);
}
