# GyaanSetu — Agent Handoff & Progress File

> **Purpose:** This file is the single source of truth for any coding agent working on this project.
> Read this file completely before making any changes. Update the **Current Status** and **Task Checklist** sections after every work session.

---

## 🏷️ Project Identity

| Field | Value |
|---|---|
| **Project Name** | GyaanSetu |
| **Team Name** | LadyBugs |
| **Team Code** | UDB-Z3KF |
| **Problem Statement** | Hyper-Personalized Learning Assistant for Underserved Students |
| **Repo Root** | `c:\Users\Shlok Naidu\Desktop\GyaanSetu-LadyBugs\` |
| **Frontend Dir** | `client/` (React + Vite) |
| **Backend Dir** | `server/` (Express.js + Node.js) |

---

## 📅 Last Updated

- **Date:** 2026-04-25 (Offline Efficiency Sprint)
- **Session:** Implemented Manual Offline Caching (Save for Offline), dedicated Offline Quiz section, and improved JSON parsing resilience for AI-generated quizzes.
- **Next Agent Should Start At:** Final production deployment (Vercel/Render) and end-to-end sync testing under flaky network conditions.
  
> **✅ STATUS:** Core features complete. Manual offline selection is live, allowing users to study without internet with 100% predictability.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Express.js (Node.js) |
| Primary AI | Groq API — `llama-3.3-70b-versatile` |
| Embeddings | HuggingFace Inference API — `BAAI/bge-m3` (384-dim) |
| Vector Store | MongoDB Atlas Vector Search (built into Atlas, no extra service) |
| Database | MongoDB Atlas (free tier) |
| Auth | JWT (`jsonwebtoken` + `bcryptjs`), stored in-memory/httpOnly cookies — NEVER localStorage |
| File Parsing | `pdf-parse`, `mammoth.js` |
| File Upload | `multer` (memory storage) |
| Offline Cache | Browser IndexedDB |
| Video Resources | YouTube Data API v3 (free tier) |
| Hindi Fallback | HuggingFace — `Helsinki-NLP/opus-mt-en-hi` |
| Frontend Hosting | Vercel |
| Backend Hosting | Render (free tier) |
| Keep-Alive | cron-job.org pinging Render every 10 minutes |

---

## 🔑 Environment Variables

### Backend — `server/.env`
```
PORT=5000
MONGODB_URI=<mongodb atlas connection string>
JWT_SECRET=<random secret>
GROQ_API_KEY=<groq api key>
HF_API_KEY=<huggingface api key>
YOUTUBE_API_KEY=<youtube data api v3 key>
```

### Frontend — `client/.env`
```
VITE_API_URL=http://localhost:5000
```

---

## 📁 Complete Target File Structure

```
/GyaanSetu-LadyBugs
  PROGRESS.md                          ← THIS FILE (always keep updated)
  README.md

  /client                              ← React frontend (Vite)
    /public
    /src
      /components
        /auth
        /syllabus
        /tracker
        /quiz
        /explanation
        /career
        /badges
        /shared
      /pages
        Login.jsx
        Signup.jsx
        Dashboard.jsx
        Syllabus.jsx
        Tracker.jsx
        Quiz.jsx
        Explanation.jsx
        Career.jsx
        Profile.jsx
      /context
        AuthContext.jsx
      /hooks
        useOfflineSync.js
        useStreak.js
      /utils
        indexedDB.js
        i18n.js
      /locales
        en.json
        hi.json
      App.jsx
      main.jsx
      index.css

  /server                              ← Express backend
    /routes
      auth.js
      syllabus.js
      tracker.js
      quiz.js
      explanation.js
      career.js
      badges.js
      sync.js
    /middleware
      auth.js
      upload.js
    /services
      groq.js
      embeddings.js
      vectorSearch.js
      youtube.js
      badges.js
      streak.js
    /models
      User.js
      Embedding.js
    app.js
    server.js
    .env
