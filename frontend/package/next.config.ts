import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",")
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
