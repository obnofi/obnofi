import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@obnofi/db", "@obnofi/types"],
  experimental: {
    // Disable features that might cause issues
    turbo: undefined,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: require.resolve("yjs"),
      "@obnofi/db$": require.resolve("@obnofi/db"),
      "@obnofi/types$": require.resolve("@obnofi/types"),
      "@obnofi/types/database$": require.resolve("@obnofi/types/database"),
      "@obnofi/types/core$": require.resolve("@obnofi/types/core"),
      "@obnofi/types/clearing$": require.resolve("@obnofi/types/clearing"),
      "@obnofi/types/db-diagram$": require.resolve("@obnofi/types/db-diagram"),
      "@obnofi/types/ai$": require.resolve("@obnofi/types/ai"),
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
