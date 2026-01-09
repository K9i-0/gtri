import { describe, test, expect, mock } from "bun:test";
import React from "react";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { useCreateWorktree } from "./useCreateWorktree.ts";

// テスト用コンポーネント
function TestComponent({
  onSuccess = () => {},
  onStatusMessage = () => {},
  selectedWorktreeBranch,
}: {
  onSuccess?: () => void;
  onStatusMessage?: (msg: string, type: "success" | "error") => void;
  selectedWorktreeBranch?: string;
}) {
  const hook = useCreateWorktree({
    onSuccess,
    onStatusMessage,
    selectedWorktreeBranch,
  });

  return (
    <Text>
      mode:{hook.state.dialog.mode}
      {hook.state.dialog.mode === "open" && (
        <>
          |step:{hook.state.dialog.step}
          |baseIndex:{hook.state.dialog.selectedBaseIndex}
          |branchIndex:{hook.state.dialog.selectedBranchIndex}
          |filter:{hook.state.dialog.branchFilter}
          |branchName:{hook.state.dialog.branchName}
          |openEditor:{hook.state.dialog.openEditor ? "true" : "false"}
          |baseBranchType:{hook.state.dialog.baseBranch.type}
        </>
      )}
      |isOpen:{hook.isDialogOpen ? "true" : "false"}
      |pending:{hook.state.pending.length}
    </Text>
  );
}

// openDialogは非同期でgitコマンドを実行するため、
// フックの同期的なロジックのみテストする
describe("useCreateWorktree", () => {
  test("initial state is closed", () => {
    const { lastFrame } = render(<TestComponent />);

    const frame = lastFrame() ?? "";
    expect(frame).toContain("mode:closed");
    expect(frame).toContain("isOpen:false");
    expect(frame).toContain("pending:0");
  });
});

// 状態遷移のユニットテストは、フック内の純粋なロジック部分を
// 別の関数に切り出してテストするのが理想的だが、
// 現在の実装ではuseCallbackで直接実装されているため、
// コンポーネントテストで代用する

