import { Box, Text } from "ink";
import type { BranchItem } from "../hooks/useBranches.ts";

interface BranchListProps {
  branches: BranchItem[];
  selectedIndex: number;
}

export function BranchList({ branches, selectedIndex }: BranchListProps) {
  // デフォルト/カレントブランチとその他を分離
  const specialBranches = branches.filter((b) => b.isDefault || b.isCurrent);
  const otherBranches = branches.filter((b) => !b.isDefault && !b.isCurrent);

  let currentIndex = 0;

  const renderBranch = (branch: BranchItem, index: number) => {
    const isSelected = index === selectedIndex;

    // L/R/Wのマーク
    const marks: string[] = [];
    if (branch.isLocal) marks.push("L");
    if (branch.isRemote) marks.push("R");
    if (branch.hasWorktree) marks.push("W");
    const locationMark = marks.length > 0 ? ` [${marks.join("")}]` : "";

    return (
      <Box key={branch.name}>
        <Text color={isSelected ? "cyan" : undefined}>
          {isSelected ? "> " : "  "}
        </Text>
        <Text
          color={isSelected ? "cyan" : undefined}
          dimColor={branch.hasWorktree}
        >
          {branch.name}
        </Text>
        {branch.isDefault && <Text dimColor> (default)</Text>}
        {branch.isCurrent && !branch.isDefault && (
          <Text dimColor> (current)</Text>
        )}
        <Text dimColor>{locationMark}</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      {/* Special branches (default, current) */}
      {specialBranches.map((branch) => renderBranch(branch, currentIndex++))}

      {/* Separator */}
      {specialBranches.length > 0 && otherBranches.length > 0 && (
        <Box>
          <Text dimColor>  ──────────────</Text>
        </Box>
      )}

      {/* Other branches */}
      {otherBranches.map((branch) => renderBranch(branch, currentIndex++))}
    </Box>
  );
}
