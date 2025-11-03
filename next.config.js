/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Allow deployment even with TS errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Build only API routes (skip frontend pages)
  pageExtensions: ["api.ts", "api.tsx", "route.ts", "route.tsx"],

  // ✅ Existing experimental config for server-only packages
  experimental: {
    serverExternalPackages: ["pdf-parse", "pdfjs-dist", "canvas"],
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existingExternals = config.externals || [];
      config.externals = [
        ...(Array.isArray(existingExternals)
          ? existingExternals
          : [existingExternals]),
        ({ request }, callback) => {
          if (
            request === "pdf-parse" ||
            request === "pdfjs-dist" ||
            request === "canvas"
          ) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
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


