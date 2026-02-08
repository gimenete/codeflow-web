#!/usr/bin/env node

// Fetches the latest release from gimenete/codeflow and writes the result
// to src/data/release.json. Run this before building/deploying the site:
//
//   node scripts/update-releases.mjs
//
// The JSON file is checked into git so the site builds without network access.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "gimenete/codeflow";
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "src", "data", "release.json");

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function isInstallerAsset(name) {
  const lower = name.toLowerCase();
  return !(
    lower.endsWith(".sha256") ||
    lower.endsWith(".sig") ||
    lower.endsWith(".blockmap") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml")
  );
}

function detectPlatform(name) {
  const lower = name.toLowerCase();
  if (lower.includes("mac") || lower.includes("darwin") || lower.includes("macos") || lower.endsWith(".dmg"))
    return "macOS";
  if (lower.includes("win") || lower.endsWith(".exe") || lower.endsWith(".msi"))
    return "Windows";
  if (lower.includes("linux") || lower.endsWith(".appimage") || lower.endsWith(".deb") || lower.endsWith(".rpm"))
    return "Linux";
  return null;
}

async function main() {
  console.log(`Fetching latest release from ${REPO}...`);

  const res = await fetch(API_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (res.status === 404) {
    console.log("No releases found. Writing empty release data.");
    const data = { release: null, fetchedAt: new Date().toISOString() };
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2) + "\n");
    console.log(`Wrote ${OUTPUT_PATH}`);
    return;
  }

  if (!res.ok) {
    console.error(`GitHub API error: HTTP ${res.status}`);
    process.exit(1);
  }

  const release = await res.json();
  const assets = release.assets
    .filter((a) => isInstallerAsset(a.name))
    .map((a) => ({
      name: a.name,
      url: a.browser_download_url,
      size: a.size,
      sizeFormatted: formatBytes(a.size),
      platform: detectPlatform(a.name),
    }));

  const data = {
    release: {
      version: release.name || release.tag_name,
      tagName: release.tag_name,
      url: release.html_url,
      publishedAt: release.published_at,
      assets,
    },
    fetchedAt: new Date().toISOString(),
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2) + "\n");

  console.log(`Release ${data.release.version} with ${assets.length} asset(s):`);
  for (const a of assets) {
    console.log(`  ${a.platform ?? "other"}: ${a.name} (${a.sizeFormatted})`);
  }
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main();
