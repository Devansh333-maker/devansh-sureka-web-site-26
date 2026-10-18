// Page-wide arrow keys (carousels, the magazine) should only react when the key isn't
// meant for something else: typing in search, scrubbing a video or a slider, switching
// tabs, or a shortcut with Ctrl/Alt/Shift held.
export function ignoreKey(e: KeyboardEvent) {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return true;
  const el = e.target as HTMLElement | null;
  return !!el && (el.isContentEditable || !!el.closest?.('input, textarea, select, video, audio, [role="slider"], [role="tablist"]'));
}
