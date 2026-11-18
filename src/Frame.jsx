import { useEffect, useRef, useState } from 'react';
import { defaultAvatar, innerSvg, VIEWS } from './lib/avatar.js';

/* =========================================================================
   The live page, from the Avatars Figma "Frame 4" (node 6:119): the avatar
   centered at its native size, a sub-component toolbar under it (undo/redo,
   option tiles, the color wheel), the default toolbar peeking out behind it,
   and the round close button.

   Close unmounts the current toolbar and the stack behind it rises into the
   default toolbar (Background · Face · Outfit). Picking one of those sinks
   the default back into the stack and mounts that part's toolbar on top.
   The page opens on Face → skin, exactly as the Figma frame.

   Positions are offsets from the frame's center (811px frame: avatar center
   at 405.5, toolbar top at 585, peek at 616, close at 686).
   ========================================================================= */

// The head as drawn in the Figma tiles (48px box)
const TILE_HEAD =
  'M12.0245 18.5527C11.8588 20.2797 11.83 21.6975 11.8624 22.8042C11.9003 24.1011 12.0223 24.9709 12.1065 25.411L11.7487 25.5544C10.3696 26.3836 11.1971 28.3183 11.8407 29.7923C12.1563 30.5152 12.494 30.6841 12.8321 30.8533V30.8533C13.1835 31.0292 13.5354 31.2052 13.8633 32.0034C14.3782 33.2563 15.5489 34.8594 16.0699 35.5043C17.9478 37.386 20.2555 38.3845 22.5695 38.7136C25.8517 39.096 29.5588 38.2427 32.33 35.4658C32.851 34.8209 34.0217 33.2179 34.5366 31.9649C34.8645 31.1668 35.2164 30.9907 35.5678 30.8149C35.9059 30.6457 36.2436 30.4767 36.5592 29.7539C37.2028 28.2798 38.0303 26.3451 36.6512 25.516L36.2934 25.3726C36.3755 24.9432 36.4936 24.105 36.5346 22.8603C36.5714 21.7402 36.5458 20.2909 36.3754 18.5142C35.9157 13.7236 31.4106 11.3282 27.8249 10.4069C25.1572 9.72152 22.3358 10.0454 21.0171 10.3411C20.8694 10.3729 20.722 10.4076 20.5749 10.4454C16.9893 11.3667 12.4842 13.762 12.0245 18.5527Z';

// Each part's toolbar: its options (Figma's four head fills for Face) and what a tile looks like
const PARTS = {
  face: { label: 'Face', key: 'skin', options: ['#d9d9d7', '#ffffff', '#d9d9d7', '#444755'], tile: 'head' },
  background: { label: 'Background', key: 'bg', options: ['#f2f2f2', '#ffe4f1', '#e3f1ff', '#e9f9d9'], tile: 'chip' },
  outfit: { label: 'Outfit', key: 'cap', options: ['#f70492', '#50c810', '#1084fe', '#1a1a1a'], tile: 'cap' },
};
const ORDER = ['background', 'face', 'outfit'];

// The look; `pick` remembers which tile is on per part (-1 = a custom color)
const START = { bg: '#f2f2f2', skin: '#ffffff', cap: '#f70492', pick: { background: 0, face: 1, outfit: 0 } };
const KEYS = ['bg', 'skin', 'cap'];
// History counts actions: a change to how the avatar looks, nothing else
const changed = (a, b) => KEYS.some((k) => String(a[k]).toLowerCase() !== String(b[k]).toLowerCase());

const MS = { exit: 160, promote: 260, demote: 200 };

// Figma's redo-01 icon; undo is the same glyph mirrored
function HistoryIcon({ mirrored, active }) {
  const color = active ? '#141B34' : '#D9D9D7';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={mirrored ? { transform: 'scaleX(-1)' } : undefined}>
      <g opacity={active ? 0.8 : 1}>
        <path d="M20.9922 8H8.99219C5.67848 8 2.99219 10.6863 2.99219 14C2.99219 17.3137 5.67848 20 8.99219 20H12.9922" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16.9922 4L18.146 4.87652C20.0435 6.31801 20.9922 7.03875 20.9922 8C20.9922 8.96125 20.0435 9.68199 18.146 11.1235L16.9922 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function HeadTile({ fill, on }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {on && <rect width="48" height="48" rx="14" fill="#1A1A1A" />}
      <path d={TILE_HEAD} fillRule="evenodd" clipRule="evenodd" fill={fill} stroke={on ? fill : '#D9D9D7'} strokeWidth="0.576" />
    </svg>
  );
}

function ChipTile({ fill, on }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {on && <rect width="48" height="48" rx="14" fill="#1A1A1A" />}
      <rect x="13" y="13" width="22" height="22" rx="7" fill={fill} stroke={on ? fill : '#D9D9D7'} strokeWidth="0.576" />
    </svg>
  );
}

