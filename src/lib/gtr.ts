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

export async function listWorktrees(): Promise<Worktree[]> {
  const { stdout, exitCode } = await runCommand(["list", "--porcelain"]);

  if (exitCode !== 0 || !stdout) {
    return [];
  }

  const lines = stdout.split("\n").filter((line) => line.length > 0);
  const worktrees: Worktree[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const parts = line.split("\t");
    if (parts.length < 3) continue;

    const [path, branch, status] = parts;
    if (!path || !branch) continue;

    const shortHash = await getShortHash(path);

    worktrees.push({
      path,
      branch,
      status: (status as Worktree["status"]) || "ok",
      isMain: i === 0,
      shortHash,
    });
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
  const proc = Bun.spawn(["git", "gtr", "editor", branch], {
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;
}

export async function startAi(branch: string): Promise<void> {
  const proc = Bun.spawn(["git", "gtr", "ai", branch], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
  await proc.exited;
}

export async function removeWorktree(branch: string): Promise<boolean> {
  const { exitCode } = await runCommand(["rm", branch, "--yes"]);
  return exitCode === 0;
}

export async function getWorktreePath(branch: string): Promise<string | null> {
  const { stdout, exitCode } = await runCommand(["go", branch]);
  return exitCode === 0 ? stdout : null;
}
