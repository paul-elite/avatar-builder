import { useState, useCallback } from 'react';
import { AVATAR_OPTIONS, defaultAvatar, innerSvg, avatarToSvg } from './avatar.js';

/* =========================================================================
   <AvatarBuilder /> — a drop-in React component.

   Props:
     value?        controlled config (omit for uncontrolled)
     defaultValue? initial config when uncontrolled
     onChange?     (config, { svg }) => void   — fires on every edit
     size?         preview size in px (default 220)
     showActions?  show Randomize / Reset (default true)
     className?    extra class on the root

   Import the stylesheet once in your app: import 'avatar-builder/styles.css'
   ========================================================================= */

const ORDER = ['bg', 'skin', 'hairColor', 'hair', 'eyes', 'mouth'];
const LABELS = { bg: 'Background', skin: 'Skin', hairColor: 'Hair color', hair: 'Hair', eyes: 'Eyes', mouth: 'Mouth' };
const COLOR_ROWS = new Set(['bg', 'skin', 'hairColor']);

export default function AvatarBuilder({
  value,
  defaultValue,
  onChange,
  size = 220,
  showActions = true,
  className = '',
}) {
  const isControlled = value != null;
  const [internal, setInternal] = useState(() => ({ ...defaultAvatar, ...defaultValue }));
  const config = { ...defaultAvatar, ...(isControlled ? value : internal) };

  const commit = useCallback((next) => {
    if (!isControlled) setInternal(next);
    if (onChange) onChange(next, { svg: avatarToSvg(next, { size }) });
  }, [isControlled, onChange, size]);

  const setKey = (key, v) => commit({ ...config, [key]: v });

  const randomize = () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const next = {};
    for (const k of ORDER) next[k] = pick(AVATAR_OPTIONS[k]);
    commit(next);
  };

  return (
    <div className={('ab-root ' + className).trim()}>
      <div className="ab-stage">
        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          role="img"
          aria-label="Avatar"
          className="ab-avatar"
          dangerouslySetInnerHTML={{ __html: innerSvg(config) }}
        />
      </div>

      <div className="ab-controls">
        {ORDER.map((key) => (
          <div className="ab-row" key={key}>
            <span className="ab-label">{LABELS[key]}</span>
            <div className="ab-opts">
              {AVATAR_OPTIONS[key].map((opt) =>
                COLOR_ROWS.has(key) ? (
                  <button
                    key={opt}
                    type="button"
                    className={'ab-swatch' + (opt === config[key] ? ' on' : '')}
                    style={{ background: opt }}
                    aria-label={opt}
                    aria-pressed={opt === config[key]}
                    onClick={() => setKey(key, opt)}
                  />
                ) : (
                  <button
                    key={opt}
                    type="button"
                    className={'ab-chip' + (opt === config[key] ? ' on' : '')}
                    aria-pressed={opt === config[key]}
                    onClick={() => setKey(key, opt)}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {showActions && (
        <div className="ab-actions">
          <button type="button" className="ab-btn" onClick={randomize}>Randomize</button>
          <button type="button" className="ab-btn ab-ghost" onClick={() => commit({ ...defaultAvatar })}>Reset</button>
        </div>
      )}
    </div>
  );
}
