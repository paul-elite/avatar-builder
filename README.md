# avatar-builder

A tiny, drop-in **React avatar builder**. Pick a look — your app receives the
chosen config and a ready-to-use SVG. No dependencies beyond React.

**Live:** https://avatars.paulelite.com

## Install

From GitHub (no publish needed):

```bash
npm i github:paul-elite/avatar-builder
```

## Use

```jsx
import { AvatarBuilder } from 'avatar-builder';
import 'avatar-builder/styles.css';

function Profile() {
  return (
    <AvatarBuilder
      onChange={(config, { svg }) => {
        // config: the chosen look   ·   svg: a complete <svg> string
        saveToProfile(config);
      }}
    />
  );
}
```

Render a saved avatar anywhere, no UI:

```jsx
import { avatarToDataUri } from 'avatar-builder';

<img src={avatarToDataUri(config)} width={48} height={48} alt="" />
```

## `<AvatarBuilder>` props

| Prop          | Type                                 | Default | Description                                   |
| ------------- | ------------------------------------ | ------- | --------------------------------------------- |
| `value`       | `AvatarConfig`                       | —       | Controlled config. Omit for uncontrolled.     |
| `defaultValue`| `AvatarConfig`                       | —       | Initial config when uncontrolled.             |
| `onChange`    | `(config, { svg }) => void`          | —       | Fires on every edit.                          |
| `size`        | `number`                             | `240`   | Preview size in px.                           |
| `backdrop`    | `'plain' \| 'circle'`                 | `'plain'` | `'circle'` puts the preview on a white circle and drops its shadow (exports keep it). |
| `persist`     | `string`                             | —       | Storage key: remember the look in this browser. |
| `exportSize`  | `number`                             | `512`   | Exported PNG size in px.                      |
| `showActions` | `boolean`                            | `true`  | Show shuffle / download in the toolbar.       |
| `className`   | `string`                             | `''`    | Extra class on the root element.              |

## How the editor works

One editor that starts broad and reveals detail only when it's relevant:

1. **Setup:** the foundation, category and style (one option each for now).
   Shown on the first visit, then reachable from the chip at the top.
2. **The default toolbar:** the Figma Frame 4 skin bar: undo/redo, the four
   head fills and the colour wheel (which opens the skin colour row and grid).
   It's the floor: there's no × on it, and closing anything always comes back
   here. Tap the face to open **all the categories:** Skin · Head · Hair · Face ·
   Eyes · Features · Torso, plus shuffle and download.
3. **Inside a category:** its items, e.g. Hair → Style, Colour, Headwear.
   Items that don't apply stay hidden: hair colour until there is hair, tongue
   colour until the mouth shows one, and Body, Outfit, Outfit colour and Details
   until Torso is set to *With torso* (choosing *Head only* hides them again).
4. **An item:** its options, each drawn as the item itself; colours as a row,
   with an "all colours" grid behind it.

Tap any part of the avatar to jump straight to its editor: the cap opens
Hair · Headwear, the glasses Eyes · Glasses, the face opens all the categories, and so on. Tap
the background (the circle on the live page) to change its colour.

One floating toolbar shows the current level, with a label above it; inside an
item the label becomes a toggle of the category's items (Style | Colour |
Headwear) to switch straight between them. At most one tray shows behind it. Going deeper sinks it into the stack behind; × or Escape closes the level
and the one below rises back. Selections persist across every move (and, with
`persist`, across visits); undo/redo count changes to the avatar only.

The head, cap, glasses, eyes, brows, nose, blush, tears, tongue and frown come
from the Avatars Figma file. Hair, the round and square heads, ears, the drawn eye set, the torso and outfits are drawn to match,
as placeholders for Figma art.

## Headless helpers

```js
import {
  avatarToSvg,      // (config, { size }) => string  — full <svg> document
  avatarToDataUri,  // (config, { size }) => string  — base64 data: URI
  downloadSvg,      // (config, { size, filename }) — download as .svg
  downloadPng,      // (config, { size, filename }) => Promise — download as .png
  randomAvatar,     // () => config
  defaultAvatar,    // the default config (the Figma avatar)
  AVATAR_OPTIONS,   // every field's choices, for building your own UI
  GROUPS, PARTS,    // the builder's structure
} from 'avatar-builder';
```

## Config shape

```ts
type AvatarConfig = {
  category: 'person';          // setup (more to come)
  style: 'outline';            // setup (more to come)
  bg: string;                  // background colour, or 'transparent' (tap the background to change it)
  shadow: boolean;
  skin: string;
  head: 'classic' | 'round' | 'square';   // classic = the Figma head, ears built in
  ears: 'none' | 'small' | 'regular' | 'big'; // for round / square heads
  tilt: 'straight' | 'left' | 'right';
  hair: 'none' | 'short' | 'bangs' | 'sidebob' | 'curly' | 'long' | 'bun' | 'underhat';
  hairColor: string;
  cap: string | null;          // headwear colour; null = none
  eyes: 'open' | 'round' | 'wide' | 'big' | 'side' | 'up' | 'sleepy' | 'peek' | 'angry'
      | 'skeptical' | 'bored' | 'happy' | 'sad' | 'closed' | 'wink' | 'flat' | 'squeeze' | 'dead' | 'dots';
  glasses: string | null;
  tears: string | null;
  brows: 'none' | 'raised' | 'flat' | 'worried';
  mouth: 'tongue' | 'smile' | 'open' | 'frown' | 'none';
  tongue: string;
  nose: 'hook' | 'dot' | 'none';
  blush: string | null;
  torso: boolean;              // false = head only
  body: 'slim' | 'regular' | 'broad';
  outfit: 'tee' | 'hoodie' | 'shirt';
  outfitColor: string;
  detail: 'none' | 'pocket' | 'stripe';
};
```

**0.3.0** adds setup, hair, the torso and outfits, and the progressive editor;
0.2.x configs still render (new fields fall back to defaults). Configs from
0.1.x render too: unknown fields are ignored.

## License

MIT
