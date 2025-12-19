export interface Worktree {
  path: string;
  branch: string;
  status: "ok" | "detached" | "locked" | "prunable" | "missing";
  isMain: boolean;
  shortHash?: string;
}

export interface GtrConfig {
  editor: string;
  ai: string;
}

export type ActionType = "editor" | "ai" | "copy" | "delete" | "refresh";
