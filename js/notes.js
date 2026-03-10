// Note business logic — CRUD operations and auto-save orchestration.
// This module owns the note lifecycle; it coordinates storage, rendering, and sidebar
// state but contains no direct persistence or rendering implementation itself.

import { state } from './state.js';
import { saveNotesToStorage } from './storage.js';
import { generateId, formatDateFull, isMobile, autoResize } from './utils.js';
import { openSidebar, closeSidebar } from './sidebar.js';
import { renderNotesList, updateStats, showSaveStatus } from './ui.js';

export function getActiveNote() {
  return state.notes.find(n => n.id === state.activeNoteId) ?? null;
}

export function selectNote(id) {
  state.activeNoteId = id;
  const note = getActiveNote();
  if (!note) return;

  document.getElementById('noNoteSelected').style.display = 'none';
  const panel = document.getElementById('editorPanel');
  panel.style.display = 'flex';

  const titleEl = document.getElementById('noteTitleInput');
  const bodyEl  = document.getElementById('noteBodyInput');

  titleEl.value = note.title;
  bodyEl.value  = note.body;
  document.getElementById('editorDate').textContent = formatDateFull(note.updatedAt);
  document.getElementById('saveStatus').classList.add('hidden');

  autoResize(titleEl);
  updateStats();

  // Pass selectNote itself as callback — ui.js does not import notes.js, breaking the cycle
  renderNotesList(document.getElementById('searchInput').value, selectNote);
}

export function createNote() {
  const note = {
    id:        generateId(),
    title:     '',
    body:      '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.notes.unshift(note); // prepend so it appears at top immediately
  saveNotesToStorage();
  selectNote(note.id);
  if (isMobile()) closeSidebar();
  document.getElementById('noteTitleInput').focus();
}

export function deleteNote(id) {
  state.notes = state.notes.filter(n => n.id !== id);
  saveNotesToStorage();
  state.activeNoteId = null;

  if (state.notes.length > 0) {
    // Auto-select most recently updated so the UI stays populated
    const next = [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    selectNote(next.id);
  } else {
    document.getElementById('noNoteSelected').style.display  = 'flex';
    document.getElementById('editorPanel').style.display     = 'none';
    // Return to sidebar when all notes are gone on mobile
    if (isMobile()) openSidebar();
    renderNotesList('', selectNote);
  }
}

// Debounce saves so we don't thrash localStorage on every keystroke
export function scheduleAutoSave() {
  showSaveStatus('Saving…');
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    const note = getActiveNote();
    if (!note) return;
    note.title     = document.getElementById('noteTitleInput').value;
    note.body      = document.getElementById('noteBodyInput').value;
    note.updatedAt = Date.now();
    document.getElementById('editorDate').textContent = formatDateFull(note.updatedAt);
    saveNotesToStorage();
    renderNotesList(document.getElementById('searchInput').value, selectNote);
    showSaveStatus('Saved');
    updateStats();
  }, 400);
}