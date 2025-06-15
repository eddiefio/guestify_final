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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'hhvvjbczfnjqeuvzxvue.supabase.co',
      },
    ],
  },
  
  // Aggiungi headers per gestire meglio la cache e la sessione
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;