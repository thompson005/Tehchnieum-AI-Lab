import type { NextConfig } from 'next';

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';
const backendUrl = isDocker ? 'http://govconnect-backend:8100' : 'http://localhost:8100';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100',
  },
};

export default nextConfig;
