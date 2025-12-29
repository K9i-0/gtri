import { Box, Text } from "ink";
import type { PRInfo } from "../types/worktree.ts";
import { PRItem } from "./PRItem.tsx";

const VISIBLE_COUNT = 7;

interface PRListProps {
  prs: PRInfo[];
  selectedIndex: number;
  creatingBranch?: string | null;
}

export function PRList({ prs, selectedIndex, creatingBranch }: PRListProps) {
  // Calculate visible range (keep selected item near center)
  const startIndex = Math.max(
    0,
    Math.min(
      selectedIndex - Math.floor(VISIBLE_COUNT / 2),
      prs.length - VISIBLE_COUNT
    )
  );
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, prs.length);
  const visiblePRs = prs.slice(startIndex, endIndex);

  const hasMoreAbove = startIndex > 0;
  const hasMoreBelow = endIndex < prs.length;

  return (
    <Box flexDirection="column" marginBottom={1}>
      {hasMoreAbove && (
        <Box marginLeft={2}>
          <Text dimColor>↑ more ({startIndex})</Text>
        </Box>
      )}
      <Box flexDirection="column">
        {visiblePRs.map((pr, index) => (
          <PRItem
            key={pr.number}
            pr={pr}
            isSelected={startIndex + index === selectedIndex}
            index={startIndex + index}
            isCreating={creatingBranch === pr.headRefName}
          />
        ))}
      </Box>
      {hasMoreBelow && (
        <Box marginLeft={2}>
          <Text dimColor>↓ more ({prs.length - endIndex})</Text>
        </Box>
      )}
    </Box>
  );
}
