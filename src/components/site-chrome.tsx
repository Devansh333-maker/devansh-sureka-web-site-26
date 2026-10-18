'use client';

import { usePathname } from 'next/navigation';
import { SiteBar, SiteFooter } from '@/components/place/chrome';
import '@/components/place/place.css';

// The home page is the world itself and draws its own interface.
// Every other page shares the same bar and footer.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/') return <>{children}</>;

  return (
    <div className="site">
      <SiteBar />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