function CapTile({ look, fill, on }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {on && <rect width="48" height="48" rx="14" fill="#1A1A1A" />}
      <svg x="8" y="8" width="32" height="32" viewBox={VIEWS.top} dangerouslySetInnerHTML={{ __html: innerSvg({ ...defaultAvatar, skin: look.skin, cap: fill, shadow: false }) }} />
    </svg>
  );
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Frame() {
  const [look, setLook] = useState(START);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  // level: 'default' or a part key. phase drives the hand-off between them.
  const [level, setLevel] = useState('face');
  const [phase, setPhase] = useState('idle'); // idle | exit | promote | demote | enter
  const colorRef = useRef(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (ms, fn) => timers.current.push(setTimeout(fn, reduced() ? 0 : ms));

  // Record an action only when the avatar actually changes; otherwise just update the selection
  const commit = (next, from = look) => {
    if (changed(next, from)) {
      setPast((p) => [...p, from]);
      setFuture([]);
    }
    setLook(next);
  };
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [look, ...f]);
    setLook(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, look]);
    setLook(future[0]);
    setFuture((f) => f.slice(1));
  };
  const choose = (part, i, value) => {
    const p = PARTS[part];
    if (look[p.key] === value && look.pick[part] === i) return;
    commit({ ...look, [p.key]: value, pick: { ...look.pick, [part]: i } });
  };

  // The color picker previews live while it's open and records one action when the color is set
  const pickFrom = useRef(null);
  const openPicker = () => {
    pickFrom.current = look;
    colorRef.current?.click();
  };
  const previewColor = (value) => {
    if (!pickFrom.current) pickFrom.current = look;
    const p = PARTS[level];
    setLook((l) => ({ ...l, [p.key]: value, pick: { ...l.pick, [level]: -1 } }));
  };
  useEffect(() => {
    const el = colorRef.current;
    if (!el) return;
    const onCommit = () => {
      const from = pickFrom.current;
      pickFrom.current = null;
      if (!from) return;
      setLook((l) => {
        if (changed(l, from)) {
          setPast((p) => [...p, from]);
          setFuture([]);
        }
        return l;
      });
    };
    el.addEventListener('change', onCommit);
    return () => el.removeEventListener('change', onCommit);
  }, [level]);

  // Close: the current toolbar leaves, then the stack rises into the default toolbar
  const close = () => {
    if (level === 'default' || phase !== 'idle') return;
    setPhase('exit');
    after(MS.exit, () => {
      setLevel('default');
      setPhase('promote');
      after(MS.promote, () => setPhase('idle'));
    });
  };
  // Open: the default toolbar sinks into the stack, then the part's toolbar mounts on top
  const open = (part) => {
    if (phase !== 'idle') return;
    setPhase('demote');
    after(MS.demote, () => {
      setLevel(part);
      setPhase('enter');
      after(200, () => setPhase('idle'));
    });
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const part = level === 'default' ? null : PARTS[level];
  const config = { ...defaultAvatar, skin: look.skin, cap: look.cap };
  // The stack behind shows whenever a part's toolbar is up (and while the default sinks into it)
  const showPeek = level !== 'default' && phase !== 'exit';
  const showClose = level !== 'default' && phase !== 'exit';

  let tiles;
  if (!part) {
    tiles = ORDER.map((k) => (
      <button key={k} type="button" className="fr-tile" aria-label={PARTS[k].label} title={PARTS[k].label} onClick={() => open(k)}>
        {k === 'face' ? <HeadTile fill={look.skin} /> : k === 'background' ? <ChipTile fill={look.bg} /> : <CapTile look={look} fill={look.cap} />}
      </button>
    ));
  } else {
    tiles = part.options.map((fill, i) => {
      const on = look.pick[level] === i;
      const Tile = part.tile === 'head' ? HeadTile : part.tile === 'chip' ? ChipTile : CapTile;
      return (
        <button key={i} type="button" className="fr-tile" aria-label={`${part.label} ${fill}`} aria-pressed={on} onClick={() => choose(level, i, fill)}>
          <Tile fill={fill} on={on} look={look} />
        </button>
      );
    });
  }

  return (
    <main className="fr" style={{ background: look.bg }}>
      <svg
        className="fr-avatar"
        viewBox="0 0 177 161"
        width="176.78"
        height="160.11"
        role="img"
        aria-label="Avatar"
        dangerouslySetInnerHTML={{ __html: innerSvg(config, { id: 'frame' }) }}
      />

      {showPeek && <span className="fr-peek" aria-hidden="true" />}

      <div className="fr-slot">
        <div className="fr-bar" key={level} data-phase={phase} role="toolbar" aria-label={part ? part.label : 'Avatar'}>
          <div className="fr-history">
            <button type="button" className="fr-icon" onClick={undo} disabled={!past.length} aria-label="Undo">
              <HistoryIcon mirrored active={past.length > 0} />
            </button>
            <button type="button" className="fr-icon" onClick={redo} disabled={!future.length} aria-label="Redo">
              <HistoryIcon active={future.length > 0} />
            </button>
          </div>

          <div className="fr-tiles">
            {tiles}
            {part && (
              <>
                <button type="button" className="fr-wheel" onClick={openPicker} aria-label="Custom color">
                  <img src="/color-wheel.png" alt="" width="28" height="28" />
                </button>
                <input
                  ref={colorRef}
                  className="fr-color"
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(look[part.key]) ? look[part.key] : '#000000'}
                  onChange={(e) => previewColor(e.target.value)}
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </>
            )}
          </div>
        </div>
      </div>

      <button type="button" className="fr-close" data-show={showClose || undefined} onClick={close} aria-label={part ? `Close ${part.label.toLowerCase()}` : 'Close'} tabIndex={showClose ? 0 : -1}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L12 12M12 12L6 18M12 12L18 18M12 12L6 6" stroke="#ABABA6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </main>
  );
}
