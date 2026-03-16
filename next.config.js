/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // trustbank.xyz/@slug → /s/@slug (mini site com @handle)
      { source: "/@:slug", destination: "/s/@:slug" },
      // trustbank.xyz/@slug/p/page-slug → /s/@slug/p/page-slug (página extra)
      { source: "/@:slug/p/:pageSlug", destination: "/s/@:slug/p/:pageSlug" },
    ];
  },
};

module.exports = nextConfig;
