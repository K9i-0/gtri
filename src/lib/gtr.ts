import type {
  Worktree,
  GtrConfig,
  PRInfo,
  BaseBranchMode,
} from "../types/worktree.ts";

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

// Get config value with .gtrconfig fallback (mirrors gtr's cfg_default)
// Priority: local git config > .gtrconfig > global/system git config
async function getConfigValue(
  gitKey: string,
  gtrconfigKey: string
): Promise<string> {
  // 1. Try local git config first (highest priority)
  const localResult = await runGitCommand([
    "config",
    "--local",
    "--get",
    gitKey,
  ]);
  if (localResult.exitCode === 0 && localResult.stdout) {
    return localResult.stdout;
  }

  // 2. Try .gtrconfig file
  const mainRepoPath = await getMainRepoPath();
  if (mainRepoPath) {
    const gtrconfigPath = `${mainRepoPath}/.gtrconfig`;
    const gtrconfigResult = await runGitCommand([
      "config",
      "-f",
      gtrconfigPath,
      "--get",
      gtrconfigKey,
    ]);
    if (gtrconfigResult.exitCode === 0 && gtrconfigResult.stdout) {
      return gtrconfigResult.stdout;
    }
  }

  // 3. Try global/system git config
  const globalResult = await runGitCommand(["config", "--get", gitKey]);
  if (globalResult.exitCode === 0 && globalResult.stdout) {
    return globalResult.stdout;
  }

  return "none";
}

