import type { ZoneId } from '@/components/world/zones';

// The cinematic frame of each place: the "real" version of the low-poly place on the
// island. Used by the arch on each place page, the arrival portal, the home page's place
// card and the Places panel preview. `sm` is a lighter cut for the small spots.
export const CINE: Record<ZoneId, string> = {
  workshop: '/opt/places/workshop.webp',
  studio: '/opt/places/studio.webp',
  commons: '/opt/places/commons.webp',
  arena: '/opt/places/arena.webp',
  press: '/opt/places/press.webp',
  notebook: '/opt/places/notebook.webp',
};

export const cineSmall = (id: ZoneId) => CINE[id].replace('.webp', '-sm.webp');

// A fast-travel into a place: the home page asks for it, the portal plays it, and the
// arch on the arriving page reports where the portal should land.
export type ArchTravel = { href: string; place: ZoneId; x: number; y: number };
export const ARCH_TRAVEL = 'arch:travel';
export const ARCH_READY = 'arch:ready';

declare global {
  interface Window {
    __archArrival?: boolean;
    // set once the first page is on screen; anything that mounts later arrived by an in-site link
    __siteBooted?: boolean;
  }
}
