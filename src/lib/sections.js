import { ITEMS, HAT, CAP, OUTFIT } from './avatar.js';

/* =========================================================================
   How each category's bar is laid out (Figma 113:9122).

   A category bar has, left to right:
     · tabs, in a soft well: the category's main choices (Hair: Style · Wear)
     · the chosen tab's options, inline
     · tiles that open one more bar above it (its colour, the finer items)
     · ×
   A tile's bar sits on top; the category bar stays under it, fully drawn but
   muted, and the main bar folds into the tray beneath. Every bar is 64px tall.

   Section fields:
     key     the tab
     label   the tab's name
     item    the config field its inline options set (see optionsFor for the
             two that also switch something on: headwear and the torso)
     more    tiles after the options; 'features' opens the Features bar,
             any other key opens that item's bar
     when    (config) => bool: hide the tab until it applies
   ========================================================================= */

export const SECTIONS = {
  face: [
    { key: 'head', label: 'Shape', item: 'head', more: ['ears', 'features', 'skin'] },
    { key: 'tilt', label: 'Angle', item: 'tilt', more: ['features', 'skin'] },
  ],
  hair: [
    { key: 'hair', label: 'Style', item: 'hair', more: ['hairColor'] },
    { key: 'wear', label: 'Wear', item: 'hat', more: ['cap'] },
    { key: 'beard', label: 'Beard', item: 'beard', more: ['hairColor'] },
  ],
  outfit: [
    { key: 'outfit', label: 'Outfit', item: 'outfit', more: ['outfitColor'] },
    { key: 'body', label: 'Body', item: 'body', when: (c) => c.torso },
    { key: 'detail', label: 'Details', item: 'detail', when: (c) => c.torso },
  ],
  features: [
    { key: 'eyes', label: 'Eyes', item: 'eyes', more: ['gaze', 'brows', 'glasses', 'tears'] },
    { key: 'mouth', label: 'Mouth', item: 'mouth', more: ['tongue'] },
    { key: 'nose', label: 'Nose', item: 'nose' },
    { key: 'cheeks', label: 'Cheeks', item: 'blush' },
    { key: 'hands', label: 'Hands', item: 'gesture' },
  ],
  frame: [{ key: 'bg', label: 'Colour', item: 'bg' }],
};

// The colour a tab's icon wears while it's selected (Style shows the hair colour, and so on)
export const TAB_TINT = { head: 'skin', hair: 'hairColor', beard: 'hairColor', wear: 'cap', outfit: 'outfitColor' };

export const visibleSections = (cat, c) => (SECTIONS[cat] || []).filter((s) => !s.when || s.when(c));

// The tiles after a section's options that apply right now
export const visibleMore = (s, c) => (s.more || []).filter((k) => {
  if (k === 'features') return true;
  if (k === 'cap') return !!c.cap; // its colour only once something is worn
  const it = ITEMS[k];
  return !it.when || it.when(c);
});

/* A section's inline options: { options, value, pick(opt) → config changes }.
   Two of them also switch something on or off:
     Wear: none takes the headwear off; any hat puts it on (in the last colour, or the first)
     Outfit: none is head only; any outfit adds the torso */
export function optionsFor(s, c) {
  if (s.key === 'wear') {
    return { options: [null, ...HAT], value: c.cap ? c.hat : null, pick: (o) => (o === null ? { cap: null } : { hat: o, cap: c.cap || CAP[0] }) };
  }
  if (s.key === 'outfit') {
    return { options: [null, ...OUTFIT], value: c.torso ? c.outfit : null, pick: (o) => (o === null ? { torso: false } : { torso: true, outfit: o }) };
  }
  const it = ITEMS[s.item];
  if (it.kind === 'color') return { options: it.optional ? [null, ...it.presets] : it.presets, value: c[s.item], pick: (o) => ({ [s.item]: o }), colour: true };
  return { options: it.options, value: c[s.item], pick: (o) => ({ [s.item]: o }) };
}

/* Tapping the avatar opens the bar for what was tapped: [category, tab, item?] */
export const TARGETS = {
  skin: ['face', 'head'],
  ears: ['face', 'head', 'ears'],
  eyes: ['features', 'eyes'],
  glasses: ['features', 'eyes', 'glasses'],
  tears: ['features', 'eyes', 'tears'],
  brows: ['features', 'eyes', 'brows'],
  mouth: ['features', 'mouth'],
  nose: ['features', 'nose'],
  blush: ['features', 'cheeks'],
  hand: ['features', 'hands'],
  hair: ['hair', 'hair'],
  beard: ['hair', 'beard'],
  cap: ['hair', 'wear'],
  torso: ['outfit', 'outfit'],
  background: ['frame', 'bg'],
};

/* The level under a path: an item's bar sits on its category; Features sits on Face */
export const parentOf = (p) => {
  if (p[0] !== 'all') return [];
  if (p.length === 2) return p[1] === 'features' ? ['all', 'face'] : [];
  return p.slice(0, 2);
};
