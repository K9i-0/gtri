import { Box, Text } from "ink";
import type { Worktree, PendingWorktree } from "../types/worktree.ts";
import { WorktreeItem } from "./WorktreeItem.tsx";
import { PendingWorktreeItem } from "./PendingWorktreeItem.tsx";

const VISIBLE_COUNT = 7;

interface WorktreeListProps {
  worktrees: Worktree[];
  selectedIndex: number;
  prLoading?: boolean;
  deletingBranch?: string | null;
  pendingWorktrees?: PendingWorktree[];
}

export function WorktreeList({ worktrees, selectedIndex, prLoading, deletingBranch, pendingWorktrees = [] }: WorktreeListProps) {
  // ready状態のpendingをマップに変換（branchName -> pending）
  const processingMap = new Map(
    pendingWorktrees
      .filter((p) => p.status === "ready")
      .map((p) => [p.branchName, p])
  );

  // creating状態のpendingのみ表示（ready状態はworktreeリストに表示）
  const creatingPending = pendingWorktrees.filter((p) => p.status === "creating");

  // Calculate visible range (keep selected item near center)
  const startIndex = Math.max(
    0,
    Math.min(
      selectedIndex - Math.floor(VISIBLE_COUNT / 2),
      worktrees.length - VISIBLE_COUNT
    )
  );
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, worktrees.length);
  const visibleWorktrees = worktrees.slice(startIndex, endIndex);

  const hasMoreAbove = startIndex > 0;
  const hasMoreBelow = endIndex < worktrees.length;

  return (
    <Box flexDirection="column" marginBottom={1}>
      {hasMoreAbove && (
        <Box marginLeft={2}>
          <Text dimColor>↑ more ({startIndex})</Text>
        </Box>
      )}
      <Box flexDirection="column">
        {visibleWorktrees.map((worktree, index) => {
          const processingPending = processingMap.get(worktree.branch);
          return (
            <WorktreeItem
              key={worktree.path}
              worktree={worktree}
              isSelected={startIndex + index === selectedIndex}
              index={startIndex + index}
              prLoading={prLoading && !worktree.prInfo}
              isDeleting={deletingBranch === worktree.branch}
              isProcessing={!!processingPending}
              processingHint={processingPending?.processingHint}
            />
          );
        })}
      </Box>
      {hasMoreBelow && (
        <Box marginLeft={2}>
          <Text dimColor>↓ more ({worktrees.length - endIndex})</Text>
        </Box>
      )}
      {/* Creating状態のPending worktreesのみ表示 */}
      {creatingPending.map((pending) => (
        <PendingWorktreeItem key={pending.id} pending={pending} />
      ))}
    </Box>
  );
}
