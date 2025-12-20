import { $ } from "bun";

const REPO = "K9i-0/gtri";
const CURRENT_VERSION = "1.0.0";

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

  return response.json();
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

async function downloadAndInstall(url: string): Promise<void> {
  console.log("Downloading...");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const binary = await response.arrayBuffer();

  // Get the path of the current executable
  const execPath = process.execPath;

  // Write to a temp file first
  const tempPath = `${execPath}.new`;
  await Bun.write(tempPath, binary);

  // Make it executable
  await $`chmod +x ${tempPath}`;

  // Replace the current binary
  const backupPath = `${execPath}.backup`;
  await $`mv ${execPath} ${backupPath}`;
  await $`mv ${tempPath} ${execPath}`;
  await $`rm -f ${backupPath}`;

  console.log("Update complete!");
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
    console.error(
      "Update failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

export function showVersion(): void {
  console.log(`gtri v${CURRENT_VERSION}`);
}
