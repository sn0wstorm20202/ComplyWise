import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const rawBackendUrl = process.env.BACKEND_INTERNAL_URL?.trim();

if (isProduction && !rawBackendUrl) {
  throw new Error(
    "BACKEND_INTERNAL_URL environment variable is required for production builds. " +
    "Silently falling back to another backend is prohibited."
  );
}

const BACKEND_URL = (rawBackendUrl || "http://127.0.0.1:8000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: "/health/:path*",
        destination: `${BACKEND_URL}/health/:path*`,
      },
    ];
  },
};

export default nextConfig;
