import { describe, test, expect } from "bun:test";
import React from "react";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { usePRs } from "./usePRs.ts";
import type { Worktree, PRInfo } from "../types/worktree.ts";

// テスト用コンポーネント
function TestComponent({
  worktrees = [],
  ghAvailable = false,
  onWorktreeCreated = () => {},
}: {
  worktrees?: Worktree[];
  ghAvailable?: boolean;
  onWorktreeCreated?: () => void;
}) {
  const hook = usePRs(worktrees, ghAvailable, onWorktreeCreated);

  return (
    <Text>
      loading:{hook.loading ? "true" : "false"}|
      prsCount:{hook.prs.length}|
      creatingBranch:{hook.creatingBranch ?? "null"}|
      pendingCount:{hook.pendingWorktrees.length}|
      error:{hook.error ?? "null"}
    </Text>
  );
}

describe("usePRs", () => {
  test("initializes with loading state when ghAvailable is false", () => {
    const { lastFrame } = render(<TestComponent ghAvailable={false} />);

    const frame = lastFrame() ?? "";
    // ghAvailableがfalseの場合、loadingはすぐにfalseになる
    expect(frame).toContain("loading:false");
    expect(frame).toContain("prsCount:0");
    expect(frame).toContain("pendingCount:0");
    expect(frame).toContain("error:null");
  });

  test("pendingWorktrees starts empty", () => {
    const { lastFrame } = render(<TestComponent ghAvailable={false} />);

    const frame = lastFrame() ?? "";
    expect(frame).toContain("pendingCount:0");
  });

  test("creatingBranch is initially null", () => {
    const { lastFrame } = render(<TestComponent ghAvailable={false} />);

    const frame = lastFrame() ?? "";
    expect(frame).toContain("creatingBranch:null");
  });

  test("exports expected functions", () => {
    let hookRef: ReturnType<typeof usePRs> | null = null;

    function CaptureHook() {
      hookRef = usePRs([], false, () => {});
      return <Text>captured</Text>;
    }

    render(<CaptureHook />);

    expect(hookRef).not.toBeNull();
    expect(typeof hookRef!.refresh).toBe("function");
    expect(typeof hookRef!.createWorktree).toBe("function");
    expect(typeof hookRef!.removePRFromList).toBe("function");
    expect(Array.isArray(hookRef!.prs)).toBe(true);
    expect(Array.isArray(hookRef!.pendingWorktrees)).toBe(true);
  });
});

describe("usePRs filtering", () => {
  // フィルタリングロジックのテスト
  // ghAvailable=false のため、PRは取得されないが、
  // worktreesとの整合性は確認できる

  test("returns empty prs when no PRs loaded", () => {
    const worktrees: Worktree[] = [
      {
        path: "/path/to/main",
        branch: "main",
        status: "ok",
        isMain: true,
        shortHash: "abc123",
      },
    ];

    const { lastFrame } = render(
      <TestComponent worktrees={worktrees} ghAvailable={false} />
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("prsCount:0");
  });
});

// Note: createWorktreeのテストは実際のgtrコマンドを実行するため、
// 統合テストまたはE2Eテストで実施する。
// ここでは非同期処理の呼び出しがエラーにならないことのみを確認する。
describe("usePRs createWorktree (basic checks)", () => {
  test("createWorktree returns false for PR without headRefName", async () => {
    let hookRef: ReturnType<typeof usePRs> | null = null;

    function CaptureHook() {
      hookRef = usePRs([], false, () => {});
      return <Text>captured</Text>;
    }

    render(<CaptureHook />);

    const prWithoutHeadRefName: PRInfo = {
      number: 1,
      title: "Test PR",
      url: "https://github.com/test/test/pull/1",
      state: "OPEN",
      isDraft: false,
      author: { login: "test" },
      // headRefName is missing
    };

    const result = await hookRef!.createWorktree(prWithoutHeadRefName);
    expect(result).toBe(false);
  });
});
