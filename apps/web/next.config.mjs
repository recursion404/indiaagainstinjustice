/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ["@citizens-first/shared"]
};

export default nextConfig;
