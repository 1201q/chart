import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ['@chart/shared-types'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.chartraders.club',
      },
    ],
  },

  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
