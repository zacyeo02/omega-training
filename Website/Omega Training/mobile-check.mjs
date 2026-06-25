import puppeteer from "puppeteer";
import fs from "node:fs";

const url = process.argv[2];
const label = process.argv[3] || "mobile";
const dir = "./temporary screenshots";
fs.mkdirSync(dir, { recursive: true });
const existing = fs.readdirSync(dir).map(f => f.match(/^screenshot-(\d+)/)).filter(Boolean).map(m => Number(m[1]));
const next = existing.length ? Math.max(...existing) + 1 : 1;
const filePath = `${dir}/screenshot-${next}-${label}.png`;

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle0" });
await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = "auto";
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  let scrolled = 0;
  while (scrolled < document.body.scrollHeight) {
    window.scrollBy(0, 300);
    scrolled += 300;
    await delay(120);
  }
  window.scrollTo(0, 0);
  await delay(300);
});
// Chromium leaves a ghost paint of sticky-positioned elements at the bottom
// of a resized/full-page capture; removing the node (screenshot-only, not
// the real page) is the only reliable fix. Header rendering is verified
// separately via a small non-resized clip.
await page.addStyleTag({ content: ".site-header { position: static !important; }" });
const fullHeight = await page.evaluate(() => document.body.scrollHeight);
await page.setViewport({ width: 390, height: fullHeight, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => document.querySelector(".site-header")?.remove());
await page.screenshot({ path: filePath, fullPage: false });
await browser.close();
console.log(`Saved ${filePath}`);
