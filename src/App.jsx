import { AvatarBuilder } from './lib/index.js';
import './lib/styles.css';
import './page.css';

/* The live site is the package's editor, full page, remembering the look in this browser. */
export default function App() {
  return <AvatarBuilder className="ab-page" persist="avatars.paulelite.com" />;
}
