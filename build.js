#!/usr/bin/env node
/* ============================================================
   build.js — data.json -> report.html -> report.pdf
   Käyttö:  node build.js [--data sample-data.json] [--out report.pdf]
   Chrome:  CHROME_BIN ympäristömuuttuja, puppeteer, tai paikallinen Chrome.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { renderHTML } = require("./template");

function arg(name, def) {
  const i = process.argv.indexOf("--" + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const dataFile = arg("data", "sample-data.json");
const outPdf = arg("out", "report.pdf");
const root = __dirname;

const data = JSON.parse(fs.readFileSync(path.resolve(dataFile), "utf8"));
const html = renderHTML(data);
const htmlPath = path.join(root, "report.html");
fs.writeFileSync(htmlPath, html);
console.log("wrote", htmlPath);

function findChrome() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  try { return require("puppeteer").executablePath(); } catch (_) {}
  const cands = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ];
  for (const c of cands) if (fs.existsSync(c)) return c;
  throw new Error("Chrome/Chromium ei löytynyt. Aseta CHROME_BIN tai `npm i puppeteer`.");
}

const chrome = findChrome();
const absOut = path.resolve(outPdf);
execFileSync(chrome, [
  "--headless", "--disable-gpu", "--no-sandbox",
  "--no-pdf-header-footer",
  "--print-to-pdf=" + absOut,
  "file://" + htmlPath,
], { stdio: "inherit" });
console.log("wrote", absOut);
