import { useState, useEffect, useCallback } from "react";
import type { Worktree, GtrConfig } from "../types/worktree.ts";
import { listWorktrees, getConfig } from "../lib/gtr.ts";

interface UseWorktreesReturn {
  worktrees: Worktree[];
  config: GtrConfig;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWorktrees(): UseWorktreesReturn {
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [config, setConfig] = useState<GtrConfig>({ editor: "none", ai: "none" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wts, cfg] = await Promise.all([listWorktrees(), getConfig()]);
      setWorktrees(wts);
      setConfig(cfg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { worktrees, config, loading, error, refresh };
}
