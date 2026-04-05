/**
 * postbuild.js — Vercel + Turbopack compatibility shim
 *
 * Next.js 16 uses Turbopack by default which doesn't generate
 * `.next/server/middleware.js.nft.json`. Vercel's @vercel/next adapter
 * requires this file. This script creates the missing files after build.
 */

const fs   = require("fs");
const path = require("path");

const nextDir  = path.join(process.cwd(), ".next");
const serverDir = path.join(nextDir, "server");
const nftPath   = path.join(serverDir, "middleware.js.nft.json");
const mwJsPath  = path.join(serverDir, "middleware.js");

// Nothing to do if files already exist (webpack build)
if (fs.existsSync(nftPath)) {
  console.log("[postbuild] middleware.js.nft.json already exists, skipping.");
  process.exit(0);
}

const manifestPath = path.join(serverDir, "middleware-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.log("[postbuild] No middleware-manifest.json found, skipping.");
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const mw = manifest?.middleware?.["/"];

if (!mw) {
  console.log("[postbuild] No root middleware in manifest, skipping.");
  process.exit(0);
}

// 1. Create middleware.js from the entrypoint chunk (Turbopack splits the bundle)
if (!fs.existsSync(mwJsPath) && mw.entrypoint) {
  const entryAbs = path.join(nextDir, mw.entrypoint);
  if (fs.existsSync(entryAbs)) {
    fs.copyFileSync(entryAbs, mwJsPath);
    console.log(`[postbuild] Created middleware.js from ${mw.entrypoint}`);
  } else {
    // Fallback: write a minimal stub so the adapter doesn't crash
    fs.writeFileSync(mwJsPath, "// Turbopack middleware stub\n");
    console.log("[postbuild] Wrote middleware.js stub (entrypoint chunk not found)");
  }
}

// 2. Create middleware.js.nft.json listing the edge chunk files
//    Edge functions are self-contained bundles; no extra node_module traces needed.
const files = (mw.files || []).map((f) =>
  // Convert "server/edge/chunks/foo.js" → relative from .next/server/
  path.relative(serverDir, path.join(nextDir, f)).replace(/\\/g, "/")
);

const nft = { version: 1, files };
fs.writeFileSync(nftPath, JSON.stringify(nft, null, 2));
console.log(`[postbuild] Created middleware.js.nft.json with ${files.length} edge chunk(s)`);
