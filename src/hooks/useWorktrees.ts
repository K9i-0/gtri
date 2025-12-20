import { useState, useEffect, useCallback } from "react";
import type { Worktree, GtrConfig } from "../types/worktree.ts";
import { listWorktrees, getConfig, getCurrentBranch } from "../lib/gtr.ts";

interface UseWorktreesReturn {
  worktrees: Worktree[];
  config: GtrConfig;
  mainBranch: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWorktrees(): UseWorktreesReturn {
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [config, setConfig] = useState<GtrConfig>({ editor: "none", ai: "none" });
  const [mainBranch, setMainBranch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wts, cfg, branch] = await Promise.all([
        listWorktrees(),
        getConfig(),
        getCurrentBranch(),
      ]);
      const filteredWts = wts.filter(
        (wt) => !wt.isMain && wt.branch !== "(detached)"
      );
      setWorktrees(filteredWts);
      setConfig(cfg);
      setMainBranch(branch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { worktrees, config, mainBranch, loading, error, refresh };
}
