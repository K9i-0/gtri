import { Box, Text } from "ink";
import type { Worktree } from "../types/worktree.ts";

interface WorktreeItemProps {
  worktree: Worktree;
  isSelected: boolean;
  index: number;
}

export function WorktreeItem({ worktree, isSelected, index }: WorktreeItemProps) {
  const icon = worktree.isMain ? "★" : "○";
  const iconColor = worktree.isMain ? "yellow" : "blue";
  const cursor = isSelected ? "❯" : " ";

  const homePath = worktree.path.replace(
    process.env.HOME || "",
    "~"
  );

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={isSelected ? "green" : undefined}>{cursor} </Text>
        <Text color={iconColor}>{icon} </Text>
        <Text bold={isSelected} inverse={isSelected}>
          {worktree.branch}
        </Text>
        <Text dimColor> </Text>
        {worktree.shortHash && (
          <Text dimColor>[{worktree.shortHash}]</Text>
        )}
        <Text dimColor> ({index + 1})</Text>
      </Box>
      <Box marginLeft={4}>
        <Text dimColor>{homePath}</Text>
      </Box>
    </Box>
  );
}
