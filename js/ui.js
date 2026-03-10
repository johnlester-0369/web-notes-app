// DOM rendering layer — reads state, writes to DOM, emits nothing back to business logic.
// The `onSelectNote` callback parameter in renderNotesList breaks what would otherwise be
// a circular import between ui.js and notes.js (notes imports ui; ui would import notes).
/* global lucide */

import { state } from './state.js';
import { escapeHtml, formatDate, countWords, isMobile } from './utils.js';
import { closeSidebar } from './sidebar.js';

export function showSaveStatus(msg) {
  const el = document.getElementById('saveStatus');
  clearTimeout(state.saveStatusTimer);
  el.textContent = msg;
  el.classList.remove('hidden');
  // "Saved" auto-dismisses to keep the toolbar uncluttered; "Saving…" stays until done
  if (msg === 'Saved') {
    state.saveStatusTimer = setTimeout(() => el.classList.add('hidden'), 2000);
  }
}

export function updateStats() {
  const title = document.getElementById('noteTitleInput').value;
  const body  = document.getElementById('noteBodyInput').value;
  // Count title + body as a unit — users think of the whole note, not individual fields
  const combined = (title + ' ' + body).trim();
  const words = countWords(combined);
  const chars = combined.length;
  document.getElementById('wordCountStat').textContent =
    `${words} word${words === 1 ? '' : 's'}`;
  document.getElementById('charCountStat').textContent =
    `${chars} char${chars === 1 ? '' : 's'}`;
}

// onSelectNote is injected by the caller (notes.js / main.js) to avoid a circular import
export function renderNotesList(query = '', onSelectNote) {
  const listEl  = document.getElementById('notesList');
  const countEl = document.getElementById('noteCount');
  const q       = query.trim().toLowerCase();

  const filtered = q
    ? state.notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
      )
    : state.notes;

  // Newest-modified first so last-worked-on is always at top
  const sorted = [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);

  countEl.textContent = sorted.length;

  if (sorted.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state" role="status">
        <div class="empty-state__icon" aria-hidden="true">
          ${q ? '<i data-lucide="search-x"></i>' : '<i data-lucide="file-plus-2"></i>'}
        </div>
        <div class="empty-state__label">${q ? 'No matches found' : 'No notes yet'}</div>
        <div class="empty-state__sublabel">${q ? 'Try a different search' : 'Tap New Note to get started'}</div>
      </div>`;
    // Re-initialize Lucide after dynamic innerHTML — startup createIcons() only saw the original DOM
    lucide.createIcons();
    return;
  }

  listEl.innerHTML = sorted.map(note => `
    <div
      class="note-item${note.id === state.activeNoteId ? ' active' : ''}"
      data-id="${note.id}"
      role="listitem"
      tabindex="0"
      aria-current="${note.id === state.activeNoteId ? 'true' : 'false'}"
      aria-label="${escapeHtml(note.title) || 'Untitled'}"
    >
      <div class="note-item__title">${escapeHtml(note.title) || 'Untitled'}</div>
      <div class="note-item__preview">${escapeHtml(note.body.split('\n')[0]) || 'No content'}</div>
      <div class="note-item__date">${formatDate(note.updatedAt)}</div>
    </div>
  `).join('');

  listEl.querySelectorAll('.note-item').forEach(item => {
    item.addEventListener('click', () => {
      onSelectNote(item.dataset.id);
      // Auto-close overlay sidebar when a note is chosen on mobile
      if (isMobile()) closeSidebar();
    });
    // Keyboard accessibility — Enter/Space activates item
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectNote(item.dataset.id);
        if (isMobile()) closeSidebar();
      }
    });
  });
}

// showDeleteModal / hideDeleteModal belong to the rendering layer — same rationale as
// renderNotesList accepting onSelectNote: keeps notes.js free of direct DOM modal concerns.

export function showDeleteModal(onConfirm) {
  const backdrop   = document.getElementById('deleteModal');
  const confirmBtn = document.getElementById('deleteModalConfirm');
  const cancelBtn  = document.getElementById('deleteModalCancel');

  // Replace nodes to shed stale listeners from prior openings without removeEventListener bookkeeping
  const freshConfirm = confirmBtn.cloneNode(true);
  const freshCancel  = cancelBtn.cloneNode(true);
  confirmBtn.replaceWith(freshConfirm);
  cancelBtn.replaceWith(freshCancel);

  freshConfirm.addEventListener('click', () => { hideDeleteModal(); onConfirm(); });
  freshCancel.addEventListener('click', hideDeleteModal);

  // Click on the dimmed backdrop area (not the card) dismisses without deleting
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) hideDeleteModal();
  }, { once: true });

  // Escape key dismissal — standard accessible dialog behaviour (ARIA APG modal pattern)
  function onEsc(e) {
    if (e.key === 'Escape') { hideDeleteModal(); document.removeEventListener('keydown', onEsc); }
  }
  document.addEventListener('keydown', onEsc);

  backdrop.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('open');
  // Focus Cancel by default — keyboard users must opt in to the destructive action, not out
  freshCancel.focus();
}

export function hideDeleteModal() {
  const backdrop = document.getElementById('deleteModal');
  backdrop.classList.remove('open');
  backdrop.setAttribute('aria-hidden', 'true');
}
