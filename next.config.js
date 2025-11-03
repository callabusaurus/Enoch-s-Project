/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark pdf-parse and related packages as server-only externals
  // This prevents Next.js from bundling them, which causes issues
  experimental: {
    serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'canvas'],
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize pdf-parse and pdfjs-dist to prevent webpack bundling
      // Use function format for more reliable externalization
      const existingExternals = config.externals || [];
      config.externals = [
        ...(Array.isArray(existingExternals) ? existingExternals : [existingExternals]),
        ({ request }, callback) => {
          if (request === 'pdf-parse' || request === 'pdfjs-dist' || request === 'canvas') {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      ];
      
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
