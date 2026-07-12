#!/usr/bin/env node
/**
 * F86N v2 — ensure proprietary edge engine exists before build/deploy.
 * Prod VPS: copies from NATT_EDGE_ENGINE_PATH or ~/HYPERNATT/private/natt-edge-engine
 * CI / fresh clone: falls back to public stub (never use stub in prod — Dockerfile blocks it)
 */
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "packages", "natt-edge-engine");
const stub = join(root, "scripts", "public-mirror-stub", "natt-edge-engine");
const privatePath =
  process.env.NATT_EDGE_ENGINE_PATH?.trim() ||
  join(homedir(), "HYPERNATT", "private", "natt-edge-engine");

function isRealEngine(dir) {
  const pkg = join(dir, "package.json");
  if (!existsSync(pkg)) return false;
  try {
    const j = JSON.parse(readFileSync(pkg, "utf8"));
    return j.version !== "0.0.0-stub";
  } catch {
    return false;
  }
}

function isStubEngine(dir) {
  const idx = join(dir, "src", "index.ts");
  if (!existsSync(idx)) return false;
  return readFileSync(idx, "utf8").includes("Public mirror stub");
}

function copyEngine(src, label) {
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[ensure-edge-engine] ${label} -> packages/natt-edge-engine`);
}

if (isRealEngine(dest) && !isStubEngine(dest)) {
  console.log("[ensure-edge-engine] real engine already present");
  process.exit(0);
}

if (isRealEngine(privatePath)) {
  copyEngine(privatePath, `private ${privatePath}`);
  process.exit(0);
}

if (existsSync(stub)) {
  console.warn("[ensure-edge-engine] WARNING: using STUB — OK for CI/mirror only, NOT prod");
  copyEngine(stub, "stub");
  process.exit(0);
}

console.error(
  "[ensure-edge-engine] FATAL: no engine found.\n" +
    "  VPS one-time: scp -r packages/natt-edge-engine user@vps:~/HYPERNATT/private/natt-edge-engine\n" +
    "  Then set NATT_EDGE_ENGINE_PATH or run from ~/HYPERNATT after git pull.",
);
process.exit(1);
