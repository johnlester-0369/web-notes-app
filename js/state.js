// Shared mutable application state — single source of truth for all modules.
// Exported as a plain object so any module can read/write live references without
// prop-drilling or complex pub/sub. Appropriate scale for a single-page notes app.
export const state = {
  notes:           [],   // in-memory array, mirrored to localStorage
  activeNoteId:    null, // ID of the currently open note
  saveTimer:       null, // handle for debounced auto-save
  saveStatusTimer: null, // handle for "Saved" auto-hide after 2 s
};