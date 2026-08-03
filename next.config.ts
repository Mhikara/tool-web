import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Percepat build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Jangan ikutkan binary besar ke serverless bundle kalau tidak perlu
  serverExternalPackages: [
    "ffmpeg-static",
    "fluent-ffmpeg",
    "@distube/ytdl-core",
    "archiver",
  ],

  // Kurangi overhead image
  images: {
    unoptimized: true,
  },

  // Experimental ringan
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
