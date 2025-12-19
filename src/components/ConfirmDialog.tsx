import { Box, Text } from "ink";
import type { Worktree } from "../types/worktree.ts";

interface ConfirmDialogProps {
  worktree: Worktree;
}

export function ConfirmDialog({ worktree }: ConfirmDialogProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="red"
      paddingX={2}
      paddingY={1}
      marginY={1}
    >
      <Text bold color="red">
        Delete Worktree
      </Text>
      <Text>
        Are you sure you want to delete '{worktree.branch}'?
      </Text>
      <Box marginTop={1}>
        <Text dimColor>
          Press [y] to confirm, any other key to cancel
        </Text>
      </Box>
    </Box>
  );
}
