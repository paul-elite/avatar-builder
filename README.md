# avatar-builder

A tiny, drop-in **React avatar builder**. Pick a look — your app receives the
chosen config and a ready-to-use SVG. No dependencies beyond React.

**Live:** https://avatars.paulelite.com · **Developer docs:** https://avatars.paulelite.com/docs/

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

## Avatars on demand (HTTP API)

Give every user an avatar before they've made one. The same seed always gives the
same face, so you can store nothing and still show a stable avatar.

```html
<img src="https://avatars.paulelite.com/a/user_42.svg" width="48" height="48" alt="">
```

| Request | Returns |
| --- | --- |
| `GET /a/<seed>.svg` | The avatar as `image/svg+xml` |
| `GET /a/<seed>.json` | `{ seed, url, editUrl, config, document, svg }` |
| `GET /api/avatar?id=42` (or `email`, `username`, `name`) | The SVG for that user. The value is hashed into the seed, so it never appears in the image URL |
| `GET /api/avatar?seed=x&hair=mop&skin=f3d2b9` | The generated look with some fields pinned |
| `GET /api/avatar?avatar=<code>` | An exact look, from a share code |
| `POST /api/avatar` `{ "user": { "id": 42, "avatar": {...saved} } }` | One avatar as JSON. A saved `avatar` wins over the generated look |
| `POST /api/avatar` `{ "users": [ ... ] }` | Up to 100 at once |

Query options: `size` (16–2048, default 256), `format=json`, `download=1`.
Responses are CORS-enabled and cached.

User metadata is only used to choose a seed. Profile fields such as name, gender or
age are never used to guess what someone looks like. If you know a user's
choices, pass them explicitly as `avatar`.

## The portable avatar (edit it again anywhere)

Every avatar, whether made by the editor, the library or the API, is an SVG that
carries its own description:

```xml
<svg … data-avatar-format="avatar-builder/1">
  <metadata><avatar-builder>{"format":"avatar-builder","version":1,"config":{…},"seed":"…"}</avatar-builder></metadata>
  <g data-layer="background">…</g>
  <g data-layer="avatar"><g data-part="skin">…</g><g data-part="eyes">…</g><g data-part="hair">…</g>…</g>
</svg>
```

So an avatar already saved or embedded on another website is also a template.
Hand that SVG (or its URL) back to the editor and the user carries on from that
exact look:

```js
import { readAvatar, loadAvatar } from 'avatar-builder';

readAvatar(svgString)          // → config, also from an <svg> element, a data URI, a document, JSON or a partial config
await loadAvatar(url)          // → fetch an avatar SVG and read it
```

Everything read is validated: unknown shapes fall back to defaults, and colours
must be plain hex values. This makes it safe to accept avatars from users.

Shareable links use a short code: `https://avatars.paulelite.com/?avatar=<code>`
(`encodeAvatar` / `decodeAvatar`). The site's ⋮ menu has **Copy link**.

## Embed on any website (no build step)

```html
<script src="https://avatars.paulelite.com/embed.js" defer></script>

<!-- show avatars -->
<avatar-image seed="user_42" size="48"></avatar-image>
<avatar-image src="https://avatars.paulelite.com/a/user_42.svg"></avatar-image>

<!-- let users create or edit theirs, starting from any avatar -->
<form>
  <avatar-builder name="avatar" template="https://avatars.paulelite.com/a/user_42.svg"></avatar-builder>
</form>
```

- `template`: where to start editing from. It accepts an avatar URL, SVG markup, an `?avatar=` code, or `seed:<seed>`.
- `name`: inside a form, submits the avatar document as JSON.
- `persist`: a storage key, to remember the look in that browser.
- **Event:** `change` fires with `event.detail = { config, svg, document, code }`.
- **Properties:** `.value`, `.svg` and `.document` read the current avatar; setting `.value` loads one.
- `window.AvatarKit` exposes the functions above (`readAvatar`, `avatarFromSeed`, …).

## React components

```jsx
import { Avatar, AvatarBuilder, avatarFromUser } from 'avatar-builder';

<Avatar user={{ id: user.id }} size={40} />            // generated, stable
<Avatar value={user.savedAvatar} size={40} />          // a saved config, document or SVG
<AvatarBuilder template={user.savedAvatar ?? avatarFromUser(user).config}
               onChange={(config, { svg, document }) => save(document)} />
```

