import type { Worktree, GtrConfig } from "../types/worktree.ts";

async function runCommand(
  args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["git", "gtr", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

async function runGitCommand(
  args: string[],
  cwd?: string
): Promise<{ stdout: string; exitCode: number }> {
  const proc = Bun.spawn(["git", ...args], {
    stdout: "pipe",
    stderr: "pipe",
    cwd,
  });
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  return { stdout: stdout.trim(), exitCode };
}

export async function checkGtrExists(): Promise<boolean> {
  const { exitCode } = await runCommand(["--version"]);
  return exitCode === 0;
}

// パース処理（テスト可能な純粋関数）
export function parseWorktreeOutput(
  output: string
): Omit<Worktree, "shortHash">[] {
  const lines = output.split("\n").filter((line) => line.length > 0);
  const worktrees: Omit<Worktree, "shortHash">[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const parts = line.split("\t");
    if (parts.length < 3) continue;

    const [path, branch, status] = parts;
    if (!path || !branch) continue;

    worktrees.push({
      path,
      branch,
      status: (status as Worktree["status"]) || "ok",
      isMain: i === 0,
    });
  }

  return worktrees;
}

export async function listWorktrees(): Promise<Worktree[]> {
  const { stdout, exitCode } = await runCommand(["list", "--porcelain"]);

  if (exitCode !== 0 || !stdout) {
    return [];
  }

  const parsed = parseWorktreeOutput(stdout);
  const worktrees: Worktree[] = [];

  for (const wt of parsed) {
    const shortHash = await getShortHash(wt.path);
    worktrees.push({ ...wt, shortHash });
  }

  return worktrees;
}

async function getShortHash(worktreePath: string): Promise<string | undefined> {
  const { stdout, exitCode } = await runGitCommand(
    ["rev-parse", "--short", "HEAD"],
    worktreePath
  );
  return exitCode === 0 ? stdout : undefined;
}

export async function getConfig(): Promise<GtrConfig> {
  const [editorResult, aiResult] = await Promise.all([
    runCommand(["config", "get", "gtr.editor.default"]),
    runCommand(["config", "get", "gtr.ai.default"]),
  ]);

  return {
    editor: editorResult.stdout || "none",
    ai: aiResult.stdout || "none",
  };
}

export async function openEditor(branch: string): Promise<void> {
  // エディタをバックグラウンドで起動（終了を待たない）
  Bun.spawn(["git", "gtr", "editor", branch], {
    stdout: "ignore",
    stderr: "ignore",
  });
}

export async function getAiCommand(branch: string): Promise<string | null> {
  const path = await getWorktreePath(branch);
  if (!path) return null;
  return `cd "${path}" && git gtr ai "${branch}"`;
}

export async function removeWorktree(branch: string): Promise<boolean> {
  const { exitCode } = await runCommand(["rm", branch, "--yes"]);
  return exitCode === 0;
}

export async function getWorktreePath(branch: string): Promise<string | null> {
  const { stdout, exitCode } = await runCommand(["go", branch]);
  return exitCode === 0 ? stdout : null;
}

export async function getCurrentBranch(): Promise<string> {
  const { stdout, exitCode } = await runGitCommand(["branch", "--show-current"]);
  return exitCode === 0 && stdout ? stdout : "unknown";
}
