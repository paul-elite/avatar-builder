import { useState } from 'react';

/* ---- Option sets ---------------------------------------------------------
   Each control is a list of choices. The avatar is drawn purely from the
   current selection, so adding a new option is just a new entry here plus a
   branch in <Avatar>. Bare on purpose — easy to grow later.
--------------------------------------------------------------------------- */

const SKIN = ['#f2d6c2', '#e8b98f', '#c88a5e', '#8d5524', '#5a3620'];
const HAIR_COLOR = ['#2b2b2b', '#6b4226', '#b5651d', '#d9a441', '#9b9b9b', '#c0392b'];
const BG = ['#e3f0ff', '#ffe8ec', '#eafbe7', '#fff4d6', '#f0e9ff', '#f3f3f3'];

const HAIR = ['none', 'short', 'bun', 'long'];
const EYES = ['dots', 'happy', 'glasses'];
const MOUTH = ['smile', 'neutral', 'open'];

const DEFAULTS = {
  skin: SKIN[1],
  hairColor: HAIR_COLOR[0],
  bg: BG[0],
  hair: 'short',
  eyes: 'dots',
  mouth: 'smile',
};

export default function App() {
  const [a, setA] = useState(DEFAULTS);
  const set = (key) => (value) => setA((prev) => ({ ...prev, [key]: value }));

  const randomize = () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    setA({
      skin: pick(SKIN),
      hairColor: pick(HAIR_COLOR),
      bg: pick(BG),
      hair: pick(HAIR),
      eyes: pick(EYES),
      mouth: pick(MOUTH),
    });
  };

  return (
    <main className="app">
      <h1>Avatar Builder</h1>

      <div className="stage">
        <Avatar {...a} />
      </div>

      <div className="controls">
        <Swatches label="Background" value={a.bg} options={BG} onChange={set('bg')} />
        <Swatches label="Skin" value={a.skin} options={SKIN} onChange={set('skin')} />
        <Swatches label="Hair color" value={a.hairColor} options={HAIR_COLOR} onChange={set('hairColor')} />
        <Choices label="Hair" value={a.hair} options={HAIR} onChange={set('hair')} />
        <Choices label="Eyes" value={a.eyes} options={EYES} onChange={set('eyes')} />
        <Choices label="Mouth" value={a.mouth} options={MOUTH} onChange={set('mouth')} />
      </div>

      <div className="actions">
        <button type="button" onClick={randomize}>Randomize</button>
        <button type="button" className="ghost" onClick={() => setA(DEFAULTS)}>Reset</button>
      </div>
    </main>
  );
}

/* ---- Controls ----------------------------------------------------------- */

function Swatches({ label, value, options, onChange }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <div className="row-opts">
        {options.map((c) => (
          <button
            key={c}
            type="button"
            className={'swatch' + (c === value ? ' on' : '')}
            style={{ background: c }}
            aria-label={c}
            aria-pressed={c === value}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}

function Choices({ label, value, options, onChange }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <div className="row-opts">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={'chip' + (o === value ? ' on' : '')}
            aria-pressed={o === value}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- The avatar --------------------------------------------------------- */

function Avatar({ skin, hairColor, bg, hair, eyes, mouth }) {
  return (
    <svg viewBox="0 0 200 200" width="220" height="220" role="img" aria-label="Your avatar">
      <circle cx="100" cy="100" r="100" fill={bg} />

      {/* long hair sits behind the head */}
      {hair === 'long' && (
        <path d="M44 90a56 56 0 0 1 112 0v70H44Z" fill={hairColor} />
      )}

      {/* neck + head */}
      <rect x="88" y="128" width="24" height="30" fill={skin} />
      <circle cx="100" cy="96" r="50" fill={skin} />

      {/* hair on top */}
      {hair === 'short' && (
        <path d="M50 92a50 50 0 0 1 100 0c0-14-20-30-50-30S50 78 50 92Z" fill={hairColor} />
      )}
      {hair === 'bun' && (
        <>
          <circle cx="100" cy="46" r="13" fill={hairColor} />
          <path d="M52 90a48 48 0 0 1 96 0c0-16-22-28-48-28S52 74 52 90Z" fill={hairColor} />
        </>
      )}
      {hair === 'long' && (
        <path d="M50 92a50 50 0 0 1 100 0c0-14-20-30-50-30S50 78 50 92Z" fill={hairColor} />
      )}

      {/* eyes */}
      {eyes === 'dots' && (
        <>
          <circle cx="82" cy="95" r="5" fill="#2b2b2b" />
          <circle cx="118" cy="95" r="5" fill="#2b2b2b" />
        </>
      )}
      {eyes === 'happy' && (
        <>
          <path d="M75 97q7-9 14 0" fill="none" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />
          <path d="M111 97q7-9 14 0" fill="none" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {eyes === 'glasses' && (
        <>
          <circle cx="82" cy="96" r="12" fill="none" stroke="#2b2b2b" strokeWidth="3" />
          <circle cx="118" cy="96" r="12" fill="none" stroke="#2b2b2b" strokeWidth="3" />
          <line x1="94" y1="96" x2="106" y2="96" stroke="#2b2b2b" strokeWidth="3" />
          <circle cx="82" cy="96" r="4" fill="#2b2b2b" />
          <circle cx="118" cy="96" r="4" fill="#2b2b2b" />
        </>
      )}

      {/* mouth */}
      {mouth === 'smile' && (
        <path d="M84 118q16 16 32 0" fill="none" stroke="#9a4b3b" strokeWidth="3" strokeLinecap="round" />
      )}
      {mouth === 'neutral' && (
        <line x1="86" y1="120" x2="114" y2="120" stroke="#9a4b3b" strokeWidth="3" strokeLinecap="round" />
      )}
      {mouth === 'open' && (
        <ellipse cx="100" cy="120" rx="10" ry="7" fill="#9a4b3b" />
      )}
    </svg>
  );
}
