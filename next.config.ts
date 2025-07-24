import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  matcher: [
    '/home',
    '/character/:path*',
    '/admin/:path*',
    '/api/character/:path*',
    '/api/admin/:path*',
  ],
};

export default nextConfig;
