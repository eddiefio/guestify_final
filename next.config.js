/** @type {import('next').NextConfig} */
// La configurazione i18n viene rimossa perché non è compatibile con App Router
// next-i18next funzionerà comunque con il nostro middleware personalizzato

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