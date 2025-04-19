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
  
  // Configurazione per le immagini
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fqjjivwdubseuwjonufk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;