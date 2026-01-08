import { Box, Text } from "ink";
import type { TabType } from "../types/worktree.ts";

interface StatusBarProps {
  message?: string | null;
  activeTab?: TabType;
  createDialogOpen?: boolean;
  actionSelectOpen?: boolean;
}

export function StatusBar({
  message,
  activeTab = "worktrees",
  createDialogOpen = false,
  actionSelectOpen = false,
}: StatusBarProps) {
  const worktreeHint =
    "[e]ditor [a]i [c]opy [d]elete [n]ew [p]r [r]efresh [q]uit | j/k:move | Enter:actions | Tab:switch";
  const prHint = "[w]orktree [p]r [r]efresh [q]uit | j/k:move | Enter:actions | Tab:switch";
  const createDialogHint = "[Enter] Create [Tab] Next field [Esc] Cancel";
  const actionSelectHint = "[Enter] Execute [j/k] Move [Esc] Cancel";

  let hint: string;
  if (actionSelectOpen) {
    hint = actionSelectHint;
  } else if (createDialogOpen) {
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
