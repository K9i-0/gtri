import { useState, useEffect, useCallback, useMemo } from "react";
import type { PRInfo, Worktree } from "../types/worktree.ts";
import { getOpenPRs, createWorktreeFromBranch } from "../lib/gtr.ts";

interface UsePRsReturn {
  prs: PRInfo[];
  loading: boolean;
  error: string | null;
  creatingBranch: string | null;
  refresh: () => Promise<void>;
  createWorktree: (pr: PRInfo) => Promise<boolean>;
  removePRFromList: (headRefName: string) => void;
}

export function usePRs(
  worktrees: Worktree[],
  ghAvailable: boolean,
  onWorktreeCreated: () => void
): UsePRsReturn {
  const [allPRs, setAllPRs] = useState<PRInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingBranch, setCreatingBranch] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ghAvailable) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const openPRs = await getOpenPRs();
      setAllPRs(openPRs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [ghAvailable]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Filter PRs that don't have worktrees
  const filteredPRs = useMemo(() => {
    return allPRs.filter((pr) => {
      const prBranch = pr.headRefName;
      if (!prBranch) return true;
      return !worktrees.some(
        (wt) => wt.branch === prBranch || wt.upstreamBranch === prBranch
      );
    });
  }, [allPRs, worktrees]);

  const removePRFromList = useCallback((headRefName: string) => {
    setAllPRs((prev) => prev.filter((pr) => pr.headRefName !== headRefName));
  }, []);

  const createWorktree = useCallback(
    async (pr: PRInfo): Promise<boolean> => {
      if (!pr.headRefName) return false;

      setCreatingBranch(pr.headRefName);
      try {
        const result = await createWorktreeFromBranch(pr.headRefName);
        if (result.success) {
          removePRFromList(pr.headRefName);
          onWorktreeCreated();
          return true;
        }
        return false;
      } finally {
        setCreatingBranch(null);
      }
    },
    [onWorktreeCreated, removePRFromList]
  );

  return {
    prs: filteredPRs,
    loading,
    error,
    creatingBranch,
    refresh,
    createWorktree,
    removePRFromList,
  };
}
