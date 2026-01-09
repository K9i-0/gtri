import { useState, useEffect, useCallback, useMemo } from "react";
import type { PRInfo, Worktree, PendingWorktree } from "../types/worktree.ts";
import { getOpenPRs, createWorktreeFromBranchStreaming } from "../lib/gtr.ts";

interface UsePRsReturn {
  prs: PRInfo[];
  loading: boolean;
  error: string | null;
  creatingBranch: string | null;
  pendingWorktrees: PendingWorktree[];
  refresh: () => Promise<void>;
  createWorktree: (pr: PRInfo) => Promise<boolean>;
  removePRFromList: (headRefName: string) => void;
}

export function usePRs(
  worktrees: Worktree[],
  ghAvailable: boolean,
  addWorktreeToList: (path: string, branch: string) => void
): UsePRsReturn {
  const [allPRs, setAllPRs] = useState<PRInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingBranch, setCreatingBranch] = useState<string | null>(null);
  const [pendingWorktrees, setPendingWorktrees] = useState<PendingWorktree[]>([]);

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

      const branchName = pr.headRefName;
      setCreatingBranch(branchName);

      // pendingを追加
      const pendingId = `pr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newPending: PendingWorktree = {
        id: pendingId,
        branchName,
        baseBranch: { type: "default" },
        openEditor: false,
        status: "creating",
        startedAt: Date.now(),
      };
      setPendingWorktrees((prev) => [...prev, newPending]);

      let currentPath: string | undefined;

      try {
        const result = await createWorktreeFromBranchStreaming(
          branchName,
          (progress) => {
            switch (progress.type) {
              case "path_detected":
                currentPath = progress.path;
                break;

              case "worktree_created":
                // ready状態に移行
                setPendingWorktrees((prev) =>
                  prev.map((p) =>
                    p.id === pendingId
                      ? { ...p, status: "ready" as const, path: currentPath }
                      : p
                  )
                );
                // 新しいworktreeをリストに追加（全体リフレッシュせず）
                if (currentPath) {
                  addWorktreeToList(currentPath, branchName);
                }
                break;

              case "copying":
                setPendingWorktrees((prev) =>
                  prev.map((p) =>
                    p.id === pendingId
                      ? { ...p, processingHint: "copying" as const }
                      : p
                  )
                );
                break;

              case "hooks":
                setPendingWorktrees((prev) =>
                  prev.map((p) =>
                    p.id === pendingId
                      ? { ...p, processingHint: "hooks" as const }
                      : p
                  )
                );
                break;

              case "completed":
                break;
            }
          }
        );

        if (result.success) {
          // 完了: pendingを削除
          setPendingWorktrees((prev) => prev.filter((p) => p.id !== pendingId));
          removePRFromList(branchName);
          return true;
        }

        // 失敗: pendingを削除
        setPendingWorktrees((prev) => prev.filter((p) => p.id !== pendingId));
        return false;
      } catch {
        setPendingWorktrees((prev) => prev.filter((p) => p.id !== pendingId));
        return false;
      } finally {
        setCreatingBranch(null);
      }
    },
    [addWorktreeToList, removePRFromList]
  );

  return {
    prs: filteredPRs,
    loading,
    error,
    creatingBranch,
    pendingWorktrees,
    refresh,
    createWorktree,
    removePRFromList,
  };
}
