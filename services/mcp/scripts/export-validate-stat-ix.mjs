/**
 * F78N — export validate_stat ix bytes for Rust parser tests.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { buildTxlineValidateStatIxData } from "../escrow-agent.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "test", "fixtures");

const CPI_ARGS_HOME = {
  txlineProgramId: "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J",
  targetTs: "1751884800000",
  fixtureSummary: {
    fixtureId: "18172280",
    updateStats: {
      updateCount: 12,
      minTimestamp: "1751884800000",
      maxTimestamp: "1751888400000",
    },
    eventsSubTreeRoot: Array.from(
      Buffer.from("fc6f76257c0b3aabaf8009133fc40f42a4de513e52e4ba61ac4ab4017abd7231", "hex"),
    ),
  },
  fixtureProof: [
    {
      hash: Array.from(Buffer.from("5a39c823c7da97613900da7ebc70cb48e0c8978db635a5e925804898b1153861", "hex")),
      isRightSibling: false,
    },
  ],
  mainTreeProof: [
    {
      hash: Array.from(Buffer.from("914ebfe898ff07826d983f207e2a0f1b75cfd9af321e74ef88287855d12f0ada", "hex")),
      isRightSibling: false,
    },
    {
      hash: Array.from(Buffer.from("698710543ae755ebee2ee545eefacbdf7de69214e873afafd9d8a6a30fce797c", "hex")),
      isRightSibling: true,
    },
  ],
  predicate: { threshold: 0, comparison: { greaterThan: {} } },
  stat1: {
    statToProve: { key: 1002, value: 1, period: 0 },
    eventStatRoot: Array.from(Buffer.from("5a39c823c7da97613900da7ebc70cb48e0c8978db635a5e925804898b1153861", "hex")),
    statProof: [
      {
        hash: Array.from(Buffer.from("cc884eba535f1794cb0432b1851139306813989145306d1a3c543bb1e0f1907b", "hex")),
        isRightSibling: false,
      },
    ],
  },
  stat2: {
    statToProve: { key: 1003, value: 0, period: 0 },
    eventStatRoot: Array.from(Buffer.from("5a39c823c7da97613900da7ebc70cb48e0c8978db635a5e925804898b1153861", "hex")),
    statProof: [
      {
        hash: Array.from(Buffer.from("9c124e61fc17cd91d02bcbccd869e5f73e121595f980fd681cda151a0683eb69", "hex")),
        isRightSibling: true,
      },
    ],
  },
  op: { subtract: {} },
  dailyScoresPdaSeeds: {
    epochDay: Math.floor(1_751_884_800_000 / 86_400_000),
    seeds: ["daily_scores_roots", [0, 0]],
  },
};

async function main() {
  mkdirSync(OUT, { recursive: true });
  const kp = Keypair.generate();
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const epochDay = CPI_ARGS_HOME.dailyScoresPdaSeeds.epochDay;
  CPI_ARGS_HOME.dailyScoresPdaSeeds.seeds[1] = [epochDay & 0xff, (epochDay >> 8) & 0xff];

  const { ixData } = await buildTxlineValidateStatIxData(
    connection,
    kp.publicKey,
    CPI_ARGS_HOME,
    new PublicKey(CPI_ARGS_HOME.txlineProgramId),
  );
  const b64 = Buffer.from(ixData).toString("base64");
  writeFileSync(join(OUT, "validate_stat_ix_home.b64"), `${b64}\n`, "utf-8");
  console.log(`Wrote validate_stat_ix_home.b64 (${ixData.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
