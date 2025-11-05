import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // API 프록시 설정 (개발 환경)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
      },
    ];
  },
};

export default nextConfig;
