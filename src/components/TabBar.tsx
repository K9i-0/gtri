import { Box, Text } from "ink";

interface TabBarProps {
  activeTab: "worktrees" | "create";
}

export function TabBar({ activeTab }: TabBarProps) {
  return (
    <Box marginBottom={1}>
      <Text
        bold={activeTab === "worktrees"}
        color={activeTab === "worktrees" ? "cyan" : "gray"}
      >
        [Worktrees]
      </Text>
      <Text> </Text>
      <Text
        bold={activeTab === "create"}
        color={activeTab === "create" ? "cyan" : "gray"}
      >
        [Create]
      </Text>
      <Text dimColor>  Tab to switch</Text>
    </Box>
  );
}
