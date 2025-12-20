import React from "react";
import { Box, Text } from "ink";
import type { BranchItem } from "../hooks/useBranches.ts";

interface BranchListProps {
  branches: BranchItem[];
  selectedIndex: number;
  filter?: string;
  maxHeight?: number;
}

export function BranchList({
  branches,
  selectedIndex,
  filter,
  maxHeight = 12,
}: BranchListProps) {
  // デフォルト/カレントブランチとその他を分離
  const specialBranches = branches.filter((b) => b.isDefault || b.isCurrent);
  const otherBranches = branches.filter((b) => !b.isDefault && !b.isCurrent);

  // 表示用の全ブランチリスト（インデックス付き）
  const allBranches: { branch: BranchItem; originalIndex: number }[] = [];
  let idx = 0;
  for (const branch of specialBranches) {
    allBranches.push({ branch, originalIndex: idx++ });
  }
  for (const branch of otherBranches) {
    allBranches.push({ branch, originalIndex: idx++ });
  }

  // スクロール位置を計算
  const scrollPadding = 2; // 上下に保持する行数
  let startIndex = 0;

  // セパレーター行を考慮した実際の表示行数
  const hasSeparator = specialBranches.length > 0 && otherBranches.length > 0;
  const separatorIndex = specialBranches.length; // セパレーターが入る位置
  const totalVisualRows = allBranches.length + (hasSeparator ? 1 : 0);

  if (totalVisualRows > maxHeight) {
    // 選択位置が表示範囲内に収まるようにスクロール
    const effectiveSelected = selectedIndex >= separatorIndex && hasSeparator
      ? selectedIndex + 1 // セパレーター分ずらす
      : selectedIndex;

    if (effectiveSelected < startIndex + scrollPadding) {
      startIndex = Math.max(0, effectiveSelected - scrollPadding);
    } else if (effectiveSelected >= startIndex + maxHeight - scrollPadding) {
      startIndex = Math.min(
        totalVisualRows - maxHeight,
        effectiveSelected - maxHeight + scrollPadding + 1
      );
    }
  }

  // コミットメッセージを省略
  const truncateMessage = (msg: string, maxLen: number) => {
    if (msg.length <= maxLen) return msg;
    return msg.slice(0, maxLen - 1) + "…";
  };

  const renderBranch = (branch: BranchItem, index: number) => {
    const isSelected = index === selectedIndex;

    // L/R/Wのマーク
    const marks: string[] = [];
    if (branch.isLocal) marks.push("L");
    if (branch.isRemote) marks.push("R");
    if (branch.hasWorktree) marks.push("W");
    const locationMark = marks.length > 0 ? `[${marks.join("")}]` : "";

    // コミット情報
    const commitInfo = branch.lastCommit
      ? ` ${truncateMessage(branch.lastCommit.message, 30)} (${branch.lastCommit.relativeDate})`
      : "";

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
        <Text dimColor> {locationMark}</Text>
        <Text dimColor color={isSelected ? "cyan" : undefined}>
          {commitInfo}
        </Text>
      </Box>
    );
  };

  // 表示する行を構築
  const visibleRows: React.ReactNode[] = [];
  let visualIndex = 0;

  // Special branches
  for (let i = 0; i < specialBranches.length; i++) {
    const branch = specialBranches[i];
    if (branch && visualIndex >= startIndex && visualIndex < startIndex + maxHeight) {
      visibleRows.push(renderBranch(branch, i));
    }
    visualIndex++;
  }

  // Separator
  if (hasSeparator) {
    if (visualIndex >= startIndex && visualIndex < startIndex + maxHeight) {
      visibleRows.push(
        <Box key="separator">
          <Text dimColor>  ──────────────</Text>
        </Box>
      );
    }
    visualIndex++;
  }

  // Other branches
  for (let i = 0; i < otherBranches.length; i++) {
    const branch = otherBranches[i];
    if (branch && visualIndex >= startIndex && visualIndex < startIndex + maxHeight) {
      visibleRows.push(renderBranch(branch, specialBranches.length + i));
    }
    visualIndex++;
  }

  // スクロールインジケーター
  const hasMoreAbove = startIndex > 0;
  const hasMoreBelow = startIndex + maxHeight < totalVisualRows;

  return (
    <Box flexDirection="column">
      {/* フィルター表示 */}
      {filter && (
        <Box marginBottom={1}>
          <Text color="yellow">Filter: </Text>
          <Text color="cyan">{filter}</Text>
          <Text dimColor> ({branches.length} matches)</Text>
        </Box>
      )}

      {/* スクロール上インジケーター */}
      {hasMoreAbove && (
        <Box>
          <Text dimColor>  ↑ {startIndex} more above</Text>
        </Box>
      )}

      {/* ブランチリスト */}
      {visibleRows}

      {/* スクロール下インジケーター */}
      {hasMoreBelow && (
        <Box>
          <Text dimColor>  ↓ {totalVisualRows - startIndex - maxHeight} more below</Text>
        </Box>
      )}

      {/* 空の場合 */}
      {branches.length === 0 && (
        <Box>
          <Text dimColor>
            {filter ? "No branches match the filter" : "No branches found"}
          </Text>
        </Box>
      )}
    </Box>
  );
}
