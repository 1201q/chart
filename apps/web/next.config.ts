import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ['@project/shared-types'],

  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
