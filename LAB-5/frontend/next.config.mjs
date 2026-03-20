const isDocker = process.env.RUNNING_IN_DOCKER === 'true';
const backendUrl = isDocker ? 'http://lab5-backend:8100' : 'http://localhost:8100';

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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
  output: 'standalone',
};

export default nextConfig;