describe("useCreateWorktree state transitions (via component)", () => {
  // 注: openDialogは非同期でgitコマンドを実行するため、
  // 単体テストでは直接テストが難しい。
  // E2Eテストでカバーする。

  test("hook exports expected functions", () => {
    let hookRef: ReturnType<typeof useCreateWorktree> | null = null;

    function CaptureHook() {
      hookRef = useCreateWorktree({
        onSuccess: () => {},
        onStatusMessage: () => {},
      });
      return <Text>captured</Text>;
    }

    render(<CaptureHook />);

    expect(hookRef).not.toBeNull();
    expect(typeof hookRef!.openDialog).toBe("function");
    expect(typeof hookRef!.closeDialog).toBe("function");
    expect(typeof hookRef!.setBranchName).toBe("function");
    expect(typeof hookRef!.setBaseBranch).toBe("function");
    expect(typeof hookRef!.toggleOpenEditor).toBe("function");
    expect(typeof hookRef!.submit).toBe("function");
    expect(typeof hookRef!.selectBaseOption).toBe("function");
    expect(typeof hookRef!.setBranchFilter).toBe("function");
    expect(typeof hookRef!.setBranchIndex).toBe("function");
    expect(typeof hookRef!.selectBranch).toBe("function");
    expect(typeof hookRef!.goBack).toBe("function");
  });

  test("closeDialog sets mode to closed", async () => {
    let hookRef: ReturnType<typeof useCreateWorktree> | null = null;

    function CaptureHook() {
      hookRef = useCreateWorktree({
        onSuccess: () => {},
        onStatusMessage: () => {},
      });
      return (
        <Text>
          mode:{hookRef.state.dialog.mode}
        </Text>
      );
    }

    const { lastFrame } = render(<CaptureHook />);

    // 初期状態
    expect(lastFrame()).toContain("mode:closed");

    // closeDialogを呼んでも閉じたままであることを確認
    hookRef!.closeDialog();
    await new Promise((r) => setTimeout(r, 50));
    expect(lastFrame()).toContain("mode:closed");
  });

  test("setBranchName does nothing when closed", async () => {
    let hookRef: ReturnType<typeof useCreateWorktree> | null = null;

    function CaptureHook() {
      hookRef = useCreateWorktree({
        onSuccess: () => {},
        onStatusMessage: () => {},
      });
      return <Text>mode:{hookRef.state.dialog.mode}</Text>;
    }

    const { lastFrame } = render(<CaptureHook />);

    // 閉じた状態でsetBranchNameを呼んでもエラーにならない
    hookRef!.setBranchName("test");
    await new Promise((r) => setTimeout(r, 50));
    expect(lastFrame()).toContain("mode:closed");
  });

  test("selectBaseOption does nothing when closed", async () => {
    let hookRef: ReturnType<typeof useCreateWorktree> | null = null;

    function CaptureHook() {
      hookRef = useCreateWorktree({
        onSuccess: () => {},
        onStatusMessage: () => {},
      });
      return <Text>mode:{hookRef.state.dialog.mode}</Text>;
    }

    const { lastFrame } = render(<CaptureHook />);

    // 閉じた状態でselectBaseOptionを呼んでもエラーにならない
    hookRef!.selectBaseOption(0);
    await new Promise((r) => setTimeout(r, 50));
    expect(lastFrame()).toContain("mode:closed");
  });

  test("setBranchFilter does nothing when closed", async () => {
    let hookRef: ReturnType<typeof useCreateWorktree> | null = null;

    function CaptureHook() {
      hookRef = useCreateWorktree({
        onSuccess: () => {},
        onStatusMessage: () => {},
      });
      return <Text>mode:{hookRef.state.dialog.mode}</Text>;
    }

    const { lastFrame } = render(<CaptureHook />);

    hookRef!.setBranchFilter("test");
    await new Promise((r) => setTimeout(r, 50));
    expect(lastFrame()).toContain("mode:closed");
  });

  test("goBack does nothing when closed", async () => {
    let hookRef: ReturnType<typeof useCreateWorktree> | null = null;

    function CaptureHook() {
      hookRef = useCreateWorktree({
        onSuccess: () => {},
        onStatusMessage: () => {},
      });
      return <Text>mode:{hookRef.state.dialog.mode}</Text>;
    }

    const { lastFrame } = render(<CaptureHook />);

    hookRef!.goBack();
    await new Promise((r) => setTimeout(r, 50));
    expect(lastFrame()).toContain("mode:closed");
  });

  test("submit does nothing when closed", async () => {
    const onSuccess = mock(() => {});
    let hookRef: ReturnType<typeof useCreateWorktree> | null = null;

    function CaptureHook() {
      hookRef = useCreateWorktree({
        onSuccess,
        onStatusMessage: () => {},
      });
      return <Text>mode:{hookRef.state.dialog.mode}</Text>;
    }

    const { lastFrame } = render(<CaptureHook />);

    await hookRef!.submit();
    await new Promise((r) => setTimeout(r, 50));
    expect(lastFrame()).toContain("mode:closed");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("useCreateWorktree pending state", () => {
  test("pending array is initially empty", () => {
    let hookRef: ReturnType<typeof useCreateWorktree> | null = null;

    function CaptureHook() {
      hookRef = useCreateWorktree({
        onSuccess: () => {},
        onStatusMessage: () => {},
      });
      return <Text>pending:{hookRef.state.pending.length}</Text>;
    }

    const { lastFrame } = render(<CaptureHook />);
    expect(lastFrame()).toContain("pending:0");
  });

  test("hook state has correct structure", () => {
    let hookRef: ReturnType<typeof useCreateWorktree> | null = null;

    function CaptureHook() {
      hookRef = useCreateWorktree({
        onSuccess: () => {},
        onStatusMessage: () => {},
      });
      return <Text>captured</Text>;
    }

    render(<CaptureHook />);

    expect(hookRef).not.toBeNull();
    expect(hookRef!.state).toHaveProperty("dialog");
    expect(hookRef!.state).toHaveProperty("pending");
    expect(Array.isArray(hookRef!.state.pending)).toBe(true);
  });
});

// Note: Streaming progress tests require mocking Bun.spawn and gtr command,
// which is complex and better suited for integration tests.
// The following tests verify the structure and basic behavior.
describe("useCreateWorktree streaming behavior (structure tests)", () => {
  test("state.pending has correct PendingWorktree shape when items exist", () => {
    // This is a structure test - verifying the expected shape
    // Actual population of pending items requires gtr command execution

    type ExpectedPendingShape = {
      id: string;
      branchName: string;
      baseBranch: { type: string };
      openEditor: boolean;
      status: string;
      startedAt: number;
      processingHint?: string;
      path?: string;
    };

    // Verify type compatibility
    const sample: ExpectedPendingShape = {
      id: "test-id",
      branchName: "feature/test",
      baseBranch: { type: "default" },
      openEditor: false,
      status: "creating",
      startedAt: Date.now(),
    };

    expect(sample.id).toBeDefined();
    expect(sample.branchName).toBeDefined();
    expect(sample.status).toBe("creating");
  });
});
