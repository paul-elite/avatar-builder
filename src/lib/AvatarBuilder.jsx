import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import {
  SETUP, PRIMARY, ITEMS, PART_TARGETS, ITEM_VIEWS, VIEWS, visibleItems, viewFor,
  defaultAvatar, innerSvg, itemSvg, headSwatchSvg, avatarToSvg,
} from './avatar.js';
import { downloadPng } from './export.js';
import { readAvatar, loadAvatar, toAvatarDocument, encodeAvatar } from './document.js';
import { NavIcon, BarIcon, ColourDot } from './icons.jsx';

/* =========================================================================
   <AvatarBuilder /> — one editor, broad → detailed, with progressive disclosure.

     Setup      the foundation: category and style (first visit; later from
                the chip at the top)
     Primary    the default stage: Skin · Hair · Face · Eyes · Features ·
                Torso · Background, plus shuffle and download
     Category   that category's items (Hair → Style, Colour, Headwear).
                Items that don't apply yet stay hidden: hair colour until
                there is hair, tongue colour until the mouth shows one, and
                everything under Torso until the avatar has a torso.
     Item       its options, drawn as the item itself; colours as a row with
                an "all colours" grid behind it

   One floating toolbar shows the current level. Going deeper sinks it into
   the stack behind; × (or Escape) closes the current level and the one below
   rises back. Selections persist across every move; undo/redo count actual
   changes to the avatar, nothing else.

   Props:
     value?        controlled config (omit for uncontrolled)
     defaultValue? initial config when uncontrolled
     template?     start editing from an existing avatar: one of our SVGs (string,
                   element or data URI), its URL, a document, or a (partial) config.
                   It wins over what `persist` remembered, and skips setup.
     onChange?     (config, { svg, document, code }) => void   — fires on every change
                   (svg carries the document, so it can be opened again as a template;
                   code is the short form for links: ?avatar=code)
     size?         preview size in px (default 240)
     exportSize?   downloaded PNG size in px (default 512)
     showActions?  show the download button (default true)
     persist?      a storage key: remember the look and setup in this browser
     className?    extra class on the root

   Import the stylesheet once: import 'avatar-builder/styles.css'
   ========================================================================= */

// demote overlaps enter: the new bar starts as the old one is still settling into the tray,
// so there's never a frame with an empty slab. 'tab' (switching sibling items) keeps the bar.
const MS = { tab: 150, morph: 150, fold: 130, flip: 300 };

/* ---- Colours: a row first, the full grid behind a button ---- */
const hsl = (h, s, l) => {
  const a = (s / 100) * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};
const GRID = [
  ...[0.92, 0.84, 0.74, 0.62, 0.5, 0.38, 0.26].map((l) => [0, 20, 35, 50, 90, 140, 170, 195, 215, 250, 285, 320].map((h) => hsl(h, 82, l))),
  ['#ffffff', '#ececea', '#d9d9d7', '#c2bfbc', '#ababa6', '#8a8a86', '#6b6b67', '#4d4d4a', '#363633', '#262624', '#1a1a1a', '#000000'],
];

