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
| `size`        | `number`                             | `200`   | Preview size in px.                           |
| `exportSize`  | `number`                             | `512`   | Exported PNG/SVG size in px.                   |
| `showActions` | `boolean`                            | `true`  | Show randomize / export / reset actions.      |
| `className`   | `string`                             | `''`    | Extra class on the root element.              |

## Headless helpers

```js
import {
  avatarToSvg,      // (config, { size }) => string  — full <svg> document
  avatarToDataUri,  // (config, { size }) => string  — base64 data: URI
  downloadSvg,      // (config, { size, filename }) — download as .svg
  downloadPng,      // (config, { size, filename }) => Promise — download as .png
  defaultAvatar,    // the default config
  AVATAR_OPTIONS,   // { bg, skin, hairColor, hair, eyes, mouth } option lists
} from 'avatar-builder';
```

The built-in builder already shows **Download PNG / SVG** buttons and a
**custom-color picker** (a bottom sheet with a hex input) on each color
category — use `showActions={false}` to hide the action bar and wire your own.

## Config shape

```ts
type AvatarConfig = {
  bg: string;         // background color
  skin: string;       // skin color
  hairColor: string;  // hair color
  hair: 'none' | 'short' | 'bun' | 'long';
  eyes: 'dots' | 'happy' | 'glasses';
  mouth: 'smile' | 'neutral' | 'open';
};
```

## License

MIT
