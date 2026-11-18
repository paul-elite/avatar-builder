import { useEffect, useRef, useState } from 'react';
import { defaultAvatar, innerSvg } from './lib/avatar.js';

/* =========================================================================
   The live page, from the Avatars Figma "Frame 4" (node 6:119): the avatar
   centered at its native size, a sub-component toolbar under it (undo/redo,
   option tiles, the color wheel), the default toolbar peeking out behind it,
   and the round close button.

   Close unmounts the current toolbar and the stack behind it rises into a
   new instance of the same toolbar (for now the stack is all one kind).
   The page opens exactly as the Figma frame.

   Positions are offsets from the frame's center (811px frame: avatar center
   at 405.5, toolbar top at 585, peek at 616, close at 686).
   ========================================================================= */

// The head as drawn in the Figma tiles (48px box)
const TILE_HEAD =
  'M12.0245 18.5527C11.8588 20.2797 11.83 21.6975 11.8624 22.8042C11.9003 24.1011 12.0223 24.9709 12.1065 25.411L11.7487 25.5544C10.3696 26.3836 11.1971 28.3183 11.8407 29.7923C12.1563 30.5152 12.494 30.6841 12.8321 30.8533V30.8533C13.1835 31.0292 13.5354 31.2052 13.8633 32.0034C14.3782 33.2563 15.5489 34.8594 16.0699 35.5043C17.9478 37.386 20.2555 38.3845 22.5695 38.7136C25.8517 39.096 29.5588 38.2427 32.33 35.4658C32.851 34.8209 34.0217 33.2179 34.5366 31.9649C34.8645 31.1668 35.2164 30.9907 35.5678 30.8149C35.9059 30.6457 36.2436 30.4767 36.5592 29.7539C37.2028 28.2798 38.0303 26.3451 36.6512 25.516L36.2934 25.3726C36.3755 24.9432 36.4936 24.105 36.5346 22.8603C36.5714 21.7402 36.5458 20.2909 36.3754 18.5142C35.9157 13.7236 31.4106 11.3282 27.8249 10.4069C25.1572 9.72152 22.3358 10.0454 21.0171 10.3411C20.8694 10.3729 20.722 10.4076 20.5749 10.4454C16.9893 11.3667 12.4842 13.762 12.0245 18.5527Z';

// The toolbar: Figma's four head fills
const PARTS = {
  face: { label: 'Face', key: 'skin', options: ['#d9d9d7', '#ffffff', '#d9d9d7', '#444755'] },
};

// The look; `pick` remembers which tile is on per part (-1 = a custom color)
// The color row the wheel opens: skin tones first, then a few others
const ROW = ['#ffffff', '#f3d2b9', '#e0ac85', '#c68b5e', '#8d5524', '#5a3620', '#444755', '#1a1a1a'];

// The detailed grid: 12 hues in 7 steps from light to deep, then a grey row
const hsl = (h, s, l) => {
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - (a / 100) * 100 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};
const GRID = [
  ...[0.92, 0.84, 0.74, 0.62, 0.5, 0.38, 0.26].map((l) => [0, 20, 35, 50, 90, 140, 170, 195, 215, 250, 285, 320].map((h) => hsl(h, 82, l))),
  ['#ffffff', '#ececea', '#d9d9d7', '#c2bfbc', '#ababa6', '#8a8a86', '#6b6b67', '#4d4d4a', '#363633', '#262624', '#1a1a1a', '#000000'],
];

const START = { bg: '#f2f2f2', skin: '#ffffff', cap: '#f70492', pick: { face: 1 } };
const KEYS = ['bg', 'skin', 'cap'];
// History counts actions: a change to how the avatar looks, nothing else
const changed = (a, b) => KEYS.some((k) => String(a[k]).toLowerCase() !== String(b[k]).toLowerCase());

const MS = { exit: 160, promote: 260, demote: 200, enter: 200 };

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

function SwatchTile({ fill, on }) {
  const light = parseInt(fill.slice(1, 3), 16) + parseInt(fill.slice(3, 5), 16) + parseInt(fill.slice(5, 7), 16) > 690;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {on && <rect width="48" height="48" rx="14" fill="#1A1A1A" />}
      <circle cx="24" cy="24" r="12" fill={fill} stroke={!on && light ? '#D9D9D7' : fill} strokeWidth="0.75" />
    </svg>
  );
}

