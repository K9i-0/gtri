import { Box, Text } from "ink";

interface StatusBarProps {
  message?: string | null;
  activeTab: "worktrees" | "create";
}

export function StatusBar({ message, activeTab }: StatusBarProps) {
  const worktreesHint =
    "[e]ditor [a]i [c]opy [d]elete [r]efresh [q]uit | j/k:move";
  const createHint =
    "[Enter] create [n]ew branch [r]efresh [q]uit | j/k:move";

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
        <Text dimColor>
          {activeTab === "worktrees" ? worktreesHint : createHint}
        </Text>
      )}
    </Box>
  );
}
