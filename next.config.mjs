/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Disable features that might cause issues
    turbo: undefined,
  },
};

export default nextConfig;
