/** @type {import('next').NextConfig} */
const repo = "site-project";
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: "export",
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  env: {
    // クライアント側で参照する「確定した」basePath（ビルド時に埋め込まれる）
    NEXT_PUBLIC_BASE_PATH: isProd ? `/${repo}` : "",
  },
};

module.exports = nextConfig;
