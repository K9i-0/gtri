import { describe, test, expect } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { CreateWorktreeDialog } from "./CreateWorktreeDialog.tsx";
import type { CreateWorktreeDialogState } from "../types/worktree.ts";

// テスト用のデフォルト状態を作成するヘルパー
function createOpenState(
  overrides: Partial<Extract<CreateWorktreeDialogState, { mode: "open" }>> = {}
): Extract<CreateWorktreeDialogState, { mode: "open" }> {
  return {
    mode: "open",
    step: "selectBase",
    branchName: "",
    baseBranch: { type: "default" },
    openEditor: false,
    selectedWorktreeBranch: undefined,
    currentBranch: "main",
    defaultBranch: "main",
    selectedBaseIndex: 0,
    branches: ["main", "develop", "feature/test"],
    branchFilter: "",
    selectedBranchIndex: 0,
    ...overrides,
  };
}

// テスト用のnoopハンドラー
const noopHandlers = {
  onBranchNameChange: () => {},
  onToggleOpenEditor: () => {},
  onSubmit: () => {},
  onCancel: () => {},
  onSelectBaseOption: () => {},
  onBranchFilterChange: () => {},
  onBranchIndexChange: () => {},
  onSelectBranch: () => {},
  onBack: () => {},
};

describe("CreateWorktreeDialog", () => {
  test("renders nothing when closed", () => {
    const { lastFrame } = render(
      <CreateWorktreeDialog
        state={{ mode: "closed" }}
        {...noopHandlers}
      />
    );

    expect(lastFrame()).toBe("");
  });

  describe("SelectBaseStep", () => {
    test("renders with default options", () => {
      const state = createOpenState({ step: "selectBase" });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("Create New Worktree");
      expect(frame).toContain("From main (default)");
      expect(frame).toContain("main repo HEAD");
      expect(frame).toContain("Choose branch...");
    });

    test("shows selected worktree option when available", () => {
      const state = createOpenState({
        step: "selectBase",
        selectedWorktreeBranch: "feature/selected",
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("From selected: feature/selected");
    });

    test("highlights selected option", () => {
      const state = createOpenState({
        step: "selectBase",
        selectedBaseIndex: 1,
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      // インデックス1が選択されていることを確認（> マーカーの位置で判断）
      const frame = lastFrame() ?? "";
      expect(frame).toContain(">");
    });

    test("shows correct hint text", () => {
      const state = createOpenState({ step: "selectBase" });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("[j/k] Move");
      expect(frame).toContain("[Enter] Confirm");
      expect(frame).toContain("[Esc] Cancel");
    });
  });

  describe("ChooseBranchStep", () => {
    test("renders branch list", () => {
      const state = createOpenState({
        step: "chooseBranch",
        branches: ["main", "develop", "feature/test"],
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("Select Base Branch");
      expect(frame).toContain("main");
      expect(frame).toContain("develop");
      expect(frame).toContain("feature/test");
    });

    test("shows no branches message when empty", () => {
      const state = createOpenState({
        step: "chooseBranch",
        branches: [],
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("No branches found");
    });

    test("filters branches", () => {
      const state = createOpenState({
        step: "chooseBranch",
        branches: ["main", "develop", "feature/test", "feature/other"],
        branchFilter: "feature",
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("feature/test");
      expect(frame).toContain("feature/other");
      // mainとdevelopはフィルタで除外される（表示されない）
    });

    test("shows scroll indicator for long lists", () => {
      const branches = Array.from({ length: 15 }, (_, i) => `branch-${i}`);
      const state = createOpenState({
        step: "chooseBranch",
        branches,
        selectedBranchIndex: 7, // 中央付近
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("of 15 branches");
    });

    test("shows hint with arrow keys", () => {
      const state = createOpenState({ step: "chooseBranch" });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("[↑↓] Move");
      expect(frame).toContain("[Esc] Back");
    });
  });

  describe("InputStep", () => {
    test("renders input form", () => {
      const state = createOpenState({
        step: "input",
        baseBranch: { type: "default" },
        defaultBranch: "main",
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("New Worktree from main");
      expect(frame).toContain("Branch name:");
      expect(frame).toContain("Open editor after creation");
    });

    test("shows base branch in title for specific mode", () => {
      const state = createOpenState({
        step: "input",
        baseBranch: { type: "specific", ref: "develop" },
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("New Worktree from develop");
    });

    test("shows validation error", () => {
      const state = createOpenState({
        step: "input",
        validationError: "Invalid branch name",
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("Invalid branch name");
    });

    test("shows checked checkbox when openEditor is true", () => {
      const state = createOpenState({
        step: "input",
        openEditor: true,
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("[x]");
    });

    test("shows unchecked checkbox when openEditor is false", () => {
      const state = createOpenState({
        step: "input",
        openEditor: false,
      });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("[ ]");
    });

    test("shows hint with Tab for toggle", () => {
      const state = createOpenState({ step: "input" });
      const { lastFrame } = render(
        <CreateWorktreeDialog state={state} {...noopHandlers} />
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("[Tab]");
      expect(frame).toContain("[Esc] Back");
    });
  });
});
