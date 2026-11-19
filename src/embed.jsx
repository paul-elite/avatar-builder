import { createRoot } from 'react-dom/client';
import css from './lib/styles.css?inline';
import AvatarBuilder from './lib/AvatarBuilder.jsx';
import { avatarToSvg, avatarToDataUri } from './lib/avatar.js';
import { readAvatar, loadAvatar, toAvatarDocument, encodeAvatar, decodeAvatar, normalizeAvatar } from './lib/document.js';
import { avatarFromSeed, avatarFromUser, seedFromUser } from './lib/seed.js';

/* =========================================================================
   Drop-in for any website, no build step:

     <script src="https://avatars.paulelite.com/embed.js" defer></script>

     <avatar-image seed="user_42" size="48"></avatar-image>
     <avatar-image src="https://avatars.paulelite.com/a/u_1dz58yaqlv3.svg"></avatar-image>

     <avatar-builder template="https://…/their-avatar.svg" name="avatar"></avatar-builder>
       · template: an avatar to start from (URL, SVG markup, ?avatar= code, or seed:<seed>)
       · name:     inside a <form>, submits the avatar as JSON (the document)
       · persist:  a storage key to remember the look in this browser
       · fires `change` with detail { config, svg, document, code }
       · .value / .svg read the current avatar; .value = … loads one

   window.AvatarKit has the headless functions (readAvatar, avatarFromSeed, …).
   ========================================================================= */

let styled = false;
function injectStyles() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const el = document.createElement('style');
  el.setAttribute('data-avatar-builder', '');
  el.textContent = css;
  document.head.appendChild(el);
}

// Any template form an attribute can hold → something AvatarBuilder's `template` accepts
function templateFrom(attr) {
  if (!attr) return undefined;
  const t = attr.trim();
  if (t.startsWith('seed:')) return avatarFromSeed(t.slice(5));
  if (/^(https?:)?\/\/|^\//.test(t) || t.startsWith('<') || t.startsWith('{') || t.startsWith('data:')) return t;
  return decodeAvatar(t) || undefined; // an ?avatar= code
}

class AvatarBuilderElement extends HTMLElement {
  static get observedAttributes() { return ['template']; }
  connectedCallback() {
    injectStyles();
    if (!this._mount) {
      this._mount = document.createElement('div');
      this.appendChild(this._mount);
      this._root = createRoot(this._mount);
    }
    if (this.getAttribute('name') && !this._input) {
      this._input = document.createElement('input');
      this._input.type = 'hidden';
      this._input.name = this.getAttribute('name');
      this.appendChild(this._input);
    }
    this._render();
  }
  disconnectedCallback() {
    // Unmount after the current task, so moving the element in the DOM doesn't tear it down
    queueMicrotask(() => { if (!this.isConnected && this._root) { this._root.unmount(); this._root = null; this._mount = null; } });
  }
  attributeChangedCallback() { if (this._root) { this._key = (this._key || 0) + 1; this._render(); } }
  _render() {
    const onChange = (config, meta) => {
      this._config = config;
      if (this._input) this._input.value = JSON.stringify(meta.document);
      this.dispatchEvent(new CustomEvent('change', { detail: { config, ...meta }, bubbles: true }));
    };
    const template = this._template !== undefined ? this._template : templateFrom(this.getAttribute('template'));
    this._config = template && typeof template === 'object' ? template : this._config;
    if (this._input && this._config) this._input.value = JSON.stringify(toAvatarDocument(this._config));
    this._root.render(
      <AvatarBuilder
        key={this._key || 0}
        template={template}
        persist={this.getAttribute('persist') || undefined}
        backdrop={this.getAttribute('backdrop') || 'circle'}
        showActions={this.getAttribute('actions') !== 'false'}
        onChange={onChange}
      />,
    );
  }
  get value() { return this._config ? normalizeAvatar(this._config) : null; }
  set value(v) { this._template = readAvatar(v) || undefined; this._config = this._template; this._key = (this._key || 0) + 1; if (this._root) this._render(); }
  get svg() { return this._config ? avatarToSvg(this._config) : null; }
  get document() { return this._config ? toAvatarDocument(this._config) : null; }
}

class AvatarImageElement extends HTMLElement {
  static get observedAttributes() { return ['seed', 'user', 'value', 'src', 'size', 'alt']; }
  connectedCallback() { this._draw(); }
  attributeChangedCallback() { if (this.isConnected) this._draw(); }
  async _draw() {
    const size = Math.max(16, Math.min(2048, Number(this.getAttribute('size')) || 64));
    let config = null;
    const src = this.getAttribute('src');
    const value = this.getAttribute('value');
    if (value) config = readAvatar(value) || decodeAvatar(value);
    else if (this.getAttribute('seed')) config = avatarFromSeed(this.getAttribute('seed'));
    else if (this.getAttribute('user')) config = avatarFromUser(this.getAttribute('user')).config;
    else if (src) { try { config = await loadAvatar(src); } catch { config = null; } }
    const img = this.querySelector('img') || this.appendChild(document.createElement('img'));
    Object.assign(img, { width: size, height: size, alt: this.getAttribute('alt') || '' });
    img.style.borderRadius = '50%';
    img.style.display = 'block';
    img.src = avatarToDataUri(config || avatarFromSeed('anon'), { size });
    this._config = config;
  }
  get value() { return this._config || null; }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('avatar-builder')) customElements.define('avatar-builder', AvatarBuilderElement);
  if (!customElements.get('avatar-image')) customElements.define('avatar-image', AvatarImageElement);
}

const AvatarKit = { readAvatar, loadAvatar, normalizeAvatar, toAvatarDocument, encodeAvatar, decodeAvatar, avatarToSvg, avatarToDataUri, avatarFromSeed, avatarFromUser, seedFromUser };
if (typeof window !== 'undefined') window.AvatarKit = AvatarKit;
export default AvatarKit;
