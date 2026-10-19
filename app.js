const currentUser = { name: "Rajnikant Gaikwad" };

const $ = id => document.getElementById(id);

let env = {};
let apps = [];
let editingId = null;

async function loadEnv() {
  const text = await (await fetch('.env')).text();
  return Object.fromEntries(text.split('\n').filter(line => line.includes('=')).map(line => {
    const i = line.indexOf('=');
    return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  }));
}

async function api(query, options = {}) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/apps${query}`, {
    ...options,
    headers: { apikey: env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message ?? res.statusText);
  return data;
}

async function refresh() {
  apps = await api('?select=*&order=created');
  renderApps();
}

const run = action => action().catch(err => alert(`Database error: ${err.message}`));

function abbr(name) {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words.slice(0, 3).map(w => w[0]).join('') : name.slice(0, 2)).toUpperCase();
}

function renderApps() {
  const query = $('search').value.trim().toLowerCase();
  const visible = apps.filter(app => app.name.toLowerCase().includes(query));
  const tpl = $('card-tpl').content;
  $('grid').replaceChildren(...visible.map(app => {
    const card = tpl.cloneNode(true);
    const badge = card.querySelector('.badge');
    badge.textContent = abbr(app.name);
    badge.style.background = app.color;
    card.querySelector('h3').textContent = app.name;
    card.querySelector('.date').textContent = 'Created ' + new Date(app.created).toLocaleDateString();
    card.querySelector('.open').onclick = () => window.open(app.url, '_blank', 'noopener');
    card.querySelector('.edit').onclick = () => openDialog(app);
    card.querySelector('.delete').onclick = () => {
      if (!confirm(`Delete ${app.name}?`)) return;
      run(async () => {
        await api(`?id=eq.${app.id}`, { method: 'DELETE' });
        await refresh();
      });
    };
    return card;
  }));
  $('empty').hidden = visible.length > 0;
}

function openDialog(app) {
  editingId = app?.id ?? null;
  $('dialog-title').textContent = app ? 'Edit app' : 'Create Solution';
  $('app-name').value = app?.name ?? '';
  $('app-url').value = app?.url ?? '';
  $('app-color').value = app?.color ?? '#1a73e8';
  $('app-dialog').showModal();
}

$('user-name').textContent = currentUser.name;

$('search-toggle').onclick = () => {
  $('search').hidden = !$('search').hidden;
  if (!$('search').hidden) $('search').focus();
};
$('search').oninput = renderApps;

$('add-app').onclick = () => openDialog();
$('cancel').onclick = () => $('app-dialog').close();

$('app-form').onsubmit = () => {
  const body = JSON.stringify({ name: $('app-name').value.trim(), url: $('app-url').value, color: $('app-color').value });
  run(async () => {
    if (editingId) await api(`?id=eq.${editingId}`, { method: 'PATCH', body });
    else await api('', { method: 'POST', body });
    await refresh();
  });
};

document.addEventListener('click', e => {
  document.querySelectorAll('.more[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; });
});

run(async () => {
  env = await loadEnv();
  await refresh();
});
