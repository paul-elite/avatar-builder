import { useState, useEffect, useCallback, useRef } from 'react';
import { GROUPS, PARTS, VIEWS, defaultAvatar, innerSvg, headSwatchSvg, avatarToSvg, randomAvatar } from './avatar.js';
import { downloadPng } from './export.js';

/* =========================================================================
   <AvatarBuilder /> — the avatar on its background, and one floating toolbar
   that goes three levels deep (the Avatars Figma file):

     1. Groups      Background · Face · Outfit          (+ shuffle, download)
     2. Parts       e.g. Face → Skin, Eyes, Brows, Nose, Mouth, Blush, Tears
     3. Options     that part's variants, and a color wheel when it takes color

   Undo/redo sit at the start of every level. Below the toolbar, × closes the
   current level back to the one above ("there is always the option to close
   and close down to the primary base component"); closed levels stay stacked
   behind the toolbar as faded bars. Escape does the same as ×.

   Props:
     value?        controlled config (omit for uncontrolled)
     defaultValue? initial config when uncontrolled
     onChange?     (config, { svg }) => void   — fires on every edit
     size?         preview size in px (default 220)
     exportSize?   exported PNG size in px (default 512)
     showActions?  show shuffle / download (default true)
     className?    extra class on the root

   Import the stylesheet once in your app: import 'avatar-builder/styles.css'
   ========================================================================= */

const ICON = {
  undo: (
    <path d="M3 8h12a6 6 0 0 1 0 12h-4M7 4 5.85 4.88C3.95 6.32 3 7.04 3 8s.95 1.68 2.85 3.12L7 12" />
  ),
  redo: (
    <path d="M21 8H9a6 6 0 0 0 0 12h4M17 4l1.15.88C20.04 6.32 21 7.04 21 8s-.96 1.68-2.85 3.12L17 12" />
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  shuffle: (
    <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22M18 2l4 4-4 4M2 6h1.9c1.5 0 2.9.9 3.6 2.2M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8M18 14l4 4-4 4" />
  ),
  download: <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />,
};

function Glyph({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON[name]}
    </svg>
  );
}

/* A crop of the avatar for a tile */
function Mini({ config, view }) {
  return (
    <svg viewBox={VIEWS[view] || VIEWS.full} width="40" height="40" aria-hidden="true" dangerouslySetInnerHTML={{ __html: innerSvg(config) }} />
  );
}

// Face-part tiles show the bare face, so the part reads at 40px
const BARE = { cap: null, glasses: null, shadow: false };
const bare = (part, c) => (['cap', 'glasses', 'bg', 'shadow'].includes(part) ? c : { ...c, ...BARE });

function optionLabel(part, opt) {
  if (opt === null) return 'None';
  if (opt === true) return 'On';
  if (opt === false) return 'Off';
  return PARTS[part].kind === 'color' ? opt : String(opt).replace(/^./, (m) => m.toUpperCase());
}

