import type { NextConfig } from "next";

const repo = "site-project";
const isGithubPagesBuild = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPagesBuild ? `/${repo}` : "",
  assetPrefix: isGithubPagesBuild ? `/${repo}/` : "",
  trailingSlash: true,
};

export default nextConfig;
