import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.ATLAS_TEST_DIST_DIR || ".next",
  turbopack: { root: process.cwd() },
  outputFileTracingIncludes: {
    "/api/atlas/*": ["./data/atlas/**/*"],
  },
};

export default nextConfig;
