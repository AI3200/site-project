import type { NextConfig } from "next";

const repo = "site-project";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "docs",
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  trailingSlash: true,
};

export default nextConfig;
