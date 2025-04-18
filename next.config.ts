import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disabilita temporaneamente la verifica ESLint durante il build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disabilita temporaneamente la verifica TypeScript durante il build
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
