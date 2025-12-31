import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { PendingWorktree } from "../types/worktree.ts";

interface PendingWorktreeItemProps {
  pending: PendingWorktree;
}

export function PendingWorktreeItem({ pending }: PendingWorktreeItemProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text>  </Text>
        <Text color="yellow">
          <Spinner type="dots" />
        </Text>
        <Text color="yellow"> {pending.branchName}</Text>
      </Box>
      <Box marginLeft={4}>
        <Text dimColor>Creating...</Text>
      </Box>
    </Box>
  );
}
