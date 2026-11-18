import { AvatarBuilder } from './lib/index.js';
import './lib/styles.css';
import './page.css';

/* The live site is the package's editor, full page, remembering the look in this browser. */
// Sample: every bar dark. ?tabs=light shows the light bars for comparison.
const tabs = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tabs')) || 'dark';

export default function App() {
  return <AvatarBuilder className="ab-page" backdrop="circle" persist="avatars.paulelite.com" tabs={tabs} />;
}
