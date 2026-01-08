import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type {
  CreateWorktreeDialogState,
  BaseBranchMode,
} from "../types/worktree.ts";
import { isMoveUp, isMoveDown } from "../lib/keybindings.ts";

interface CreateWorktreeDialogProps {
  state: CreateWorktreeDialogState;
  onBranchNameChange: (name: string) => void;
  onToggleOpenEditor: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  onSelectBaseOption: (index: number) => void;
  onBranchFilterChange: (filter: string) => void;
  onBranchIndexChange: (index: number) => void;
  onSelectBranch: (branch: string) => void;
  onBack: () => void;
}

export function CreateWorktreeDialog({
  state,
  onBranchNameChange,
  onToggleOpenEditor,
  onSubmit,
  onCancel,
  onSelectBaseOption,
  onBranchFilterChange,
  onBranchIndexChange,
  onSelectBranch,
  onBack,
}: CreateWorktreeDialogProps) {
  if (state.mode === "closed") return null;

  const { step } = state;

  if (step === "selectBase") {
    return (
      <SelectBaseStep
        state={state}
        onSelect={onSelectBaseOption}
        onCancel={onCancel}
      />
    );
  }

  if (step === "chooseBranch") {
    return (
      <ChooseBranchStep
        state={state}
        onFilterChange={onBranchFilterChange}
        onIndexChange={onBranchIndexChange}
        onSelect={onSelectBranch}
        onBack={onBack}
        onCancel={onCancel}
      />
    );
  }

  return (
    <InputStep
      state={state}
      onBranchNameChange={onBranchNameChange}
      onToggleOpenEditor={onToggleOpenEditor}
      onSubmit={onSubmit}
      onBack={onBack}
      onCancel={onCancel}
    />
  );
}

// Step 1: ベースブランチ選択方法を選ぶ
interface SelectBaseStepProps {
  state: Extract<CreateWorktreeDialogState, { mode: "open" }>;
  onSelect: (index: number) => void;
  onCancel: () => void;
}

