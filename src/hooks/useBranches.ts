import { useState, useEffect, useCallback, useRef } from "react";
import {
  listRemoteBranches,
  listLocalBranches,
  getDefaultBranch,
  getCurrentBranch,
  getBranchesLastCommits,
  type CommitInfo,
} from "../lib/gtr.ts";

export interface BranchItem {
  name: string;
  isDefault: boolean;
  isCurrent: boolean;
  isLocal: boolean;
  isRemote: boolean;
  hasWorktree: boolean;
  lastCommit?: CommitInfo;
}

interface UseBranchesReturn {
  branches: BranchItem[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useBranches(worktreeBranches: string[]): UseBranchesReturn {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const worktreeBranchesRef = useRef(worktreeBranches);

  // Update ref when worktreeBranches changes
  worktreeBranchesRef.current = worktreeBranches;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [remoteBranches, localBranches, defaultBranch, currentBranch] =
        await Promise.all([
          listRemoteBranches(),
          listLocalBranches(),
          getDefaultBranch(),
          getCurrentBranch(),
        ]);

      const wtBranches = worktreeBranchesRef.current;
      const items: BranchItem[] = [];
      const seen = new Set<string>();

      // リモートブランチのセット（origin/xxx -> xxx）
      const remoteSet = new Set(
        remoteBranches.map((b) => b.replace(/^origin\//, ""))
      );

      // 1. デフォルトブランチを先頭に
      items.push({
        name: defaultBranch,
        isDefault: true,
        isCurrent: currentBranch === defaultBranch,
        isLocal: localBranches.includes(defaultBranch),
        isRemote: remoteSet.has(defaultBranch),
        hasWorktree: wtBranches.includes(defaultBranch),
      });
      seen.add(defaultBranch);

      // 2. 現在のブランチ（デフォルトと異なる場合）
      if (currentBranch !== defaultBranch && currentBranch !== "unknown") {
        items.push({
          name: currentBranch,
          isDefault: false,
          isCurrent: true,
          isLocal: localBranches.includes(currentBranch),
          isRemote: remoteSet.has(currentBranch),
          hasWorktree: wtBranches.includes(currentBranch),
        });
        seen.add(currentBranch);
      }

      // 3. ローカルブランチ（デフォルト・カレント以外）
      for (const local of localBranches) {
        if (seen.has(local)) continue;

        items.push({
          name: local,
          isDefault: false,
          isCurrent: false,
          isLocal: true,
          isRemote: remoteSet.has(local),
          hasWorktree: wtBranches.includes(local),
        });
        seen.add(local);
      }

      // 4. リモートのみのブランチ
      for (const remote of remoteBranches) {
        const name = remote.replace(/^origin\//, "");
        if (seen.has(name)) continue;

        items.push({
          name: remote,
          isDefault: false,
          isCurrent: false,
          isLocal: false,
          isRemote: true,
          hasWorktree: wtBranches.some((wt) => wt === name || wt === remote),
        });
        seen.add(name);
      }

      // コミット情報を取得
      const branchNames = items.map((b) => b.name);
      const commits = await getBranchesLastCommits(branchNames);
      for (const item of items) {
        item.lastCommit = commits.get(item.name);
      }

      setBranches(items);
    } finally {
      setLoading(false);
    }
  }, []);

  // worktreeBranches が変わったら再取得
  const worktreesKey = worktreeBranches.join(",");
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worktreesKey]);

  return { branches, loading, refresh };
}
