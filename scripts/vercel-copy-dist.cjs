/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

function existsDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

// Vercel can run build from repo root or from a configured Root Directory.
// We accept either:
// - repo root: src at ./apps/tma/dist
// - apps/tma root: src at ./dist
const cwd = process.cwd();
const candidateFromRepoRoot = path.resolve(cwd, "apps/tma/dist");
const candidateFromAppRoot = path.resolve(cwd, "dist");

let src = null;
let dest = null;

if (existsDir(candidateFromRepoRoot)) {
  src = candidateFromRepoRoot;
  dest = path.resolve(cwd, "dist");
} else if (existsDir(candidateFromAppRoot) && !existsDir(candidateFromRepoRoot)) {
  // If we are already in apps/tma, we need to copy to repo root dist:
  // cwd/dist -> cwd/../../dist (best-effort).
  src = candidateFromAppRoot;
  dest = path.resolve(cwd, "../../dist");
} else {
  console.error("Could not find build output directory.");
  console.error("Tried:", candidateFromRepoRoot, "and", candidateFromAppRoot);
  process.exit(1);
}

rmrf(dest);
copyDir(src, dest);
console.log("Copied build output:", src, "->", dest);

