import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid EPERM on locked `.next/dev/trace` (Desktop/OneDrive/antivirus on Windows)
  distDir: process.env.NEXT_DIST_DIR || '.next',

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

let exportedConfig: NextConfig = nextConfig;

try {
  // Optional PWA wrapper. If the package is missing, the config still loads
  // and the app can boot without crashing the Next TS config loader.
  const withPWA = require('next-pwa').default as (cfg: Record<string, unknown>) => (base: NextConfig) => NextConfig;
  exportedConfig = withPWA({
    dest: 'public',
    register: false,  // Manual registration in layout.tsx for better Vercel compatibility
    skipWaiting: true,
    // Disable PWA in development, but keep it ENABLED in production
    disable: process.env.NODE_ENV === 'development',
    // Don't precache _next/static files - they change with every build
    // Instead, cache them at runtime when requested
    cacheOnFrontEndNav: true,
    dynamicStartUrl: false,
    publicExcludes: ['!noprecache/**/*'],
    // Only precache essential public files, not _next/static
    buildExcludes: [
      /middleware-manifest\.json$/,
      /_next\/static\/.*\.js$/,  // Don't precache JS chunks
      /_next\/static\/.*\.css$/,  // Don't precache CSS chunks
    ],
    runtimeCaching: [
      // Cache Next.js static assets at runtime (not during install)
      {
        urlPattern: /^https?:\/\/.*\/_next\/static\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // Cache all other requests with network-first strategy
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'prime-offline-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  })(nextConfig);
} catch {
  // Keep the regular Next config usable when next-pwa is unavailable.
}

export default exportedConfig;