```

---

## 🗄️ MongoDB Schemas

### User Model (`server/models/User.js`)
```js
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed, saltRounds: 10),
  language: { type: String, enum: ['en', 'hi'], default: 'en' },

  syllabus: {
    subjects: [
      {
        name: String,
        units: [
          {
            name: String,
            topics: [
              {
                name: String,
                confidence: { type: String, enum: ['confident', 'neutral', 'weak'], default: 'neutral' },
                studied: { type: Boolean, default: false },
                studied_at: Date,
                last_tested: Date,
                score: { type: Number, default: 0 },
                quiz_priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
              }
            ]
          }
        ]
      }
    ]
  },

  pacing_profile: {
    avg_time_per_q: { type: Number, default: 30 },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' }
  },

  quiz_history: [{ subject: String, topics: [String], score: Number, total: Number, date: Date, time_taken: Number }],
  offline_queue: [{ type: { type: String }, data: Object, timestamp: Date }],

  career_profile: { strong: [String], weak: [String], recommended_roles: [String] },

  gamification: {
    current_streak: { type: Number, default: 0 },
    longest_streak: { type: Number, default: 0 },
    last_active_date: Date,
    total_topics_studied: { type: Number, default: 0 },
    total_quizzes_taken: { type: Number, default: 0 },
    badges_earned: [String],
    badge_seen: [String],
    badge_unseen: [String],
    offline_sync_count: { type: Number, default: 0 }   // ← needed for sync_star badge
  },

  createdAt: { type: Date, default: Date.now }
}
```

### Embedding Model (`server/models/Embedding.js`)
```js
{
  _id: ObjectId,
  user_id: String,      // scopes every vector to its owner (NEVER query without this filter)
  subject: String,
  unit: String,
  topic: String,
  text: String,         // raw chunk: "Subject - Unit - Topic"
  embedding: [Number],  // 384-dim float array from BAAI/bge-m3
  createdAt: { type: Date, default: Date.now }
}
```

**Atlas Vector Search Index (create manually in Atlas UI):**
- Index name: `vector_index`
- Collection: `embeddings`
- JSON definition:
```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" },
    { "type": "filter", "path": "user_id" }
  ]
}
```
> ⚠️ `$vectorSearch` will throw an error if this index does not exist. Must be created manually before the app runs.

---

## 🌐 API Endpoints Summary

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/signup` | Register, hash pw, create user, issue JWT (7d) |
| POST | `/login` | Verify pw, update streak, issue JWT |
| GET | `/me` | Return full user (no password) |

**Streak logic on login:**
- today → no change
- yesterday → increment `current_streak`, update `longest_streak` if needed
- older → reset `current_streak` to 0

### Syllabus — `/api/syllabus`
| Method | Path | Description |
|---|---|---|
| POST | `/upload` | multer → parse PDF/DOCX → strip headers/footers → Groq JSON parse |
| POST | `/save` | Save to DB, delete old embeddings, batch-embed all topics, insertMany |
| GET | `/` | Return user's full syllabus |
| PUT | `/edit` | Replace syllabus, re-embed, preserve existing topic metadata by name match |

### Tracker — `/api/tracker`
| Method | Path | Description |
|---|---|---|
| PUT | `/tick` | Mark topic studied, update gamification, run badge checks |
| PUT | `/confidence` | Update confidence + recalculate quiz_priority |
| GET | `/due-for-review` | Topics where studied_at AND last_tested both ≥ 7 days ago |

**quiz_priority logic:**
- weak + studied → high
- confident + studied → low
- neutral + studied → medium
- not studied → excluded from quiz

### Quiz — `/api/quiz`
| Method | Path | Description |
|---|---|---|
| POST | `/generate` | Adaptive quiz: priority-filtered topics → Groq → JSON-only questions |
| POST | `/grade` | Grade MCQ instantly; theoretical via Groq rubric; update pacing level |
| POST | `/pregenerate` | 20–30 Qs per weak/due topic for offline cache |

**Pacing level thresholds:**
- avg_time > 40s → decrement level (never below beginner)
- avg_time < 15s AND score ≥ 70% → increment level (never above advanced)

**Question types:** MCQ, theoretical, coding

### Explanation — `/api/explanation`
| Method | Path | Description |
|---|---|---|
| POST | `/ask` | Embed question → Atlas vector search (user-scoped) → RAG context → Groq stream |

### Career — `/api/career`
| Method | Path | Description |
|---|---|---|
| GET | `/guidance` | Strong/weak topics → Groq role mapping → YouTube API (fallback to search URL) |

YouTube fallback URL: `https://www.youtube.com/results?search_query=[topic]+tutorial+for+beginners`

