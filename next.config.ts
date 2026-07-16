import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root so lockfile-based inference can never pick the
    // wrong directory (see ERR "Next.js inferred your workspace root").
    root: __dirname,
  },
};

export default nextConfig;