export async function getConfig(): Promise<GtrConfig> {
  const [editor, ai] = await Promise.all([
    getConfigValue("gtr.editor.default", "defaults.editor"),
    getConfigValue("gtr.ai.default", "defaults.ai"),
  ]);

  return { editor, ai };
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
    "number,title,url,state,author,isDraft",
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

// リポジトリの全てのOpen PRを取得
export async function getOpenPRs(): Promise<PRInfo[]> {
  const { stdout, exitCode } = await runGhCommand([
    "pr",
    "list",
    "--state",
    "open",
    "--json",
    "number,title,url,state,author,headRefName,isDraft",
    "--limit",
    "100",
  ]);

  if (exitCode !== 0 || !stdout) {
    return [];
  }

  try {
    return JSON.parse(stdout) as PRInfo[];
  } catch {
    return [];
  }
}

export interface CreateWorktreeResult {
  success: boolean;
  path?: string;
  error?: string;
}

// PRブランチからworktreeを作成
export async function createWorktreeFromBranch(
  branch: string
): Promise<CreateWorktreeResult> {
  const { stdout, stderr, exitCode } = await runCommand(["new", branch]);

  if (exitCode === 0) {
    return { success: true, path: stdout };
  }

  return { success: false, error: stderr || "Failed to create worktree" };
}

// gtr new コマンドの引数を構築
export function buildGtrNewCommand(
  branchName: string,
  baseBranch: BaseBranchMode
): string[] {
  const args = ["new"];

  switch (baseBranch.type) {
    case "default":
      // gtr new <branch> --yes
      args.push(branchName, "--yes");
      break;
    case "fromSelected":
    case "specific":
      // gtr new <branch> --from <ref> --yes
      args.push(branchName, "--from", baseBranch.ref, "--yes");
      break;
    case "fromCurrent":
      // gtr new <branch> --from-current --yes
      args.push(branchName, "--from-current", "--yes");
      break;
  }

  return args;
}

// ローカルブランチ一覧を取得
export async function getLocalBranches(): Promise<string[]> {
  const { stdout, exitCode } = await runGitCommand([
    "branch",
    "--format=%(refname:short)",
  ]);

  if (exitCode !== 0 || !stdout) {
    return [];
  }

  return stdout
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
}

// 新規worktreeを作成（バックグラウンド実行用）
export async function createWorktreeNew(
  branchName: string,
  baseBranch: BaseBranchMode
): Promise<CreateWorktreeResult> {
  const args = buildGtrNewCommand(branchName, baseBranch);
  const { stdout, stderr, exitCode } = await runCommand(args);

  if (exitCode === 0) {
    // 出力からパスを抽出（gtr new の出力形式に依存）
    // 通常は作成されたパスが出力される
    return { success: true, path: stdout || undefined };
  }

  return { success: false, error: stderr || "Failed to create worktree" };
}

// ブランチ名のバリデーション
export interface BranchNameValidation {
  valid: boolean;
  error?: string;
}

export function validateBranchName(name: string): BranchNameValidation {
  if (!name.trim()) {
    return { valid: false, error: "Branch name cannot be empty" };
  }

  // Gitのブランチ名規則に従う
  const invalidChars = /[\s~^:?*[\]\\]/;
  if (invalidChars.test(name)) {
    return { valid: false, error: "Branch name contains invalid characters" };
  }

  if (name.startsWith("-") || name.endsWith(".") || name.endsWith("/")) {
    return { valid: false, error: "Invalid branch name format" };
  }

  // 連続する . や // をチェック
  if (name.includes("..") || name.includes("//")) {
    return { valid: false, error: "Invalid branch name format" };
  }

  // @ が単独で使われていないかチェック
  if (name === "@" || name.includes("@{")) {
    return { valid: false, error: "Invalid branch name format" };
  }

  return { valid: true };
}

// デフォルトブランチを取得
export async function getDefaultBranch(): Promise<string> {
  // git symbolic-ref refs/remotes/origin/HEAD を試す
  const { stdout, exitCode } = await runGitCommand([
    "symbolic-ref",
    "--short",
    "refs/remotes/origin/HEAD",
  ]);

  if (exitCode === 0 && stdout) {
    // origin/main -> main
    return stdout.replace(/^origin\//, "");
  }

  // フォールバック: main または master を確認
  const { exitCode: mainExitCode } = await runGitCommand([
    "rev-parse",
    "--verify",
    "refs/heads/main",
  ]);

  if (mainExitCode === 0) {
    return "main";
  }

  return "master";
}

// パスでエディタを開く
export async function openEditorAtPath(path: string): Promise<void> {
  // gtr editor は branch 名を取るので、パスから branch を推測するか、
  // 直接 config のエディタコマンドを使う
  const config = await getConfig();
  if (config.editor === "none") {
    return;
  }

  // エディタコマンドをバックグラウンドで起動
  Bun.spawn([config.editor, path], {
    stdout: "ignore",
    stderr: "ignore",
  });
}

// gtri 固有の設定（個人設定、チーム共有しない）
export interface GtriCreateSettings {
  baseBranchMode: "default" | "fromSelected" | "fromCurrent";
  openEditor: boolean;
}

const DEFAULT_CREATE_SETTINGS: GtriCreateSettings = {
  baseBranchMode: "default",
  openEditor: false,
};

// ローカルgit configから gtri の設定を読み込む
// .git/config に保存されるため、チームで共有されない
export async function getGtriCreateSettings(): Promise<GtriCreateSettings> {
  // baseBranchMode を読み込む
  const baseModeResult = await runGitCommand([
    "config",
    "--local",
    "--get",
    "gtri.create.baseBranchMode",
  ]);
  const baseBranchMode =
    baseModeResult.exitCode === 0 &&
    ["default", "fromSelected", "fromCurrent"].includes(baseModeResult.stdout)
      ? (baseModeResult.stdout as GtriCreateSettings["baseBranchMode"])
      : DEFAULT_CREATE_SETTINGS.baseBranchMode;

  // openEditor を読み込む
  const openEditorResult = await runGitCommand([
    "config",
    "--local",
    "--get",
    "gtri.create.openEditor",
  ]);
  const openEditor =
    openEditorResult.exitCode === 0
      ? openEditorResult.stdout === "true"
      : DEFAULT_CREATE_SETTINGS.openEditor;

  return { baseBranchMode, openEditor };
}

// ローカルgit configに gtri の設定を保存する
// .git/config に保存されるため、チームで共有されない
export async function saveGtriCreateSettings(
  settings: Partial<GtriCreateSettings>
): Promise<void> {
  if (settings.baseBranchMode !== undefined) {
    await runGitCommand([
      "config",
      "--local",
      "gtri.create.baseBranchMode",
      settings.baseBranchMode,
    ]);
  }

  if (settings.openEditor !== undefined) {
    await runGitCommand([
      "config",
      "--local",
      "gtri.create.openEditor",
      settings.openEditor ? "true" : "false",
    ]);
  }
}
