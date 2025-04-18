/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  
  // Disabilita il prerendering per le pagine protette
  experimental: {
    optimizePackageImports: ['react-hot-toast'],
  },
};

module.exports = nextConfig;