export interface PRAuthor {
  login: string;
}

export interface PRInfo {
  number: number;
  title: string;
  url: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  author: PRAuthor;
}

export interface Worktree {
  path: string;
  branch: string;
  upstreamBranch?: string;
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
