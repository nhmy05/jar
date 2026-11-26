import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* font file names carry their version, so browsers can keep them for good */
  async headers() {
    return [{ source: "/fonts/:file*.woff2", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
};

export default nextConfig;
