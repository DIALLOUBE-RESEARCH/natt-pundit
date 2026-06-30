const path = require("path");

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: `${basePath}/offline`,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  basePath,
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@natt-pundit/contracts"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, "../../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve("buffer/"),
    };
    return config;
  },
});

module.exports = nextConfig;
