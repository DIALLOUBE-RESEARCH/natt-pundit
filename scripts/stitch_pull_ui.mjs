#!/usr/bin/env node
/**
 * Pull Stitch screens (GEMINI_3_PRO) into stitch-import/.
 *
 * Auth (first match wins):
 *   STITCH_API_KEY          — from stitch.withgoogle.com
 *   gcloud OAuth            — gcloud auth print-access-token + GOOGLE_CLOUD_PROJECT
 *
 *   node scripts/stitch_pull_ui.mjs
 *   node scripts/stitch_pull_ui.mjs --moodboard apps/web/design/moodboard/moodboard-home-mobile.png
 *
 * Windows: Node fetch may fail TLS (UNABLE_TO_VERIFY_LEAF_SIGNATURE). Script auto-sets
 * NODE_TLS_REJECT_UNAUTHORIZED=0 for local pull only — use STITCH_API_KEY on CI if needed.
 */
import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.platform === "win32" && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "apps", "web", "stitch-import");
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "project-87fea829-0a41-452e-a91";
const MODEL_ID = "GEMINI_3_PRO";

const DESIGN_SYSTEM = {
  colorMode: "DARK",
  theme: {
    primary: "#C8A951",
    secondary: "#1D428A",
    background: "#0A0A0A",
    surface: "#141C32",
    onBackground: "#FFFFFF",
    onSurface: "#FFFFFF",
  },
  typography: {
    display: "Barlow Condensed",
    body: "Inter",
    mono: "JetBrains Mono",
  },
};

const SCREENS = [
  {
    slug: "home",
    device: "MOBILE",
    prompt:
      "Mobile-first PWA home for Natt Settlement TxODDS track. FIFA World Cup 2026 INSPIRED " +
      "black white gold #C8A951, TxODDS navy #141C32 panels, USA blue #1D428A for TxLINE link. " +
      "Barlow Condensed large title, Inter body, JetBrains Mono for odds. " +
      "Contest logo header area, hero kicker gold, fixture cards with country flags, " +
      "SETUP green pill HOLD gray pill, kickoff time. Footer Powered by TxODDS. " +
      "48-module geometric grid subtle background. iOS 2026 premium native app quality, " +
      "20px card radius, navy material cards gold left accent. English. NO FIFA emblem NO purple AI glass.",
  },
  {
    slug: "match",
    device: "MOBILE",
    prompt:
      "Mobile match detail SAME design system as home screen. Large gold score center, team flags, " +
      "LIVE tag, odds ticker, conviction gauge, outcome decomposition table pi_tx pi_model columns, " +
      "Merkle settlement proof panel sober technical. Sticky back nav. English. iOS-grade spacing.",
  },
];

function parseArgs(argv) {
  let moodboard = null;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--moodboard" && argv[i + 1]) moodboard = argv[++i];
  }
  return { moodboard };
}

function getGcloudToken() {
  const gcloud = join(
    process.env.LOCALAPPDATA || "",
    "Google",
    "Cloud SDK",
    "google-cloud-sdk",
    "bin",
    "gcloud.cmd",
  );
  const cmd = `"${gcloud}" auth print-access-token`;
  const token = execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  if (!token || token.includes("ERROR")) throw new Error("gcloud auth print-access-token failed");
  return token;
}

async function createClient() {
  const { StitchToolClient } = await import("@google/stitch-sdk");
  const apiKey = process.env.STITCH_API_KEY?.trim();
  if (apiKey) {
    console.log("auth: STITCH_API_KEY");
    return new StitchToolClient({ apiKey, projectId: PROJECT_ID });
  }
  const accessToken = process.env.STITCH_ACCESS_TOKEN?.trim() || getGcloudToken();
  console.log("auth: OAuth access token");
  return new StitchToolClient({ accessToken, projectId: PROJECT_ID });
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  const { moodboard } = parseArgs(process.argv);
  const { Stitch, Project } = await import("@google/stitch-sdk");

  const client = await createClient();
  const stitch = new Stitch(client);

  const title = `Natt Settlement ${new Date().toISOString().slice(0, 10)}`;
  const created = await stitch.createProject(title);
  const projectId = created.projectId ?? created.id;
  console.log("project", projectId);

  const project = new Project(client, projectId);

  try {
    await project.createDesignSystem(DESIGN_SYSTEM);
    console.log("design system OK");
  } catch (e) {
    console.warn("design system skip:", e.message);
  }

  let designContext = null;
  let homeScreenId = null;

  if (moodboard) {
    const abs = resolve(ROOT, moodboard);
    console.log("upload moodboard", abs);
    const uploaded = await project.uploadImage(abs, { title: "Natt moodboard reference" });
    const ref = uploaded[0];
    const refId = ref?.screenId ?? ref?.id;
    console.log("moodboard screen", refId);
    if (refId) {
      try {
        const ctx = await client.callTool("extract_design_context", {
          projectId,
          screenId: refId,
        });
        designContext = ctx?.designContext ?? ctx;
        console.log("extract_design_context OK");
      } catch (e) {
        console.warn("extract_design_context skip:", e.message);
      }
    }
  }

  const manifest = { projectId, title, modelId: MODEL_ID, designSystem: DESIGN_SYSTEM, screens: [] };

  for (const spec of SCREENS) {
    console.log("generate", spec.slug, spec.device, MODEL_ID);
    let prompt = spec.prompt;
    if (spec.slug === "match" && designContext) {
      prompt += ` Apply this design context exactly: ${JSON.stringify(designContext).slice(0, 4000)}`;
    } else if (spec.slug === "match" && homeScreenId) {
      prompt += ` Match visual style of home screen id ${homeScreenId}.`;
    }

    let screen;
    if (spec.slug === "match" && designContext) {
      try {
        const applied = await client.callTool("apply_design_context", {
          projectId,
          prompt,
          deviceType: spec.device,
          modelId: MODEL_ID,
          designContext,
        });
        const projected = (applied?.outputComponents ?? [])
          .map((c) => c?.design?.screens?.[0])
          .find((s) => s != null);
        if (projected) {
          const { Screen } = await import("@google/stitch-sdk");
          screen = new Screen(client, { ...projected, projectId });
        }
      } catch (e) {
        console.warn("apply_design_context fallback generate:", e.message);
      }
    }
    if (!screen) {
      screen = await project.generate(prompt, spec.device, MODEL_ID);
    }

    const sid = screen.screenId ?? screen.id;
    if (spec.slug === "home") {
      homeScreenId = sid;
      if (!designContext) {
        try {
          const ctx = await client.callTool("extract_design_context", { projectId, screenId: sid });
          designContext = ctx?.designContext ?? ctx;
          console.log("home design context extracted");
        } catch (e) {
          console.warn("extract home context skip:", e.message);
        }
      }
    }

    const htmlUrl = await screen.getHtml();
    const imageUrl = await screen.getImage();
    const dir = join(OUT, spec.slug);
    await mkdir(dir, { recursive: true });
    const htmlBytes = await download(htmlUrl, join(dir, "screen.html"));
    const imgBytes = await download(imageUrl, join(dir, "screen.png"));
    manifest.screens.push({ slug: spec.slug, screenId: sid, device: spec.device, htmlBytes, imgBytes });
    console.log(`  OK ${spec.slug} id=${sid} html=${htmlBytes} img=${imgBytes}`);
  }

  await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  await writeFile(join(OUT, "design-system.json"), JSON.stringify(DESIGN_SYSTEM, null, 2));
  await client.close();
  console.log("Done ->", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
