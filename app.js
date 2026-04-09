// ── State ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',     label: '✦ Tout',    color: '#c8f064' },
  { id: 'perso',   label: '🏠 Perso',  color: '#7b61ff' },
  { id: 'travail', label: '💼 Travail', color: '#ff9f43' },
  { id: 'courses', label: '🛒 Courses', color: '#54d4a0' },
  { id: 'sante',   label: '❤️ Santé',  color: '#ff4d6d' },
];

let tasks = [];
try { tasks = JSON.parse(localStorage.getItem('pwa_tasks') || '[]'); } catch(e) {}
let filter = 'all';
let activeCat = 'all';

// ── Date / greeting ────────────────────────────────────────────────────────
const now = new Date();
const h = now.getHours();
document.getElementById('greeting').textContent =
  h < 12 ? 'Bonjour ☀️' : h < 18 ? 'Bon après-midi 🌤' : 'Bonsoir 🌙';
document.getElementById('dayNum').textContent = now.getDate();
document.getElementById('monthName').textContent =
  now.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();

// ── Persist ────────────────────────────────────────────────────────────────
function save() {
  try { localStorage.setItem('pwa_tasks', JSON.stringify(tasks)); } catch(e) {}
}

// ── Escape HTML ───────────────────────────────────────────────────────────
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Category bar ──────────────────────────────────────────────────────────
function buildCatBar() {
  const bar = document.getElementById('catBar');
  bar.innerHTML = CATEGORIES.map(c => `
    <button class="cat-chip ${activeCat === c.id ? 'selected' : ''}" data-cat="${c.id}">
      <span class="cat-dot" style="background:${c.color}"></span>${c.label}
    </button>`).join('');
  bar.querySelectorAll('.cat-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      buildCatBar();
      renderTasks();
    });
  });
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderTasks() {
  const list = document.getElementById('taskList');
  const empty = document.getElementById('emptyState');

  let visible = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done')   return t.done;
    return true;
  });
  if (activeCat !== 'all') visible = visible.filter(t => t.cat === activeCat);

  list.innerHTML = visible.map(t => {
    const cat = CATEGORIES.find(c => c.id === t.cat) || CATEGORIES[1];
    return `
    <div class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <div class="check-ring">
        <svg width="12" height="12" fill="none" stroke="#0a0a0f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2 6 5 9 10 3"/>
        </svg>
      </div>
      <div class="task-body">
        <div class="task-text">${escHtml(t.text)}</div>
        <div class="task-meta">
          <span class="task-cat">
            <span class="cat-dot" style="background:${cat.color}"></span>
            ${cat.label.replace(/\S+ /, '')}
          </span>
          <span class="task-time">${t.time}</span>
        </div>
      </div>
      <button class="delete-btn" data-delete="${t.id}" type="button">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
        </svg>
      </button>
    </div>`;
  }).join('');

  // Attach events to rendered tasks
  list.querySelectorAll('.task-item').forEach(el => {
    const id = el.dataset.id;
    el.querySelector('.check-ring').addEventListener('click', () => toggleTask(id));
    el.querySelector('.task-body').addEventListener('click', () => toggleTask(id));
  });
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteTask(btn.dataset.delete);
    });
  });

  empty.classList.toggle('visible', visible.length === 0);
  updateStats();
  updateWidget();
}

// ── Stats ──────────────────────────────────────────────────────────────────
function updateStats() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const left  = total - done;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statDone').textContent  = done;
  document.getElementById('statLeft').textContent  = left;
  document.getElementById('progPct').textContent   = pct + '%';
  document.getElementById('progFill').style.width  = pct + '%';
}

// ── Widget preview ─────────────────────────────────────────────────────────
function updateWidget() {
  const wt   = document.getElementById('widgetTasks');
  const wf   = document.getElementById('widgetFooter');
  const top5 = tasks.slice(0, 5);
  const left = tasks.filter(t => !t.done).length;
  const cat  = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[1];

  wt.innerHTML = top5.map(t => `
    <div class="widget-task ${t.done ? 'done-task' : ''}">
      <span class="w-dot" style="background:${t.done ? '#444' : cat(t.cat).color}"></span>
      ${escHtml(t.text)}
    </div>`).join('') || '<div style="color:var(--muted);font-size:13px">Aucune tâche</div>';
  wf.textContent = left + ' tâche' + (left !== 1 ? 's' : '') + ' restante' + (left !== 1 ? 's' : '');
}

