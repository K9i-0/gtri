#!/usr/bin/env bun
import { render } from "ink";
import { App } from "./App.tsx";
import { checkGtrExists } from "./lib/gtr.ts";

async function main() {
  if (!process.stdin.isTTY) {
    console.error("Error: This terminal does not support interactive mode.");
    console.error("Please run gtri in a TTY terminal.");
    process.exit(1);
  }

  const gtrExists = await checkGtrExists();
  if (!gtrExists) {
    console.error("Error: git-gtr is not installed or not in PATH.");
    console.error("Install it from: https://github.com/coderabbitai/git-worktree-runner");
    process.exit(1);
  }

  render(<App />);
}

main();
