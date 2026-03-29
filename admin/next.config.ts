import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from the repository root so all projects share one env file
config({ path: resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
