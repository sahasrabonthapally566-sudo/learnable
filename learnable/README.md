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

Login is simulated for this prototype — enter any teacher name on the
welcome screen and click **"Log in to LearnAble"**. Your name is
remembered until you log out.

## 4. What's fully playable

Out of the 44 activities listed in the Activity Library (across 8
categories), the following **8 games are fully functional** end-to-end,as to demonstrate the full idea,
including teacher-configurable rounds/duration, live scoring, and reports:

| Category            | Playable Activity              |
|----------------------|--------------------------------|
| Autism               | Regular Things                 |
| ADHD                  | Sack Bear                      |
| Dyslexia              | Word Recognition by Sound      |
| Dyscalculia           | Counting Objects                |
| Dyspraxia             | Shape Tracing                   |
| Visual Impairment     | Animal Sounds                   |
| Hearing Impairment    | Visual Storytelling             |
| Dysgraphia            | Letter Tracing                  |

Every other activity appears in the Activity Library clearly marked
**"Coming Soon."**

## 5. Key features

- **Dashboard** — total students, activities completed today, average
  accuracy, students needing attention, quick actions.
- **Students** — add / edit / delete students, set learning category and
  Mild/Moderate support level, view individual profiles.
- **Activity Library** — all 8 categories and every listed activity;
  playable activities launch directly into the game flow.
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
- **Accessibility** — adjustable text size, high-contrast mode, reduced
  motion, audio assistance (Text-to-Speech), and captions/text
  alternatives — all persisted locally. Keyboard navigation and visible
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
├── templates/
│   └── index.html          # Single-page app shell
└── static/
    ├── css/
    │   └── style.css       # Design system (pastel, accessible, responsive)
    ├── js/
    │   ├── data.js         # Categories, activity catalog, storage, demo data
    │   ├── accessibility.js# Accessibility + Settings pages
    │   ├── students.js     # Student management + profile
    │   ├── dashboard.js    # Teacher dashboard
    │   ├── games.js        # Game engine + all 8 playable games
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
