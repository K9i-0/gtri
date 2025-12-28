import { useState, useEffect, useCallback } from "react";
import type { Worktree, GtrConfig } from "../types/worktree.ts";
import {
  listWorktrees,
  getConfig,
  getCurrentBranch,
  checkGhExists,
  getPRInfoBatch,
} from "../lib/gtr.ts";

interface UseWorktreesReturn {
  worktrees: Worktree[];
  config: GtrConfig;
  mainBranch: string;
  loading: boolean;
  prLoading: boolean;
  error: string | null;
  ghAvailable: boolean;
  refresh: () => Promise<void>;
  deletingBranch: string | null;
  setDeletingBranch: (branch: string | null) => void;
  removeWorktreeFromList: (branch: string) => void;
}

export function useWorktrees(): UseWorktreesReturn {
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [config, setConfig] = useState<GtrConfig>({ editor: "none", ai: "none" });
  const [mainBranch, setMainBranch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [prLoading, setPrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ghAvailable, setGhAvailable] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<string | null>(null);

  const removeWorktreeFromList = useCallback((branch: string) => {
    setWorktrees((prev) => prev.filter((wt) => wt.branch !== branch));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wts, cfg, branch, ghExists] = await Promise.all([
        listWorktrees(),
        getConfig(),
        getCurrentBranch(),
        checkGhExists(),
      ]);
      const filteredWts = wts.filter(
        (wt) => !wt.isMain && wt.branch !== "(detached)"
      );
      setWorktrees(filteredWts);
      setConfig(cfg);
      setMainBranch(branch);
      setGhAvailable(ghExists);

      // PR情報を非同期で取得（上流ブランチ名を使用）
      if (ghExists && filteredWts.length > 0) {
        setPrLoading(true);
        const branches = filteredWts.map((wt) => wt.upstreamBranch || wt.branch);
        getPRInfoBatch(branches).then((prMap) => {
          setWorktrees((prev) =>
            prev.map((wt) => ({
              ...wt,
              prInfo: prMap.get(wt.upstreamBranch || wt.branch),
            }))
          );
          setPrLoading(false);
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    worktrees,
    config,
    mainBranch,
    loading,
    prLoading,
    error,
    ghAvailable,
    refresh,
    deletingBranch,
    setDeletingBranch,
    removeWorktreeFromList,
  };
}
