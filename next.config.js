/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use serverComponentsExternalPackages for Next.js 14+ (recommended approach)
  serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist', 'canvas'],
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Additional webpack configuration for server-side
      // Prevent webpack from trying to bundle canvas (used by pdfjs-dist)
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
