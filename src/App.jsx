import { AvatarBuilder, decodeAvatar, avatarFromSeed } from './lib/index.js';
import './lib/styles.css';
import './page.css';

/* The live site is the package's editor, full page, remembering the look in this browser.
   Links open an avatar to edit from:  ?avatar=<code>  ·  ?seed=<seed>  ·  ?template=<svg url> */
const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const template = q.get('avatar') ? decodeAvatar(q.get('avatar')) || undefined
  : q.get('seed') ? avatarFromSeed(q.get('seed'))
    : q.get('template') || undefined;
// Once opened, the look is the user's: edits are remembered, so reloading shouldn't reset to the link
if (template && typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname);

export default function App() {
  return <AvatarBuilder className="ab-page" backdrop="circle" persist="avatars.paulelite.com" template={template} />;
}
