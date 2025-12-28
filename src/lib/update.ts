import { $ } from "bun";

const REPO = "K9i-0/gtri";
const CURRENT_VERSION = "1.4.0";

interface GitHubRelease {
  tag_name: string;
  assets: {
    name: string;
    browser_download_url: string;
  }[];
}

function getAssetName(): string {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "darwin" && arch === "arm64") {
    return "gtri-darwin-arm64";
  } else if (platform === "darwin" && arch === "x64") {
    return "gtri-darwin-x64";
  } else if (platform === "linux" && arch === "x64") {
    return "gtri-linux-x64";
  }

  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

async function getLatestRelease(): Promise<GitHubRelease> {
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("No releases found. Please create a release first.");
    }
    throw new Error(`Failed to fetch release: ${response.statusText}`);
  }

  return response.json() as Promise<GitHubRelease>;
}

function compareVersions(current: string, latest: string): number {
  const currentParts = current.replace(/^v/, "").split(".").map(Number);
  const latestParts = latest.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] || 0;
    const l = latestParts[i] || 0;
    if (c < l) return -1;
    if (c > l) return 1;
  }
  return 0;
}

async function downloadBinary(url: string, tempPath: string): Promise<void> {
  try {
    // Try fetch first (faster, no sudo prompt)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    const binary = await response.arrayBuffer();
    await Bun.write(tempPath, binary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Fallback to curl for SSL certificate issues (corporate proxies)
    if (message.includes("certificate")) {
      console.log("Falling back to curl...");
      await $`curl -fsSL -o ${tempPath} ${url}`;
    } else {
      throw error;
    }
  }
}

async function downloadAndInstall(url: string): Promise<void> {
  console.log("Downloading...");

  // Get the path of the current executable
  const execPath = process.execPath;

  // Download to temp directory first (always writable)
  const tempPath = `/tmp/gtri-update-${Date.now()}`;
  await downloadBinary(url, tempPath);

  // Make it executable
  await $`chmod +x ${tempPath}`;

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

export async function update(): Promise<void> {
  console.log(`Current version: v${CURRENT_VERSION}`);
  console.log("Checking for updates...");

  try {
    const release = await getLatestRelease();
    const latestVersion = release.tag_name;

    console.log(`Latest version: ${latestVersion}`);

    const cmp = compareVersions(CURRENT_VERSION, latestVersion);

    if (cmp >= 0) {
      console.log("You are already on the latest version.");
      return;
    }

    console.log(`New version available: ${latestVersion}`);

    const assetName = getAssetName();
    const asset = release.assets.find((a) => a.name === assetName);

    if (!asset) {
      throw new Error(
        `No binary found for your platform (${assetName}). Available: ${release.assets.map((a) => a.name).join(", ")}`
      );
    }

    await downloadAndInstall(asset.browser_download_url);
    console.log(`Successfully updated to ${latestVersion}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Provide helpful hints for common errors
    if (message.includes("certificate")) {
      console.error("Update failed:", message);
      console.error("\nHint: This may be caused by a corporate proxy or firewall.");
      console.error("Try downloading manually from:");
      console.error(`  https://github.com/${REPO}/releases/latest`);
    } else {
      console.error("Update failed:", message);
    }
    process.exit(1);
  }
}

export function showVersion(): void {
  console.log(`gtri v${CURRENT_VERSION}`);
}

/**
 * Check for updates at startup and display a notification if available.
 * This runs in the background and won't block the app if it fails.
 */
export async function checkForUpdates(): Promise<void> {
  try {
    const release = await getLatestRelease();
    const latestVersion = release.tag_name;

    const cmp = compareVersions(CURRENT_VERSION, latestVersion);

    if (cmp < 0) {
      // New version available - show colored notification
      const yellow = "\x1b[33m";
      const cyan = "\x1b[36m";
      const bold = "\x1b[1m";
      const reset = "\x1b[0m";

      console.log("");
      console.log(
        `${yellow}╭${"─".repeat(45)}╮${reset}`
      );
      console.log(
        `${yellow}│${reset} ${bold}New version available:${reset} ${cyan}${latestVersion}${reset}${" ".repeat(45 - 23 - latestVersion.length)}${yellow}│${reset}`
      );
      console.log(
        `${yellow}│${reset} Run: ${cyan}${bold}gtri update${reset}${" ".repeat(45 - 17)}${yellow}│${reset}`
      );
      console.log(
        `${yellow}╰${"─".repeat(45)}╯${reset}`
      );
      console.log("");
    }
  } catch (error) {
    // Silently fail - don't block the app if version check fails
    // (e.g., no internet connection, GitHub API rate limit, etc.)
  }
}