/* ---- Icons (Figma's redo-01, mirrored for undo; x; shuffle; download) ---- */
function HistoryIcon({ mirrored }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={mirrored ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M20.99 8h-12a6 6 0 0 0 0 12h4M16.99 4l1.16.88C20.04 6.32 20.99 7.04 20.99 8s-.95 1.68-2.84 3.12L16.99 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const LINE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" {...LINE} /></svg>;
const DownloadIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" {...LINE} /></svg>;
const MoreIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.9967 12.5V12M11.9967 6.5V6M11.9967 18.5V18M12.9967 12.5C12.9967 11.9477 12.549 11.5 11.9967 11.5C11.4444 11.5 10.9967 11.9477 10.9967 12.5C10.9967 13.0523 11.4444 13.5 11.9967 13.5C12.549 13.5 12.9967 13.0523 12.9967 12.5ZM12.9967 6.5C12.9967 5.94772 12.549 5.5 11.9967 5.5C11.4444 5.5 10.9967 5.94772 10.9967 6.5C10.9967 7.05228 11.4444 7.5 11.9967 7.5C12.549 7.5 12.9967 7.05228 12.9967 6.5ZM12.9967 18.5C12.9967 17.9477 12.549 17.5 11.9967 17.5C11.4444 17.5 10.9967 17.9477 10.9967 18.5C10.9967 19.0523 11.4444 19.5 11.9967 19.5C12.549 19.5 12.9967 19.0523 12.9967 18.5Z" {...LINE} /></svg>;
const LinkIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" {...LINE} /></svg>;
const ResetIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.35-5.65M4 4v4.5h4.5" {...LINE} /></svg>;
const ExpandIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4H20v5.5M9.5 20H4v-5.5M20 4l-6.5 6.5M4 20l6.5-6.5" {...LINE} /></svg>;
// Shape rows longer than this scroll and get an expand button
const SHAPE_ROW = 7;
const ArrowIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" {...LINE} strokeWidth={2} /></svg>;

/* ---- Tile faces: the item itself (or the colour), never the whole avatar ---- */
function None() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <circle cx="20" cy="20" r="9" fill="none" stroke="#c9c9c6" strokeWidth="1.5" />
      <path d="M13.6 26.4 26.4 13.6" stroke="#c9c9c6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ItemArt({ part, config, size = 40 }) {
  const inner = itemSvg(part, config);
  if (!inner) return <None />;
  return <svg viewBox={ITEM_VIEWS[part]} width={size} height={size} aria-hidden="true" dangerouslySetInnerHTML={{ __html: inner }} />;
}
const HeadSwatch = ({ color, shape, size = 40 }) => (
  <svg viewBox={VIEWS.face} width={size} height={size} aria-hidden="true" dangerouslySetInnerHTML={{ __html: headSwatchSvg(color, shape) }} />
);
const FrameSwatch = ({ shape }) => (
  <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    {shape === 'circle' && <circle cx="20" cy="20" r="12" fill="#e8e7e6" />}
    {shape === 'rounded' && <rect x="8" y="8" width="24" height="24" rx="7" fill="#e8e7e6" />}
    {shape === 'square' && <rect x="8" y="8" width="24" height="24" fill="#e8e7e6" />}
    {shape === 'full' && <rect x="4" y="4" width="32" height="32" rx="3" fill="none" stroke="#c9c9c6" strokeWidth="1.5" strokeDasharray="3 3" />}
  </svg>
);
const Chip = ({ color }) => (color ? <span className="ab-chip" style={{ background: color }} /> : <None />);

/* What an item looks like for a given config: used for item tiles and option tiles */
function Face({ item, config, size }) {
  switch (item) {
    case 'body': return <ItemArt part="body" config={{ ...config, outfitColor: '#d9d9d7', outfit: 'tee', detail: 'none' }} size={size} />;
    case 'outfitColor': return <Chip color={config.outfitColor} />;
    case 'skin': return <HeadSwatch color={config.skin} shape={config.head} size={size} />;
    case 'bg': return <Chip color={config.bg} />;
    case 'frame': return <FrameSwatch shape={config.frame} />;
    case 'blush': return <Chip color={config.blush} />;
    case 'tears': return <Chip color={config.tears} />;
    case 'hairColor': return config.hair === 'none' ? <Chip color={config.hairColor} /> : <ItemArt part="hair" config={config} size={size} />;
    case 'torso': return config.torso ? <ItemArt part="outfit" config={config} size={size} /> : <HeadSwatch color={config.skin} size={size} />;
    default: return <ItemArt part={item} config={config} size={size} />;
  }
}


const eq = (a, b) => a === b || (a != null && b != null && String(a).toLowerCase() === String(b).toLowerCase());
// Mix a hex colour toward another (for brightness): t = 0 keeps it, 1 reaches the target
const mixHex = (hex, target, t) => {
  const p = (h) => { const x = h.replace('#', ''); const n = parseInt(x.length === 3 ? x.replace(/./g, '$&$&') : x, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const a = p(hex), b = p(target);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
// Brightness −1…1 → the base colour darkened toward black or lightened toward white (never all the way)
const brighten = (base, b) => (b < 0 ? mixHex(base, '#000000', -b * 0.75) : b > 0 ? mixHex(base, '#ffffff', b * 0.85) : base);
const changed = (a, b) => Object.keys({ ...a, ...b }).some((k) => !eq(a[k], b[k]));
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function load(key) {
  if (!key) return null;
  try {
    const d = JSON.parse(window.localStorage.getItem(key) || 'null');
    // Saved before the background could be changed: the old fixed grey becomes the new white default
    if (d && d.config && d.config.bg === '#f2f2f2' && !d.bgEdited) d.config.bg = '#ffffff';
    return d;
  } catch { return null; }
}
function save(key, data) {
  if (!key) return;
  try { window.localStorage.setItem(key, JSON.stringify(data)); } catch { /* storage unavailable */ }
}

export default function AvatarBuilder({
  value,
  defaultValue,
  onChange,
  size = 240,
  exportSize = 512,
  showActions = true,
  persist,
  className = '',
  backdrop = 'plain', // 'plain' | 'circle': a white circle behind the preview (and no drop shadow on it)
  template,
}) {
  // A template given inline is read now; one given as a URL is fetched (below)
  const isUrl = typeof template === 'string' && /^(https?:)?\/\/|^\//.test(template.trim());
  const fromTemplate = useRef(template != null && !isUrl ? readAvatar(template) : null).current;
  const saved = useRef(typeof window !== 'undefined' && !fromTemplate ? load(persist) : null).current;
  const startLook = useRef(fromTemplate);
  const isControlled = value != null;
  const [internal, setInternal] = useState(() => fromTemplate || { ...defaultAvatar, ...(readAvatar(defaultValue) || {}), ...saved?.config });
  const config = { ...defaultAvatar, ...(isControlled ? value : internal) };

  // Where the editor is: ['setup'] · [] (primary) · [group] · [group, item]
  const [setupDone, setSetupDone] = useState(() => !!(fromTemplate || isUrl || saved?.setupDone));
  const [path, setPath] = useState(() => (fromTemplate || isUrl || saved?.setupDone ? [] : ['setup']));
  const [phase, setPhase] = useState('idle'); // idle | exit | promote | demote | enter
  const [instance, setInstance] = useState(0);
  const [grid, setGrid] = useState(false);
  const [menu, setMenu] = useState(false); // the ⋮ menu on the default bar
  const [copied, setCopied] = useState(false);
  // Brightness over the open colour: the colour it started from (base), how far it's moved (b),
  // and the colour that produced (so an undo or a new pick resets it)
  const [bright, setBright] = useState(null);
  const brightStart = useRef(null); // the look when a slide began: one undo step per slide
  const menuRef = useRef(null);
  const [history, setHistory] = useState({ past: [], future: [] });
  // The category you last opened stays lit on the default toolbar
  const [lastTop, setLastTop] = useState('face');
  // Moving between levels: a snapshot of every bar and tray, played forward once the new level renders
  const flip = useRef(null);
  const rootRef = useRef(null);
  const pressRef = useRef(null); // the last control pressed, so a new bar can grow out of it
  const stackRef = useRef(null);
  const ghostsRef = useRef(null);
  const topRef = useRef(null); // copies that move over the bars (a tab stretching, a bar shrinking home)
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (ms, fn) => timers.current.push(setTimeout(fn, reducedMotion() ? 0 : ms));

  useEffect(() => { save(persist, { config, setupDone, bgEdited: true }); }, [persist, setupDone, JSON.stringify(config)]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Changes and history: an action is a change to how the avatar looks ---- */
  const emit = useCallback((next) => {
    if (!isControlled) setInternal(next);
    if (onChange) onChange(next, { svg: avatarToSvg(next, { size: exportSize }), document: toAvatarDocument(next), code: encodeAvatar(next) });
  }, [isControlled, onChange, exportSize]);

  // A template URL (e.g. https://avatars.paulelite.com/a/<seed>.svg): load it once, then edit from there
  useEffect(() => {
    if (!isUrl) return undefined;
    let live = true;
    loadAvatar(template).then((c) => { if (live) { startLook.current = c; emit(c); } }, () => {});
    return () => { live = false; };
  }, [isUrl ? template : null]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next) => {
    if (!changed(next, config)) return;
    setHistory((h) => ({ past: [...h.past.slice(-99), config], future: [] }));
    emit(next);
  };
  const set = (key, v) => commit({ ...config, [key]: v });
  const undo = () => {
    if (!history.past.length) return;
    setHistory((h) => ({ past: h.past.slice(0, -1), future: [config, ...h.future] }));
    emit(history.past[history.past.length - 1]);
  };
  // Back to the default look; the saved copy in this browser is cleared too (undo brings it back)
  const reset = () => {
    try { if (persist) window.localStorage.removeItem(persist); } catch { /* storage unavailable */ }
    setGrid(false);
    commit(startLook.current || { ...defaultAvatar, category: config.category, style: config.style });
  };
  // Starting over goes back to the template the editor was opened with, if any
  const edited = changed(startLook.current || { ...defaultAvatar, category: config.category, style: config.style }, config);
  const redo = () => {
    if (!history.future.length) return;
    setHistory((h) => ({ past: [...h.past, config], future: h.future.slice(1) }));
    emit(history.future[0]);
  };

  // Small features (eyes, nose, brows…) get an invisible padded hit area, so they're easy to tap
  useLayoutEffect(() => {
    const svg = avatarRef.current;
    if (!svg) return;
    svg.querySelectorAll('[data-part]:not([data-part="skin"]):not([data-part="torso"]):not([data-part="hair"]):not([data-part="cap"])').forEach((g) => {
      if (g.querySelector(':scope > [data-hit]')) return; // already padded
      const b = g.getBBox();
      if (!b.width && !b.height) return;
      const pad = 5;
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', b.x - pad); r.setAttribute('y', b.y - pad);
      r.setAttribute('width', b.width + pad * 2); r.setAttribute('height', b.height + pad * 2);
      r.setAttribute('fill', 'transparent');
      r.dataset.hit = '';
      g.insertBefore(r, g.firstChild);
    });
  });

  /* ---- Moving between levels ---- */
  const go = (next, dir) => {
    if (phase !== 'idle') return;
    setGrid(false);
    if (dir === 'tab') {
      // Same level, another item: the bar stays put, its width morphs and only its contents change
      barWidth.current = barRef.current ? barRef.current.getBoundingClientRect().width : null;
      setPath(next);
      if (next[0] === 'all' && next[1]) setLastTop(next[1] === 'features' ? 'face' : next[1]);
      setPhase('tab');
      after(MS.tab, () => setPhase('idle'));
      return;
    }
    // Every other move: snapshot the bars and trays, switch level, then FLIP each one to its new place
    if (stackRef.current && !reducedMotion()) {
      // Where the move came from: the tab (or part of the avatar) just pressed, else the focused control
      const pressed = pressRef.current && performance.now() - pressRef.current.t < 1500 ? pressRef.current.el : document.activeElement;
      const from = pressed && pressed !== document.body && rootRef.current && rootRef.current.contains(pressed) ? pressed.getBoundingClientRect() : null;
      pressRef.current = null;
      // Every tab that opens a level, so a new bar can stretch out of exactly that tab
      const opens = {};
      stackRef.current.querySelectorAll('[data-opens]').forEach((t) => { opens[t.dataset.opens] = { rect: t.getBoundingClientRect(), radius: getComputedStyle(t).borderRadius }; });
      flip.current = {
        from,
        opens,
        layers: [...stackRef.current.querySelectorAll('[data-layer]')].map((el) => ({
          key: el.dataset.layer, kind: el.dataset.kind, rect: el.getBoundingClientRect(), radius: getComputedStyle(el).borderRadius, clone: el.cloneNode(true),
        })),
      };
    }
    setPath(next);
    if (next[0] === 'all' && next[1]) setLastTop(next[1] === 'features' ? 'face' : next[1]);
    setInstance((n) => n + 1);
    setPhase('flip');
    after(MS.flip, () => setPhase('idle'));
  };
  const open = (key) => go([...path, key], 'down');
  /* Paths: ['setup'] · [] the default bar (Face · Hair · Outfit · Background · Frame) ·
     ['all', group] a category · ['all', group, item] an item ·
     Features nests one more level: ['all', 'features'] the organs · ['all', 'features', organ] · [..., organ, item] */
  const back = () => {
    if (grid) return setGrid(false);
    if (path[0] === 'setup' && !setupDone) return;
    if (!path.length) return; // the default toolbar is where closing stops
    if (path.join('/') === 'all/features') return go(['all', 'face'], 'up'); // Features lives inside Face
    if (path[0] === 'setup' || path.length <= 2) return go([], 'up');
    go(path.slice(0, -1), 'up');
  };
  // Tap a part of the avatar to jump straight to its editor (the cap → Hair · Headwear)
  const jump = (part) => {
    const target = PART_TARGETS[part];
    if (!target || path[0] === 'setup') return;
    const next = ['all', ...target];
    if (next.join('/') === path.join('/')) return setGrid(false);
    go(next, path.length ? 'swap' : 'down');
  };
  const avatarRef = useRef(null);
  // Mark the option row when it overflows, so only rows that actually scroll fade at the edge
  const tilesRef = useRef(null);
  useLayoutEffect(() => {
    const el = tilesRef.current;
    if (!el) return undefined;
    // Measure without the fade's own end padding, or it would keep itself switched on
    const check = () => { el.removeAttribute('data-overflow'); if (el.scrollWidth > el.clientWidth + 1) el.setAttribute('data-overflow', ''); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  });
  // The item toggle's pill: measured onto the chosen tab, sliding when it changes
  const segRef = useRef(null);
  const segPlaced = useRef(false);
  useLayoutEffect(() => {
    const seg = segRef.current;
    if (!seg) { segPlaced.current = false; return; }
    const on = seg.querySelector('.ab-seg-btn.on');
    const ind = seg.querySelector('.ab-seg-ind');
    if (!on || !ind) return;
    if (!segPlaced.current) ind.style.transition = 'none'; // the first placement doesn't slide in from nowhere
    ind.style.width = on.offsetWidth + 'px';
    ind.style.transform = `translateX(${on.offsetLeft - 3}px)`;
    const ghost = ind.firstChild;
    if (ghost) { ghost.style.transition = ind.style.transition; ghost.style.transform = `translateX(${3 - on.offsetLeft}px)`; }
    if (!segPlaced.current) { void ind.offsetWidth; ind.style.transition = ''; if (ghost) ghost.style.transition = ''; segPlaced.current = true; }
  });
  // Switching items keeps the bar: its width eases from the old to the new instead of jumping
  const barRef = useRef(null);
  // The white selection on the default bar is one shape that slides from tab to tab
  // (it fades in on the first pick, and out where it is when the tab is closed)
  const indRef = useRef(null);
  useLayoutEffect(() => {
    const ind = indRef.current;
    if (!ind) return;
    const tab = ind.parentElement.querySelector('.ab-cat.on');
    if (!tab) { ind.removeAttribute('data-show'); return; }
    const place = () => { ind.style.transform = `translateX(${tab.offsetLeft}px)`; ind.style.width = `${tab.offsetWidth}px`; };
    if (!ind.hasAttribute('data-show')) {
      ind.style.transition = 'none';
      place();
      void ind.offsetWidth; // commit the spot before fading in, so it appears there rather than sliding in
      ind.style.transition = '';
      ind.setAttribute('data-show', '');
    } else place();
  });
  const barWidth = useRef(null);
  useLayoutEffect(() => {
    const bar = barRef.current;
    const from = barWidth.current;
    if (!bar || from == null || phase !== 'tab') return;
    barWidth.current = null;
    const to = bar.getBoundingClientRect().width;
    if (Math.abs(to - from) < 1 || reducedMotion()) return;
    bar.animate([{ width: from + 'px' }, { width: to + 'px' }], { duration: MS.tab, easing: 'cubic-bezier(0.45, 0, 0.1, 1)' });
  });
  /* ---- Levels as layers ----------------------------------------------------
     Bars and trays carry data-layer (the level they show) and data-kind (bar | tray); a tab
     that opens a level carries data-opens (that level). Moves are snappy (no overshoot):
     · opening  1 · the new bar grows out of the pressed tab: full height first while narrow,
                    then it widens to its centred place, its unscaled contents pinned left
                    and revealed rightward (fade in, a 2px blur clearing)
                2 · then the bars below fold into the stack (or slide to their new place)
     · closing  the bar fades out at once, slipping a few px toward its parent (ease-out, 2px blur),
                while the stack unfolds back into bars over it
     · anything else (a jump from the avatar, setup) plays in one step */
  useLayoutEffect(() => {
    const snap = flip.current;
    const under = ghostsRef.current;
    const over = topRef.current;
    if (!snap || !under || !over || !stackRef.current) return;
    flip.current = null;
    under.replaceChildren();
    over.replaceChildren();
    const base = under.getBoundingClientRect();
    const ease = 'cubic-bezier(0.2, 0, 0, 1)';
    const { morph: M, fold: F } = MS;
    const box = (r) => ({ left: r.left - base.left + 'px', top: r.top - base.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    const toward = (a, b) => `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
    const ghost = (old, layer) => {
      const g = old.clone;
      g.removeAttribute('data-layer');
      g.inert = true;
      Object.assign(g.style, { position: 'absolute', margin: 0, right: 'auto', bottom: 'auto', transformOrigin: '0 0', transform: 'none', ...box(old.rect) });
      layer.appendChild(g);
      return g;
    };
    const done = (a, g) => a.finished.then(() => g.remove(), () => {});
    const fadeKids = (el, keyframes, opts) => [...el.children].forEach((c) => c.animate(keyframes, opts));
    const before = new Map(snap.layers.map((o) => [o.key, o]));
    const now = [...stackRef.current.querySelectorAll('[data-layer]')].map((el) => ({ el, key: el.dataset.layer, kind: el.dataset.kind, rect: el.getBoundingClientRect(), radius: getComputedStyle(el).borderRadius }));
    const nowKeys = new Set(now.map((n) => n.key));
    const opening = now.some((n) => n.kind === 'bar' && !before.has(n.key));
    const closing = !opening && [...before.values()].some((o) => o.kind === 'bar' && !nowKeys.has(o.key));
    // Step timing: what lands/leaves first, and what the stack does around it
    // How long a new bar takes to grow (longer bars reveal for longer); the stack waits for it
    const growFor = (w) => Math.round(Math.min(280, Math.max(M, M + (w - 360) * 0.25)));
    const newBar = now.find((n) => n.kind === 'bar' && !before.has(n.key));
    const stackAt = opening ? growFor(newBar.rect.width) : 0; // the stack moves after a new bar lands, or first when closing
    const leaveAt = 0; // a closing bar just goes, at once, while the stack unfolds over it
    const tabFor = (key) => { const t = stackRef.current.querySelector(`[data-opens="${key}"]`); return t ? { rect: t.getBoundingClientRect(), radius: getComputedStyle(t).borderRadius } : null; };
    const closingTabs = new Map([...before.values()].filter((o) => o.kind === 'bar' && !nowKeys.has(o.key)).map((o) => [o.key, tabFor(o.key)]));

    for (const n of now) {
      const { el, key, kind, rect: r } = n;
      const old = before.get(key);
      before.delete(key);
      if (!old) {
        if (kind === 'bar') {
          const from = snap.opens[key] || snap.from;
          if (from) {
            // The bar grows out of its tab without stretching its contents. A plain surface
            // (with the bar's real contents inside, unscaled and pinned to its left edge):
            //   1 · gets its full height fast while still narrow, just above the tab
            //   2 · then widens to its place, centred on the page, revealing more of
            //       the row to the right as it goes
            // Long bars take a little longer, so the reveal reads instead of whipping past.
            const fr = from.rect || from;
            const w0 = Math.min(r.width, Math.max(fr.width * 2.4, 140));
            const h0 = r.height * 0.66;
            const cx = fr.left + fr.width / 2;
            const left0 = Math.min(Math.max(cx - w0 / 2, r.left), r.right - w0);
            const at = (p) => ({ left: left0 + (r.left - left0) * p, width: w0 + (r.width - w0) * p });
            const box2 = (x, y, w, h) => ({ left: x - base.left + 'px', top: y - base.top + 'px', width: w + 'px', height: h + 'px' });
            const D = growFor(r.width);
            // Like every level, it grows out of the top of its parent bar first. When its real place
            // is lower (deeper levels take the bottom slot as the bars below fold away), it lands
            // above the parent bar, then settles down into place with the fold.
            const parent = snap.layers.find((o) => o.kind === 'bar' && fr.top >= o.rect.top - 1 && fr.bottom <= o.rect.bottom + 1);
            const landTop = parent && r.top > parent.rect.top - 8 - r.height + 1 ? parent.rect.top - 8 - r.height : r.top;
            const blob = document.createElement('div');
            blob.className = 'ab-morph';
            const inner = el.cloneNode(true);
            inner.removeAttribute('data-layer');
            inner.inert = true;
            inner.className += ' ab-morph-inner';
            Object.assign(inner.style, { width: r.width + 'px', height: r.height + 'px' });
            blob.appendChild(inner);
            over.appendChild(blob);
            const a1 = at(0.12), a2 = at(0.5);
            done(blob.animate([
              { ...box2(left0, landTop + r.height - h0, w0, h0), borderRadius: n.radius, opacity: 0, filter: 'blur(2px)', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
              { ...box2(a1.left, landTop, a1.width, r.height), opacity: 1, filter: 'blur(0)', offset: 0.3, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' },
              { ...box2(a2.left, landTop, a2.width, r.height), offset: 0.62, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
              { ...box2(r.left, landTop, r.width, r.height), borderRadius: n.radius, opacity: 1, filter: 'blur(0)' },
            ], { duration: D, fill: 'forwards' }), blob);
            // the real bar takes over once the surface has landed
            el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: D });
            // then it settles from where it landed into its place, with the fold
            if (landTop !== r.top) el.animate([{ transform: `translateY(${landTop - r.top}px)` }, { transform: 'none' }], { duration: F, delay: D, easing: ease, fill: 'backwards' });
          } else {
            el.animate([{ transform: 'translateY(8px) scale(0.97)' }, { transform: 'none' }], { duration: M, easing: ease });
            fadeKids(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 110, easing: 'ease-out' });
          }
        } else {
          el.animate([{ opacity: 0 }, { opacity: getComputedStyle(el).opacity }], { duration: 120, delay: stackAt + F - 60, easing: 'ease-out', fill: 'backwards' });
        }
      } else if (old.kind === kind) {
        if (Math.abs(old.rect.top - r.top) + Math.abs(old.rect.left - r.left) + Math.abs(old.rect.width - r.width) < 1) continue;
        el.animate([{ transformOrigin: '0 0', transform: toward(old.rect, r) }, { transformOrigin: '0 0', transform: 'none' }], { duration: F, delay: stackAt, easing: ease, fill: 'backwards' });
      } else if (kind === 'bar') {
        // Out of the stack: the bar unfolds from its tray, contents arriving as it opens
        el.animate([{ transformOrigin: '0 0', transform: toward(old.rect, r) }, { transformOrigin: '0 0', transform: 'none' }], { duration: F, delay: stackAt, easing: ease, fill: 'backwards' });
        fadeKids(el, [{ opacity: 0 }, { opacity: 1 }], { duration: F * 0.7, delay: stackAt + F * 0.1, easing: 'ease-out', fill: 'backwards' });
      } else {
        // Into the stack: a copy of the bar waits, then folds into its tray, which takes over
        const g = ghost(old, under);
        const end = getComputedStyle(el).opacity;
        el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: stackAt + F });
        fadeKids(g, [{ opacity: 1 }, { opacity: 0 }], { duration: 70, delay: stackAt, easing: 'ease-out', fill: 'both' });
        done(g.animate([{ transform: 'none', opacity: 1 }, { transform: toward(r, old.rect), opacity: end }], { duration: F, delay: stackAt, easing: ease, fill: 'both' }), g);
      }
    }
    if (opening) {
      const top = rootRef.current && rootRef.current.querySelector('.ab-dock > .ab-seg, .ab-dock > .ab-bright, .ab-dock > .ab-crumbs');
      if (top) top.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 140, delay: stackAt + F * 0.5, easing: 'ease-out', fill: 'backwards' });
    }
    for (const old of before.values()) {
      const tab = old.kind === 'bar' && closingTabs.get(old.key);
      if (tab) {
        // Closing: the bar just goes, slipping a little toward its parent (not all the way),
        // easing out as it fades with a touch of motion blur; under the stack, so bars unfolding
        // into its place draw over it
        const g = ghost(old, under);
        const drop = Math.min(10, Math.max(0, tab.rect.top - old.rect.bottom) + 6);
        // a little spring: it slips slightly past where it stops, then eases back as it vanishes
        done(g.animate([
          { transform: 'none', opacity: 1, filter: 'blur(0)' },
          { transform: `translateY(${drop * 1.25}px)`, opacity: 0.3, offset: 0.7 },
          { transform: `translateY(${drop}px)`, opacity: 0, filter: 'blur(2px)' },
        ], { duration: 120, delay: leaveAt, easing: 'ease-out', fill: 'both' }), g);
        continue;
      }
      const g = ghost(old, under);
      done(g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-out', fill: 'forwards' }), g);
    }
  });

  // A tap on a part edits that part; anywhere else on the stage edits the background
  const onStageClick = (e) => { const g = e.target.closest && e.target.closest('[data-part]'); jump(g ? g.dataset.part : 'background'); };

  const finishSetup = () => {
    setSetupDone(true);
    go([], setupDone ? 'up' : 'swap');
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { if (menu) setMenu(false); else back(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [menu]);

  /* ---- What the current level shows ---- */
  const inSetup = path[0] === 'setup';
  const isDefault = !path.length;
  const inAll = path[0] === 'all';
  const top = inAll && path[1] ? PRIMARY.find((g) => g.key === path[1]) : null;
  // A category with organs (Features) shows them first; the organ then acts as the category
  const organ = top && top.organs && path[2] ? top.organs.find((o) => o.key === path[2]) : null;
  const group = top && top.organs ? organ : top;
  const base = !group ? [] : organ ? ['all', top.key, organ.key] : ['all', top.key]; // the path to `group`
  const at = base.length; // where the item sits in the path
  const shown = group ? visibleItems(group, config) : [];
  // A category with one visible item opens that item directly
  // (a switch, like Torso's head only / with torso, always shows inline at the category level)
  const itemKey = group ? path[at] || (shown.length === 1 && ITEMS[shown[0]].kind !== 'toggle' ? shown[0] : null) : null;
  const item = itemKey ? ITEMS[itemKey] : null;
  // If an open item stops applying (e.g. hair colour after choosing no hair), step back to its category
  useEffect(() => {
    if (group && path[at] && !shown.includes(path[at]) && phase === 'idle') go(base, 'up');
  });

  const crumbs = inSetup
    ? ['Setup']
    : top && top.organs && !organ
      ? [top.label]
      : !group
        ? ['Avatar']
        : [...(organ ? [top.label] : []), group.label, ...(path[at] && item && shown.length > 1 ? [item.label] : [])];

  // An open item's siblings in its category (switches like Torso's are shown inline, not opened)
  const siblings = group && item ? shown.filter((k) => ITEMS[k].kind !== 'toggle') : [];
  // The brightness slide on the open colour, while it still describes that colour
  const brightNow = bright && bright.key === itemKey && eq(bright.value, config[itemKey]) ? bright : null;

  // The default bar (Figma 88:5720): Face · Hair · Outfit · Color, then the ⋮ menu.
  // It stays as a full bar under a category (one over the other); deeper, it folds into the stack.
  // A tab is selected only while its bar is open: nothing is selected on the bare default bar,
  // closing the bar above deselects it, and tapping the selected tab closes its bar (deselects it).
  const openTab = isDefault ? null : lastTop;
  const openTop = (key) => {
    if (inAll && path.length === 2 && path[1] === key) return back();
    go(['all', key], inAll && path.length === 2 && path[1] !== 'features' ? 'tab' : 'down');
  };
  const homeTiles = PRIMARY.filter((g) => g.bar).map((g) => (
    <button key={g.key} type="button" className={'ab-tile ab-cat' + (openTab === g.key ? ' on' : '')} onClick={() => openTop(g.key)} data-opens={'all/' + g.key} aria-label={g.label} aria-pressed={openTab === g.key}>
      <span className="ab-cat-art"><BarIcon name={g.key} on={openTab === g.key} dark color={g.key === 'frame' ? config.bg : undefined} /></span>
      <span className="ab-cat-label">{g.label}</span>
    </button>
  ));
  // Figma 88:5720: the ⋮ menu holds what used to sit on the bar (download) plus starting over
  // A link that opens this exact look in the editor, anywhere (the site reads ?avatar=)
  const copyLink = () => {
    const url = `https://avatars.paulelite.com/?avatar=${encodeAvatar(config)}`;
    try { navigator.clipboard.writeText(url).then(() => { setCopied(true); after(900, () => { setMenu(false); setCopied(false); }); }, () => {}); } catch { /* no clipboard */ }
  };
  const homeExtras = (
    <>
      <span className="ab-sep" aria-hidden="true" />
      <div className="ab-more" ref={menuRef}>
        <button type="button" className="ab-more-btn" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="More" title="More"><MoreIcon /></button>
        <div className="ab-menu" role="menu" data-open={menu || undefined} aria-hidden={!menu}>
          {showActions && (
            <button type="button" role="menuitem" tabIndex={menu ? 0 : -1} onClick={() => { setMenu(false); downloadPng(config, { size: exportSize }); }}><DownloadIcon />Download PNG</button>
          )}
          <button type="button" role="menuitem" tabIndex={menu ? 0 : -1} onClick={copyLink}><LinkIcon />{copied ? 'Link copied' : 'Copy link'}</button>
          <button type="button" role="menuitem" tabIndex={menu ? 0 : -1} disabled={!edited} onClick={() => { setMenu(false); reset(); }}><ResetIcon />Start over</button>
        </div>
      </div>
    </>
  );

  let tiles = null;
  let extras = null;
  let shapeGrid = null;

  if (inSetup) {
    tiles = SETUP.map((s) => (
      <div key={s.key} className="ab-set">
        <span className="ab-set-label">{s.label}</span>
        <div className="ab-set-options">
          {s.options.map((opt) => (
            <button key={opt} type="button" className={'ab-pill' + (eq(config[s.key], opt) ? ' on' : '')} aria-pressed={eq(config[s.key], opt)} onClick={() => set(s.key, opt)}>
              {s.names[opt] || opt}
            </button>
          ))}
        </div>
      </div>
    ));
    extras = (
      <button type="button" className="ab-continue" onClick={finishSetup}>
        {setupDone ? 'Done' : 'Customize'} <ArrowIcon />
      </button>
    );
  } else if (isDefault) {
    // The default bar is drawn on its own (homeBar, below); nothing stacks on it here
  } else if (top && top.organs && !organ) {
    // Features: the organs, each a metaphor
    tiles = top.organs.map((o) => (
      <button key={o.key} type="button" className="ab-tile ab-cat" onClick={() => open(o.key)} data-opens={[...path, o.key].join('/')} aria-label={o.label}>
        <span className="ab-cat-art"><NavIcon name={o.key} group={top.key} /></span>
        <span className="ab-cat-label">{o.label}</span>
      </button>
    ));
  } else if (!item) {
    // The category's items; a toggle (Torso) shows its two choices inline, and what it unlocks follows
    tiles = shown.map((k) => {
      const it = ITEMS[k];
      if (it.kind === 'toggle') {
        return (
          <div key={k} className="ab-toggle" role="radiogroup" aria-label={it.label}>
            {it.options.map((opt) => (
              <button key={String(opt)} type="button" role="radio" aria-checked={eq(config[k], opt)} className={'ab-pill' + (eq(config[k], opt) ? ' on' : '')} onClick={() => set(k, opt)}>
                {it.names[String(opt)]}
              </button>
            ))}
          </div>
        );
      }
      // An item that's currently off (no glasses, no blush…) shows its icon faded
      const off = config[k] === null || config[k] === 'none';
      return (
        <button key={k} type="button" className="ab-tile ab-cat" onClick={() => open(k)} data-opens={[...path, k].join('/')} aria-label={it.label}>
          <span className="ab-cat-art" style={off ? { opacity: 0.4 } : undefined}>
            <NavIcon name={k} group={group.key} wheel={it.kind === 'color' && !it.optional} color={config[k]} />
          </span>
          <span className="ab-cat-label">{it.label}</span>
        </button>
      );
    });
    // Features (eyes, mouth, nose…) opens from inside Face
    if (group.key === 'face') {
      tiles.push(
        <button key="features" type="button" className="ab-tile ab-cat" onClick={() => go(['all', 'features'], 'down')} data-opens="all/features" aria-label="Features">
          <span className="ab-cat-art"><NavIcon name="features" /></span>
          <span className="ab-cat-label">Features</span>
        </button>,
      );
    }
  } else {
    const opts = item.kind === 'color' ? (item.optional ? [null, ...item.presets] : item.presets) : item.options;
    // Colour chips and skin heads take the dark selected tile; items (mostly black) a light one with a ring
    const isSwatch = ['skin', 'bg', 'blush', 'tears'].includes(itemKey) || (itemKey === 'hairColor' && config.hair === 'none');
    const optionTile = (opt, { inGrid = false } = {}) => {
      // A brightened colour keeps its swatch marked
      const on = eq(config[itemKey], opt) || (!!brightNow && brightNow.b !== 0 && eq(brightNow.base, opt));
      const label = opt === null ? 'None' : opt === true ? 'On' : opt === false ? 'Off' : String(opt);
      if (item.kind === 'color' && !inGrid) {
        // the brightened swatch shows its colour as it is now
        const shown = on && brightNow && eq(brightNow.base, opt) ? config[itemKey] : opt;
        return (
          <button key={String(opt)} type="button" className="ab-swatch" aria-pressed={on} aria-label={label} title={label} onClick={() => set(itemKey, opt)}>
            <ColourDot color={shown} on={on} />
          </button>
        );
      }
      return (
        <button
          key={String(opt)}
          type="button"
          className={'ab-tile' + (on ? ' on' : '')}
          data-kind={isSwatch ? 'swatch' : 'item'}
          aria-pressed={on}
          aria-label={label}
          title={label}
          tabIndex={inGrid && !grid ? -1 : undefined}
          onClick={() => { set(itemKey, opt); if (inGrid) setGrid(false); }}
        >
          {/* the brightened swatch shows its colour as it is now */}
          <Face item={itemKey} config={{ ...config, [itemKey]: on && brightNow && eq(brightNow.base, opt) ? config[itemKey] : opt }} />
        </button>
      );
    };
    tiles = opts.map((opt) => optionTile(opt));
    // A long row of shapes scrolls, and can expand into a grid of every option
    if (item.kind === 'shape' && opts.length > SHAPE_ROW) {
      extras = (
        <button type="button" className="ab-tile ab-grid-btn" onClick={() => setGrid((g) => !g)} aria-label={`All ${item.label.toLowerCase()} options`} aria-expanded={grid} data-open={grid || undefined}>
          <ExpandIcon />
        </button>
      );
      shapeGrid = opts.map((opt) => optionTile(opt, { inGrid: true }));
    }
    if (item.kind === 'color') {
      extras = (
        <button type="button" className="ab-tile ab-grid-btn" onClick={() => setGrid((g) => !g)} aria-label="All colours" aria-expanded={grid} data-open={grid || undefined}>
          <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
            {['#ff4f4e', '#ffb900', '#00cc1a', '#1084fe', '#8b5cf6', '#f70492', '#d9d9d7', '#444755', '#1a1a1a'].map((f, i) => (
              <rect key={i} x={14 + (i % 3) * 7} y={14 + Math.floor(i / 3) * 7} width="6" height="6" rx="2" fill={f} />
            ))}
          </svg>
        </button>
      );
    }
  }

  // Levels below the current one, shown as the stack behind the toolbar
  // The default bar is the floor: nothing under it, no ×. Everything else stacks on top of it.
  const depth = inSetup ? (setupDone ? 1 : 0) : isDefault ? 0 : path.length - 1;
  const canClose = depth > 0;
  // The levels under this one, nearest first, ending at the default bar ('home'), as back() walks them.
  // One level under: it stays a full bar, one over the other. Two or more: they fold into trays (two show).
  const parentOf = (p) => (p.join('/') === 'all/features' ? ['all', 'face'] : p.length <= 2 ? [] : p.slice(0, -1));
  const below = [];
  if (inAll) for (let p = parentOf(path); ; p = parentOf(p)) { below.push(p.length ? p.join('/') : 'home'); if (!p.length) break; }
  const homeShown = isDefault || below.length === 1;
  const trays = below.length >= 2 ? below.slice(0, 2) : [];
  const levelKey = isDefault ? 'home' : path.join('/');
  // The preview centres the head itself (its silhouette spans x 33–177, y 3.5–160), not head + shadow;
  // with a torso it stays centred left–right and keeps the body in frame. Exports keep the full views.
  // On the framed backdrop the avatar sits in a shape (no shadow); 'full' drops the shape (shadow on).
  // The page behind stays light grey at all times; the colour only fills the shape (and the download).
  // Always the round background on the circle backdrop, whatever frame an older saved look has
  const framed = backdrop === 'circle';
  const view = config.torso ? '-23.5 -16 257 257' : '10.5 -12.85 189 189';

  return (
    <div
      ref={rootRef}
      onPointerDownCapture={(e) => { const t = e.target.closest && e.target.closest('button, [data-part]'); pressRef.current = t ? { el: t, t: performance.now() } : null; }}
      className={('ab-root ' + className).trim()} style={framed ? { '--ab-fill': config.bg } : backdrop === 'circle' ? undefined : { '--ab-bg': config.bg }} data-grid={grid || undefined} data-backdrop={backdrop} data-frame={backdrop === 'circle' ? 'circle' : undefined}>
      <div className="ab-ghosts" ref={ghostsRef} aria-hidden="true" />
      <div className="ab-ghosts ab-ghosts-top" ref={topRef} aria-hidden="true" />
      {setupDone && !inSetup && (
        <button type="button" className="ab-setup-chip" onClick={() => go(['setup'], 'down')} aria-label="Change category and style">
          {SETUP.map((s) => s.names[config[s.key]] || config[s.key]).join(' · ')}
        </button>
      )}

      {!inSetup && (
        <button type="button" className="ab-reset" data-show={edited || undefined} onClick={reset} tabIndex={edited ? 0 : -1} aria-label="Reset to the default avatar" title="Reset to the default avatar">
          Reset
        </button>
      )}

      <div className="ab-stage" onClick={onStageClick} data-tappable={!inSetup || undefined}>
        <svg
          viewBox={view}
          width={size}
          height={size}
          role="img"
          aria-label="Avatar preview"
          className="ab-avatar"
          ref={avatarRef}
          data-tappable={!inSetup || undefined}
          dangerouslySetInnerHTML={{ __html: innerSvg(framed ? { ...config, shadow: false } : config, { id: 'preview', parts: true }) }}
        />
      </div>

      <div className="ab-dock">
        {item && item.kind === 'color' ? (
          // Colours: a brightness slider over the chosen colour, in place of the item switcher
          (() => {
            const cur = config[itemKey];
            const base = brightNow ? brightNow.base : cur;
            const b = brightNow ? brightNow.b : 0;
            const slide = (v) => {
              if (!base) return;
              const nb = Math.max(-1, Math.min(1, v));
              const next = { ...config, [itemKey]: brighten(base, nb) };
              if (brightStart.current && !brightStart.current.recorded) {
                const from = brightStart.current.config;
                brightStart.current.recorded = true;
                setHistory((h) => ({ past: [...h.past.slice(-99), from], future: [] }));
              }
              setBright({ key: itemKey, base, b: nb, value: next[itemKey] });
              emit(next);
            };
            const begin = () => { brightStart.current = { config, recorded: false }; };
            return (
              <div className="ab-bright" role="group" aria-label="Brightness" data-off={!base || undefined}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={Math.round(b * 100)}
                  disabled={!base}
                  aria-label="Brightness"
                  aria-valuetext={b === 0 ? 'Original' : `${b > 0 ? 'Lighter' : 'Darker'} ${Math.abs(Math.round(b * 100))}%`}
                  style={base ? { '--lo': brighten(base, -1), '--mid': base, '--hi': brighten(base, 1) } : undefined}
                  onPointerDown={begin}
                  onFocus={begin}
                  onChange={(e) => slide(Number(e.target.value) / 100)}
                  onDoubleClick={() => { begin(); slide(0); }}
                />
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
            );
          })()
        ) : siblings.length > 1 ? (
          // Inside an item: a toggle of the category's items, to switch straight between them
          <div className="ab-seg" role="tablist" aria-label={group.label} ref={segRef}>
            {/* One dark pill that slides to the chosen item, rather than two crossfading */}
            <span className="ab-seg-ind" aria-hidden="true">
              {/* White copies of the labels ride inside the pill, so text is legible at every frame of the slide */}
              <span className="ab-seg-ghost">
                {siblings.map((k) => <span key={k} className="ab-seg-btn">{ITEMS[k].label}</span>)}
              </span>
            </span>
            {siblings.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={k === itemKey}
                className={'ab-seg-btn' + (k === itemKey ? ' on' : '')}
                onClick={() => k !== itemKey && go([...base, k], 'tab')}
              >
                {ITEMS[k].label}
              </button>
            ))}
          </div>
        ) : crumbs.length > 1 && (
          // Only when there's a trail to show (Features · Eyes); a lone label would read as a switch with nothing to switch
          <div className="ab-crumbs" aria-live="polite">
            {crumbs.map((c, i) => (
              <span key={i} className={i === crumbs.length - 1 ? 'ab-crumb-now' : undefined}>{c}</span>
            ))}
          </div>
        )}

        <div className="ab-stack" ref={stackRef}>
          {trays.map((k, i) => (
            <span key={k} className="ab-peek" data-layer={k} data-kind="tray" data-dark={k === 'home' ? '' : undefined} style={{ '--depth': i + 1 }} aria-hidden="true" />
          ))}

          {shapeGrid && (
            <div className="ab-grid ab-grid-items" data-open={grid || undefined} role="dialog" aria-label={`All ${item.label.toLowerCase()} options`} aria-hidden={!grid}>
              {shapeGrid}
            </div>
          )}

          {item && item.kind === 'color' && (
            <div className="ab-grid" data-open={grid || undefined} role="dialog" aria-label="Colour grid" aria-hidden={!grid}>
              {GRID.map((row, r) => (
                <div key={r} className="ab-grid-row">
                  {row.map((fill) => (
                    <button
                      key={fill + r}
                      type="button"
                      className="ab-cell"
                      style={{ background: fill }}
                      data-on={eq(config[itemKey], fill) || undefined}
                      aria-label={fill}
                      tabIndex={grid ? 0 : -1}
                      onClick={() => { set(itemKey, fill); setGrid(false); }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {!isDefault && <div className="ab-bar" ref={barRef} key={instance} data-layer={levelKey} data-kind="bar" data-phase={phase} data-level={inSetup ? 'setup' : isDefault ? 'default' : item ? 'item' : 'category'} role="toolbar" aria-label={crumbs.join(' · ')}>
            {!inSetup && !homeShown && <div className="ab-history">
              <button type="button" className="ab-icon ab-hist-btn" onClick={undo} disabled={!history.past.length} aria-label="Undo" title="Undo"><HistoryIcon mirrored /></button>
              <button type="button" className="ab-icon ab-hist-btn" onClick={redo} disabled={!history.future.length} aria-label="Redo" title="Redo"><HistoryIcon /></button>
            </div>}
            <div className="ab-tiles" ref={tilesRef} data-long={shapeGrid ? '' : undefined} data-swatches={item && item.kind === 'color' ? '' : undefined}>
              {tiles}
            </div>
            {extras}
            {canClose && (
              <>
                <span className="ab-sep ab-sep-close" aria-hidden="true" />
                <button type="button" className="ab-bar-close" onClick={back} aria-label="Close" title="Close"><CloseIcon /></button>
              </>
            )}
          </div>}
          {homeShown && (
            <div className="ab-bar" data-layer="home" data-kind="bar" data-level="default" data-under={!isDefault || undefined} role="toolbar" aria-label="Avatar">
              <div className="ab-history">
                <button type="button" className="ab-icon ab-hist-btn" onClick={undo} disabled={!history.past.length} aria-label="Undo" title="Undo"><HistoryIcon mirrored /></button>
                <button type="button" className="ab-icon ab-hist-btn" onClick={redo} disabled={!history.future.length} aria-label="Redo" title="Redo"><HistoryIcon /></button>
              </div>
              <span className="ab-sep" aria-hidden="true" />
              <div className="ab-tiles ab-home-tiles"><span className="ab-cat-ind" ref={indRef} aria-hidden="true" />{homeTiles}</div>
              {homeExtras}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
