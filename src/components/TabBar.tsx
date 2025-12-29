import { Box, Text } from "ink";
import type { TabType } from "../types/worktree.ts";

interface TabBarProps {
  activeTab: TabType;
  worktreeCount: number;
  prCount: number;
}

export function TabBar({ activeTab, worktreeCount, prCount }: TabBarProps) {
  return (
    <Box marginBottom={1}>
      <Text
        bold={activeTab === "worktrees"}
        inverse={activeTab === "worktrees"}
        color={activeTab === "worktrees" ? "cyan" : undefined}
      >
        {" "}Worktrees ({worktreeCount}){" "}
      </Text>
      <Text dimColor> | </Text>
      <Text
        bold={activeTab === "prs"}
        inverse={activeTab === "prs"}
        color={activeTab === "prs" ? "cyan" : undefined}
      >
        {" "}Open PRs ({prCount}){" "}
      </Text>
      <Text dimColor> (Tab to switch)</Text>
    </Box>
  );
}
