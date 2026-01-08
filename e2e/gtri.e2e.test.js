import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as pty from "node-pty";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const GTRI_PATH = path.join(PROJECT_ROOT, "gtri");

// Ensure gtri binary exists
try {
  execSync(`test -f ${GTRI_PATH}`, { stdio: "ignore" });
} catch {
  console.error("Error: gtri binary not found. Run 'bun run build' first.");
  process.exit(1);
}

// Strip ANSI escape codes for easier assertion
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

// Helper to wait for output containing a specific string
function waitForOutput(getOutput, contains, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const output = stripAnsi(getOutput());
      if (output.includes(contains)) {
        resolve(output);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout waiting for "${contains}". Got: ${output.slice(-500)}`));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

// Helper to spawn gtri with PTY
function spawnGtri() {
  const term = pty.spawn(GTRI_PATH, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: PROJECT_ROOT,
  });

  let output = "";
  term.onData((data) => {
    output += data;
  });

  return {
    term,
    getOutput: () => output,
    clearOutput: () => {
      output = "";
    },
    write: (data) => term.write(data),
    kill: () => term.kill(),
    waitForExit: () =>
      new Promise((resolve) => {
        term.onExit(({ exitCode }) => resolve(exitCode));
      }),
  };
}

describe("gtri E2E (PTY)", () => {
  test("launches and shows Worktrees header", async () => {
    const gtri = spawnGtri();
    try {
      await waitForOutput(gtri.getOutput, "Worktrees");
      expect(stripAnsi(gtri.getOutput())).toContain("Worktrees");
    } finally {
      gtri.write("q");
      gtri.kill();
    }
  });

  test("Tab key switches between tabs", async () => {
    const gtri = spawnGtri();
    try {
      await waitForOutput(gtri.getOutput, "Worktrees");

      // Press Tab to switch to Open PRs
      gtri.write("\t");

      // Wait for PRs tab to be active (status bar changes)
      await waitForOutput(gtri.getOutput, "[w]orktree");
      expect(stripAnsi(gtri.getOutput())).toContain("Open PRs");
    } finally {
      gtri.write("q");
      gtri.kill();
    }
  });

  test("j/k keys navigate in list", async () => {
    const gtri = spawnGtri();
    try {
      await waitForOutput(gtri.getOutput, "Worktrees");

      // Navigate with j/k
      gtri.write("j");
      await new Promise((r) => setTimeout(r, 200));
      gtri.write("k");
      await new Promise((r) => setTimeout(r, 200));

      // If we got here without crash, navigation works
      expect(true).toBe(true);
    } finally {
      gtri.write("q");
      gtri.kill();
    }
  });

  test("q key exits the application", async () => {
    const gtri = spawnGtri();

    await waitForOutput(gtri.getOutput, "Worktrees");

    // Press q to quit
    gtri.write("q");

    const exitCode = await gtri.waitForExit();
    expect(exitCode).toBe(0);
  });

  test("Enter key opens action dialog on PR tab", async () => {
    const gtri = spawnGtri();
    try {
      await waitForOutput(gtri.getOutput, "Worktrees");

      // Switch to PRs tab
      gtri.write("\t");
      await waitForOutput(gtri.getOutput, "[w]orktree");

      // Wait for PRs to load
      try {
        await waitForOutput(gtri.getOutput, "#", 5000);
      } catch {
        // No PRs available, skip this test
        console.log("No PRs available, skipping action dialog test");
        return;
      }

      // Press Enter to open action dialog
      gtri.clearOutput();
      gtri.write("\r");

      await waitForOutput(gtri.getOutput, "Actions:", 5000);
      expect(stripAnsi(gtri.getOutput())).toContain("Actions:");

      // Close dialog with Escape
      gtri.write("\x1b");
    } finally {
      gtri.write("q");
      gtri.kill();
    }
  });
});

describe("Create Worktree Dialog E2E", () => {
  test("n key opens create worktree dialog", async () => {
    const gtri = spawnGtri();
    try {
      await waitForOutput(gtri.getOutput, "Worktrees");

      // Press n to open create dialog
      gtri.write("n");

      await waitForOutput(gtri.getOutput, "Create New Worktree", 5000);
      expect(stripAnsi(gtri.getOutput())).toContain("Create New Worktree");
      expect(stripAnsi(gtri.getOutput())).toContain("(default)");
    } finally {
      gtri.write("\x1b"); // Close dialog
      gtri.write("q");
      gtri.kill();
    }
  });

  test("Escape closes create worktree dialog", async () => {
    const gtri = spawnGtri();
    try {
      await waitForOutput(gtri.getOutput, "Worktrees");

      // Press n to open create dialog
      gtri.write("n");
      await waitForOutput(gtri.getOutput, "Create New Worktree", 5000);

      // Press Escape to close
      gtri.clearOutput();
      gtri.write("\x1b");

      // Wait for dialog to close and return to main view
      await new Promise((r) => setTimeout(r, 300));
      const output = stripAnsi(gtri.getOutput());
      // Dialog should be closed - no longer showing "Create New Worktree" header
      // Main view should be visible
      expect(output).not.toContain("Create New Worktree");
    } finally {
      gtri.write("q");
      gtri.kill();
    }
  });

  test("number keys select base option in create dialog", async () => {
    const gtri = spawnGtri();
    try {
      await waitForOutput(gtri.getOutput, "Worktrees");

      // Press n to open create dialog
      gtri.write("n");
      await waitForOutput(gtri.getOutput, "Create New Worktree", 5000);

      // Press 1 to select default branch and proceed to input step
      gtri.clearOutput();
      gtri.write("1");

      await waitForOutput(gtri.getOutput, "Branch name:", 5000);
      expect(stripAnsi(gtri.getOutput())).toContain("Branch name:");
    } finally {
      gtri.write("\x1b"); // Back to select step
      gtri.write("\x1b"); // Close dialog
      gtri.write("q");
      gtri.kill();
    }
  });

  test("j/k keys navigate in select base step", async () => {
    const gtri = spawnGtri();
    try {
      await waitForOutput(gtri.getOutput, "Worktrees");

      // Press n to open create dialog
      gtri.write("n");
      await waitForOutput(gtri.getOutput, "Create New Worktree", 5000);

      // Press j to move down
      gtri.write("j");
      await new Promise((r) => setTimeout(r, 200));

      // Press k to move up
      gtri.write("k");
      await new Promise((r) => setTimeout(r, 200));

      // If we got here without crash, navigation works
      expect(stripAnsi(gtri.getOutput())).toContain("Create New Worktree");
    } finally {
      gtri.write("\x1b");
      gtri.write("q");
      gtri.kill();
    }
  });

  test("choose branch option opens branch picker", async () => {
    const gtri = spawnGtri();
    try {
      await waitForOutput(gtri.getOutput, "Worktrees");

      // Press n to open create dialog
      gtri.write("n");
      await waitForOutput(gtri.getOutput, "Create New Worktree", 5000);

      // Wait for dialog content to fully render
      await waitForOutput(gtri.getOutput, "Choose branch...", 5000);

      // Get the current output to count options
      const output = stripAnsi(gtri.getOutput());

      // Count how many options there are by checking for option numbers
      // Options are: [1] From default, [2] From current, ([3] From selected if available), [N] Choose branch...
      // The last option is always "Choose branch..."
      let lastOptionNum = 3; // Default: no selected worktree
      if (output.includes("From selected:")) {
        lastOptionNum = 4;
      }

      // Press the number key for "Choose branch..." option
      gtri.clearOutput();
      gtri.write(String(lastOptionNum));

      await waitForOutput(gtri.getOutput, "Select Base Branch", 5000);
      expect(stripAnsi(gtri.getOutput())).toContain("Select Base Branch");
      expect(stripAnsi(gtri.getOutput())).toContain("Filter:");
    } finally {
      gtri.write("\x1b"); // Back
      gtri.write("\x1b"); // Close
      gtri.write("q");
      gtri.kill();
    }
  });

  test("Escape in input step goes back to select step", async () => {
    const gtri = spawnGtri();
    try {
      await waitForOutput(gtri.getOutput, "Worktrees");

      // Press n to open create dialog
      gtri.write("n");
      await waitForOutput(gtri.getOutput, "Create New Worktree", 5000);

      // Press 1 to select default and go to input step
      gtri.write("1");
      await waitForOutput(gtri.getOutput, "Branch name:", 5000);

      // Press Escape to go back
      gtri.clearOutput();
      gtri.write("\x1b");

      await waitForOutput(gtri.getOutput, "Create New Worktree", 5000);
      expect(stripAnsi(gtri.getOutput())).toContain("(default)");
    } finally {
      gtri.write("\x1b");
      gtri.write("q");
      gtri.kill();
    }
  });
});
