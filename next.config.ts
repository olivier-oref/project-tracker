import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // e2e builds go to .next-e2e so they never clobber a running `next dev` (.next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
