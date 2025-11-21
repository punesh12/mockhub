import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Optimize for production
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
  },
}

export default nextConfig
