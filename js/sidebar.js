// Sidebar open/close DOM operations — no project imports, pure leaf module.
// Centralised here because multiple call sites (notes.js, main.js) toggle the sidebar;
// a single implementation prevents drift between them.

export function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('active');
  document.getElementById('sidebarToggleBtn').setAttribute('aria-expanded', 'true');
  // Lock body scroll — sidebar acts as a modal sheet on mobile
  document.body.style.overflow = 'hidden';
}

export function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
  document.getElementById('sidebarToggleBtn').setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}