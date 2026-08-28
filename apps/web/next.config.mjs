/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ["@citizens-first/shared"]
};

export default nextConfig;
