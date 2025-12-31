import { Box, Text } from "ink";
import type { TabType } from "../types/worktree.ts";

interface StatusBarProps {
  message?: string | null;
  activeTab?: TabType;
}

export function StatusBar({ message, activeTab = "worktrees" }: StatusBarProps) {
  const worktreeHint = "[e]ditor [a]i [c]opy [d]elete [p]r [r]efresh [q]uit | j/k:move | Tab:switch";
  const prHint = "[w]orktree [p]r [r]efresh [q]uit | j/k:move | Tab:switch";
  const hint = activeTab === "worktrees" ? worktreeHint : prHint;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      paddingTop={1}
    >
      {message ? (
        <Text color="green">{message}</Text>
      ) : (
        <Text dimColor>{hint}</Text>
      )}
    </Box>
  );
}