## `<AvatarBuilder>` props

| Prop          | Type                                 | Default | Description                                   |
| ------------- | ------------------------------------ | ------- | --------------------------------------------- |
| `value`       | `AvatarConfig`                       | —       | Controlled config. Omit for uncontrolled.     |
| `defaultValue`| `AvatarConfig`                       | —       | Initial config when uncontrolled.             |
| `template`    | SVG / URL / document / config        | —       | Start editing from an existing avatar; wins over `persist`, skips setup, and **Start over** returns to it. |
| `onChange`    | `(config, { svg, document, code }) => void` | — | Fires on every edit. `svg` carries the document, so it can be reopened as a template. |
| `size`        | `number`                             | `240`   | Preview size in px.                           |
| `backdrop`    | `'plain' \| 'circle'`                 | `'plain'` | `'circle'` puts the preview on a white circle and drops its shadow (exports keep it). |
| `persist`     | `string`                             | —       | Storage key: remember the look in this browser. |
| `exportSize`  | `number`                             | `512`   | Exported PNG size in px.                      |
| `showActions` | `boolean`                            | `true`  | Show the download button in the toolbar.      |
| `className`   | `string`                             | `''`    | Extra class on the root element.              |

## How the editor works

One editor that starts broad and reveals detail only when it's relevant:

1. **Setup:** the foundation, category and style (one option each for now).
   Shown on the first visit, then reachable from the chip at the top.
2. **The default toolbar** (dark, from the Figma "2 · Default toolbar"): undo/redo
   in a recessed well, Face · Hair · Outfit · Frame as small heads (the category
   you last opened sits on a light tile), and download. It's the floor: there's no
   × on it, and closing anything always comes back here.
   - Face: skin, head shape, ears, tilt, and Features
   - Features (inside Face), organ by organ: Eyes (shape, look, brows, glasses, tears) ·
     Mouth (shape, tongue) · Nose · Cheeks (blush) · Hands
   - Hair: style, colour, headwear, hat
   - Outfit: head only / with torso, then body, outfit, colour, details
   - Frame: the colour of the round background (the avatar always sits in a circle)
3. **Inside a category:** its items, e.g. Hair → Style, Colour, Headwear.
   Items that don't apply stay hidden: hair colour until there is hair, tongue
   colour until the mouth shows one, and Body, Outfit, Outfit colour and Details
   until Torso is set to *With torso* (choosing *Head only* hides them again).
   Categories and items show metaphorical line icons (a comb for Hair, a
   crown for Headwear, a lollipop for Tongue, a flower for Nose…), faded when
   that item is off.
4. **An item:** its options, each drawn as the item itself; colours as a row,
   with an "all colours" grid behind it. Long rows of shapes (eyes, mouths,
   hair…) scroll in about seven tiles' width and have an expand button that
   opens every option as a grid.

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
  frame: 'circle';             // always round now; older values render as a circle
  shadow: boolean;
  skin: string;
  head: 'classic' | 'round' | 'square';   // classic = the Figma head, ears built in
  ears: 'none' | 'small' | 'regular' | 'big'; // for round / square heads
  tilt: 'straight' | 'left' | 'right';
  hair: 'none' | 'short' | 'bangs' | 'sidebob' | 'curly' | 'long' | 'bun' | 'underhat';
  hairColor: string;
  cap: string | null;          // headwear colour; null = none
  hat: 'cap' | 'side' | 'beanie'; // which headwear, when cap isn't null
  eyes: 'open' | 'round' | 'wide' | 'big' | 'side' | 'up' | 'sleepy' | 'peek' | 'angry'
      | 'skeptical' | 'bored' | 'happy' | 'sad' | 'closed' | 'wink' | 'flat' | 'squeeze' | 'dead' | 'dots';
  gaze: 'left' | 'center' | 'right'; // where the pupils look (eye styles with pupils)
  glasses: string | null;
  tears: string | null;
  brows: 'none' | 'raised' | 'flat' | 'worried';
  mouth: 'tongue' | 'smile' | 'smirk' | 'open' | 'o' | 'frown' | 'wobble' | 'none';
  tongue: string;
  nose: 'hook' | 'dot' | 'tick' | 'none';
  blush: string | null;
  gesture: 'none' | 'nose' | 'chin'; // hands: finger to the nose, hand under the chin
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