function SelectBaseStep({ state, onSelect, onCancel }: SelectBaseStepProps) {
  const { defaultBranch, currentBranch, selectedBaseIndex, selectedWorktreeBranch } = state;

  // 選択肢を構築（selectedWorktreeBranchがある場合は追加）
  const options: { key: string; label: string }[] = [
    {
      key: "1",
      label: `From ${defaultBranch || "main"} (default)`,
    },
    {
      key: "2",
      label: `From ${currentBranch || "unknown"} (main repo HEAD)`,
    },
  ];

  // 選択中のworktreeブランチがある場合は追加
  if (selectedWorktreeBranch) {
    options.push({
      key: "3",
      label: `From selected: ${selectedWorktreeBranch}`,
    });
  }

  // Choose branch... は常に最後
  options.push({
    key: String(options.length + 1),
    label: "Choose branch...",
  });

  useInput((input, key) => {
    // 数字キーでクイック選択（即座に確定）
    const numKey = parseInt(input, 10);
    if (numKey >= 1 && numKey <= options.length) {
      const targetIndex = numKey - 1;
      // 数字キーは即座に確定するため、まずインデックスを更新し、次のティックで確定
      onSelect(targetIndex);
      setTimeout(() => onSelect(targetIndex), 0);
      return;
    }

    // j/k/上下キーで選択（ナビゲーションのみ）
    if (isMoveUp(input, key)) {
      const newIndex =
        selectedBaseIndex <= 0 ? options.length - 1 : selectedBaseIndex - 1;
      onSelect(newIndex);
      return;
    }
    if (isMoveDown(input, key)) {
      const newIndex =
        selectedBaseIndex >= options.length - 1 ? 0 : selectedBaseIndex + 1;
      onSelect(newIndex);
      return;
    }

    // Enterで確定
    if (key.return) {
      onSelect(selectedBaseIndex);
      return;
    }

    // Escでキャンセル
    if (key.escape) {
      onCancel();
    }
  });

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
        Create New Worktree
      </Text>

      <Box marginTop={1} flexDirection="column">
        {options.map((opt, i) => (
          <Text key={opt.key}>
            {i === selectedBaseIndex ? (
              <Text color="cyan">{">"} </Text>
            ) : (
              <Text>{"  "}</Text>
            )}
            <Text
              color={i === selectedBaseIndex ? "cyan" : undefined}
              bold={i === selectedBaseIndex}
            >
              [{opt.key}] {opt.label}
            </Text>
          </Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>[1-{options.length}] Select [j/k] Move [Enter] Confirm [Esc] Cancel</Text>
      </Box>
    </Box>
  );
}

// Step 1.5: ブランチ一覧から選ぶ
interface ChooseBranchStepProps {
  state: Extract<CreateWorktreeDialogState, { mode: "open" }>;
  onFilterChange: (filter: string) => void;
  onIndexChange: (index: number) => void;
  onSelect: (branch: string) => void;
  onBack: () => void;
  onCancel: () => void;
}

function ChooseBranchStep({
  state,
  onFilterChange,
  onIndexChange,
  onSelect,
  onBack,
  onCancel,
}: ChooseBranchStepProps) {
  const { branches, branchFilter, selectedBranchIndex } = state;

  // フィルター適用
  const filteredBranches = branches.filter((b) =>
    b.toLowerCase().includes(branchFilter.toLowerCase())
  );

  // 表示するブランチ（最大10件）
  const maxVisible = 10;
  const startIndex = Math.max(
    0,
    Math.min(
      selectedBranchIndex - Math.floor(maxVisible / 2),
      filteredBranches.length - maxVisible
    )
  );
  const visibleBranches = filteredBranches.slice(
    startIndex,
    startIndex + maxVisible
  );

  useInput((input, key) => {
    // Escで常にBack（前のステップに戻る）
    if (key.escape) {
      onBack();
      return;
    }

    // 上下矢印キーのみで選択（j/kはフィルター入力と競合するため使わない）
    if (key.upArrow) {
      const newIndex =
        selectedBranchIndex <= 0
          ? filteredBranches.length - 1
          : selectedBranchIndex - 1;
      onIndexChange(newIndex);
      return;
    }
    if (key.downArrow) {
      const newIndex =
        selectedBranchIndex >= filteredBranches.length - 1
          ? 0
          : selectedBranchIndex + 1;
      onIndexChange(newIndex);
      return;
    }

    // Enterで選択
    if (key.return) {
      const selected = filteredBranches[selectedBranchIndex];
      if (selected) {
        onSelect(selected);
      }
    }
  });

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
        Select Base Branch
      </Text>

      <Box marginTop={1}>
        <Text color="cyan">Filter: </Text>
        <TextInput
          value={branchFilter}
          onChange={onFilterChange}
          placeholder="Type to filter..."
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        {visibleBranches.length === 0 ? (
          <Text dimColor>No branches found</Text>
        ) : (
          visibleBranches.map((branch, i) => {
            const actualIndex = startIndex + i;
            const isSelected = actualIndex === selectedBranchIndex;
            return (
              <Text key={branch}>
                {isSelected ? (
                  <Text color="cyan">{">"} </Text>
                ) : (
                  <Text>{"  "}</Text>
                )}
                <Text color={isSelected ? "cyan" : undefined} bold={isSelected}>
                  {branch}
                </Text>
              </Text>
            );
          })
        )}
      </Box>

      {filteredBranches.length > maxVisible && (
        <Box marginTop={1}>
          <Text dimColor>
            {selectedBranchIndex + 1} of {filteredBranches.length} branches
          </Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>[Enter] Select [↑↓] Move [Esc] Back</Text>
      </Box>
    </Box>
  );
}

// Step 2: ブランチ名入力
interface InputStepProps {
  state: Extract<CreateWorktreeDialogState, { mode: "open" }>;
  onBranchNameChange: (name: string) => void;
  onToggleOpenEditor: () => void;
  onSubmit: () => void;
  onBack: () => void;
  onCancel: () => void;
}

function InputStep({
  state,
  onBranchNameChange,
  onToggleOpenEditor,
  onSubmit,
  onBack,
  onCancel,
}: InputStepProps) {
  const { branchName, baseBranch, openEditor, validationError, defaultBranch } =
    state;

  useInput((input, key) => {
    // Escで前のステップに戻る
    if (key.escape) {
      onBack();
      return;
    }
    // Tabでチェックボックスをトグル
    if (key.tab) {
      onToggleOpenEditor();
    }
  });

  const baseBranchLabel = formatBaseBranch(baseBranch, defaultBranch);

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
        New Worktree from {baseBranchLabel}
      </Text>

      <Box marginTop={1}>
        <Text color="cyan">Branch name: </Text>
        <TextInput
          value={branchName}
          onChange={onBranchNameChange}
          onSubmit={onSubmit}
        />
      </Box>

      {validationError && (
        <Box marginLeft={2}>
          <Text color="yellow">! {validationError}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text>
          <Text
            color={openEditor ? "green" : undefined}
            dimColor={!openEditor}
          >
            [{openEditor ? "x" : " "}]
          </Text>
          <Text> Open editor after creation </Text>
          <Text dimColor>[Tab]</Text>
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>[Enter] Create [Esc] Back</Text>
      </Box>
    </Box>
  );
}

function formatBaseBranch(
  mode: BaseBranchMode,
  defaultBranch?: string
): string {
  switch (mode.type) {
    case "default":
      return defaultBranch || "main";
    case "fromSelected":
    case "specific":
      return mode.ref;
    case "fromCurrent":
      return "current branch";
  }
}
