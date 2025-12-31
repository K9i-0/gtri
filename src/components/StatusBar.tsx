import { Box, Text } from "ink";
import type { TabType } from "../types/worktree.ts";

interface StatusBarProps {
  message?: string | null;
  activeTab?: TabType;
  createDialogOpen?: boolean;
}

export function StatusBar({
  message,
  activeTab = "worktrees",
  createDialogOpen = false,
}: StatusBarProps) {
  const worktreeHint =
    "[e]ditor [a]i [c]opy [d]elete [n]ew [p]r [r]efresh [q]uit | j/k:move | Tab:switch";
  const prHint = "[w]orktree [p]r [r]efresh [q]uit | j/k:move | Tab:switch";
  const createDialogHint = "[Enter] Create [Tab] Next field [Esc] Cancel";

  let hint: string;
  if (createDialogOpen) {
    hint = createDialogHint;
  } else {
    hint = activeTab === "worktrees" ? worktreeHint : prHint;
  }

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
