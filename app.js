const $ = id => document.getElementById(id);

let apps = JSON.parse(localStorage.getItem('apps')) ?? [];
let editingId = null;

const saveApps = () => localStorage.setItem('apps', JSON.stringify(apps));

function abbr(name) {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words.slice(0, 3).map(w => w[0]).join('') : name.slice(0, 2)).toUpperCase();
}

function renderApps() {
  const tpl = $('card-tpl').content;
  $('grid').replaceChildren(...apps.map(app => {
    const card = tpl.cloneNode(true);
    const badge = card.querySelector('.badge');
    badge.textContent = abbr(app.name);
    badge.style.background = app.color;
    card.querySelector('h3').textContent = app.name;
    card.querySelector('.date').textContent = new Date(app.created).toLocaleDateString();
    card.querySelector('.open').onclick = () => window.open(app.url, '_blank', 'noopener');
    card.querySelector('.edit').onclick = () => openDialog(app);
    card.querySelector('.delete').onclick = () => {
      if (!confirm(`Delete ${app.name}?`)) return;
      apps = apps.filter(a => a.id !== app.id);
      saveApps();
      renderApps();
    };
    return card;
  }));
  $('empty').hidden = apps.length > 0;
}

function openDialog(app) {
  editingId = app?.id ?? null;
  $('dialog-title').textContent = app ? 'Edit app' : 'Add app';
  $('app-name').value = app?.name ?? '';
  $('app-url').value = app?.url ?? '';
  $('app-color').value = app?.color ?? '#4f46e5';
  $('app-dialog').showModal();
}

$('add-app').onclick = () => openDialog();
$('cancel').onclick = () => $('app-dialog').close();

$('app-form').onsubmit = () => {
  const data = { name: $('app-name').value.trim(), url: $('app-url').value, color: $('app-color').value };
  if (editingId) apps = apps.map(a => a.id === editingId ? { ...a, ...data } : a);
  else apps.push({ id: Date.now(), created: new Date().toISOString(), ...data });
  saveApps();
  renderApps();
};

renderApps();
