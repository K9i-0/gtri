import { Box, Text } from "ink";
import type { PRInfo } from "../types/worktree.ts";
import { PRItem } from "./PRItem.tsx";

interface PRListProps {
  prs: PRInfo[];
  selectedIndex: number;
  creatingBranch?: string | null;
}

export function PRList({ prs, selectedIndex, creatingBranch }: PRListProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="column">
        {prs.map((pr, index) => (
          <PRItem
            key={pr.number}
            pr={pr}
            isSelected={index === selectedIndex}
            index={index}
            isCreating={creatingBranch === pr.headRefName}
          />
        ))}
      </Box>
    </Box>
  );
}
