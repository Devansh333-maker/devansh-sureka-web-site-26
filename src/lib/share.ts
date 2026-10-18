import type { Metadata } from 'next';

// A page's title and description, plus the card people see when its link is shared on
// WhatsApp, LinkedIn or X (the 1200×630 pictures in /public/og).
export function shareMeta(title: string, description: string, image: string): Metadata {
  const full = `${title} · Devansh Sureka`;
  return {
    title,
    description,
    openGraph: { title: full, description, images: [{ url: image, width: 1200, height: 630, alt: full }] },
    twitter: { card: 'summary_large_image', title: full, description, images: [image] },
  };
}
