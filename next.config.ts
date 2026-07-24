import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Increase timeouts for development (WSL/slow file system)
  experimental: {
    // Increase webpack timeout for large components
    workerThreads: false,
    cpus: 1,
  },
  
  // Production build optimizations
  webpack: (config, { dev, isServer }) => {
    // Increase timeout for chunk loading
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
  
  // Increase serverComponentsExternalPackages timeout
  serverComponentsExternalPackages: [],
};

export default nextConfig;
