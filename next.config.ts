/** @type {import('next').NextConfig} */
const repo = "site-project";

const nextConfig = {
  output: "export",
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
