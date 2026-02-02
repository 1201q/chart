import type { NextConfig } from 'next';
import path from 'node:path';
import withBundleAnalyzer from '@next/bundle-analyzer';

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
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
