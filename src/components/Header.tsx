import { Box, Text } from "ink";
import type { GtrConfig } from "../types/worktree.ts";

interface HeaderProps {
  config: GtrConfig;
}

export function Header({ config }: HeaderProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      paddingX={2}
      marginBottom={1}
    >
      <Text bold color="cyan">
        gtri - Git Worktree Manager
      </Text>
      <Text dimColor>
        Editor: {config.editor} | AI: {config.ai}
      </Text>
    </Box>
  );
}
