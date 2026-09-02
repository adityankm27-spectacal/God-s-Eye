import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "screenshots";

const pages = [
  { file: "01-landing", path: "/", label: "Landing / Problem Framing" },
  { file: "02-overview", path: "/dashboard", label: "Mission Overview Dashboard" },
  { file: "03-detection", path: "/dashboard/detection", label: "Spill Detection (SAR + AI segmentation)" },
  { file: "04-characterization", path: "/dashboard/characterization", label: "Slick Characterization & Volume" },
  { file: "05-oil-type", path: "/dashboard/oiltype", label: "Oil Type Identification" },
  { file: "06-drift", path: "/dashboard/drift", label: "Drift Prediction (origin + forecast)" },
  { file: "07-vessels", path: "/dashboard/vessels", label: "Vessel Attribution & Explainability" },
  { file: "08-evidence", path: "/dashboard/evidence", label: "Evidence File, Alerts & Response" },
  { file: "09-tech", path: "/dashboard/tech", label: "Technical Approach / Tech Stack" },
];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });

for (const p of pages) {
  await page.goto(BASE + p.path, { waitUntil: "networkidle2", timeout: 60000 });
  // Let maplibre tiles + plotly finish painting
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: `${OUT}/${p.file}.png`, fullPage: true });
  console.log(`✓ ${p.file}.png — ${p.label}`);
}

await browser.close();
console.log(`\nSaved ${pages.length} screenshots to ./${OUT}/`);
