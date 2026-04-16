import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  allowedDevOrigins: ["z3t11c4.42bangkok.com", "localhost"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/auth/login",
        permanent: true, // Use false if this might change later
      },
      {
        source: "/login",
        destination: "/auth/login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
