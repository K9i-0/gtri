import { Box, Text } from "ink";
import Link from "ink-link";
import Spinner from "ink-spinner";
import type { Worktree } from "../types/worktree.ts";

interface WorktreeItemProps {
  worktree: Worktree;
  isSelected: boolean;
  index: number;
  prLoading?: boolean;
  isDeleting?: boolean;
}

export function WorktreeItem({ worktree, isSelected, index, prLoading, isDeleting }: WorktreeItemProps) {
  const icon = worktree.isMain ? "★" : "○";
  const iconColor = worktree.isMain ? "yellow" : "blue";
  const cursor = isSelected ? "❯" : " ";

  const homePath = worktree.path.replace(
    process.env.HOME || "",
    "~"
  );

  // PRタイトルを切り捨て
  const maxTitleLength = 40;
  const prTitle = worktree.prInfo?.title
    ? worktree.prInfo.title.length > maxTitleLength
      ? worktree.prInfo.title.substring(0, maxTitleLength - 3) + "..."
      : worktree.prInfo.title
    : null;

  // PRのstateに応じた色
  const stateColor =
    worktree.prInfo?.state === "OPEN"
      ? "green"
      : worktree.prInfo?.state === "MERGED"
        ? "magenta"
        : "red";

  if (isDeleting) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text color="red">  </Text>
          <Text color="red">
            <Spinner type="dots" />
          </Text>
          <Text color="red"> Deleting...</Text>
          <Text dimColor> {worktree.branch}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={isSelected ? "green" : undefined}>{cursor} </Text>
        <Text color={iconColor}>{icon} </Text>
        <Text bold={isSelected} inverse={isSelected}>
          {worktree.branch}
        </Text>
        <Text dimColor> </Text>
        {worktree.shortHash && (
          <Text dimColor>[{worktree.shortHash}]</Text>
        )}
        <Text dimColor> ({index + 1})</Text>
      </Box>
      <Box marginLeft={4}>
        <Text dimColor>{homePath}</Text>
      </Box>
      {/* PR情報の行 - PRがある場合のみ表示 */}
      {prLoading && !worktree.prInfo ? (
        <Box marginLeft={4}>
          <Text color="yellow">Loading PR...</Text>
        </Box>
      ) : worktree.prInfo ? (
        <Box marginLeft={4}>
          <Text color={stateColor}>[{worktree.prInfo.state}]</Text>
          {worktree.prInfo.isDraft && <Text color="gray"> [Draft]</Text>}
          <Text dimColor> </Text>
          <Link url={worktree.prInfo.url}>
            <Text color="cyan">#{worktree.prInfo.number}</Text>
          </Link>
          <Text dimColor> </Text>
          <Link url={`https://github.com/${worktree.prInfo.author.login}`}>
            <Text color="yellow">@{worktree.prInfo.author.login}</Text>
          </Link>
          <Text dimColor> {prTitle}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
