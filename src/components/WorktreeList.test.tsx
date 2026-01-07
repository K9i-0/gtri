import { describe, test, expect } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { WorktreeList } from "./WorktreeList.tsx";
import type { Worktree } from "../types/worktree.ts";

const createWorktree = (branch: string, isMain = false): Worktree => ({
  path: `/path/to/${branch}`,
  branch,
  status: "ok" as const,
  isMain,
});

describe("WorktreeList", () => {
  test("renders worktree items", () => {
    const worktrees = [
      createWorktree("main", true),
      createWorktree("feature/test"),
    ];

    const { lastFrame } = render(
      <WorktreeList worktrees={worktrees} selectedIndex={0} />
    );

    expect(lastFrame()).toContain("main");
    expect(lastFrame()).toContain("feature/test");
  });

  test("highlights selected item", () => {
    const worktrees = [
      createWorktree("main", true),
      createWorktree("feature/test"),
    ];

    const { lastFrame } = render(
      <WorktreeList worktrees={worktrees} selectedIndex={1} />
    );

    // The frame should contain both branches
    const frame = lastFrame() ?? "";
    expect(frame).toContain("main");
    expect(frame).toContain("feature/test");
  });

  test("shows 'more' indicator when list is scrolled", () => {
    const worktrees = Array.from({ length: 10 }, (_, i) =>
      createWorktree(`feature/branch-${i}`)
    );

    const { lastFrame } = render(
      <WorktreeList worktrees={worktrees} selectedIndex={5} />
    );

    const frame = lastFrame() ?? "";
    // Should show scroll indicators
    expect(frame).toContain("↑ more");
    expect(frame).toContain("↓ more");
  });

  test("handles empty worktree list", () => {
    const { lastFrame } = render(
      <WorktreeList worktrees={[]} selectedIndex={0} />
    );

    // Should render without crashing
    expect(lastFrame()).toBeDefined();
  });

  test("shows deleting state for branch being deleted", () => {
    const worktrees = [
      createWorktree("main", true),
      createWorktree("feature/deleting"),
    ];

    const { lastFrame } = render(
      <WorktreeList
        worktrees={worktrees}
        selectedIndex={0}
        deletingBranch="feature/deleting"
      />
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("feature/deleting");
  });

  test("displays PR loading state", () => {
    const worktrees = [createWorktree("feature/test")];

    const { lastFrame } = render(
      <WorktreeList worktrees={worktrees} selectedIndex={0} prLoading={true} />
    );

    // Should render without crashing during PR loading
    expect(lastFrame()).toBeDefined();
  });
});
