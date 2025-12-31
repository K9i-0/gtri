export interface PRAuthor {
  login: string;
}

export interface PRInfo {
  number: number;
  title: string;
  url: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  author: PRAuthor;
  headRefName?: string;
  isDraft?: boolean;
}

export interface Worktree {
  path: string;
  branch: string;
  upstreamBranch?: string;
  status: "ok" | "detached" | "locked" | "prunable" | "missing";
  isMain: boolean;
  shortHash?: string;
  prInfo?: PRInfo;
  isDirty?: boolean;
}

export interface GtrConfig {
  editor: string;
  ai: string;
}

export type ActionType = "editor" | "ai" | "copy" | "delete" | "refresh";

export type TabType = "worktrees" | "prs";

// ベースブランチの種類
export type BaseBranchMode =
  | { type: "default" } // デフォルトブランチから
  | { type: "fromSelected"; ref: string } // 選択中のworktreeのブランチから
  | { type: "fromCurrent" }; // main repoの現在のブランチから (--from-current)

// ダイアログの状態
export type CreateWorktreeDialogState =
  | { mode: "closed" }
  | {
      mode: "input";
      branchName: string;
      baseBranch: BaseBranchMode;
      openEditor: boolean;
      activeField: "branchName" | "baseBranch" | "openEditor";
      validationError?: string;
      // ベースブランチ選択用のコンテキスト情報
      selectedWorktreeBranch?: string; // 選択中のworktreeのブランチ
      currentBranch?: string; // main repoの現在のブランチ
      defaultBranch?: string; // デフォルトブランチ
    };

// バックグラウンドで作成中のworktree
export interface PendingWorktree {
  id: string; // ユニークID
  branchName: string;
  baseBranch: BaseBranchMode;
  openEditor: boolean;
  status: "creating" | "success" | "error";
  error?: string;
  path?: string;
  startedAt: number;
}

// App レベルの状態
export interface CreateWorktreeState {
  dialog: CreateWorktreeDialogState;
  pending: PendingWorktree[];
}
