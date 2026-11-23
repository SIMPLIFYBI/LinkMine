/** @type {import("next").NextConfig} */
const dotenv = require("dotenv");
dotenv.config(); // Explicitly load .env files from project root

const nextConfig = {
  reactStrictMode: true,
  // The intelligence report HTML is read from disk at request time, so it must be traced into the build.
  outputFileTracingIncludes: {
    "/intelligence/raw/[slug]": ["./app/reports/*.html"],
    "/embed/reserves": ["./app/intelligence/tokens.css"],
    "/admin/intelligence/social/image/[slug]/[n]": ["./app/intelligence/social/fonts/*.ttf", "./public/intelligence/james-blue-192.jpg"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // YouMine Intelligence moved out of /admin; the social post kits stay there as editorial tooling.
      {
        source: "/admin/intelligence",
        destination: "/intelligence",
        permanent: false,
      },
      {
        source: "/admin/intelligence/:path((?!social).*)",
        destination: "/intelligence/:path",
        permanent: false,
      },
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