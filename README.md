# avatar-builder

A tiny, drop-in **React avatar builder**. Pick a look — your app receives the
chosen config and a ready-to-use SVG. No dependencies beyond React.

**Live demo:** https://avatar-builder-phi.vercel.app

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
| `size`        | `number`                             | `220`   | Preview size in px.                           |
| `exportSize`  | `number`                             | `512`   | Exported PNG size in px.                      |
| `showActions` | `boolean`                            | `true`  | Show shuffle / download in the toolbar.       |
| `className`   | `string`                             | `''`    | Extra class on the root element.              |

## How the builder works

The avatar sits on its background, with one floating toolbar under it that
goes three levels deep:

1. **Groups:** Background · Face · Outfit (plus shuffle and download)
2. **Parts:** Background → Color, Shadow · Face → Skin, Eyes, Brows, Nose,
   Mouth, Blush, Tears · Outfit → Cap, Glasses
3. **Options:** that part's variants as tiles, and a color wheel (custom hex)
   for every part that takes a color

Undo/redo sit at the start of every level. The round × under the toolbar (or
Escape) closes the current level back to the one above; closed levels stay
stacked behind the toolbar.

The art comes from the Avatars Figma file: an outlined head with a soft
offset shadow, and parts exported from it (cap, round glasses, open and closed
eyes, brows, nose, blush, tears, tongue, frown) plus a few drawn to match
(wink and dot eyes, flat and worried brows, smile and open mouths).

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
  bg: string;                 // background color, or 'transparent'
  shadow: boolean;            // the soft offset shadow
  skin: string;               // head fill
  eyes: 'open' | 'closed' | 'wink' | 'dots';
  brows: 'none' | 'raised' | 'flat' | 'worried';
  nose: 'hook' | 'dot' | 'none';
  mouth: 'tongue' | 'smile' | 'open' | 'frown' | 'none';
  tongue: string;             // tongue color (tongue and open mouths)
  blush: string | null;       // null = none
  tears: string | null;
  cap: string | null;         // cap color; the brim is a lighter tint
  glasses: string | null;     // glasses color
};
```

**0.2.0** changes the config shape and the look. Configs saved with 0.1.x
(`hair`, `hairColor`, …) still render: unknown fields are ignored and missing
ones fall back to the defaults.

## License

MIT
