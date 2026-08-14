/** @type {import("next").NextConfig} */
const dotenv = require("dotenv");
dotenv.config(); // Explicitly load .env files from project root

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/marketplace",
        destination: "/vault",
        permanent: true,
      },
      {
        source: "/marketplace/:path*",
        destination: "/vault/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/vault",
        destination: "/marketplace",
      },
      {
        source: "/vault/:path*",
        destination: "/marketplace/:path*",
      },
    ];
  },
};

module.exports = nextConfig;