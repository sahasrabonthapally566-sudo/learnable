# LearnAble 🦉

**AI-Powered Adaptive Learning Platform for Children with Learning Differences**
*(Teacher-facing local prototype)*

LearnAble lets a teacher manage students, run adaptive learning games, and
review performance reports for children (approx. ages 4–14) with learning
differences such as Autism, ADHD, Dyslexia, Dyscalculia, Dyspraxia, Visual
Impairment, Hearing Impairment, and Dysgraphia.

This is a **local prototype**: all data (students, activity sessions,
accessibility settings) is stored in your browser's `localStorage`, so it
keeps working offline and survives page refreshes. Flask only serves the
page and static files — there is no external database or API for the protoype.

---

## 1. Requirements

- Python 3.9+
- A modern browser (Chrome, Edge, or Firefox recommended for full
  Text-to-Speech support in the Dyslexia and Visual Impairment games)

## 2. Setup & Run

```bash
cd learnable
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

On first load, the app automatically seeds 8 demo students from school ZPHS Doultabad as case studies for this project(Aarav, Anaya,
Riya, Kabir, Meera, Vihaan, Tara, Arjun) with sample activity history . You can reset this
demo data at any time from **Settings → Reset demo data**.

## 3. Logging in

This is a **test login** (simulated, no password). The teacher name on the
welcome screen is pre-filled as **Anuradha K** — just click
**"Log in to LearnAble"**. The name is remembered until you log out.

## 4. What's fully playable

**All 52 activities in the Activity Library are now playable** across the 8
categories. Every game supports teacher-configurable rounds (or duration for
Sack Bear), live scoring, and automatic reports (accuracy, correct / incorrect /
missed, average response time, hints used).

| Category            | Activities |
|---------------------|-----------|
| Autism (5)          | Talking Friend · Color Matching · Shape Identifying · Regular Things · Memory Game |
| ADHD (7)            | Sack Bear · Fruit Slice · Color Tapping · Number Tapping · Memory Game · Counting · Object Recognition |
| Dyslexia (8)        | Pronunciation Practice · Letter Sound Matching · Word Recognition by Sound · Color Association · Rhymes / Songs · Rhythm Activities · Storytelling · Interactive Storybooks |
| Dyscalculia (6)     | Counting Objects · Addition / Subtraction · Multiplication / Division · Math Puzzles · Board / Card Games · Digital Puzzles |
| Dyspraxia (4)       | Color Matching (drag & drop) · Shape Tracing · Tapping Count · Sack Bear |
| Visual Impairment (7) | Animal Sounds · Traffic Sounds · Nature Sounds · Storytelling · Guided Audio · Sound Memory · Sequential Sounds |
| Hearing Impairment (8) | Alphabet Visual · Color Games · Shape Games · Pattern Recognition · Object Recognition · Visual Storytelling · Visual Memory · Number Games |
| Dysgraphia (7)      | Free Drawing · Letter Tracing · Handwriting Practice · Coloring Challenges · Pattern Replication · Alphabet / Number Writing · Memory Strengthening |

How accuracy is worked out:

- **Automatically scored** – almost every game (multiple choice, tapping, matching, memory boards, drag-and-drop, rhythm timing, sound recognition). Wrong taps are *incorrect*; running out of time or leaving a round blank is *missed*.
- **Tracing / drawing games** (Letter Tracing, Pattern Replication, Alphabet / Number Writing, Handwriting Practice, Memory Strengthening) – scored by how much of the guide the line covered while staying on it.
- **Helper-marked** – Pronunciation Practice and Free Drawing can't be judged by a computer, so the teacher or parent taps "✅ Said it clearly" / "✅ Yes" or "🔁 Needs practice" / "Not yet".

Sounds in the Visual Impairment games (car horn, bell, siren, train, bird, rain,
thunder, wind, drum…) and in Sound Memory / Rhythm are generated in the browser
with the Web Audio API — no audio files are required.

Mild vs. Moderate support levels change the difficulty (fewer choices, smaller
numbers, longer time limits, larger tracing tolerance for Moderate).

## 5. Key features

- **Dashboard** — total students, activities completed today, average
  accuracy, students needing attention, quick actions.
- **Students** — add / edit / delete students, set learning category and
  Mild/Moderate support level, view individual profiles.
- **Activity Library** — pick a student first; only that student's own
  activities (their learning category) are shown. Playable activities
  launch directly into the game flow for that student.
- **Adaptive game flow** — teacher selects rounds (5/10/15/20) or, for
  Sack Bear, a duration (30/60/90/120s) before every session. For
  Moderate-support students, the teacher can optionally run a **Teacher
  Demonstration** step before handing the activity to the student
  (Student Mode); demonstrations are tracked and shown in Reports.
- **Reports** — per-student accuracy, response time, correct/incorrect/
  missed counts, hints used, teacher demonstrations, and a full session
  history, all computed from real stored session data.
- **Learning Performance** — a transparent, explainable recommendation
  (based only on accuracy/response time/completion) that is clearly
  labeled as *not* a diagnosis or clinical assessment. The teacher stays
  in control and can always override it.
- **Accessibility** — adjustable text size, high-contrast mode, and audio
  assistance (Text-to-Speech) — all persisted locally. Keyboard navigation and visible
  focus states are supported throughout.
- **Offline-friendly** — a small service worker caches the app shell so
  it keeps working after the first load; all data already lives in
  `localStorage`.

## 6. Project structure

```
learnable/
├── app.py                  # Flask server (serves the SPA)
├── requirements.txt
├── README.md
├── index.html              # Single-page app shell
└── static/
    ├── css/
    │   └── style.css       # Design system (pastel, accessible, responsive)
    ├── js/
    │   ├── data.js         # Categories, activity catalog, storage, demo data
    │   ├── accessibility.js# Accessibility + Settings pages
    │   ├── students.js     # Student management + profile
    │   ├── dashboard.js    # Teacher dashboard
    │   ├── games.js        # Game engine + the first 8 playable games
    │   ├── games_extra.js  # 16 more playable games (2 per category)
    │   ├── games_more.js   # 16 more: Autism, ADHD, Dyslexia, Dyscalculia
    │   ├── games_more2.js  # 12 more: Visual, Hearing, Dysgraphia (+ synthesised sounds)
    │   ├── reports.js      # Performance reports
    │   └── app.js          # Router, login, nav wiring
    └── service-worker.js   # Offline caching of the app shell
```

## 7. Notes on scope

- No diagnosis, medical assessment, or disability-severity prediction is
  ever claimed anywhere in the app — only an explainable "Learning
  Performance" summary of recorded activity data.
- The Animal Sounds and Visual Storytelling games are **teacher-evaluated
  by design** (no automatic speech or sign-language recognition is
  attempted) — the teacher listens/watches and marks each round Correct
  or Incorrect.
- Firebase was intentionally left out to keep local setup simple, but the
  storage helpers in `data.js` are isolated behind small functions
  (`getStudents`, `addSession`, etc.) so swapping in a real backend or
  Firebase later only requires changing that one file.
