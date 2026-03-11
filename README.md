# Notes

> Your notes stay in your browser. No account. No server. No build step.

Most note-taking tools demand cloud sync, a sign-up flow, or a bundler before you can write a single line. Notes skips all of that — open `index.html`, start writing. Everything persists to `localStorage`, private and offline-ready by default.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen)](https://johnlester-0369.github.io/web-notes-app)

![Notes app screenshot](./docs/preview.png)

---

## Quick Start

No install. No package manager. Two options:

**Clone the repo**

```bash
git clone https://github.com/johnlester-0369/web-notes-app.git
cd web-notes-app
```

Then choose how to open it:

**Option A — Local static server (recommended)**

ES Module imports require a server in some browsers due to CORS restrictions:

```bash
# Python — built into macOS and most Linux distros
python3 -m http.server 8080

# Node.js
npx serve .

# VS Code
# Install "Live Server" → right-click index.html → Open with Live Server
```

Then open `http://localhost:8080`.

**Option B — Open directly**

```
open index.html
```

Works in most modern browsers for a pure-static app. If imports silently fail, switch to Option A.

---

## Features

- **Instant creation** — one click/tap opens a blank note ready to type
- **Auto-save** — debounced 400 ms after the last keystroke; "Saving…" / "Saved" status in the toolbar
- **Full-text search** — filters title and body in real time as you type
- **Delete confirmation** — modal with Escape, backdrop-click, and Cancel affordances; keyboard focus defaults to Cancel to prevent accidental deletion
- **Live word & character count** — footer stats update continuously as you write
- **Responsive layout**
  - **Desktop** (≥ 900 px): persistent sidebar + editor side-by-side
  - **Tablet** (640–900 px): narrower sidebar, same layout
  - **Mobile** (< 640 px): slide-in sidebar sheet; floating action button replaces the header button
- **Keyboard accessible** — all elements reachable via Tab; Enter/Space activates list items; Escape closes dialogs
- **Zero dependencies** — no framework, no bundler, no `npm install`

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | Vanilla ES Modules (JS) | No build toolchain required; native browser support since 2017 |
| Markup | HTML5 | Semantic elements and ARIA attributes throughout |
| Styles | CSS custom properties + responsive breakpoints | Design tokens defined once in `:root`; overridden per breakpoint — no preprocessor needed |
| Icons | [Lucide](https://lucide.dev/) (UMD CDN) | Consistent stroke-icon library; loaded as a sync `<script>` so the `lucide` global is ready before deferred modules execute |
| Font | [DM Sans](https://fonts.google.com/specimen/DM+Sans) (Google Fonts) | Clean humanist sans-serif; approachable without being bland |
| Storage | `localStorage` (`notes-app-v1` key) | Zero-setup persistence; swap to IndexedDB or a remote API by editing `storage.js` only |

---

## Architecture

Six focused ES modules, each owning a single concern. `main.js` is pure event-wiring glue — no business logic lives there.

**Import graph** — who depends on whom (arrows follow `import` direction):

```
┌─────────────┐
│  index.html │
│ (app shell) │
└──────┬──────┘
       │ <script type="module">
       ▼
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   main.js   │────►│   notes.js  │────►│  storage.js  │
│ (entry/glue)│     │ (CRUD/save) │     │(localStorage)│
└──────┬──────┘     └──────┬──────┘     └──────┬───────┘
       │                   │                   │
       │      ┌────────────┘                   │
       │      │                                │
       ▼      ▼                                ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    ui.js    │────►│  sidebar.js │     │   state.js  │
│ (rendering) │     │(open/close) │     │(shared obj) │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│   utils.js  │
│  (pure fns) │
└─────────────┘
```

**Note lifecycle** — runtime data flow from user action to persistence and render:

```
  User Action (keystroke · click · search)
       │
       ▼
┌──────────────────────────────────────────────┐
│                   main.js                    │
│  input event  → scheduleAutoSave() ──────────┼──►┐
│  New Note btn → createNote()       ──────────┼──►│
│  Delete btn   → deleteNote()       ──────────┼──►│
└──────────────────────────────────────────────┘   │
                                                   │
       ┌───────────────────────────────────────────┘
       ▼
┌──────────────────────────────────────────────┐
│                  notes.js                    │
│  mutates ──────────────────► state.js        │
│  saveNotesToStorage() ──────► storage.js     │
│                                  │           │
│                                  ▼           │
│                             localStorage     │
│  renderNotesList() ─────────► ui.js → DOM    │
│  selectNote()      ─────────► ui.js → DOM    │
└──────────────────────────────────────────────┘
       │
       ├── sidebar.js  (open/close CSS classes + ARIA attrs)
       ├── utils.js    (formatDate · escapeHtml · countWords · isMobile)
       └── state.js    (notes[] · activeNoteId · timer handles)
```

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `main.js` | Event listeners, initialisation sequence — no business logic |
| `notes.js` | Note CRUD and auto-save orchestration |
| `state.js` | Single source of truth for `notes[]`, `activeNoteId`, and timer handles |
| `storage.js` | All `localStorage` access — swap the persistence layer here only |
| `ui.js` | Renders note list, stats bar, save status, and delete confirmation modal |
| `sidebar.js` | Adds/removes CSS classes and ARIA attributes for the mobile sidebar |
| `utils.js` | Pure, side-effect-free helpers — safe to unit test in isolation |

### Architectural Decisions

**Shared mutable state via plain object (`state.js`)** — State is a plain exported object rather than a reactive store or event bus. At this scale, the added ceremony of pub/sub or a signal library costs more than it buys; every module reads and writes live references directly.

**Circular import avoidance via callback injection** — `ui.js` needs to call `selectNote`, but `notes.js` already imports `ui.js`. Rather than adding a shared event bus to break the cycle, `renderNotesList` and `showDeleteModal` accept an `onSelectNote` callback from their callers. The dependency graph stays acyclic with no additional infrastructure.

**Auto-save debounce at 400 ms** — Writing to `localStorage` on every keystroke would thrash the storage layer. 400 ms is fast enough to feel instant on tab-close but long enough to batch a typical typing burst into a single write.

**CSS ↔ JS breakpoint parity** — `isMobile()` hard-codes `window.innerWidth < 640` to match the CSS `@media (max-width: 639px)` breakpoint exactly. If the CSS value ever changes, `isMobile()` must change with it — they are a coupled pair.

---

## File Structure

```
web-note-app/
├── css/
│   └── styles.css         # Design tokens, component styles, responsive breakpoints
├── docs/
│   └── preview.png        # Screenshot used in this README
├── js/
│   ├── main.js            # Entry point — event wiring + initialisation
│   ├── notes.js           # Note business logic (CRUD, auto-save)
│   ├── sidebar.js         # Mobile sidebar DOM operations
│   ├── state.js           # Shared application state
│   ├── storage.js         # localStorage persistence layer
│   ├── ui.js              # DOM rendering layer
│   └── utils.js           # Pure utility functions
└── index.html             # App shell + all HTML structure
```

---

## Browser Support

Any modern browser with ES Module and `localStorage` support:

| Browser | Minimum version |
|---|---|
| Chrome / Edge | 61+ |
| Firefox | 60+ |
| Safari | 10.1+ |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT © [johnlester-0369](https://github.com/johnlester-0369)
