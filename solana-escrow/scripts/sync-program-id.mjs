#!/usr/bin/env node
/**
 * Sync program pubkey into Anchor.toml, lib.rs, web IDL.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pubkey = execSync("node scripts/generate-program-keypair.mjs", {
  cwd: root,
  encoding: "utf8",
}).trim();

const anchorToml = join(root, "Anchor.toml");
let toml = readFileSync(anchorToml, "utf8");
toml = toml.replace(
  /natt_escrow = "[^"]+"/g,
  `natt_escrow = "${pubkey}"`,
);
writeFileSync(anchorToml, toml);

const libRs = join(root, "programs", "natt_escrow", "src", "lib.rs");
let lib = readFileSync(libRs, "utf8");
lib = lib.replace(/declare_id!\("[^"]+"\);/, `declare_id!("${pubkey}");`);
writeFileSync(libRs, lib);

const webIdl = join(root, "..", "natt-pundit", "apps", "web", "idl", "natt_escrow.json");
const idl = JSON.parse(readFileSync(webIdl, "utf8"));
idl.address = pubkey;
writeFileSync(webIdl, `${JSON.stringify(idl, null, 2)}\n`);

console.log(`Synced program id: ${pubkey}`);
console.log("");
console.log("Set on VPS after anchor deploy:");
console.log(`NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=${pubkey}`);
