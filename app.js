// ── Theme ──────────────────────────────────────────────────────────────────
const html = document.documentElement;
let theme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', theme);

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  renderThemeIcon();
}

function renderThemeIcon() {
  const btn = document.getElementById('themeBtn');
  btn.innerHTML = theme === 'dark'
    ? `<svg width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
         <circle cx="12" cy="12" r="4.5"/>
         <line x1="12" y1="2" x2="12" y2="4.5"/>
         <line x1="12" y1="19.5" x2="12" y2="22"/>
         <line x1="4.22" y1="4.22" x2="5.93" y2="5.93"/>
         <line x1="18.07" y1="18.07" x2="19.78" y2="19.78"/>
         <line x1="2" y1="12" x2="4.5" y2="12"/>
         <line x1="19.5" y1="12" x2="22" y2="12"/>
         <line x1="4.22" y1="19.78" x2="5.93" y2="18.07"/>
         <line x1="18.07" y1="5.93" x2="19.78" y2="4.22"/>
       </svg>`
    : `<svg width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
         <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
       </svg>`;
}

// ── Date header ────────────────────────────────────────────────────────────
(function() {
  const now = new Date();
  const day = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('headerDay').textContent = day.charAt(0).toUpperCase() + day.slice(1);
})();

// ── State ──────────────────────────────────────────────────────────────────
let tasks = [];
try { tasks = JSON.parse(localStorage.getItem('tasks_v2') || '[]'); } catch(e) {}
let filter = 'all';
let activeView = 'list';

function save() {
  try { localStorage.setItem('tasks_v2', JSON.stringify(tasks)); } catch(e) {}
}

// ── Time remaining ─────────────────────────────────────────────────────────
function timeRemaining(task) {
  if (!task.dueDate) return { label: 'Sans échéance', cls: 'none' };

  const dueStr = task.dueDate + (task.dueTime ? 'T' + task.dueTime : 'T23:59');
  const due    = new Date(dueStr);
  const now    = new Date();
  const diff   = due - now; // ms

  if (diff < 0) {
    return { label: 'En retard', cls: 'late' };
  }

  const totalMin = Math.floor(diff / 60000);
  const days  = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins  = totalMin % 60;

  let label;
  if (days > 1)       label = `dans ${days}j ${hours}h`;
  else if (days === 1) label = `dans 1j ${hours}h`;
  else if (hours > 0)  label = `dans ${hours}h ${mins}min`;
  else if (mins > 0)   label = `dans ${mins}min`;
  else                 label = `Maintenant`;

  const cls = days >= 1 ? 'ok' : hours >= 3 ? 'warn' : 'late';
  return { label, cls };
}

// ── Escape ─────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Render list view ───────────────────────────────────────────────────────
function renderList() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const left  = total - done;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  // Progress
  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('progLeft').textContent = left;
  document.getElementById('progPct').textContent  = pct + '%';

  // Filter
  let visible = tasks;
  if (filter === 'active') visible = tasks.filter(t => !t.done);
  if (filter === 'done')   visible = tasks.filter(t =>  t.done);

  const list  = document.getElementById('taskList');
  const empty = document.getElementById('empty');

  list.innerHTML = visible.map(t => {
    const tr = timeRemaining(t);
    return `
    <div class="task-card ${t.done ? 'done' : ''}" data-id="${t.id}">
      <div class="checkbox" data-check="${t.id}">
        <svg width="10" height="10" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1.5 5.5 4 8 8.5 2"/>
        </svg>
      </div>
      <div class="task-body">
        <div class="task-title">${esc(t.title)}</div>
        ${t.desc ? `<div class="task-desc">${esc(t.desc)}</div>` : ''}
        <span class="task-time-badge ${tr.cls}">
          ${tr.cls === 'none'
            ? `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5.5" cy="5.5" r="4.5"/><path d="M5.5 3v2.5l1.5 1.5"/></svg>`
            : `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5.5" cy="5.5" r="4.5"/><path d="M5.5 3v2.5l1.5 1.5"/></svg>`
          }
          ${tr.label}
        </span>
      </div>
      <button class="del-btn" data-del="${t.id}" type="button" aria-label="Supprimer">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="1.5" y1="1.5" x2="11.5" y2="11.5"/>
          <line x1="11.5" y1="1.5" x2="1.5" y2="11.5"/>
        </svg>
      </button>
    </div>`;
  }).join('');

  // Events
  list.querySelectorAll('[data-check]').forEach(el => {
    el.addEventListener('click', () => toggle(el.dataset.check));
  });
  list.querySelectorAll('.task-body').forEach(el => {
    const card = el.closest('.task-card');
    el.addEventListener('click', () => toggle(card.dataset.id));
  });
  list.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); remove(btn.dataset.del); });
  });

  // Empty
  const isEmpty = visible.length === 0;
  empty.classList.toggle('show', isEmpty);
  if (isEmpty) {
    const configs = {
      all:    { icon: '✦', title: 'Aucune tâche', sub: 'Ajoute ta première tâche via "New"' },
      active: { icon: '✅', title: 'Tout est fait !', sub: 'Profite de ta journée 🎉' },
      done:   { icon: '🎯', title: 'Rien de terminé', sub: 'Coche une tâche pour la voir ici' },
    };
    const c = configs[filter];
    document.getElementById('emptyIcon').textContent  = c.icon;
    document.getElementById('emptyTitle').textContent = c.title;
    document.getElementById('emptySub').textContent   = c.sub;
  }
}

// ── Task actions ───────────────────────────────────────────────────────────
function toggle(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; save(); renderList(); }
}

function remove(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  renderList();
}

// ── Add task (from form) ───────────────────────────────────────────────────
function handleSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('fTitle').value.trim();
  if (!title) { document.getElementById('fTitle').focus(); return; }

  tasks.unshift({
    id:      Date.now().toString(),
    title,
    desc:    document.getElementById('fDesc').value.trim(),
    dueDate: document.getElementById('fDate').value,
    dueTime: document.getElementById('fTime').value,
    done:    false,
  });

  save();
  e.target.reset();
  switchView('list');
}

// ── View switching ─────────────────────────────────────────────────────────
function switchView(v) {
  activeView = v;
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === v);
  });

  if (v === 'list') renderList();
}

// ── Filter wiring ──────────────────────────────────────────────────────────
document.getElementById('filters').querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderList();
  });
});

// ── Nav wiring ─────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ── Theme wiring ───────────────────────────────────────────────────────────
document.getElementById('themeBtn').addEventListener('click', toggleTheme);

// ── Form wiring ────────────────────────────────────────────────────────────
document.getElementById('taskForm').addEventListener('submit', handleSubmit);

// ── Init ───────────────────────────────────────────────────────────────────
renderThemeIcon();
switchView('list');

// ── Service Worker ─────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
