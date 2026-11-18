import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import {
  SETUP, PRIMARY, ITEMS, PART_TARGETS, ITEM_VIEWS, VIEWS, visibleItems, viewFor,
  defaultAvatar, innerSvg, itemSvg, headSwatchSvg, avatarToSvg, randomAvatar,
} from './avatar.js';
import { downloadPng } from './export.js';
import { NavIcon } from './icons.jsx';

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
     onChange?     (config, { svg }) => void   — fires on every change
     size?         preview size in px (default 240)
     exportSize?   downloaded PNG size in px (default 512)
     showActions?  show shuffle / download (default true)
     persist?      a storage key: remember the look and setup in this browser
     className?    extra class on the root

   Import the stylesheet once: import 'avatar-builder/styles.css'
   ========================================================================= */

const MS = { exit: 150, promote: 240, demote: 190, enter: 190 };

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
const ShuffleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22M18 2l4 4-4 4M2 6h1.9c1.5 0 2.9.9 3.6 2.2M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8M18 14l4 4-4 4" {...LINE} /></svg>;
const DownloadIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" {...LINE} /></svg>;
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
}) {
  const saved = useRef(typeof window !== 'undefined' ? load(persist) : null).current;
  const isControlled = value != null;
  const [internal, setInternal] = useState(() => ({ ...defaultAvatar, ...defaultValue, ...saved?.config }));
  const config = { ...defaultAvatar, ...(isControlled ? value : internal) };

  // Where the editor is: ['setup'] · [] (primary) · [group] · [group, item]
  const [setupDone, setSetupDone] = useState(() => !!saved?.setupDone);
  const [path, setPath] = useState(() => (saved?.setupDone ? [] : ['setup']));
  const [phase, setPhase] = useState('idle'); // idle | exit | promote | demote | enter
  const [instance, setInstance] = useState(0);
  const [grid, setGrid] = useState(false);
  const [history, setHistory] = useState({ past: [], future: [] });
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (ms, fn) => timers.current.push(setTimeout(fn, reducedMotion() ? 0 : ms));

  useEffect(() => { save(persist, { config, setupDone, bgEdited: true }); }, [persist, setupDone, JSON.stringify(config)]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Changes and history: an action is a change to how the avatar looks ---- */
  const emit = useCallback((next) => {
    if (!isControlled) setInternal(next);
    if (onChange) onChange(next, { svg: avatarToSvg(next, { size: exportSize }) });
  }, [isControlled, onChange, exportSize]);

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
    const first = dir === 'down' ? 'demote' : 'exit';
    const second = dir === 'up' ? 'promote' : 'enter';
    setPhase(first);
    after(dir === 'down' ? MS.demote : MS.exit, () => {
      setPath(next);
      setInstance((n) => n + 1);
      setPhase(second);
      after(second === 'promote' ? MS.promote : MS.enter, () => setPhase('idle'));
    });
  };
  const open = (key) => go([...path, key], 'down');
  /* Paths: ['setup'] · [] the default bar (Face · Hair · Outfit · Background · Frame) ·
     ['all', group] a category · ['all', group, item] an item ·
     Features nests one more level: ['all', 'features'] the organs · ['all', 'features', organ] · [..., organ, item] */
  const back = () => {
    if (grid) return setGrid(false);
    if (path[0] === 'setup' && !setupDone) return;
    if (!path.length) return; // the default toolbar is where closing stops
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
  // A tap on a part edits that part; anywhere else on the stage edits the background
  const onStageClick = (e) => { const g = e.target.closest && e.target.closest('[data-part]'); jump(g ? g.dataset.part : 'background'); };

  const finishSetup = () => {
    setSetupDone(true);
    go([], setupDone ? 'up' : 'swap');
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') back(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
    tiles = PRIMARY.map((g) => (
      <button key={g.key} type="button" className="ab-tile ab-cat" onClick={() => go(['all', g.key], 'down')} aria-label={g.label}>
        <span className="ab-cat-art"><NavIcon name={g.key} /></span>
        <span className="ab-cat-label">{g.label}</span>
      </button>
    ));
    if (showActions) {
      extras = (
        <>
          <span className="ab-sep" aria-hidden="true" />
          <button type="button" className="ab-icon" onClick={() => commit(randomAvatar(config))} aria-label="Shuffle" title="Shuffle"><ShuffleIcon /></button>
          <button type="button" className="ab-icon" onClick={() => downloadPng(config, { size: exportSize })} aria-label="Download PNG" title="Download PNG"><DownloadIcon /></button>
        </>
      );
    }
  } else if (top && top.organs && !organ) {
    // Features: the organs, each a metaphor
    tiles = top.organs.map((o) => (
      <button key={o.key} type="button" className="ab-tile ab-cat" onClick={() => open(o.key)} aria-label={o.label}>
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
        <button key={k} type="button" className="ab-tile ab-cat" onClick={() => open(k)} aria-label={it.label}>
          <span className="ab-cat-art" style={off ? { opacity: 0.4 } : undefined}>
            <NavIcon name={k} group={group.key} />
          </span>
          <span className="ab-cat-label">{it.label}</span>
        </button>
      );
    });
  } else {
    const opts = item.kind === 'color' ? (item.optional ? [null, ...item.presets] : item.presets) : item.options;
    // Colour chips and skin heads take the dark selected tile; items (mostly black) a light one with a ring
    const isSwatch = ['skin', 'bg', 'blush', 'tears'].includes(itemKey) || (itemKey === 'hairColor' && config.hair === 'none');
    const optionTile = (opt, { inGrid = false } = {}) => {
      const on = eq(config[itemKey], opt);
      const label = opt === null ? 'None' : opt === true ? 'On' : opt === false ? 'Off' : String(opt);
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
          <Face item={itemKey} config={{ ...config, [itemKey]: opt }} />
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
  const canClose = depth > 0 && phase !== 'exit';
  // The preview centres the head itself (its silhouette spans x 33–177, y 3.5–160), not head + shadow;
  // with a torso it stays centred left–right and keeps the body in frame. Exports keep the full views.
  // On the framed backdrop the avatar sits in a shape (no shadow); 'full' is a plain background (shadow on)
  const framed = backdrop === 'circle' && config.frame !== 'full';
  const view = config.torso ? '-23.5 -16 257 257' : '10.5 -12.85 189 189';

  return (
    <div className={('ab-root ' + className).trim()} style={framed ? { '--ab-fill': config.bg } : { '--ab-bg': config.bg }} data-grid={grid || undefined} data-backdrop={backdrop} data-frame={backdrop === 'circle' ? config.frame || 'circle' : undefined}>
      {setupDone && !inSetup && (
        <button type="button" className="ab-setup-chip" onClick={() => go(['setup'], 'down')} aria-label="Change category and style">
          {SETUP.map((s) => s.names[config[s.key]] || config[s.key]).join(' · ')}
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
        {siblings.length > 1 ? (
          // Inside an item: a toggle of the category's items, to switch straight between them
          <div className="ab-seg" role="tablist" aria-label={group.label}>
            {siblings.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={k === itemKey}
                className={'ab-seg-btn' + (k === itemKey ? ' on' : '')}
                onClick={() => k !== itemKey && go([...base, k], 'swap')}
              >
                {ITEMS[k].label}
              </button>
            ))}
          </div>
        ) : (
          <div className="ab-crumbs" aria-live="polite">
            {crumbs.map((c, i) => (
              <span key={i} className={i === crumbs.length - 1 ? 'ab-crumb-now' : undefined}>{c}</span>
            ))}
          </div>
        )}

        <div className="ab-stack">
          {/* At most two trays show: the toolbar and one behind it, however deep you are */}
          {Array.from({ length: Math.min(depth, 1) }, (_, i) => (
            <span key={i} className="ab-peek" style={{ '--depth': 1 }} aria-hidden="true" />
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

          <div className="ab-bar" key={instance} data-phase={phase} data-level={inSetup ? 'setup' : isDefault ? 'default' : item ? 'item' : 'category'} role="toolbar" aria-label={crumbs.join(' · ')}>
            {!inSetup && <div className="ab-history">
              <button type="button" className="ab-icon" onClick={undo} disabled={!history.past.length} aria-label="Undo" title="Undo"><HistoryIcon mirrored /></button>
              <button type="button" className="ab-icon" onClick={redo} disabled={!history.future.length} aria-label="Redo" title="Redo"><HistoryIcon /></button>
            </div>}
            <div className="ab-tiles" ref={tilesRef} data-long={shapeGrid ? '' : undefined}>
              {tiles}
            </div>
            {extras}
          </div>
        </div>

        <button type="button" className="ab-close" data-show={canClose || undefined} onClick={back} aria-label="Close" tabIndex={canClose ? 0 : -1}>
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
