import { Box, Text } from "ink";
import type { Worktree } from "../types/worktree.ts";
import { WorktreeItem } from "./WorktreeItem.tsx";

interface WorktreeListProps {
  worktrees: Worktree[];
  selectedIndex: number;
  prLoading?: boolean;
  deletingBranch?: string | null;
}

export function WorktreeList({ worktrees, selectedIndex, prLoading, deletingBranch }: WorktreeListProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Text bold>Worktrees ({worktrees.length})</Text>
      </Box>
      <Box flexDirection="column">
        {worktrees.map((worktree, index) => (
          <WorktreeItem
            key={worktree.path}
            worktree={worktree}
            isSelected={index === selectedIndex}
            index={index}
            prLoading={prLoading && !worktree.prInfo}
            isDeleting={deletingBranch === worktree.branch}
          />
        ))}
      </Box>
    </Box>
  );
}
