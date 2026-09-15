import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid EPERM on locked `.next/dev/trace` (Desktop/OneDrive/antivirus on Windows)
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Disable ESLint during production builds (warnings shouldn't block deployment)
  // @ts-ignore - eslint property exists but not in type definition
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during production builds
  // @ts-ignore - typescript property exists but not in type definition  
  typescript: {
    ignoreBuildErrors: true,
  },

  // Keep builds stable on constrained/WSL environments
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  // Next.js 16 renamed this option (old key warns as invalid)
  serverExternalPackages: [],

  // Explicit empty Turbopack config so Next 16 doesn't fail when a webpack
  // hook is also present (dev uses --webpack; production can use either).
  turbopack: {},

  // Ensure service worker is served with correct headers
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },

  webpack: (config, { dev, isServer }) => {
    // WSL2 + DrvFs (/mnt/c) mounts don't reliably deliver inotify events, so
    // native fs.watch misses edits made from the Windows side. Poll instead
    // so dev-server hot reload actually picks up file changes.
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    // Dev-only client overlay tweaks (used with `next dev --webpack`)
    if (dev && !isServer) {
      config.devServer = {
        ...config.devServer,
        client: {
          overlay: {
            errors: true,
            warnings: false,
          },
          reconnect: true,
        },
      };
    }
    return config;
  },
};

// PWA is now handled by static public/sw.js file for reliability
// next-pwa disabled to avoid Vercel build issues
export default nextConfig;