### Badges — `/api/badges`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Return earned/unseen/all badges |
| PUT | `/seen` | Move badge from unseen → seen |

### Sync — `/api/sync`
| Method | Path | Description |
|---|---|---|
| POST | `/push` | Replay offline queue sorted by timestamp (use timestamp for streak, not server time) |

### Keep-Alive
| Method | Path | Description |
|---|---|---|
| GET | `/api/ping` | No auth. Returns `{ status: "ok" }`. Register BEFORE global JWT middleware. |

---

## 🏅 Badge Definitions

```js
const BADGES = [
  { id: 'first_step',        name: 'First Step',        icon: '🌱', description: 'Study your first topic',              condition: 'total_topics_studied >= 1' },
  { id: 'three_streak',      name: '3 Day Streak',       icon: '🔥', description: '3 days in a row',                    condition: 'current_streak >= 3' },
  { id: 'week_warrior',      name: 'Week Warrior',       icon: '⚡', description: '7 day streak',                       condition: 'current_streak >= 7' },
  { id: 'fortnight_fighter', name: 'Fortnight Fighter',  icon: '🏆', description: '14 day streak',                      condition: 'current_streak >= 14' },
  { id: 'month_master',      name: 'Month Master',       icon: '💎', description: '30 day streak',                      condition: 'current_streak >= 30' },
  { id: 'sharp_shooter',     name: 'Sharp Shooter',      icon: '🎯', description: 'Score 90%+ on first attempt',        condition: 'quiz score >= 90 on first try' },
  { id: 'quiz_master',       name: 'Quiz Master',        icon: '🧠', description: 'Complete 10 quizzes',                condition: 'total_quizzes_taken >= 10' },
  { id: 'bookworm',          name: 'Bookworm',           icon: '📚', description: 'Tick 50 topics as studied',          condition: 'total_topics_studied >= 50' },
  { id: 'speed_demon',       name: 'Speed Demon',        icon: '🚀', description: 'Answer 10 questions under 15s each', condition: 'fast answers count >= 10 in one session' },
  { id: 'multilingual',      name: 'Multilingual',       icon: '🌍', description: 'Use the app in Hindi',               condition: 'language === hi' },
  { id: 'comeback_kid',      name: 'Comeback Kid',       icon: '💪', description: 'Improve score by 30%+ on retake',    condition: 'retake score - previous score >= 30' },
  { id: 'syllabus_slayer',   name: 'Syllabus Slayer',    icon: '⭐', description: 'Tick 100% topics in a subject',      condition: 'all topics in any subject studied' },
  { id: 'sync_star',         name: 'Sync Star',          icon: '🔄', description: 'Sync offline progress 3 times',      condition: 'offline_sync_count >= 3' },
  { id: 'career_ready',      name: 'Career Ready',       icon: '🎓', description: 'Complete career guidance',           condition: 'career guidance viewed' },
];
```

**Badge check rules:**
- All badge checks are **non-blocking** — run after the main API response is sent (use `setImmediate` or fire-and-forget)
- Badge checks triggered by each endpoint:
  - `tick` → first_step, bookworm, syllabus_slayer
  - `grade` → sharp_shooter, quiz_master, speed_demon, comeback_kid
  - `sync/push` → sync_star (after all items processed)
  - `career/guidance` → career_ready
  - `login` → three_streak, week_warrior, fortnight_fighter, month_master, multilingual

---

## 🎨 Frontend Design Specification

### Design Philosophy
**Brutally minimal. No gradients. No shadows. No decorations.**
Editorial design — clean grid, strong typography, intentional whitespace.

### Color Palette (CSS Variables)
```css
:root {
  --bg:            #F5F4F0;
  --surface:       #FFFFFF;
  --border:        #E0DED8;
  --text-primary:  #1A1A1A;
  --text-secondary:#6B6860;
  --text-muted:    #A8A49E;
  --accent:        #2D5BE3;
  --accent-light:  #EEF2FD;
  --danger:        #D94F3D;
  --warning:       #E08C2B;
  --success:       #2E7D52;
  --code-bg:       #F0EFEB;
}
```
**NO gradients. NO box-shadows except `0 1px 0 var(--border)` for card bottoms.**

