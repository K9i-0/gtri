import type { Worktree, GtrConfig, PRInfo } from "../types/worktree.ts";

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
    const [shortHash, upstreamBranch, isDirty] = await Promise.all([
      getShortHash(wt.path),
      getUpstreamBranch(wt.branch),
      checkIsDirty(wt.path),
    ]);
    worktrees.push({ ...wt, shortHash, upstreamBranch, isDirty });
  }

  return worktrees;
}

async function checkIsDirty(worktreePath: string): Promise<boolean> {
  const { stdout, exitCode } = await runGitCommand(
    ["status", "--porcelain"],
    worktreePath
  );
  return exitCode === 0 && stdout.length > 0;
}

async function getShortHash(worktreePath: string): Promise<string | undefined> {
  const { stdout, exitCode } = await runGitCommand(
    ["rev-parse", "--short", "HEAD"],
    worktreePath
  );
  return exitCode === 0 ? stdout : undefined;
}

async function getUpstreamBranch(branch: string): Promise<string | undefined> {
  const { stdout, exitCode } = await runGitCommand([
    "config",
    "--get",
    `branch.${branch}.merge`,
  ]);
  if (exitCode !== 0 || !stdout) {
    return undefined;
  }
  // refs/heads/feature/hoge -> feature/hoge
  return stdout.replace(/^refs\/heads\//, "");
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

export async function getMainRepoPath(): Promise<string | null> {
  const { stdout, exitCode } = await runCommand(["list", "--porcelain"]);
  if (exitCode !== 0 || !stdout) return null;

  const firstLine = stdout.split("\n")[0];
  if (!firstLine) return null;

  const path = firstLine.split("\t")[0];
  return path || null;
}

export async function getAiCommand(branch: string): Promise<string | null> {
  const path = await getMainRepoPath();
  if (!path) return null;
  return `cd "${path}" && git gtr ai "${branch}"`;
}

export interface RemoveWorktreeResult {
  success: boolean;
  error?: string;
}

export async function removeWorktree(branch: string): Promise<RemoveWorktreeResult> {
  const { exitCode, stderr } = await runCommand([
    "rm",
    branch,
    "--yes",
    "--force",
    "--delete-branch",
  ]);
  if (exitCode === 0) {
    return { success: true };
  }

  return { success: false, error: stderr || "Failed to remove worktree" };
}

export async function getWorktreePath(branch: string): Promise<string | null> {
  const { stdout, exitCode } = await runCommand(["go", branch]);
  return exitCode === 0 ? stdout : null;
}

export async function getCurrentBranch(): Promise<string> {
  const { stdout, exitCode } = await runGitCommand(["branch", "--show-current"]);
  return exitCode === 0 && stdout ? stdout : "unknown";
}

// gh コマンドを実行するヘルパー関数
async function runGhCommand(
  args: string[]
): Promise<{ stdout: string; exitCode: number }> {
  const proc = Bun.spawn(["gh", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  return { stdout: stdout.trim(), exitCode };
}

// gh CLI が利用可能かチェック
export async function checkGhExists(): Promise<boolean> {
  const proc = Bun.spawn(["gh", "auth", "status"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const exitCode = await proc.exited;
  return exitCode === 0;
}

// ブランチに対応する PR 情報を取得
export async function getPRInfo(branch: string): Promise<PRInfo | null> {
  const { stdout, exitCode } = await runGhCommand([
    "pr",
    "list",
    "--head",
    branch,
    "--state",
    "all",
    "--json",
    "number,title,url,state,author",
    "--limit",
    "1",
  ]);

  if (exitCode !== 0 || !stdout) {
    return null;
  }

  try {
    const prs = JSON.parse(stdout) as PRInfo[];
    return prs[0] ?? null;
  } catch {
    return null;
  }
}

// 複数ブランチの PR 情報を並列取得
export async function getPRInfoBatch(
  branches: string[]
): Promise<Map<string, PRInfo>> {
  const results = new Map<string, PRInfo>();

  const prInfoPromises = branches.map(async (branch) => {
    const prInfo = await getPRInfo(branch);
    if (prInfo) {
      results.set(branch, prInfo);
    }
  });

  await Promise.all(prInfoPromises);
  return results;
}

// PR をブラウザで開く
export async function openPRInBrowser(url: string): Promise<void> {
  Bun.spawn(["open", url], {
    stdout: "ignore",
    stderr: "ignore",
  });
}
