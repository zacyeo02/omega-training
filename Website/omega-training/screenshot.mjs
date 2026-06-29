import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error("Usage: node screenshot.mjs <url> [label]");
  process.exit(1);
}

const dir = "./temporary screenshots";
fs.mkdirSync(dir, { recursive: true });

const existing = fs
  .readdirSync(dir)
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const next = existing.length ? Math.max(...existing) + 1 : 1;

const fileName = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const filePath = path.join(dir, fileName);

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle0" });

// Scroll through the full page so any scroll-triggered reveal animations fire
await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = "auto";
  const distance = 300;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  let scrolled = 0;
  while (scrolled < document.body.scrollHeight) {
    window.scrollBy(0, distance);
    scrolled += distance;
    await delay(120);
  }
  window.scrollTo(0, 0);
  await delay(300);
});

// Sticky elements can render blank in fullPage captures after programmatic
// scrolling (Chromium resizes the viewport for the capture); pin them static.
// Chromium leaves a ghost paint of sticky-positioned elements at the bottom
// of a resized/full-page capture, overwriting real content underneath.
// Removing the node (screenshot-only, not the real page) is the only
// reliable fix. Header rendering is verified separately via a small clip.
await page.addStyleTag({ content: ".site-header { position: static !important; }" });
const fullHeight = await page.evaluate(() => document.body.scrollHeight);
await page.setViewport({ width: 1440, height: fullHeight });
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => document.querySelector(".site-header")?.remove());

await page.screenshot({ path: filePath, fullPage: false });
await browser.close();

console.log(`Saved ${filePath}`);
