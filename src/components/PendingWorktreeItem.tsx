import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { PendingWorktree } from "../types/worktree.ts";

interface PendingWorktreeItemProps {
  pending: PendingWorktree;
  isSelected?: boolean;
}

export function PendingWorktreeItem({
  pending,
  isSelected = false,
}: PendingWorktreeItemProps) {
  const cursor = isSelected ? "❯" : " ";

  // creating状態: 従来のスピナー表示
  if (pending.status === "creating") {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text>  </Text>
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
          <Text color="yellow"> {pending.branchName}</Text>
        </Box>
        <Box marginLeft={4}>
          <Text dimColor>Creating...</Text>
        </Box>
      </Box>
    );
  }

  // ready状態: worktree作成完了、copy/hooks処理中
  if (pending.status === "ready") {
    const homePath = pending.path?.replace(process.env.HOME || "", "~") || "";
    const processingText =
      pending.processingHint === "copying"
        ? "Copying..."
        : pending.processingHint === "hooks"
          ? "Running hooks..."
          : "Processing...";

    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text color={isSelected ? "green" : undefined}>{cursor} </Text>
          <Text color="blue">○ </Text>
          <Text bold={isSelected} inverse={isSelected}>
            {pending.branchName}
          </Text>
          <Text color="yellow"> (new)</Text>
        </Box>
        <Box marginLeft={4}>
          <Text dimColor>{homePath}</Text>
        </Box>
        <Box marginLeft={4}>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text color="cyan"> {processingText}</Text>
        </Box>
      </Box>
    );
  }

  // error状態はpendingから削除されるため、通常はここに来ない
  return null;
}
