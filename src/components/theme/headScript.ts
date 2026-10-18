// Runs in the page head before first paint (plain module, not a client component, so the
// server layout gets the actual text). Sets the theme and the motion switch from what the
// visitor chose before, falling back to their device settings.
export const HEAD_SCRIPT = [
  `try{var t=localStorage.getItem('ds-theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}`,
  `try{var m=localStorage.getItem('ds-motion');if(m!=='on'&&m!=='off')m=matchMedia('(prefers-reduced-motion: reduce)').matches?'off':'on';document.documentElement.dataset.motion=m}catch(e){}`,
].join(';');
