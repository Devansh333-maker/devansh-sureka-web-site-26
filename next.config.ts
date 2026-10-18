import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // lets a production build run beside the dev server without sharing .next
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // no Next.js badge in the corner while developing (it sat on top of the sound button)
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Heavy static assets (3D models, the Draco decoder, baked outfits, optimised images)
  // stay in the browser's cache for a week and refresh quietly after that, so a
  // returning visitor's scenes appear immediately.
  async headers() {
    const week = 'public, max-age=604800, stale-while-revalidate=2592000';
    return ['/models/:path*', '/draco/:path*', '/opt/:path*', '/brand/:path*', '/me/:path*'].map((source) => ({
      source,
      headers: [{ key: 'Cache-Control', value: week }],
    }));
  },
  // The old site's pages now live inside the world. Keep their links working.
  async redirects() {
    return [
      { source: '/design', destination: '/press', permanent: true },
      { source: '/design/:path*', destination: '/press', permanent: true },
      { source: '/3d-modeling', destination: '/workshop', permanent: true },
      { source: '/research', destination: '/studio#archive', permanent: true },
      { source: '/research/:path*', destination: '/studio#archive', permanent: true },
      { source: '/experience', destination: '/about', permanent: true },
      { source: '/experience/por', destination: '/chaupal', permanent: true },
      { source: '/experience/work', destination: '/work', permanent: true },
      { source: '/experience/education', destination: '/about', permanent: true },
      { source: '/blog', destination: '/notebook', permanent: true },
      { source: '/blog/:path*', destination: '/notebook', permanent: true },
      { source: '/resume', destination: '/work', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
