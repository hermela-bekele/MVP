import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
