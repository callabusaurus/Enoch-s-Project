/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Add this block anywhere inside the object (top or bottom is fine)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Mark pdf-parse and related packages as server-only externals
  experimental: {
    serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'canvas'],
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
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

      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

