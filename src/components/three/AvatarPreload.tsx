// The avatar, hinted with two <link rel=preload> tags carrying media queries: the browser
// fetches only the one matching the screen (the full model on laptops, the half-texture copy
// on phones). React hoists them into <head>. Keep PHONE in step with Avatar.tsx.
const PHONE = '(max-width: 760px), (hover: none) and (pointer: coarse)';
const DESKTOP = '(min-width: 761px) and (hover: hover), (min-width: 761px) and (pointer: fine)';

export function AvatarPreload() {
  return (
    <>
      <link rel="preload" as="fetch" crossOrigin="anonymous" href="/models/avatar/devansh-guide-lite.glb" media={PHONE} />
      <link rel="preload" as="fetch" crossOrigin="anonymous" href="/models/avatar/devansh-guide.glb" media={DESKTOP} />
    </>
  );
}
