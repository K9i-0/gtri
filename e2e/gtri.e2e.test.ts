import { describe, test, expect } from "bun:test";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const GTRI_PATH = path.join(PROJECT_ROOT, "gtri");

// Strip ANSI escape codes for easier assertion
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

describe("gtri E2E", () => {
  test("--help shows usage information", async () => {
    const proc = Bun.spawn([GTRI_PATH, "--help"], {
      cwd: PROJECT_ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    expect(exitCode).toBe(0);
    expect(stdout).toContain("gtri");
  });

  test("--version shows version", async () => {
    const proc = Bun.spawn([GTRI_PATH, "--version"], {
      cwd: PROJECT_ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    expect(exitCode).toBe(0);
    // Version should be in format like "gtri v1.6.0"
    expect(stdout.trim()).toMatch(/gtri v\d+\.\d+\.\d+/);
  });

  test("exits with error when not in TTY", async () => {
    const proc = Bun.spawn([GTRI_PATH], {
      cwd: PROJECT_ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });

    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    // Should exit with error when not in TTY
    expect(exitCode).toBe(1);
    expect(stderr).toContain("TTY");
  });
});

// Note: Full interactive E2E tests with keyboard input require PTY support.
// node-pty has compatibility issues with Bun.
// For full E2E testing, consider using:
// 1. A shell script wrapper with `expect`
// 2. Running tests with Node.js instead of Bun for PTY-dependent tests
// 3. VHS (https://github.com/charmbracelet/vhs) for visual terminal testing
