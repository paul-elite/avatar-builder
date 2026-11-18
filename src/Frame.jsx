import { useRef, useState } from 'react';
import { defaultAvatar, innerSvg } from './lib/avatar.js';

/* =========================================================================
   The live page, exactly as the Avatars Figma "Frame 4" (node 6:119):
   the avatar centered at its native size on #f2f2f2, the "part selected"
   toolbar under it (undo/redo, four head fills, the color wheel), the
   faded primary bar peeking out behind, and the round close button.
   Nothing more for now. Positions are offsets from the frame's center
   (811px tall frame: avatar center at 405.5, toolbar top at 585, peek at
   616, close at 686).
   ========================================================================= */

// The head as drawn in the Figma tiles (48px box)
const TILE_HEAD =
  'M12.0245 18.5527C11.8588 20.2797 11.83 21.6975 11.8624 22.8042C11.9003 24.1011 12.0223 24.9709 12.1065 25.411L11.7487 25.5544C10.3696 26.3836 11.1971 28.3183 11.8407 29.7923C12.1563 30.5152 12.494 30.6841 12.8321 30.8533V30.8533C13.1835 31.0292 13.5354 31.2052 13.8633 32.0034C14.3782 33.2563 15.5489 34.8594 16.0699 35.5043C17.9478 37.386 20.2555 38.3845 22.5695 38.7136C25.8517 39.096 29.5588 38.2427 32.33 35.4658C32.851 34.8209 34.0217 33.2179 34.5366 31.9649C34.8645 31.1668 35.2164 30.9907 35.5678 30.8149C35.9059 30.6457 36.2436 30.4767 36.5592 29.7539C37.2028 28.2798 38.0303 26.3451 36.6512 25.516L36.2934 25.3726C36.3755 24.9432 36.4936 24.105 36.5346 22.8603C36.5714 21.7402 36.5458 20.2909 36.3754 18.5142C35.9157 13.7236 31.4106 11.3282 27.8249 10.4069C25.1572 9.72152 22.3358 10.0454 21.0171 10.3411C20.8694 10.3729 20.722 10.4076 20.5749 10.4454C16.9893 11.3667 12.4842 13.762 12.0245 18.5527Z';

// The four fills in Figma's toolbar, in order (the first and third are the same grey there)
const FILLS = ['#d9d9d7', '#ffffff', '#d9d9d7', '#444755'];
const START = 1; // Figma shows the second (white) selected

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

export default function Frame() {
  // Each history entry: { index, skin } (index is which tile is on; -1 for a custom color)
  const [state, setState] = useState({ index: START, skin: FILLS[START] });
  // Figma shows undo active: the white head was just picked over the grey one
  const [past, setPast] = useState([{ index: 0, skin: FILLS[0] }]);
  const [future, setFuture] = useState([]);
  const colorRef = useRef(null);

  const commit = (next) => {
    if (next.index === state.index && next.skin === state.skin) return;
    setPast((p) => [...p, state]);
    setFuture([]);
    setState(next);
  };
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [state, ...f]);
    setState(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, state]);
    setState(future[0]);
    setFuture((f) => f.slice(1));
  };

  const config = { ...defaultAvatar, skin: state.skin };

  return (
    <main className="fr">
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

      <div className="fr-bar" role="toolbar" aria-label="Skin">
        <div className="fr-history">
          <button type="button" className="fr-icon" onClick={undo} disabled={!past.length} aria-label="Undo">
            <HistoryIcon mirrored active={past.length > 0} />
          </button>
          <button type="button" className="fr-icon" onClick={redo} disabled={!future.length} aria-label="Redo">
            <HistoryIcon active={future.length > 0} />
          </button>
        </div>

        <div className="fr-tiles">
          {FILLS.map((fill, i) => {
            const on = state.index === i;
            return (
              <button
                key={i}
                type="button"
                className="fr-tile"
                aria-label={`Skin ${fill}`}
                aria-pressed={on}
                onClick={() => commit({ index: i, skin: fill })}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  {on && <rect width="48" height="48" rx="14" fill="#1A1A1A" />}
                  <path d={TILE_HEAD} fillRule="evenodd" clipRule="evenodd" fill={fill} stroke={on ? fill : '#D9D9D7'} strokeWidth="0.576" />
                </svg>
              </button>
            );
          })}

          <button type="button" className="fr-wheel" onClick={() => colorRef.current?.click()} aria-label="Custom color">
            <img src="/color-wheel.png" alt="" width="28" height="28" />
          </button>
          <input
            ref={colorRef}
            className="fr-color"
            type="color"
            value={state.skin}
            onChange={(e) => commit({ index: -1, skin: e.target.value })}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>

      <button type="button" className="fr-close" aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L12 12M12 12L6 18M12 12L18 18M12 12L6 6" stroke="#ABABA6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </main>
  );
}
