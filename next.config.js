/** @type {import("next").NextConfig} */
const dotenv = require("dotenv");
dotenv.config(); // Explicitly load .env files from project root

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;