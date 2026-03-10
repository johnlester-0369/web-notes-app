// Entry point — wires DOM events to business logic and runs initialisation.
// No business logic lives here; this file is pure glue between the DOM and the modules.
// lucide is a UMD global from the sync <script> in index.html;
// because <script type="module"> is always deferred, lucide will have executed first.
/* global lucide */

import { loadNotes } from './storage.js';
import { renderNotesList, showDeleteModal } from './ui.js';
import { createNote, deleteNote, selectNote, scheduleAutoSave } from './notes.js';
import { openSidebar, closeSidebar } from './sidebar.js';
import { state } from './state.js';
import { autoResize } from './utils.js';

// ── Event wiring ─────────────────────────────────────────────────────────────

document.getElementById('newNoteBtn').addEventListener('click', createNote);
document.getElementById('newNoteBtn2').addEventListener('click', createNote);
document.getElementById('fabNewNoteBtn').addEventListener('click', createNote);

document.getElementById('deleteNoteBtn').addEventListener('click', () => {
  // Show confirmation modal before deleting — one-way action that cannot be undone
  if (state.activeNoteId) showDeleteModal(() => deleteNote(state.activeNoteId));
});

document.getElementById('noteTitleInput').addEventListener('input', e => {
  autoResize(e.target);
  scheduleAutoSave();
});

document.getElementById('noteBodyInput').addEventListener('input', scheduleAutoSave);

document.getElementById('searchInput').addEventListener('input', e => {
  renderNotesList(e.target.value, selectNote);
});

// Mobile: hamburger in app bar toggles sidebar
document.getElementById('sidebarToggleBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.contains('open')
    ? closeSidebar()
    : openSidebar();
});

// Mobile: tapping the dimmed overlay dismisses the sidebar
document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

// ── Initialise ───────────────────────────────────────────────────────────────

loadNotes();
renderNotesList('', selectNote);
// Convert all static <i data-lucide> elements to inline SVGs now that the full DOM is ready
lucide.createIcons();

// Open the most recently touched note on load so the user lands in context
if (state.notes.length > 0) {
  const recent = [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  selectNote(recent.id);
}
