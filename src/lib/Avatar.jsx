import { useMemo } from 'react';
import { avatarToDataUri } from './avatar.js';
import { readAvatar } from './document.js';
import { avatarFromSeed, avatarFromUser } from './seed.js';

/* =========================================================================
   <Avatar /> — show an avatar anywhere, no editor.

     <Avatar value={config} />            a saved config (or document / SVG string)
     <Avatar seed="user_42" />            generated on the spot, same seed → same face
     <Avatar user={{ id: 42 }} />         generated from a user record (see avatarFromUser)
     <Avatar user={user} value={saved} /> the user's saved look, falling back to theirs

   Renders an <img> with a data URI (so masks never clash between avatars), and the
   image is itself the portable SVG, editable again from any copy.
   ========================================================================= */
export default function Avatar({ value, seed, user, size = 64, alt = '', className = '', style, ...rest }) {
  const src = useMemo(() => {
    const saved = value != null ? readAvatar(value) : null;
    const config = saved || (seed != null ? avatarFromSeed(seed) : avatarFromUser(user ?? 'anon').config);
    return avatarToDataUri(config, { size });
  }, [typeof value === 'object' ? JSON.stringify(value) : value, seed, typeof user === 'object' ? JSON.stringify(user) : user, size]); // eslint-disable-line react-hooks/exhaustive-deps
  return <img src={src} width={size} height={size} alt={alt} className={className} style={{ borderRadius: '50%', ...style }} draggable={false} {...rest} />;
}
