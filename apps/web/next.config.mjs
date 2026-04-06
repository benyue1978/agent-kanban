import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
  async rewrites() {
    return [
      {
        source: "/kanban-api/:path*",
        destination: `${process.env.KANBAN_API_URL || "http://127.0.0.1:3101"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
