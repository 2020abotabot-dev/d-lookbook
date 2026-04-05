/**
 * prebuild.js — Create middleware.js.nft.json BEFORE next build
 *
 * Vercel's @vercel/next plugin reads middleware.js.nft.json DURING
 * "Finalizing page optimization" inside next build. Next.js 16 Turbopack
 * doesn't generate this file, so the Vercel plugin throws ENOENT.
 *
 * This script creates stub files in .next/server/ before next build starts
 * so the Vercel plugin finds them. The postbuild.js script overwrites them
 * with the real content afterwards.
 */

const fs   = require("fs");
const path = require("path");

const serverDir = path.join(process.cwd(), ".next", "server");
const nftPath   = path.join(serverDir, "middleware.js.nft.json");
const mwJsPath  = path.join(serverDir, "middleware.js");

// Ensure .next/server exists (may not on a clean Vercel build)
fs.mkdirSync(serverDir, { recursive: true });

// Create minimal valid nft.json stub
if (!fs.existsSync(nftPath)) {
  fs.writeFileSync(nftPath, JSON.stringify({ version: 1, files: [] }));
  console.log("[prebuild] Created stub middleware.js.nft.json");
} else {
  console.log("[prebuild] middleware.js.nft.json already exists, skipping.");
}

// Create minimal middleware.js stub
if (!fs.existsSync(mwJsPath)) {
  fs.writeFileSync(mwJsPath, "// Turbopack middleware stub — replaced by postbuild\n");
  console.log("[prebuild] Created stub middleware.js");
} else {
  console.log("[prebuild] middleware.js already exists, skipping.");
}
