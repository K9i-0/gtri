#!/usr/bin/env bun
import { render } from "ink";
import { App } from "./App.tsx";
import { checkGtrExists } from "./lib/gtr.ts";
import { update, showVersion, checkForUpdates } from "./lib/update.ts";

async function main() {
  // Bunコンパイル済みバイナリでは argv[2] に実行ファイルのパスが入るためスキップ
  let args = process.argv.slice(2);
  if (args[0]?.includes("gtri") && !["update", "version", "help"].includes(args[0])) {
    args = args.slice(1);
  }
  const command = args[0];

  // Handle subcommands
  if (command === "update") {
    await update();
    return;
  }

  if (command === "version" || command === "--version" || command === "-v") {
    showVersion();
    return;
  }

  if (command === "help" || command === "--help" || command === "-h") {
    console.log("gtri - Interactive TUI for git-worktree-runner");
    console.log("");
    console.log("Usage:");
    console.log("  gtri              Launch interactive TUI");
    console.log("  gtri update       Update to the latest version");
    console.log("  gtri version      Show version");
    console.log("  gtri help         Show this help");
    return;
  }

  if (command && !command.startsWith("-")) {
    console.error(`Unknown command: ${command}`);
    console.error("Run 'gtri help' for usage.");
    process.exit(1);
  }

  // Launch TUI
  if (!process.stdin.isTTY) {
    console.error("Error: This terminal does not support interactive mode.");
    console.error("Please run gtri in a TTY terminal.");
    process.exit(1);
  }

  const gtrExists = await checkGtrExists();
  if (!gtrExists) {
    console.error("Error: git-gtr is not installed or not in PATH.");
    console.error(
      "Install it from: https://github.com/coderabbitai/git-worktree-runner"
    );
    process.exit(1);
  }

  // Check for updates at startup
  await checkForUpdates();

  render(<App />);
}

main();
// Demo
