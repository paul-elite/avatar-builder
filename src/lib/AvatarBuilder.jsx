import { useState, useCallback } from 'react';
import { AVATAR_OPTIONS, defaultAvatar, innerSvg, avatarToSvg } from './avatar.js';

/* =========================================================================
   <AvatarBuilder /> — a drop-in React component with a centered layout:
   a large preview up top, a category switcher, one centered row of options
   at a time (live preview tiles for shapes, swatches for colors), and
   centered actions.

   Props:
     value?        controlled config (omit for uncontrolled)
     defaultValue? initial config when uncontrolled
     onChange?     (config, { svg }) => void   — fires on every edit
     size?         preview size in px (default 200)
     showActions?  show Randomize / Reset (default true)
     className?    extra class on the root

   Import the stylesheet once in your app: import 'avatar-builder/styles.css'
   ========================================================================= */

const CATS = [
  { key: 'bg', label: 'Background', type: 'color' },
  { key: 'skin', label: 'Skin', type: 'color' },
  { key: 'hairColor', label: 'Hair color', type: 'color' },
  { key: 'hair', label: 'Hair', type: 'shape' },
  { key: 'eyes', label: 'Eyes', type: 'shape' },
  { key: 'mouth', label: 'Mouth', type: 'shape' },
];

export default function AvatarBuilder({
  value,
  defaultValue,
  onChange,
  size = 200,
  showActions = true,
  className = '',
}) {
  const isControlled = value != null;
  const [internal, setInternal] = useState(() => ({ ...defaultAvatar, ...defaultValue }));
  const [active, setActive] = useState(CATS[0].key);
  const config = { ...defaultAvatar, ...(isControlled ? value : internal) };

  const commit = useCallback((next) => {
    if (!isControlled) setInternal(next);
    if (onChange) onChange(next, { svg: avatarToSvg(next, { size }) });
  }, [isControlled, onChange, size]);

  const setKey = (key, v) => commit({ ...config, [key]: v });

  const randomize = () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const next = {};
    for (const c of CATS) next[c.key] = pick(AVATAR_OPTIONS[c.key]);
    commit(next);
  };

  const cat = CATS.find((c) => c.key === active) || CATS[0];

  return (
    <div className={('ab-root ' + className).trim()}>
      <div className="ab-stage">
        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          role="img"
          aria-label="Avatar preview"
          className="ab-avatar"
          dangerouslySetInnerHTML={{ __html: innerSvg(config) }}
        />
        {showActions && (
          <button type="button" className="ab-shuffle" onClick={randomize} aria-label="Randomize" title="Randomize">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
              <path d="m18 2 4 4-4 4" />
              <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
              <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
              <path d="m18 14 4 4-4 4" />
            </svg>
          </button>
        )}
      </div>

      <div className="ab-tabs" role="tablist" aria-label="Avatar parts">
        {CATS.map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={c.key === active}
            className={'ab-tab' + (c.key === active ? ' on' : '')}
            onClick={() => setActive(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="ab-panel" role="group" aria-label={cat.label}>
        {AVATAR_OPTIONS[cat.key].map((opt) => {
          const on = opt === config[cat.key];
          if (cat.type === 'color') {
            return (
              <button
                key={opt}
                type="button"
                className={'ab-swatch' + (on ? ' on' : '')}
                style={{ background: opt }}
                aria-label={opt}
                aria-pressed={on}
                onClick={() => setKey(cat.key, opt)}
              />
            );
          }
          return (
            <button
              key={opt}
              type="button"
              className={'ab-tile' + (on ? ' on' : '')}
              aria-label={opt}
              aria-pressed={on}
              onClick={() => setKey(cat.key, opt)}
            >
              <svg
                viewBox="0 0 200 200"
                width="52"
                height="52"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: innerSvg({ ...config, [cat.key]: opt }) }}
              />
            </button>
          );
        })}
      </div>

      {showActions && (
        <div className="ab-actions">
          <button type="button" className="ab-btn ab-ghost" onClick={() => commit({ ...defaultAvatar })}>Reset</button>
        </div>
      )}
    </div>
  );
}
