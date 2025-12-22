export interface PRInfo {
  number: number;
  title: string;
  url: string;
  state: "open" | "closed" | "merged";
}

export interface Worktree {
  path: string;
  branch: string;
  status: "ok" | "detached" | "locked" | "prunable" | "missing";
  isMain: boolean;
  shortHash?: string;
  prInfo?: PRInfo;
}

export interface GtrConfig {
  editor: string;
  ai: string;
}

export type ActionType = "editor" | "ai" | "copy" | "delete" | "refresh";
