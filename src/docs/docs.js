import './docs.css';
import { avatarToSvg, avatarToDataUri, ITEMS, CATEGORIES, STYLES, HAIR, EYES, MOUTH } from '../lib/avatar.js';
import { readAvatar, encodeAvatar, toAvatarDocument } from '../lib/document.js';
import { avatarFromUser, avatarFromSeed, GENERATOR_VERSION } from '../lib/seed.js';

/* The developer docs: a static page with a live playground, all on the real library. */

const ORIGIN = 'https://avatars.paulelite.com';
const $ = (s) => document.querySelector(s);

// A row of generated faces under the title
$('#faces').innerHTML = Array.from({ length: 9 }, (_, i) => `<img src="${avatarToDataUri(avatarFromSeed('docs-' + (i + 3)), { size: 112 })}" width="56" height="56" alt="">`).join('');

/* ---- Playground ---- */
const fill = (sel, opts) => { sel.insertAdjacentHTML('beforeend', opts.map((o) => `<option value="${o}">${o}</option>`).join('')); };
fill($('#pin-hair'), HAIR);
fill($('#pin-eyes'), EYES);
fill($('#pin-mouth'), MOUTH);

let lastSvg = '';
let lastConfig = null;
function play() {
  const raw = $('#seed').value.trim() || 'anon';
  const size = Number($('#size').value);
  const pins = {};
  for (const k of ['hair', 'eyes', 'mouth']) { const v = $('#pin-' + k).value; if (v) pins[k] = v; }
  const { seed, config } = avatarFromUser({ id: raw }, Object.keys(pins).length ? pins : undefined);
  lastConfig = config;
  lastSvg = avatarToSvg(config, { size, seed });
  $('#play-face').innerHTML = `<img src="${avatarToDataUri(config, { size })}" width="${Math.min(size, 200)}" height="${Math.min(size, 200)}" alt="Avatar for ${raw.replace(/[<>"&]/g, '')}">`;
  const qs = new URLSearchParams({ id: raw });
  if (size !== 256) qs.set('size', size);
  Object.entries(pins).forEach(([k, v]) => qs.set(k, v));
  const url = `${ORIGIN}/api/avatar?${qs}`;
  $('#play-url').textContent = url;
  $('#play-edit').href = `/?avatar=${encodeAvatar(config)}`;
  $('#play-json-url').textContent = `${ORIGIN}/api/avatar?${qs}&format=json`;
  const shown = { seed, generator: GENERATOR_VERSION, url, editUrl: `${ORIGIN}/?avatar=${encodeAvatar(config)}`, config, document: toAvatarDocument(config, { seed }), svg: lastSvg.slice(0, 120) + '…' };
  $('#play-json').textContent = JSON.stringify(shown, null, 2);
  const live = $('#live-frame avatar-builder');
  if (live && !live.dataset.touched) live.value = config;
}
['#seed', '#size', '#pin-hair', '#pin-eyes', '#pin-mouth'].forEach((s) => $(s).addEventListener('input', play));
play();

/* ---- Read an avatar back ---- */
function read() {
  const v = $('#read-in').value.trim();
  if (!v) { $('#read-out').textContent = '// the config appears here'; return; }
  const c = readAvatar(v);
  $('#read-out').textContent = c ? JSON.stringify(c, null, 2) : '// No avatar found. Paste an SVG made by Avatar Builder.';
}
$('#read-in').addEventListener('input', read);
$('#read-sample').addEventListener('click', () => { $('#read-in').value = lastSvg; read(); });

/* ---- Copy buttons (on every code block, plus the URL) ---- */
document.querySelectorAll('pre > code').forEach((code) => {
  if (code.closest('.read-out, .live-out, .json')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'copy copy-pre';
  b.textContent = 'Copy';
  b.addEventListener('click', () => copy(code.textContent, b));
  code.parentElement.appendChild(b);
});
document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copy($(b.dataset.copy).textContent, b)));
function copy(text, b) {
  navigator.clipboard?.writeText(text).then(() => {
    b.textContent = 'Copied';
    setTimeout(() => { b.textContent = 'Copy'; }, 1200);
  }, () => {});
}

/* ---- Config fields, from the library itself ---- */
const rows = [['category', CATEGORIES.join(', ')], ['style', STYLES.join(', ')]];
for (const [k, p] of Object.entries(ITEMS)) {
  const vals = p.kind === 'color' ? `hex colour${p.optional ? ' or null' : ''} (presets: ${p.presets.join(' ')})` : p.options.map(String).join(', ');
  rows.push([k, vals]);
}
$('#fields tbody').innerHTML = rows.map(([k, v]) => `<tr><td><code>${k}</code></td><td>${v}</td></tr>`).join('');

/* ---- The live embed (the same embed.js other sites load) ---- */
const s = document.createElement('script');
s.src = '/embed.js';
s.onload = () => {
  const el = document.createElement('avatar-builder');
  el.setAttribute('name', 'avatar');
  el.setAttribute('actions', 'false');
  $('#live-frame').appendChild(el);
  el.value = lastConfig;
  el.addEventListener('change', (e) => {
    el.dataset.touched = '1';
    $('#live-out').textContent = `change → ${JSON.stringify(e.detail.document, null, 2)}`;
  });
};
document.body.appendChild(s);

/* ---- Brand face, and the contents list following the reader ---- */
$('#brand-face').src = avatarToDataUri(avatarFromSeed('avatar-builder'), { size: 56 });
const links = [...document.querySelectorAll('.toc a')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-80px 0px -70% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));
