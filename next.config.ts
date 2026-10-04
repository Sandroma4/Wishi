import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@wishi/prisma-client"],
  turbopack: { root: process.cwd() },
  experimental: { serverActions: { bodySizeLimit: "6mb" as const } },
};

export default withNextIntl(nextConfig);
