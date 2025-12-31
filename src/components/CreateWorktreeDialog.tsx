import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type {
  CreateWorktreeDialogState,
  BaseBranchMode,
} from "../types/worktree.ts";

interface CreateWorktreeDialogProps {
  state: CreateWorktreeDialogState;
  onBranchNameChange: (name: string) => void;
  onBaseBranchChange: (mode: BaseBranchMode) => void;
  onToggleOpenEditor: () => void;
  onNextField: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CreateWorktreeDialog({
  state,
  onBranchNameChange,
  onBaseBranchChange,
  onToggleOpenEditor,
  onNextField,
  onSubmit,
  onCancel,
}: CreateWorktreeDialogProps) {
  if (state.mode === "closed") return null;

  const {
    branchName,
    baseBranch,
    openEditor,
    activeField,
    validationError,
    selectedWorktreeBranch,
    currentBranch,
    defaultBranch,
  } = state;

  // ベースブランチ選択時のキー入力処理
  useInput(
    (input, key) => {
      if (activeField !== "baseBranch") return;

      if (key.upArrow || key.downArrow) {
        // 上下キーでベースブランチを変更
        const options: BaseBranchMode[] = [
          { type: "default" },
          ...(selectedWorktreeBranch
            ? [{ type: "fromSelected" as const, ref: selectedWorktreeBranch }]
            : []),
          { type: "fromCurrent" },
        ];

        const currentIndex = options.findIndex((opt) => {
          if (opt.type === "default" && baseBranch.type === "default")
            return true;
          if (opt.type === "fromSelected" && baseBranch.type === "fromSelected")
            return true;
          if (opt.type === "fromCurrent" && baseBranch.type === "fromCurrent")
            return true;
          return false;
        });

        let newIndex: number;
        if (key.upArrow) {
          newIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex >= options.length - 1 ? 0 : currentIndex + 1;
        }

        const newOption = options[newIndex];
        if (newOption) {
          onBaseBranchChange(newOption);
        }
      }
    },
    { isActive: activeField === "baseBranch" }
  );

  // openEditor フィールドでのキー入力処理
  useInput(
    (input, key) => {
      if (activeField !== "openEditor") return;
      if (input === " " || key.return) {
        onToggleOpenEditor();
      }
    },
    { isActive: activeField === "openEditor" }
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="blue"
      paddingX={2}
      paddingY={1}
      marginY={1}
    >
      <Text bold color="blue">
        New Worktree
      </Text>

      {/* Branch name input */}
      <Box marginTop={1}>
        <Text color={activeField === "branchName" ? "cyan" : undefined}>
          Branch name:{" "}
        </Text>
        {activeField === "branchName" ? (
          <TextInput
            value={branchName}
            onChange={onBranchNameChange}
            onSubmit={onSubmit}
          />
        ) : (
          <Text>{branchName || "(empty)"}</Text>
        )}
      </Box>

      {/* Validation error */}
      {validationError && (
        <Box marginLeft={2}>
          <Text color="yellow">⚠ {validationError}</Text>
        </Box>
      )}

      {/* Base branch selector */}
      <Box marginTop={1} flexDirection="column">
        <Text color={activeField === "baseBranch" ? "cyan" : undefined}>
          Base:{" "}
          {activeField === "baseBranch" ? (
            <Text dimColor>[↑↓ to select]</Text>
          ) : (
            <Text>{formatBaseBranch(baseBranch, defaultBranch)}</Text>
          )}
        </Text>
        {activeField === "baseBranch" && (
          <Box flexDirection="column" marginLeft={2}>
            <BaseBranchOption
              label={`Default branch (${defaultBranch || "main"})`}
              isSelected={baseBranch.type === "default"}
            />
            {selectedWorktreeBranch && (
              <BaseBranchOption
                label={`From selected: ${selectedWorktreeBranch}`}
                isSelected={baseBranch.type === "fromSelected"}
              />
            )}
            <BaseBranchOption
              label={`From current (main repo): ${currentBranch || "unknown"}`}
              isSelected={baseBranch.type === "fromCurrent"}
            />
          </Box>
        )}
      </Box>

      {/* Open editor checkbox */}
      <Box marginTop={1}>
        <Text color={activeField === "openEditor" ? "cyan" : undefined}>
          [{openEditor ? "x" : " "}] Open editor after creation
          {activeField === "openEditor" && <Text dimColor> [Space to toggle]</Text>}
        </Text>
      </Box>

      {/* Action hints */}
      <Box marginTop={1}>
        <Text dimColor>[Enter] Create [Tab] Next field [Esc] Cancel</Text>
      </Box>
    </Box>
  );
}

interface BaseBranchOptionProps {
  label: string;
  isSelected: boolean;
}

function BaseBranchOption({ label, isSelected }: BaseBranchOptionProps) {
  return (
    <Text>
      {isSelected ? (
        <Text color="green">● {label}</Text>
      ) : (
        <Text dimColor>○ {label}</Text>
      )}
    </Text>
  );
}

function formatBaseBranch(
  mode: BaseBranchMode,
  defaultBranch?: string
): string {
  switch (mode.type) {
    case "default":
      return `(default branch: ${defaultBranch || "main"})`;
    case "fromSelected":
      return `from ${mode.ref}`;
    case "fromCurrent":
      return "(main repo current)";
  }
}
