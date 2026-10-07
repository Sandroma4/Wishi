import createNextIntlPlugin from "next-intl/plugin";
import { networkInterfaces } from "node:os";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false as const,
  distDir: process.env.CADEOLY_E2E === "true" ? ".next-e2e" : ".next",
  allowedDevOrigins: [
    "127.0.0.1",
    ...Object.values(networkInterfaces())
      .flatMap((addresses) => addresses ?? [])
      .filter((address) => address.family === "IPv4" && !address.internal)
      .map((address) => address.address),
  ],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
  serverExternalPackages: ["@wishi/prisma-client"],
  turbopack: { root: process.cwd() },
  experimental: { serverActions: { bodySizeLimit: "6mb" as const } },
};

export default withNextIntl(nextConfig);
