import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Jangan bundle binary/native packages
  serverExternalPackages: [
    "ffmpeg-static",
    "fluent-ffmpeg",
    "@distube/ytdl-core",
    "archiver",
  ],

  images: {
    unoptimized: true,
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
