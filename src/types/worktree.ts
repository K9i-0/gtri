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

// アクション選択ダイアログ用
export interface ActionItem {
  key: string;
  label: string;
  action: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export type ActionSelectDialogState =
  | { mode: "closed" }
  | {
      mode: "open";
      selectedIndex: number;
      actions: ActionItem[];
      targetLabel: string;
    };

export type TabType = "worktrees" | "prs";

// ベースブランチの種類
export type BaseBranchMode =
  | { type: "default" } // デフォルトブランチから
  | { type: "fromSelected"; ref: string } // 選択中のworktreeのブランチから
  | { type: "fromCurrent" } // main repoの現在のブランチから (--from-current)
  | { type: "specific"; ref: string }; // 任意のブランチから（Choose branch...で選択）

// ダイアログのステップ
export type CreateWorktreeStep =
  | "selectBase" // Step 1: ベースブランチの選択方法を選ぶ
  | "chooseBranch" // Step 1.5: ブランチ一覧から選ぶ（Choose branch...選択時）
  | "input"; // Step 2: ブランチ名入力

// ダイアログの状態
export type CreateWorktreeDialogState =
  | { mode: "closed" }
  | {
      mode: "open";
      step: CreateWorktreeStep;
      branchName: string;
      baseBranch: BaseBranchMode;
      openEditor: boolean;
      validationError?: string;
      // ベースブランチ選択用のコンテキスト情報
      selectedWorktreeBranch?: string; // 選択中のworktreeのブランチ
      currentBranch?: string; // main repoの現在のブランチ
      defaultBranch?: string; // デフォルトブランチ
      // selectBase ステップ用
      selectedBaseIndex: number;
      // chooseBranch ステップ用
      branches: string[];
      branchFilter: string;
      selectedBranchIndex: number;
    };

// バックグラウンドで作成中のworktree
export interface PendingWorktree {
  id: string; // ユニークID
  branchName: string;
  baseBranch: BaseBranchMode;
  openEditor: boolean;
  status: "creating" | "ready" | "error";
  processingHint?: "copying" | "hooks"; // copy/hooks処理中の表示用
  error?: string;
  path?: string; // ready時に設定される
  startedAt: number;
}

// App レベルの状態
export interface CreateWorktreeState {
  dialog: CreateWorktreeDialogState;
  pending: PendingWorktree[];
}
