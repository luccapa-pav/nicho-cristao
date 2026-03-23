/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/celula", destination: "/fraternidade", permanent: true },
      { source: "/celula/:path*", destination: "/fraternidade/:path*", permanent: true },
    ];
  },
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
};

export default nextConfig;