// ── Actions ────────────────────────────────────────────────────────────────
function addTask() {
  const input = document.getElementById('taskInput');
  const text  = input.value.trim();
  if (!text) return;
  const cat = activeCat === 'all' ? 'perso' : activeCat;
  tasks.unshift({
    id:   Date.now().toString(),
    text,
    done: false,
    cat,
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  });
  input.value = '';
  save();
  renderTasks();
  input.focus();
}

function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; save(); renderTasks(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  renderTasks();
}

// ── Export tâches vers iCloud (Scriptable) ────────────────────────────────
function exportToiCloud() {
  const json = JSON.stringify(tasks, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'taches.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Feedback visuel
  const btn = document.getElementById('exportBtn');
  if (btn) {
    btn.textContent = '✅ Fichier prêt !';
    setTimeout(() => { btn.textContent = '☁️ Exporter vers iCloud'; }, 2500);
  }
}

// ── Scriptable widget script generator ────────────────────────────────────
function getScriptableCode() {
  return `// Scriptable widget — Mes Tâches
// Colle ce script dans Scriptable, puis ajoute le widget sur ton écran d'accueil.
// Les données sont lues depuis iCloud Drive/Scriptable/taches.json
// Dans l'app web, exporte tes tâches en JSON vers ce fichier.

const fm = FileManager.iCloud();
const path = fm.joinPath(fm.documentsDirectory(), "taches.json");
let tasks = [];
if (fm.fileExists(path)) {
  try { tasks = JSON.parse(fm.readString(path)); } catch(e) {}
}

const w = new ListWidget();
w.backgroundColor = new Color("#13131a");
w.setPadding(14, 16, 14, 16);

const title = w.addText("Mes tâches");
title.font = Font.boldSystemFont(16);
title.textColor = new Color("#c8f064");
w.addSpacer(8);

const pending = tasks.filter(t => !t.done).slice(0, 5);
if (pending.length === 0) {
  const none = w.addText("✓ Tout est fait !");
  none.font = Font.systemFont(13);
  none.textColor = new Color("#aaaaaa");
} else {
  for (const t of pending) {
    const row = w.addText("• " + t.text);
    row.font = Font.systemFont(13);
    row.textColor = new Color("#f0f0f5");
    row.lineLimit = 1;
    w.addSpacer(4);
  }
}

w.addSpacer();
const footer = w.addText(pending.length + " restante" + (pending.length !== 1 ? "s" : ""));
footer.font = Font.systemFont(10);
footer.textColor = new Color("#666666");
footer.rightAlignText();

Script.setWidget(w);
w.presentSmall();
Script.complete();
`;
}

// ── Wire up all buttons ────────────────────────────────────────────────────
document.getElementById('addBtn').addEventListener('click', addTask);

document.getElementById('taskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

document.getElementById('filterBar').querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTasks();
  });
});

document.getElementById('navClear').addEventListener('click', () => {
  if (tasks.some(t => t.done)) {
    tasks = tasks.filter(t => !t.done);
    save();
    renderTasks();
  }
});

document.getElementById('exportBtn').addEventListener('click', exportToiCloud);

document.getElementById('copyScriptableBtn').addEventListener('click', () => {
  const code = getScriptableCode();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('copyScriptableBtn');
      btn.textContent = '✅ Copié !';
      setTimeout(() => { btn.textContent = '📋 Copier le script Scriptable'; }, 2000);
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const btn = document.getElementById('copyScriptableBtn');
    btn.textContent = '✅ Copié !';
    setTimeout(() => { btn.textContent = '📋 Copier le script Scriptable'; }, 2000);
  }
});

// ── Init ───────────────────────────────────────────────────────────────────
buildCatBar();
renderTasks();

// ── Service Worker ─────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
