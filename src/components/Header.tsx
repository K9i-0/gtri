import { Box, Text } from "ink";
import type { GtrConfig } from "../types/worktree.ts";

interface HeaderProps {
  config: GtrConfig;
  mainBranch: string;
}

export function Header({ config, mainBranch }: HeaderProps) {
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
        Editor: {config.editor} | AI: {config.ai} | Main repo: {mainBranch}
      </Text>
    </Box>
  );
}
