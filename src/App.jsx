import { useState } from 'react';
import { AvatarBuilder } from './lib/index.js';
import './lib/styles.css';
import './demo.css';

/* The deployed site is the live demo/playground for the package. It consumes
   the exact component a host app would import. */

export default function App() {
  const [config, setConfig] = useState(null);

  return (
    <main className="demo">
      <header className="demo-head">
        <h1>Avatar Builder</h1>
        <p>A drop-in React component. Pick a look — your app receives the config and a ready-to-use SVG.</p>
      </header>

      <AvatarBuilder onChange={(c) => setConfig(c)} />

      <section className="demo-block">
        <h2>onChange payload</h2>
        <pre>{config ? JSON.stringify(config, null, 2) : 'Make a change above to see the config your app receives…'}</pre>
      </section>

      <section className="demo-block">
        <h2>Use it in your app</h2>
        <pre>{`npm i github:paul-elite/avatar-builder`}</pre>
        <pre>{`import { AvatarBuilder } from 'avatar-builder';
import 'avatar-builder/styles.css';

function Profile() {
  return (
    <AvatarBuilder
      onChange={(config, { svg }) => {
        // config: the chosen look  ·  svg: a complete <svg> string
        saveToProfile(config);
      }}
    />
  );
}`}</pre>
        <p className="demo-note">Render a saved avatar anywhere, or export it yourself:</p>
        <pre>{`import { avatarToDataUri, downloadSvg, downloadPng } from 'avatar-builder';

<img src={avatarToDataUri(config)} width={48} height={48} alt="" />

downloadPng(config, { size: 512 });   // or downloadSvg(config)`}</pre>
      </section>
    </main>
  );
}
