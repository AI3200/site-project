/** @type {import('next').NextConfig} */
const repo = 'site-project';

const nextConfig = {
  output: 'export',
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  trailingSlash: true, // ← これを追加
};

module.exports = nextConfig;
