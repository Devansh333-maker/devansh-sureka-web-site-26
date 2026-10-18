import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Tells search engines they may read the whole site (served at /robots.txt), except the workbench page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/lab' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
