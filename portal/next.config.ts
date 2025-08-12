import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  // Ensure proper handling of environment variables in production
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  // Optimize for production
  poweredByHeader: false,
  compress: true,
  // Handle image optimization
  images: {
    unoptimized: true, // Disable Next.js image optimization for standalone mode
  },
};

export default nextConfig;
