import { createRequire } from "module";
import path from "path";
const require = createRequire(import.meta.url);

const workspaceRoot = path.resolve(process.cwd(), "../..");

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
      "@obnofi/db$": path.join(workspaceRoot, "packages/db/src/index.ts"),
      "@obnofi/types$": path.join(workspaceRoot, "packages/types/src/index.ts"),
      "@obnofi/types/database$": path.join(workspaceRoot, "packages/types/src/database.ts"),
      "@obnofi/types/core$": path.join(workspaceRoot, "packages/types/src/core.ts"),
      "@obnofi/types/clearing$": path.join(workspaceRoot, "packages/types/src/clearing.ts"),
      "@obnofi/types/db-diagram$": path.join(workspaceRoot, "packages/types/src/db-diagram.ts"),
      "@obnofi/types/ai$": path.join(workspaceRoot, "packages/types/src/ai.d.ts"),
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