// "All colors": a 3 × 3 of tiny swatches
function GridGlyph() {
  const c = ['#ff4f4e', '#ffb900', '#00cc1a', '#1084fe', '#8b5cf6', '#f70492', '#d9d9d7', '#444755', '#1a1a1a'];
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {c.map((fill, i) => (
        <rect key={i} x={14 + (i % 3) * 7} y={14 + Math.floor(i / 3) * 7} width="6" height="6" rx="2" fill={fill} />
      ))}
    </svg>
  );
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Frame() {
  const [look, setLook] = useState(START);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  // level: 'face' (the head fills) or 'color' (the row the wheel opens, stacked on top)
  const [level, setLevel] = useState('face');
  // Each close mounts a new instance of the toolbar below; phase drives the hand-off
  const [instance, setInstance] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | exit | promote | demote | enter
  const [grid, setGrid] = useState(false);
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

  // A color from the row or the grid: one action; the head tiles light up if it is one of theirs
  const chooseColor = (value) => {
    const i = PARTS.face.options.findIndex((o) => o.toLowerCase() === value.toLowerCase());
    choose('face', i, value);
    setGrid(false);
  };

  // Close: the current toolbar leaves, then the one below rises into its place
  // (the head fills under the color row; another head-fills instance under that)
  const close = () => {
    if (phase !== 'idle') return;
    setGrid(false);
    setPhase('exit');
    after(MS.exit, () => {
      if (level === 'color') setLevel('face');
      setInstance((n) => n + 1);
      setPhase('promote');
      after(MS.promote, () => setPhase('idle'));
    });
  };
  // The wheel: the head fills sink into the stack and the color row mounts on top
  const openColors = () => {
    if (phase !== 'idle') return;
    setPhase('demote');
    after(MS.demote, () => {
      setLevel('color');
      setInstance((n) => n + 1);
      setPhase('enter');
      after(MS.enter, () => setPhase('idle'));
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (grid) setGrid(false);
      else close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const part = PARTS.face;
  const config = { ...defaultAvatar, skin: look.skin, cap: look.cap };
  // There is always another instance in the stack, so the peek and close stay up
  const showClose = phase !== 'exit';

  const current = look.skin.toLowerCase();
  const tiles =
    level === 'face'
      ? part.options.map((fill, i) => {
          const on = look.pick.face === i;
          return (
            <button key={i} type="button" className="fr-tile" aria-label={`${part.label} ${fill}`} aria-pressed={on} onClick={() => choose('face', i, fill)}>
              <HeadTile fill={fill} on={on} />
            </button>
          );
        })
      : ROW.map((fill) => {
          const on = current === fill;
          return (
            <button key={fill} type="button" className="fr-tile" aria-label={`Color ${fill}`} aria-pressed={on} onClick={() => chooseColor(fill)}>
              <SwatchTile fill={fill} on={on} />
            </button>
          );
        });

  return (
    <main className="fr" style={{ background: look.bg }} data-grid={(level === 'color' && grid) || undefined}>
      <svg
        className="fr-avatar"
        viewBox="0 0 177 161"
        width="176.78"
        height="160.11"
        role="img"
        aria-label="Avatar"
        dangerouslySetInnerHTML={{ __html: innerSvg(config, { id: 'frame' }) }}
      />

      <span className="fr-peek" aria-hidden="true" />

      <div className="fr-slot">
        {level === 'color' && (
          <div className="fr-grid" data-open={grid || undefined} role="dialog" aria-label="Color grid" aria-hidden={!grid}>
            {GRID.map((rowColors, r) => (
              <div key={r} className="fr-grid-row">
                {rowColors.map((fill) => (
                  <button
                    key={fill + r}
                    type="button"
                    className="fr-cell"
                    style={{ background: fill }}
                    data-on={current === fill || undefined}
                    aria-label={fill}
                    tabIndex={grid ? 0 : -1}
                    onClick={() => chooseColor(fill)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
        <div className="fr-bar" key={instance} data-phase={phase} role="toolbar" aria-label={level === 'face' ? part.label : 'Colors'}>
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
            {level === 'face' ? (
              <button type="button" className="fr-wheel" onClick={openColors} aria-label="More colors">
                <img src="/color-wheel.png" alt="" width="28" height="28" />
              </button>
            ) : (
              <button type="button" className="fr-tile fr-grid-btn" onClick={() => setGrid((g) => !g)} aria-label="All colors" aria-expanded={grid} data-open={grid || undefined}>
                <GridGlyph />
              </button>
            )}
          </div>
        </div>
      </div>

      <button type="button" className="fr-close" data-show={showClose || undefined} onClick={close} aria-label="Close" tabIndex={showClose ? 0 : -1}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L12 12M12 12L6 18M12 12L18 18M12 12L6 6" stroke="#ABABA6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </main>
  );
}
