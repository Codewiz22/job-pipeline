import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

// Use career.config.local.js when it exists (your private copy, git-ignored),
// otherwise the shared career.config.js.
const local = path.join(root, "career.config.local.js");
const careerConfig = existsSync(local) ? local : path.join(root, "career.config.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // rss-parser pulls in xml2js, which should stay a plain Node require.
  experimental: { serverComponentsExternalPackages: ["rss-parser"] },
  webpack(config) {
    config.resolve.alias["@career-config"] = careerConfig;
    return config;
  },
};

export default nextConfig;
