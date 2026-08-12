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

export default nextConfig;
