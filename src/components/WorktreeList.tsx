import { Box, Text } from "ink";
import type { Worktree } from "../types/worktree.ts";
import { WorktreeItem } from "./WorktreeItem.tsx";

interface WorktreeListProps {
  worktrees: Worktree[];
  selectedIndex: number;
}

export function WorktreeList({ worktrees, selectedIndex }: WorktreeListProps) {
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
          />
        ))}
      </Box>
    </Box>
  );
}
