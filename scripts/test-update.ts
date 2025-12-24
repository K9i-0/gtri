#!/usr/bin/env bun
/**
 * Test script for update installation logic
 * Usage: bun scripts/test-update.ts
 */

import { $ } from "bun";

const REPO = "K9i-0/gtri";

async function downloadAndInstall(url: string): Promise<void> {
  console.log("Downloading...");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const binary = await response.arrayBuffer();

  // Get the path of the current executable
  const execPath = process.execPath;

  // Download to temp directory first (always writable)
  const tempPath = `/tmp/gtri-update-${Date.now()}`;
  await Bun.write(tempPath, binary);

  // Make it executable
  await $`chmod +x ${tempPath}`;

  console.log(`Downloaded to: ${tempPath}`);
  console.log(`Target: ${execPath}`);

  // Try to replace directly, if permission denied, use sudo
  try {
    const backupPath = `${execPath}.backup`;
    await $`mv ${execPath} ${backupPath}`.quiet();
    await $`mv ${tempPath} ${execPath}`.quiet();
    await $`rm -f ${backupPath}`.quiet();
    console.log("Update complete!");
  } catch {
    // Permission denied - need sudo
    console.log("\nPermission required. Running with sudo...");
    await $`sudo mv ${tempPath} ${execPath}`;
    console.log("Update complete!");
  }
}

async function main() {
  // Get latest release info
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`
  );
  const release = await response.json();

  console.log(`Latest release: ${release.tag_name}`);

  // Find darwin-arm64 asset
  const asset = release.assets.find((a: { name: string }) =>
    a.name === "gtri-darwin-arm64"
  );

  if (!asset) {
    console.error("No darwin-arm64 asset found");
    process.exit(1);
  }

  console.log(`Asset URL: ${asset.browser_download_url}`);

  await downloadAndInstall(asset.browser_download_url);
}

main().catch(console.error);
