/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ["@citizens-first/shared"]
};

export default nextConfig;
