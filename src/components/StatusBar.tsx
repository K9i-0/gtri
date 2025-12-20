import { Box, Text } from "ink";

interface StatusBarProps {
  message?: string | null;
  activeTab: "worktrees" | "create";
  hasFilter?: boolean;
}

export function StatusBar({ message, activeTab, hasFilter }: StatusBarProps) {
  const worktreesHint =
    "[e]ditor [a]i [c]opy [d]elete [r]efresh [q]uit | j/k:move";

  // Createタブ用のヒントを親切に
  const createHint = hasFilter
    ? "[Enter] create [n]ew branch [Esc] clear filter [/] filter | j/k:move"
    : "[Enter] create [n]ew branch [/] filter [r]efresh [q]uit | j/k:move g/G:top/bottom";

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