export default function AvatarBuilder({
  value,
  defaultValue,
  onChange,
  size = 220,
  exportSize = 512,
  showActions = true,
  className = '',
}) {
  const isControlled = value != null;
  const [internal, setInternal] = useState(() => ({ ...defaultAvatar, ...defaultValue }));
  const config = { ...defaultAvatar, ...(isControlled ? value : internal) };

  // Where the toolbar is: [] → groups, [group] → parts, [group, part] → options
  const [path, setPath] = useState([]);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState('');
  const configRef = useRef(config);
  configRef.current = config;

  const emit = useCallback((next) => {
    if (!isControlled) setInternal(next);
    if (onChange) onChange(next, { svg: avatarToSvg(next, { size: exportSize }) });
  }, [isControlled, onChange, exportSize]);

  const commit = useCallback((next) => {
    setHistory((h) => ({ past: [...h.past.slice(-99), configRef.current], future: [] }));
    emit(next);
  }, [emit]);

  const undo = () => {
    if (!history.past.length) return;
    const prev = history.past[history.past.length - 1];
    setHistory({ past: history.past.slice(0, -1), future: [config, ...history.future] });
    emit(prev);
  };
  const redo = () => {
    if (!history.future.length) return;
    const next = history.future[0];
    setHistory({ past: [...history.past, config], future: history.future.slice(1) });
    emit(next);
  };

  const setKey = (key, v) => commit({ ...config, [key]: v });
  const back = useCallback(() => setPath((p) => p.slice(0, -1)), []);

  // Escape closes the sheet first, then steps the toolbar back a level
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (sheetOpen) setSheetOpen(false);
      else back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen, back]);

  const [groupKey, partKey] = path;
  const group = GROUPS.find((g) => g.key === groupKey);
  const part = partKey ? PARTS[partKey] : null;

  const openSheet = () => {
    setHexDraft(String(config[partKey] || '').replace('#', ''));
    setSheetOpen(true);
  };
  const onHex = (raw) => {
    const clean = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    setHexDraft(clean);
    if (clean.length === 6) setKey(partKey, '#' + clean);
  };

  /* ---- The current level's tiles ---- */
  let tiles;
  if (!group) {
    tiles = GROUPS.map((g) => (
      <button key={g.key} type="button" className="ab-tile" aria-label={g.label} title={g.label} onClick={() => setPath([g.key])}>
        {g.key === 'background' ? (
          <span className="ab-chip" style={{ background: config.bg }}>
            <Mini config={config} view="full" />
          </span>
        ) : (
          <Mini config={g.key === 'face' ? { ...config, ...BARE } : config} view={g.view} />
        )}
      </button>
    ));
  } else if (!part) {
    tiles = group.parts.map((k) => (
      <button key={k} type="button" className="ab-tile" aria-label={PARTS[k].label} title={PARTS[k].label} onClick={() => setPath([group.key, k])}>
        {k === 'skin' ? (
          <svg viewBox={VIEWS.face} width="40" height="40" aria-hidden="true" dangerouslySetInnerHTML={{ __html: headSwatchSvg(config.skin) }} />
        ) : k === 'bg' ? (
          <span className="ab-chip" style={{ background: config.bg }} />
        ) : (
          <Mini config={bare(k, config)} view={PARTS[k].view} />
        )}
      </button>
    ));
  } else {
    const opts = part.kind === 'color' ? (part.optional ? [null, ...part.presets] : part.presets) : part.options;
    tiles = opts.map((opt) => {
      const on = opt === config[partKey] || (opt && config[partKey] && String(opt).toLowerCase() === String(config[partKey]).toLowerCase());
      let face;
      if (partKey === 'skin') {
        face = <svg viewBox={VIEWS.face} width="40" height="40" aria-hidden="true" dangerouslySetInnerHTML={{ __html: headSwatchSvg(opt) }} />;
      } else if (partKey === 'bg') {
        face = <span className="ab-chip" style={{ background: opt }} />;
      } else {
        face = <Mini config={bare(partKey, { ...config, [partKey]: opt })} view={part.view} />;
      }
      return (
        <button
          key={String(opt)}
          type="button"
          className={'ab-tile' + (on ? ' on' : '')}
          aria-label={optionLabel(partKey, opt)}
          title={optionLabel(partKey, opt)}
          aria-pressed={!!on}
          onClick={() => setKey(partKey, opt)}
        >
          {face}
        </button>
      );
    });
  }

  const level = path.length;
  const levelLabel = part ? part.label : group ? group.label : 'Avatar';

  return (
    <div className={('ab-root ' + className).trim()} style={{ '--ab-bg': config.bg }}>
      <div className="ab-stage">
        <svg
          viewBox={VIEWS.full}
          width={size}
          height={size}
          role="img"
          aria-label="Avatar preview"
          className="ab-avatar"
          dangerouslySetInnerHTML={{ __html: innerSvg(config, { id: 'preview' }) }}
        />
      </div>

      <div className="ab-dock">
        <div className="ab-stack">
          {/* Closed levels, stacked behind the toolbar */}
          {Array.from({ length: level }, (_, i) => (
            <span key={i} className="ab-peek" style={{ '--depth': level - i }} aria-hidden="true" />
          ))}

          <div className="ab-bar" key={path.join('/') || 'root'} role="toolbar" aria-label={levelLabel}>
            <div className="ab-history">
              <button type="button" className="ab-icon" onClick={undo} disabled={!history.past.length} aria-label="Undo" title="Undo">
                <Glyph name="undo" />
              </button>
              <button type="button" className="ab-icon" onClick={redo} disabled={!history.future.length} aria-label="Redo" title="Redo">
                <Glyph name="redo" />
              </button>
            </div>

            <div className="ab-tiles">
              {tiles}
              {part && part.kind === 'color' && (
                <button type="button" className="ab-wheel" onClick={openSheet} aria-label="Custom color" title="Custom color">
                  <span aria-hidden="true" />
                </button>
              )}
              {level === 0 && showActions && (
                <>
                  <span className="ab-sep" aria-hidden="true" />
                  <button type="button" className="ab-icon" onClick={() => commit(randomAvatar())} aria-label="Shuffle" title="Shuffle">
                    <Glyph name="shuffle" />
                  </button>
                  <button type="button" className="ab-icon" onClick={() => downloadPng(config, { size: exportSize })} aria-label="Download PNG" title="Download PNG">
                    <Glyph name="download" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <button type="button" className="ab-close" data-show={level > 0 || undefined} onClick={back} aria-label={'Close ' + levelLabel.toLowerCase()} tabIndex={level > 0 ? 0 : -1}>
          <Glyph name="close" />
        </button>
      </div>

      {sheetOpen && part && (
        <div className="ab-sheet-root" role="dialog" aria-modal="true" aria-label={'Edit ' + part.label.toLowerCase()}>
          <div className="ab-sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="ab-sheet">
            <div className="ab-sheet-grip" aria-hidden="true" />
            <div className="ab-sheet-head">
              <span className="ab-sheet-title">{part.label} color</span>
              <button type="button" className="ab-sheet-close" onClick={() => setSheetOpen(false)} aria-label="Close">
                <Glyph name="close" />
              </button>
            </div>
            <div className="ab-sheet-pick">
              <input
                type="color"
                className="ab-color"
                value={/^#[0-9a-f]{6}$/i.test(config[partKey] || '') ? config[partKey] : '#000000'}
                onChange={(e) => { setHexDraft(e.target.value.replace('#', '')); setKey(partKey, e.target.value); }}
                aria-label="Pick a color"
              />
              <div className="ab-hex">
                <span>#</span>
                <input type="text" value={hexDraft} onChange={(e) => onHex(e.target.value)} spellCheck={false} maxLength={6} aria-label="Hex color" />
              </div>
            </div>
            <button type="button" className="ab-done" onClick={() => setSheetOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