### Typography
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
:root {
  --font-display: 'DM Serif Display', serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'DM Mono', monospace;
  --text-xs: 11px; --text-sm: 13px; --text-base: 15px;
  --text-md: 17px; --text-lg: 20px; --text-xl: 26px;
  --text-2xl: 34px; --text-3xl: 48px;
}
```

### Layout
- Base unit: 8px | Page max-width: 1100px centered | Sidebar: 220px fixed
- Card padding: 24px | Border-radius: 6px only | Borders: 1px solid var(--border)

### Key Components
- **Buttons:** `.btn-primary` (accent bg), `.btn-secondary` (transparent + border), `.btn-danger`
- **Cards:** `.card` — border + single bottom shadow only
- **Confidence Tags:** `.tag-confident` (green), `.tag-neutral` (amber), `.tag-weak` (red)
- **Sync Indicator:** dot (7px circle) + monospace label
- **Offline Banner:** fixed top, warning bg → success bg on sync, instant show/no animation
- **Badge Popup:** fixed bottom-right, slide-up 20px + fade-in 300ms, auto-dismiss 4s

### Page Layouts
- **Auth:** Centered card (max 420px), lang toggle buttons EN/HI (not dropdown)
- **Dashboard:** 220px fixed sidebar (active link: 3px left accent border), 3-col stat cards, quiz history table
- **Syllabus:** Dashed upload zone → accordion tree; topic row: checkbox + name + confidence buttons + edit mode
- **Quiz:** Single question card, 2px timer bar (linear shrink, danger <10s), MCQ rows, theoretical textarea, coding textarea in code-bg
- **Explanation:** Two-column (30% context + 70% chat), streaming cursor blink animation
- **Career:** 2-col role cards with flat 4px progress bar (border-radius: 0), YouTube video cards
- **Profile:** Initials avatar, 🔥 streak counter in font-mono text-3xl, badges grid

### Animations (allowed list)
- Page transitions: 150ms opacity fade only
- Badge popup: slide-up 20px + fade-in 300ms ease-out
- Quiz timer: `transition: width linear`
- Explanation stream: blinking cursor `@keyframes blink { 50% { opacity: 0 } }`
- **NO** bounce, spring, scale, or rotation anywhere

---

## 📦 Offline / IndexedDB Specification

### Store Names
- `offline_queue` — keyPath: `id` (autoIncrement)
- `quiz_cache` — keyPath: `topic`
- `explanation_cache` — keyPath: `topic`

### Functions to implement in `client/src/utils/indexedDB.js`
| Function | Purpose |
|---|---|
| `openDB()` | Open/upgrade IndexedDB, create stores if needed |
| `addToQueue(type, data, timestamp)` | Add offline action to queue |
| `getQueue()` | Get all pending items |
| `clearQueue()` | Wipe queue after successful sync |
| `cacheQuiz(topic, questions)` | Store pre-generated questions |
| `getCachedQuiz(topic)` | Retrieve cached questions (null if missing) |
| `cacheExplanation(topic, text)` | Cache AI explanation text |
| `getCachedExplanation(topic)` | Retrieve cached explanation (null if missing) |

### Sync Flow (client-side)
1. Listen: `window.addEventListener('online', handler)`
2. `getQueue()` → if non-empty → POST `/api/sync/push`
3. On success → `clearQueue()` → show "Synced" banner for 3s

---

## 🔑 Critical Rules for Every Agent

1. **JWT must NEVER go in localStorage** — use httpOnly cookies or in-memory state
2. **All Groq prompts must include the user's language preference** (French/English/Hindi)
3. **All Atlas vector search queries MUST include `filter: { user_id: userId }`** — never query without it
4. **`vector_index` must be created manually in MongoDB Atlas UI** before the app starts
5. **HuggingFace embeddings are rate-limited (1000 calls/day)** — batch all topics in one insertMany, never embed on-demand
6. **Offline sync timestamps from IndexedDB must be used for streak validation**, not `Date.now()` on the server
7. **`/api/ping` must be registered BEFORE the global JWT middleware** in `app.js`
8. **All badge checks are non-blocking** — fire-and-forget after main response is sent
9. **PDF parser must strip headers, footers, and page numbers** before sending to Groq
10. **All Groq prompts must ask for JSON-only** — strip accidental ` ```json ``` ` fences before `JSON.parse()`
11. **YouTube API calls must gracefully fallback** to search URL if quota exceeded
12. **Pacing level is bounded**: never below `beginner`, never above `advanced`
13. **Offline queue replay must be sorted by `timestamp` ascending** before processing

---

## ✅ Task Checklist

> Update this checklist as work progresses. Mark `[x]` when done, `[/]` when in progress.

### Day 1 — Foundation
- [x] `server/` — Express app setup (`app.js`, `server.js`, MongoDB connection)
- [x] `server/` — Auth routes: `POST /signup`, `POST /login`, `GET /me`
- [x] `server/` — bcrypt password hashing (saltRounds: 10) + JWT issuance (7d expiry)
- [x] `server/` — JWT middleware (`middleware/auth.js`)
- [x] `server/` — User model (`models/User.js`)
- [x] `server/` — `/api/ping` keep-alive endpoint (no auth, registered first)
- [x] `client/` — React + Vite app scaffolded (`npm create vite@latest ./`)
- [x] `client/` — `index.css` — full design system (CSS vars, fonts, utility classes)
- [x] `client/` — `AuthContext.jsx` + protected route wrapper
- [x] `client/` — Login page (centered card, EN/HI toggle)
- [x] `client/` — Signup page
- [x] `client/` — `utils/i18n.js` + `locales/en.json` + `locales/hi.json`

### Day 2 — Syllabus
- [x] `server/` — multer upload middleware (`middleware/upload.js`, memory storage, 10MB limit)
- [x] `server/` — PDF parse + DOCX parse + header/footer stripping
- [x] `server/` — Groq syllabus parser service (`services/groq.js`)
- [x] `server/` — `POST /api/syllabus/upload` endpoint
- [x] `server/` — HuggingFace embedding service (`services/embeddings.js`)
- [x] `server/` — vectorSearch service (`services/vectorSearch.js`: `getEmbedding`, `storeEmbeddings`, `retrieveChunks`)
- [x] `server/` — Embedding model (`models/Embedding.js`)
- [ ] **MANUAL STEP** — Create `vector_index` in MongoDB Atlas UI (see schema section above)
- [x] `server/` — `POST /api/syllabus/save` (save + delete old embeddings + batch embed)
- [x] `server/` — `GET /api/syllabus`
- [x] `server/` — `PUT /api/syllabus/edit` (replace + re-embed + preserve metadata by name match)
- [x] `client/` — Syllabus upload page (dashed zone, drag-and-drop)
- [x] `client/` — Syllabus tree accordion (checkbox + confidence buttons)
- [x] `client/` — Inline edit mode (inputs, add/delete topics, save sends full subjects array)

### Day 3 — Quiz Engine
- [x] `server/` — `POST /api/quiz/generate` (priority-filtered, adaptive, Groq JSON-only)
- [x] `server/` — `POST /api/quiz/grade` (MCQ instant + theoretical rubric via Groq + pacing update)
- [x] `server/` — `POST /api/quiz/pregenerate` (20–30 Qs per weak/due topic)
- [x] `server/` — Pacing level update logic (time + score thresholds)
- [x] `client/` — Quiz page (question card, 2px timer bar, MCQ rows, answer reveal)
- [x] `client/` — Quiz results screen (per-topic scores, feedback)

### Day 4 — Explanation + Badges + Streak + Notes
- [x] `server/` — `POST /api/explanation/ask` (embed → vector search → RAG → Groq stream)
- [x] `server/` — `POST /api/notes/generate` (structured Markdown cheat-sheet via Groq)
- [x] `server/` — Badge service (`services/badges.js`, BADGES array, checkBadges function)
- [x] `server/` — Streak service (`services/streak.js`)
- [x] `server/` — `GET /api/badges`
- [x] `server/` — `PUT /api/badges/seen`
- [x] `server/` — `PUT /api/tracker/tick` (with badge checks)
- [x] `server/` — `PUT /api/tracker/confidence`
- [x] `server/` — `GET /api/tracker/due-for-review`
- [x] `client/` — Explanation page (two-column layout, streaming cursor)
- [x] `client/` — Notes generation page (animated loader + parsed markdown cheat-sheet UI)
- [x] `client/` — Badge popup component (slide-up, 4s auto-dismiss)
- [x] `client/` — Profile page (initials avatar, streak, badges grid)

### Day 5 — Offline + Career + Polish
- [x] `client/` — `utils/indexedDB.js` (all 8 functions)
- [x] `client/` — `hooks/useOfflineSync.js` (online/offline event listeners + sync)
- [x] `client/` — `hooks/useStreak.js`
- [x] `client/` — Offline detection banner (fixed top)
- [x] `client/` — Offline queue interception (ticks + quiz results → IndexedDB when offline)
- [x] `client/` — Manual Cache selection (Save Offline button in Syllabus)
- [x] `client/` — Dedicated Offline Quiz section in Quiz page UI
- [x] `server/` — `POST /api/sync/push` (timestamp-sorted replay, streak from timestamp)
- [x] `server/` — `GET /api/career/guidance` (Groq role mapping + YouTube API + fallback)
- [x] `client/` — Career page (2-col role cards, readiness bars, video resources)
- [x] `client/` — Hindi i18n wired throughout all pages
- [x] `server/` — Dashboard stats endpoint (or aggregate on frontend from existing endpoints)
- [x] `client/` — Dashboard page (stat cards, quiz history table, sync indicator)
- [ ] Update `README.md` with full setup + deployment instructions + vector index manual step
- [ ] Deploy `client/` to Vercel
- [ ] Deploy `server/` to Render
- [ ] Configure cron-job.org to ping `/api/ping` every 10 minutes

### Day 6 — Optimization & Verification
- [ ] `client/` — Implement Optimistic Updates for confidence/tick (TBD)
- [ ] `client/` — Pre-load IndexedDB cache into RAM for instant quiz starts (TBD)
- [ ] `server/` — Create `test_badges.js` verification suite (TBD)
- [ ] `client/` — Memoize Syllabus tree components for smooth scrolling/interaction (TBD)
- [ ] `server/` — Strip metadata before caching to optimize storage (TBD)

## 🐛 Known Issues / Decisions Log

> Add entries here as decisions are made or bugs are discovered.

| Date | Issue / Decision | Resolution |
|---|---|---|
| 2026-04-25 | Project initialized | Both `client/` and `server/` are empty. Start from Day 1. |
| 2026-04-25 | Multi-Syllabus Transition | Migrated from single `syllabus` field to `syllabi` array + `activeSyllabusId`. Added migration logic in `auth.js` to ensure zero data loss for legacy users. |
| 2026-04-25 | RAG Scoping Fix | Vector search now filters by `syllabus_id` to prevent cross-document hallucinations when multiple syllabi are uploaded. |
| 2026-04-25 | UI/UX Refinement | Implemented collapsible tree structures for large syllabi. Moved "Ask anything" context to a premium chat header in Explanation page. |
| 2026-04-25 | Personalization Sprint | Added tailored quizzes (10/18/25 Qs), Performance Insights (Strengths/Growth), Query History, and Read Aloud button. |
| 2026-04-25 | Manual Offline Cache | Implemented "Save Offline" feature with 5-topic limit. Added dedicated Offline Section in Quiz page for instant access without internet. |
| 2026-04-25 | JSON Parser Fix | Added control-character stripping in `groq.js` to handle unescaped newlines in AI-generated JSON quizzes. |
| 2026-04-26 | Quiz Type Restriction | Restricted 'coding' questions to only show when the syllabus explicitly contains programming topics. |

---

## 📝 Notes for Next Agent

- **Manual Offline selection is live.** Users can pick up to 5 topics in the Syllabus page to download for offline use.
- **Offline Quiz logic is robust.** The Quiz page now features a "Ready for Offline Study" section that bypasses network calls entirely.
- **JSON resilience is improved.** Backend `safeParseJson` now handles raw control characters frequently returned by Llama models.
- **Database Connection Warning:** Recent logs showed `ENOTFOUND` for MongoDB Atlas—this confirms the need for the offline mode. Ensure the internet is stable during the next deployment phase.
- **Multi-Syllabus is the new standard.** All routes (`quiz`, `career`, `explanation`, `tracker`) now use `user.getActiveSyllabus()` to scope their operations.
- **Remaining work:** Production deployment (Vercel/Render), final offline sync validation, and README update.
- User model fully updated with `syllabi` array and `activeSyllabusId` helper.
