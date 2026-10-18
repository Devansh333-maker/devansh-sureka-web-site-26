import type { MetadataRoute } from 'next';
import { sortedNotes } from '@/content/notebook';
import { studies } from '@/content/studies';
import { SITE_URL } from '@/lib/site';

// The list of every page for Google (served at /sitemap.xml). Notebook posts and studies join it by themselves.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/workshop', '/studio', '/chaupal', '/arena', '/press', '/notebook', '/about', '/work'];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: 'monthly' as const, priority: p === '' ? 1 : 0.8 })),
    ...sortedNotes.map((n) => ({ url: `${SITE_URL}/notebook/${n.slug}`, lastModified: n.date, changeFrequency: 'yearly' as const, priority: 0.6 })),
    ...studies.map((s) => ({ url: `${SITE_URL}/studies/${s.slug}`, changeFrequency: 'yearly' as const, priority: 0.5 })),
  ];
}
