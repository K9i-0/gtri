import { Box, Text } from "ink";
import Link from "ink-link";
import Spinner from "ink-spinner";
import type { PRInfo } from "../types/worktree.ts";

interface PRItemProps {
  pr: PRInfo;
  isSelected: boolean;
  index: number;
  isCreating?: boolean;
}

export function PRItem({ pr, isSelected, index, isCreating }: PRItemProps) {
  const cursor = isSelected ? ">" : " ";

  // Truncate PR title
  const maxTitleLength = 50;
  const prTitle =
    pr.title.length > maxTitleLength
      ? pr.title.substring(0, maxTitleLength - 3) + "..."
      : pr.title;

  if (isCreating) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text color="green">  </Text>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text color="green"> Creating worktree...</Text>
          <Text dimColor> {pr.headRefName}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={isSelected ? "green" : undefined}>{cursor} </Text>
        <Link url={pr.url}>
          <Text color="cyan" bold={isSelected} inverse={isSelected}>
            #{pr.number}
          </Text>
        </Link>
        <Text> </Text>
        <Text bold={isSelected}>{prTitle}</Text>
        <Text dimColor> ({index + 1})</Text>
      </Box>
      <Box marginLeft={4}>
        <Text dimColor>Branch: </Text>
        <Text color="yellow">{pr.headRefName}</Text>
        <Text dimColor> by </Text>
        <Link url={`https://github.com/${pr.author.login}`}>
          <Text color="magenta">@{pr.author.login}</Text>
        </Link>
      </Box>
    </Box>
  );
}
