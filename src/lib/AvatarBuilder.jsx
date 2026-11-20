import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import {
  SETUP, PRIMARY, ITEMS, ITEM_VIEWS, VIEWS,
  defaultAvatar, innerSvg, itemSvg, headSwatchSvg, avatarToSvg, STYLE_LOOK,
} from './avatar.js';
import { downloadPng } from './export.js';
import { readAvatar, loadAvatar, toAvatarDocument, encodeAvatar } from './document.js';
import { NavIcon, BarIcon, ColourDot, HairIcon, hasHairIcon } from './icons.jsx';
import { visibleSections, visibleMore, optionsFor, TARGETS, parentOf } from './sections.js';

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
// rise: a new bar coming up from behind the one under it · fold: the stack moving around it ·
// sink: a closing bar dropping back behind its parent
// grow: a new bar growing in place (height, then width) · fold: the stack moving around it ·
// sink: a closing bar dropping back · step: the gap between one bar's move and the next
// (the stack moves one bar at a time, as in the article). flip: how long a level change holds the bars
const MS = { tab: 150, grow: 440, reveal: 300, fold: 220, sink: 170, open: 180, close: 170, flip: 820 };

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
    case 'body': return <ItemArt part="body" config={{ ...config, outfitColor: '#d9d9d7', outfit: 'tee', pattern: 'none', detail: 'none' }} size={size} />;
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
  // The tab chosen in each category bar (Hair: Style or Wear), kept while you move around
  const [sec, setSec] = useState({ face: 'head', hair: 'hair', outfit: 'outfit', features: 'eyes', frame: 'bg' });
  // A colour bar showing shades of one colour instead of its presets: { key, base }
  const [shades, setShades] = useState(null);
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
    svg.querySelectorAll('[data-part]:not([data-part="skin"]):not([data-part="torso"]):not([data-part="hair"]):not([data-part="beard"]):not([data-part="cap"])').forEach((g) => {
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
    // A level change can be interrupted (× on a bar that's still arriving sends it straight back);
    // switching tabs can't, it's too short to matter
    if (phase !== 'idle' && !(phase === 'flip' && dir !== 'tab')) return;
    if (phase === 'flip') {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      if (stackRef.current) stackRef.current.getAnimations({ subtree: true }).forEach((a) => a.finish());
      if (ghostsRef.current) ghostsRef.current.replaceChildren();
      if (topRef.current) topRef.current.replaceChildren();
    }
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
    if (stackRef.current) {
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
    if (path[0] === 'setup') return go([], 'up');
    go(parentOf(path), 'up');
  };
  // A tab in a category bar: on the top bar it swaps the options in place; on a bar under the
  // top one it closes what's above and shows that tab
  const switchTab = (cat, key) => {
    if (phase !== 'idle') return;
    if (path.length === 2 && path[1] === cat) {
      if (sec[cat] === key) return;
      barWidth.current = barRef.current ? barRef.current.getBoundingClientRect().width : null;
      setSec((x) => ({ ...x, [cat]: key }));
      setPhase('tab');
      after(MS.tab, () => setPhase('idle'));
      return;
    }
    setSec((x) => ({ ...x, [cat]: key }));
    go(['all', cat], 'up');
  };
  // Tap a part of the avatar to open its bar (the cap → Hair, on Wear)
  const jump = (part) => {
    const t = TARGETS[part];
    if (!t || path[0] === 'setup') return;
    const [cat, tab, k] = t;
    setSec((x) => ({ ...x, [cat]: tab }));
    const next = ['all', cat, ...(k ? [k] : [])];
    if (next.join('/') === path.join('/')) return setGrid(false);
    go(next, path.length ? 'swap' : 'down');
  };
  const avatarRef = useRef(null);
  // Mark rows that overflow, so only rows that actually scroll fade at the edge
  useLayoutEffect(() => {
    const root = stackRef.current;
    if (!root) return undefined;
    // Measure without the fade's own end padding, or it would keep itself switched on
    const check = () => root.querySelectorAll('.ab-tiles, .ab-opts').forEach((el) => { el.removeAttribute('data-overflow'); if (el.scrollWidth > el.clientWidth + 1) el.setAttribute('data-overflow', ''); });
    check();
    // A row that scrolls opens scrolled to what's chosen (the lit tile on a bar under the top one)
    root.querySelectorAll('.ab-tiles[data-overflow], .ab-opts[data-overflow]').forEach((el) => {
      const bar = el.closest('.ab-bar');
      const mark = bar && bar.dataset.layer + (bar.hasAttribute('data-muted') ? ':m' : '');
      if (!bar || el.dataset.placed === mark) return;
      el.dataset.placed = mark;
      const on = el.querySelector(bar.hasAttribute('data-muted') ? '.ab-cat.on' : '[aria-pressed="true"], .ab-tab.on') || el.querySelector('[aria-pressed="true"]');
      if (!on) return;
      const a = on.getBoundingClientRect(), r = el.getBoundingClientRect();
      if (a.left >= r.left && a.right <= r.right - 24) return;
      el.scrollLeft += a.left - r.left - (r.width - a.width) / 2;
    });
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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
  // Each bar's own width, so a bar folded into the tray keeps its width (inset a little), instead of
  // taking the width of the bar it hangs under
  const barWidths = useRef({});
  useLayoutEffect(() => {
    if (!stackRef.current) return;
    stackRef.current.querySelectorAll('[data-layer][data-kind="bar"]').forEach((el) => {
      if (el.getAnimations().length) return; // mid-move widths aren't its own
      barWidths.current[el.dataset.layer] = el.offsetWidth;
    });
  });
  useLayoutEffect(() => {
    const bar = barRef.current;
    const from = barWidth.current;
    if (!bar || from == null || phase !== 'tab') return;
    barWidth.current = null;
    const to = bar.getBoundingClientRect().width;
    if (Math.abs(to - from) < 1 || reducedMotion()) return;
    bar.animate([{ width: from + 'px' }, { width: to + 'px' }], { duration: MS.tab, easing: 'cubic-bezier(0.45, 0, 0.1, 1)' });
  });
  /* ---- Levels as layers (Figma 113:9122) ------------------------------------
     Bars and trays carry data-layer (the level they show) and data-kind (bar | tray).
     · opening  the new bar rises from behind the bar under it, sliding its options in from
                beneath (a touch of spring, a 2px blur clearing). At the same time the stack
                makes room: the bar it came from slides down into the stack, drawn but muted,
                and the one under that folds into the tray.
     · closing  the bar sinks back behind the bar under it as it fades (ease-out, 2px blur),
                while the stack rises back into place over it
     · anything else (a jump from the avatar, setup) plays the same pieces at once */
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
    const spring = 'cubic-bezier(0.3, 1.2, 0.45, 1)';
    const { grow: G, reveal: RV, fold: F, sink: S } = MS;
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
    const now = [...stackRef.current.querySelectorAll('[data-layer]')].map((el) => ({ el, key: el.dataset.layer, kind: el.dataset.kind, rect: el.getBoundingClientRect() }));
    const nowMap = new Map(now.map((n) => [n.key, n]));
    // Reduced motion: no rising, sliding, scaling or blur; bars that arrive fade in, bars that leave fade out
    if (reducedMotion()) {
      for (const n of now) if (!before.has(n.key)) n.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'ease-out' });
      for (const old of before.values()) if (!nowMap.has(old.key)) { const g = ghost(old, under); done(g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: 'ease-out', fill: 'forwards' }), g); }
      return;
    }
    // The level a bar sits on, by layer key ('all/hair/hairColor' → 'all/hair' → 'home')
    const parentKey = (key) => { const p = parentOf(key.split('/')); return p.length ? p.join('/') : 'home'; };

    /* One bar at a time (the article's rule) when opening: the bar under folds into the tray, then the
       bar you came from slides down, then the new bar grows. Closing starts on the press: the bar sinks
       as the one under it rises back, then the tray unfolds. A step that has nothing to move is skipped. */
    const barsNow = now.filter((n) => n.kind === 'bar');
    const barsBefore = snap.layers.filter((o) => o.kind === 'bar');
    const added = barsNow.some((n) => !before.has(n.key));
    const removed = barsBefore.some((o) => !nowMap.has(o.key));
    const opening = added && !removed;
    const closing = removed && !added;
    const moved = (n) => { const o = before.get(n.key); return o && o.kind === n.kind && Math.abs(o.rect.top - n.rect.top) + Math.abs(o.rect.left - n.rect.left) + Math.abs(o.rect.width - n.rect.width) >= 1; };
    const folds = now.some((n) => { const o = before.get(n.key); return o && o.kind === 'bar' && n.kind === 'tray'; });
    const slides = now.some(moved);
    const T = { fold: 0, slide: 0, grow: 0, sink: 0, unfold: 0 };
    if (opening) {
      T.slide = folds ? MS.open : 0;
      T.grow = T.slide + (slides ? MS.open : folds ? MS.open : 0);
    } else if (closing) {
      // Closing answers the press at once: the bar under it rises back while the closed one sinks,
      // then the tray unfolds
      T.slide = 0;
      T.unfold = slides ? MS.close : 0;
    }

    for (const n of now) {
      const { el, key, kind, rect: r } = n;
      const old = before.get(key);
      before.delete(key);
      if (!old) {
        if (kind === 'bar') {
          // Grows from two thirds of its size, out of the control that opened it: full height first, then full width. The surface is a plain copy of the bar's skin (so nothing is squashed);
          // the bar itself appears when the surface is full size, its options sliding up one by one
          // It starts at about two thirds of its size (never from nothing), reaches full height, then full width.
          // It grows out of what opened it: the tab that opens this bar, else the control pressed, else its centre
          const k = 0.66;
          const src = (snap.opens[key] && snap.opens[key].rect) || snap.from;
          const ox = src ? Math.min(r.right, Math.max(r.left, src.left + src.width / 2)) : r.left + r.width / 2;
          const oy = src ? src.top + src.height / 2 : r.top + r.height / 2;
          const r0 = { left: ox + (r.left - ox) * k, top: oy + (r.top - oy) * k, width: r.width * k, height: r.height * k };
          const r1 = { left: r0.left, top: r.top, width: r0.width, height: r.height };
          const surf = document.createElement('div');
          surf.className = 'ab-morph';
          surf.style.borderRadius = getComputedStyle(el).borderRadius;
          Object.assign(surf.style, box(r0));
          over.appendChild(surf);
          const grow = surf.animate([
            { ...box(r0) },
            { ...box(r1), offset: 0.42 },
            { ...box(r) },
          ], { duration: G, delay: T.grow, easing: ease, fill: 'both' });
          grow.finished.then(() => surf.remove(), () => surf.remove());
          el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: T.grow + G, fill: 'backwards' });
          [...el.querySelectorAll('.ab-tiles > .ab-opts > *, .ab-tiles > :not(.ab-opts), .ab-bar-close, .ab-sep-close')].forEach((c, i) => c.animate(
            [{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
            { duration: 190, delay: T.grow + RV + Math.min(i, 10) * 12, easing: ease, fill: 'backwards' },
          ));
          // The category's tabs arrive last, once there's a bar for them to sit on
          const pill = el.previousElementSibling && el.previousElementSibling.classList.contains('ab-pill-wrap') ? el.previousElementSibling : null;
          if (pill) {
            pill.getAnimations().forEach((a) => a.cancel());
            pill.animate([{ opacity: 0, transform: 'translateY(4px) scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: T.grow + G - 60, easing: ease, fill: 'backwards' });
          }
        } else {
          el.animate([{ opacity: 0 }, { opacity: getComputedStyle(el).opacity }], { duration: 140, delay: (closing ? T.unfold : T.fold) + F - 80, easing: 'ease-out', fill: 'backwards' });
        }
      } else if (old.kind === kind) {
        if (Math.abs(old.rect.top - r.top) + Math.abs(old.rect.left - r.left) + Math.abs(old.rect.width - r.width) < 1) continue;
        el.animate([{ transformOrigin: '0 0', transform: toward(old.rect, r) }, { transformOrigin: '0 0', transform: 'none' }], { duration: F, delay: T.slide, easing: ease, fill: 'backwards' });
      } else if (kind === 'bar') {
        // Out of the stack: the bar unfolds from its tray, contents arriving as it opens; it stays
        // behind the bar above until it has landed (it comes out from under it)
        el.style.zIndex = '-1';
        el.animate([{ transformOrigin: '0 0', transform: toward(old.rect, r) }, { transformOrigin: '0 0', transform: 'none' }], { duration: F, delay: T.unfold, easing: ease, fill: 'backwards' })
          .finished.then(() => { el.style.zIndex = ''; }, () => { el.style.zIndex = ''; });
        fadeKids(el, [{ opacity: 0 }, { opacity: 1 }], { duration: F * 0.7, delay: T.unfold + F * 0.1, easing: 'ease-out', fill: 'backwards' });
      } else {
        // Into the stack: a copy of the bar folds into its tray, which takes over
        const g = ghost(old, under);
        const end = getComputedStyle(el).opacity;
        el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: T.fold + F });
        fadeKids(g, [{ opacity: 1 }, { opacity: 0 }], { duration: 70, delay: T.fold, easing: 'ease-out', fill: 'both' });
        done(g.animate([{ transform: 'none', opacity: 1 }, { transform: toward(r, old.rect), opacity: end }], { duration: F, delay: T.fold, easing: ease, fill: 'both' }), g);
      }
    }
    for (const old of before.values()) {
      const g = ghost(old, under);
      if (old.kind === 'bar') {
        // Closing: it sinks back behind the bar it sits on (under the stack, so that bar draws over it)
        const p = nowMap.get(parentKey(old.key));
        const dy = p ? Math.max(8, Math.min(40, p.rect.top + 8 - old.rect.top)) : 10;
        done(g.animate([
          { transform: 'none', opacity: 1, filter: 'blur(0)' },
          { transform: `translateY(${dy * 0.7}px) scale(0.97)`, opacity: 0.4, offset: 0.6 },
          { transform: `translateY(${dy}px) scale(0.95)`, opacity: 0, filter: 'blur(2px)' },
        ], { duration: S, easing: 'ease-out', fill: 'both' }), g);
        continue;
      }
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
    const onKey = (e) => {
      if (e.key === 'Escape') { if (menu) setMenu(false); else back(); return; }
      // Undo / redo from anywhere, since deeper bars don't carry the buttons (⌘Z, ⇧⌘Z, Ctrl+Y)
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    };
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
  const levelKey = isDefault ? 'home' : path.join('/');
  // A level: a category bar (its tabs, the tab's options, tiles to go further) or one item's bar
  const describe = (p) => {
    if (p[0] !== 'all' || !p[1]) return null;
    const cat = p[1];
    const sections = visibleSections(cat, config);
    const s = sections.find((x) => x.key === sec[cat]) || sections[0];
    if (p.length === 2) return { kind: 'cat', cat, sections, s };
    return { kind: 'item', cat, s, k: p[2] };
  };
  const level = describe(path);
  // If an open item stops applying (hair colour after choosing no hair), step back to its category
  useEffect(() => {
    if (!level || level.kind !== 'item' || phase !== 'idle') return;
    if (!level.s || !visibleMore(level.s, config).includes(level.k)) go(['all', level.cat], 'up');
  });
  // The colour the top bar edits (for its grid), if it's a colour bar
  const colourKey = level ? (level.kind === 'item' ? (ITEMS[level.k] && ITEMS[level.k].kind === 'color' ? level.k : null) : (level.sections.length === 1 && ITEMS[level.s.item].kind === 'color' ? level.s.item : null)) : null;
  const shapeKey = level && level.kind === 'item' && ITEMS[level.k] && ITEMS[level.k].kind === 'shape' ? level.k : null;
  const crumbs = inSetup ? ['Setup'] : !level ? ['Avatar'] : [PRIMARY.find((g) => g.key === level.cat)?.label || 'Features', ...(level.kind === 'item' ? [ITEMS[level.k].label] : [level.s.label])];

  // The default bar (Figma 88:5720): Face · Hair · Outfit · Color, then the ⋮ menu.
  // It stays as a full bar under a category (one over the other); deeper, it folds into the tray.
  // A tab is selected only while its bar is open: nothing is selected on the bare default bar,
  // closing the bar above deselects it, and tapping the selected tab closes its bar (deselects it).
  const openTab = isDefault ? null : lastTop;
  const openTop = (key) => {
    if (inAll && path.length === 2 && path[1] === key) return back();
    if (inAll && lastTop === key) return go(['all', key], 'up'); // its bar is open under something: back to it
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

  /* ---- Pieces of a bar ---- */
  const live = (top) => (top ? undefined : -1); // controls on a muted bar stay clickable, but out of the tab order
  // One option: the item itself, drawn for this config
  // The grey an option is drawn in until it's chosen
  const UNPICKED = '#9ea1a9';
  const optionTile = (k, opt, { on, pick, inGrid = false, top = true, art }) => {
    const label = opt === null ? 'None' : opt === true ? 'On' : opt === false ? 'Off' : String(opt);
    return (
      <button
        key={String(opt)}
        type="button"
        className={'ab-tile' + (on ? ' on' : '')}
        data-kind="item"
        aria-pressed={on}
        aria-label={label}
        title={label}
        tabIndex={inGrid && !grid ? -1 : live(top)}
        onClick={() => { pick(opt); if (inGrid) setGrid(false); }}
      >
        {art || <Face item={k} config={{ ...config, [k]: opt }} />}
      </button>
    );
  };
  // One colour: a round patch; the chosen one wears the white hub
  const swatch = (k, opt, top) => {
    const on = eq(config[k], opt);
    const label = opt === null ? 'None' : String(opt);
    return (
      <button key={String(opt)} type="button" className="ab-swatch" aria-pressed={on} aria-label={label} title={label} tabIndex={live(top)} onClick={() => set(k, opt)}>
        <ColourDot color={opt} on={on} />
      </button>
    );
  };
  // Shades of one colour, darkest to lightest (the colour itself in the middle)
  const shadesOf = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    const sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    const h = !d ? 0 : mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
    const steps = [0.12, 0.22, 0.32, 0.42, 0.54, 0.66, 0.78, 0.9].map((L) => hsl((h + 360) % 360, Math.min(100, sat * 100), L));
    // the colour itself takes the nearest step, so it's always in the row
    let near = 0;
    steps.forEach((_, i) => { if (Math.abs([0.12, 0.22, 0.32, 0.42, 0.54, 0.66, 0.78, 0.9][i] - l) < Math.abs([0.12, 0.22, 0.32, 0.42, 0.54, 0.66, 0.78, 0.9][near] - l)) near = i; });
    steps[near] = hex.toLowerCase();
    return steps;
  };
  const Cluster = ({ fills }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      {fills.slice(0, 7).map((f, i) => {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={14 + Math.cos(a) * 8.5} cy={14 + Math.sin(a) * 8.5} r="3.6" fill={f} />;
      })}
    </svg>
  );
  // A colour bar: shades of the current colour and the full grid on the left, then the colours
  const colourTiles = (k, top) => {
    const it = ITEMS[k];
    const cur = config[k];
    const mode = shades && shades.key === k ? shades : null;
    const list = mode ? shadesOf(mode.base) : [...(it.optional && k !== 'cap' ? [null] : []), ...it.presets];
    const shadeBase = cur || it.presets[0];
    return [
      <button key="shades" type="button" className="ab-tile ab-tool" data-open={mode || undefined} aria-pressed={!!mode} aria-label="Shades of this colour" title="Shades of this colour" tabIndex={live(top)} onClick={() => setShades(mode ? null : { key: k, base: shadeBase })}>
        <Cluster fills={shadesOf(shadeBase).slice(0, 7)} />
      </button>,
      <button key="all" type="button" className="ab-tile ab-tool" data-open={(top && grid) || undefined} aria-label="All colours" aria-expanded={top && grid} title="All colours" tabIndex={live(top)} onClick={() => { if (top) setGrid((g) => !g); }}>
        {/* Every colour: one continuous spectrum. A ring of single colours (the shades button) is one palette */}
        <span className="ab-spectrum" aria-hidden="true" />
      </button>,
      <span key="sep" className="ab-sep ab-sep-close" aria-hidden="true" />,
      ...list.map((o) => swatch(k, o, top)),
    ];
  };
  // A row of shapes for an item
  const shapeTiles = (k, top) => ITEMS[k].options.map((o) => optionTile(k, o, { on: eq(config[k], o), pick: (v) => set(k, v), top }));
  // A tile that opens a bar above (a colour, the finer items, Features); lit while that bar is open
  // bare: the bar's own options are unlabelled icons, so its tiles (Colour…) drop their label to match
  const moreTile = (cat, k, top, bare = false) => {
    const target = k === 'features' ? ['all', 'features'] : ['all', cat, k];
    const on = path.join('/') === target.join('/') || (k === 'features' && path[1] === 'features');
    const it = ITEMS[k];
    const wheel = it && it.kind === 'color' && (!it.optional || k === 'cap');
    const label = k === 'features' ? 'Features' : wheel ? 'Colour' : it.label;
    const off = it && (config[k] === null || config[k] === 'none');
    return (
      <button key={k} type="button" className={'ab-tile ab-cat' + (on ? ' on' : '')} data-bare={bare || undefined} data-opens={target.join('/')} aria-label={k === 'features' ? 'Features' : it.label} aria-expanded={on} tabIndex={live(top)}
        onClick={() => (on ? go(['all', cat], 'up') : go(target, path.length > 2 || path[1] === 'features' ? 'swap' : 'down'))}>
        <span className="ab-cat-art" style={off ? { opacity: 0.4 } : undefined}>
          <NavIcon name={k} group={cat} wheel={wheel} color={config[k]} />
        </span>
        {!bare && <span className="ab-cat-label">{label}</span>}
      </button>
    );
  };
  // A level's main row: what it sets, its options, which is on, and what picking one does
  const mainRow = (d) => {
    if (d.kind === 'item') {
      const k = d.k;
      return ITEMS[k].kind === 'color' ? { colour: k } : { k, options: ITEMS[k].options, isOn: (v) => eq(config[k], v), pick: (v) => set(k, v) };
    }
    const { sections, s } = d;
    if (sections.length === 1 && ITEMS[s.item].kind === 'color') return { colour: s.item }; // Frame: just its colour
    const o = optionsFor(s, config);
    if (o.colour) return { swatches: s.item, options: o.options };
    return {
      k: s.item,
      options: o.options,
      isOn: (v) => eq(o.value, v),
      pick: (v) => commit({ ...config, ...o.pick(v) }),
      // Only the chosen option wears the colour (the hair, the hat, the outfit); the rest are drawn in grey
      art: (v, on) => {
        if (v === null) return <None />;
        const tint = (c) => (on ? c : UNPICKED);
        if (s.item === 'hair') return hasHairIcon(v) ? <HairIcon style={v} color={tint(config.hairColor)} /> : <Face item="hair" config={{ ...config, hair: v, hairColor: tint(config.hairColor) }} />;
        if (s.item === 'beard') return <Face item="beard" config={{ ...config, beard: v, hairColor: tint(config.hairColor) }} />;
        if (s.key === 'wear') return <Face item="hat" config={{ ...config, cap: tint(config.cap || '#1a1a1a'), hat: v }} />;
        if (s.key === 'outfit') return <Face item="outfit" config={{ ...config, torso: true, outfit: v, outfitColor: tint(config.outfitColor) }} />;
        if (s.item === 'pattern') return v === 'none' ? <None /> : <Face item="pattern" config={{ ...config, torso: true, pattern: v, outfitColor: on ? config.outfitColor : '#ffffff' }} />;
        return undefined;
      },
    };
  };
  // A level's bar, left of its ×: tabs, then the main row (scrolling on its own when long), then tiles
  const levelParts = (d, top) => {
    const m = mainRow(d);
    if (m.colour) return { row: colourTiles(m.colour, top), swatches: true };
    const row = m.swatches
      ? m.options.map((v) => swatch(m.swatches, v, top))
      : m.options.map((v) => optionTile(m.k, v, { on: m.isOn(v), pick: m.pick, top, art: m.art && m.art(v, m.isOn(v)) }));
    if (d.kind === 'item') return { row, swatches: !!m.swatches, long: m.options.length > SHAPE_ROW };
    const { cat, sections, s } = d;
    // The category's tabs: a small pill over the bar in focus (Figma 156:17484), not inside the bar
    const tabs = sections.length > 1 && (
      <div key="tabs" className="ab-pill" role="tablist" aria-label={crumbs[0]}>
        {sections.map((t) => {
          const on = t.key === s.key;
          return (
            <button key={t.key} type="button" role="tab" aria-selected={on} className={'ab-pill-tab' + (on ? ' on' : '')} tabIndex={live(top)} onClick={() => switchTab(cat, t.key)}>
              {t.label}
            </button>
          );
        })}
      </div>
    );
    return { tabs, row, swatches: !!m.swatches, long: m.options.length > SHAPE_ROW, more: visibleMore(s, config).map((k) => moreTile(cat, k, top, row.length > 0)) };
  };
  const closeX = (top) => (
    <>
      <span className="ab-sep ab-sep-close" aria-hidden="true" />
      <button type="button" className="ab-bar-close" onClick={top ? back : () => go(parentOf(path).length ? parentOf(parentOf(path)) : [], 'up')} aria-label="Close" title="Close" tabIndex={live(top)}><CloseIcon /></button>
    </>
  );

  // Setup has its own bar: category and style, then Customize
  let setupTiles = null;
  if (inSetup) {
    setupTiles = SETUP.map((s) => (
      <div key={s.key} className="ab-set">
        <span className="ab-set-label">{s.label}</span>
        <div className="ab-set-options">
          {s.options.map((opt) => (
            <button key={opt} type="button" className={'ab-pill' + (eq(config[s.key], opt) ? ' on' : '')} aria-pressed={eq(config[s.key], opt)} onClick={() => (s.key === 'style' && config.style !== opt ? commit({ ...config, style: opt, ...(STYLE_LOOK[opt] || {}) }) : set(s.key, opt))}>
              {s.names[opt] || opt}
            </button>
          ))}
        </div>
      </div>
    ));
  }
  // A long shape row on the top bar opens into a grid of every option
  const topRow = level ? mainRow(level) : null;
  const gridRow = topRow && topRow.k && topRow.options.length > SHAPE_ROW ? topRow : null;

  // The stack, top to bottom: the current bar; the level under it as a full bar (muted, unless it's
  // the default bar); the level under that as the tray. The default bar is the floor: nothing under it.
  const chain = [];
  if (inAll) for (let p = parentOf(path); ; p = parentOf(p)) { chain.push(p); if (!p.length) break; }
  const underPath = chain[0] || null;
  const trayPath = chain[1] || null;
  const homeShown = isDefault || (underPath && !underPath.length);
  const underLevel = underPath && underPath.length ? describe(underPath) : null;
  const trayKey = trayPath ? (trayPath.length ? trayPath.join('/') : 'home') : null;
  const canClose = inSetup ? setupDone : !isDefault;

  // The preview centres the head itself (its silhouette spans x 33–177, y 3.5–160), not head + shadow;
  // with a torso it stays centred left–right and keeps the body in frame. Exports keep the full views.
  // On the framed backdrop the avatar sits in a shape (no shadow); 'full' drops the shape (shadow on).
  // The page behind stays light grey at all times; the colour only fills the shape (and the download).
  // Always the round background on the circle backdrop, whatever frame an older saved look has
  const framed = backdrop === 'circle';
  const view = config.torso ? '-23.5 -16 257 257' : '10.5 -12.85 189 189';

  const levelBar = (d, top) => {
    const key = ['all', d.cat, ...(d.kind === 'item' ? [d.k] : [])].join('/');
    return (
      <div
        className="ab-bar"
        key={key}
        ref={top ? barRef : undefined}
        data-layer={key}
        data-kind="bar"
        data-phase={top ? phase : undefined}
        data-level={d.kind === 'item' ? 'item' : 'category'}
        data-muted={top ? undefined : ''}
        role="toolbar"
        aria-label={top ? crumbs.join(' · ') : 'Under: ' + (d.kind === 'item' ? ITEMS[d.k].label : d.s.label)}
      >
        {(() => {
          const parts = levelParts(d, top);
          return (
            <div className="ab-tiles">
              <div className="ab-opts" data-swatches={parts.swatches ? '' : undefined} data-long={parts.long ? '' : undefined}>{parts.row}</div>
              {top && parts.long && gridRow && (
                <button type="button" className="ab-tile ab-grid-btn" onClick={() => setGrid((g) => !g)} aria-label={`All ${(ITEMS[gridRow.k] || {}).label?.toLowerCase() || ''} options`} aria-expanded={grid} data-open={grid || undefined}>
                  <ExpandIcon />
                </button>
              )}
              {parts.more}
            </div>
          );
        })()}
        {closeX(top)}
      </div>
    );
  };

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
        <div className="ab-stack" ref={stackRef}>

          {gridRow && (
            <div className="ab-grid ab-grid-items" data-open={grid || undefined} role="dialog" aria-label="All options" aria-hidden={!grid}>
              {gridRow.options.map((o) => optionTile(gridRow.k, o, { on: gridRow.isOn(o), pick: gridRow.pick, inGrid: true, art: gridRow.art && gridRow.art(o, gridRow.isOn(o)) }))}
            </div>
          )}

          {colourKey && (
            <div className="ab-grid" data-open={grid || undefined} role="dialog" aria-label="Colour grid" aria-hidden={!grid}>
              {GRID.map((row, r) => (
                <div key={r} className="ab-grid-row">
                  {row.map((fill) => (
                    <button
                      key={fill + r}
                      type="button"
                      className="ab-cell"
                      style={{ background: fill }}
                      data-on={eq(config[colourKey], fill) || undefined}
                      aria-label={fill}
                      tabIndex={grid ? 0 : -1}
                      onClick={() => { set(colourKey, fill); setGrid(false); }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {inSetup && (
            <div className="ab-bar" ref={barRef} key={'setup' + instance} data-layer="setup" data-kind="bar" data-phase={phase} data-level="setup" role="toolbar" aria-label="Setup">
              <div className="ab-tiles">{setupTiles}</div>
              <button type="button" className="ab-continue" onClick={finishSetup}>
                {setupDone ? 'Done' : 'Customize'} <ArrowIcon />
              </button>
              {canClose && closeX(true)}
            </div>
          )}
          {level && level.kind !== 'item' && (() => {
            const t = levelParts(level, true).tabs;
            return t ? <div key={'pill/' + level.cat} className="ab-pill-wrap">{t}</div> : null;
          })()}
          {level && levelBar(level, true)}
          {underLevel && (
            // The tray hangs under the bar it belongs to, sized to it
            <div className="ab-under">
              {trayKey && <span key={trayKey} className="ab-peek" data-layer={trayKey} data-kind="tray" data-dark={trayKey === 'home' ? '' : undefined} style={{ '--depth': 1, ...(barWidths.current[trayKey] ? { '--tray-w': barWidths.current[trayKey] - 32 + 'px' } : {}) }} aria-hidden="true" />}
              {levelBar(underLevel, false)}
            </div>
          )}
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
