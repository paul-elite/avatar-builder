import { useState, useEffect, useCallback } from 'react';
import { AVATAR_OPTIONS, defaultAvatar, innerSvg, avatarToSvg } from './avatar.js';
import { downloadSvg, downloadPng } from './export.js';

/* =========================================================================
   <AvatarBuilder /> — a drop-in React component with a centered layout:
   a large preview up top (with a floating randomize button), a category
   switcher, one centered row of options at a time (live preview tiles for
   shapes, swatches for colors), a bottom-sheet custom color picker, and
   export (SVG / PNG) + reset actions.

   Props:
     value?        controlled config (omit for uncontrolled)
     defaultValue? initial config when uncontrolled
     onChange?     (config, { svg }) => void   — fires on every edit
     size?         preview size in px (default 200)
     exportSize?   exported PNG/SVG size in px (default 512)
     showActions?  show randomize / export / reset (default true)
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
  exportSize = 512,
  showActions = true,
  className = '',
}) {
  const isControlled = value != null;
  const [internal, setInternal] = useState(() => ({ ...defaultAvatar, ...defaultValue }));
  const [active, setActive] = useState(CATS[0].key);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState('');
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

  // Close the sheet on Escape.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setSheetOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const openSheet = () => {
    setHexDraft((config[cat.key] || '').replace('#', ''));
    setSheetOpen(true);
  };
  const onHex = (raw) => {
    const clean = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    setHexDraft(clean);
    if (clean.length === 6) setKey(cat.key, '#' + clean);
  };
  const onColorInput = (hex) => {
    setHexDraft(hex.replace('#', ''));
    setKey(cat.key, hex);
  };

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
        {cat.type === 'color' && (
          <button type="button" className="ab-swatch ab-custom" aria-label="Custom color" onClick={openSheet}>
            <span className="ab-plus" aria-hidden="true">+</span>
          </button>
        )}
      </div>

      {showActions && (
        <div className="ab-footer">
          <div className="ab-actions">
            <button type="button" className="ab-btn" onClick={() => downloadPng(config, { size: exportSize })}>Download PNG</button>
            <button type="button" className="ab-btn ab-ghost" onClick={() => downloadSvg(config, { size: exportSize })}>SVG</button>
          </div>
          <button type="button" className="ab-reset" onClick={() => commit({ ...defaultAvatar })}>Reset</button>
        </div>
      )}

      {sheetOpen && (
        <div className="ab-sheet-root" role="dialog" aria-modal="true" aria-label={'Edit ' + cat.label.toLowerCase()}>
          <div className="ab-sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="ab-sheet">
            <div className="ab-sheet-grip" aria-hidden="true" />
            <div className="ab-sheet-head">
              <span className="ab-sheet-title">Edit {cat.label.toLowerCase()}</span>
              <button type="button" className="ab-sheet-close" onClick={() => setSheetOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="ab-sheet-pick">
              <input
                type="color"
                className="ab-color"
                value={config[cat.key]}
                onChange={(e) => onColorInput(e.target.value)}
                aria-label="Pick a color"
              />
              <div className="ab-hex">
                <span>#</span>
                <input
                  type="text"
                  value={hexDraft}
                  onChange={(e) => onHex(e.target.value)}
                  spellCheck={false}
                  maxLength={6}
                  aria-label="Hex color"
                />
              </div>
            </div>
            <div className="ab-sheet-swatches">
              {AVATAR_OPTIONS[cat.key].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={'ab-swatch' + (opt === config[cat.key] ? ' on' : '')}
                  style={{ background: opt }}
                  aria-label={opt}
                  onClick={() => { setHexDraft(opt.replace('#', '')); setKey(cat.key, opt); }}
                />
              ))}
            </div>
            <button type="button" className="ab-btn ab-sheet-done" onClick={() => setSheetOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
