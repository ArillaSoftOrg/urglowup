import type { NextConfig } from "next";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: cloudName
      ? [
          {
            protocol: "https",
            hostname: "res.cloudinary.com",
            pathname: `/${cloudName}/**`,
          },
        ]
      : [],
    qualities: [75],
  },
};

export default nextConfig;
