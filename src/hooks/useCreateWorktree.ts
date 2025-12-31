import { useState, useCallback } from "react";
import type {
  CreateWorktreeState,
  BaseBranchMode,
  PendingWorktree,
} from "../types/worktree.ts";
import {
  createWorktreeNew,
  validateBranchName,
  openEditorAtPath,
  getCurrentBranch,
  getDefaultBranch,
  getGtriCreateSettings,
  saveGtriCreateSettings,
  type GtriCreateSettings,
} from "../lib/gtr.ts";

interface UseCreateWorktreeOptions {
  onSuccess: () => void; // リストを更新
  onStatusMessage: (message: string, type: "success" | "error") => void;
  selectedWorktreeBranch?: string; // 選択中のworktreeのブランチ
}

interface UseCreateWorktreeReturn {
  state: CreateWorktreeState;
  openDialog: () => Promise<void>;
  closeDialog: () => void;
  setBranchName: (name: string) => void;
  setBaseBranch: (mode: BaseBranchMode) => void;
  toggleOpenEditor: () => void;
  setActiveField: (
    field: "branchName" | "baseBranch" | "openEditor"
  ) => void;
  nextField: () => void;
  submit: () => Promise<void>;
  isDialogOpen: boolean;
  hasPending: boolean;
}

export function useCreateWorktree({
  onSuccess,
  onStatusMessage,
  selectedWorktreeBranch,
}: UseCreateWorktreeOptions): UseCreateWorktreeReturn {
  const [state, setState] = useState<CreateWorktreeState>({
    dialog: { mode: "closed" },
    pending: [],
  });

  // 保存された設定からBaseBranchModeを復元
  const restoreBaseBranchMode = useCallback(
    (
      savedMode: GtriCreateSettings["baseBranchMode"],
      selectedBranch?: string
    ): BaseBranchMode => {
      switch (savedMode) {
        case "fromSelected":
          // 選択中のworktreeがある場合のみ fromSelected を使用
          if (selectedBranch) {
            return { type: "fromSelected", ref: selectedBranch };
          }
          return { type: "default" };
        case "fromCurrent":
          return { type: "fromCurrent" };
        default:
          return { type: "default" };
      }
    },
    []
  );

  // ダイアログを開く
  const openDialog = useCallback(async () => {
    // コンテキスト情報と設定を取得
    const [currentBranch, defaultBranch, savedSettings] = await Promise.all([
      getCurrentBranch(),
      getDefaultBranch(),
      getGtriCreateSettings(),
    ]);

    const baseBranch = restoreBaseBranchMode(
      savedSettings.baseBranchMode,
      selectedWorktreeBranch
    );

    setState((s) => ({
      ...s,
      dialog: {
        mode: "input",
        branchName: "",
        baseBranch,
        openEditor: savedSettings.openEditor,
        activeField: "branchName",
        selectedWorktreeBranch,
        currentBranch,
        defaultBranch,
      },
    }));
  }, [selectedWorktreeBranch, restoreBaseBranchMode]);

  // ダイアログを閉じる
  const closeDialog = useCallback(() => {
    setState((s) => ({
      ...s,
      dialog: { mode: "closed" },
    }));
  }, []);

  // ブランチ名を設定（リアルタイムバリデーション付き）
  const setBranchName = useCallback((name: string) => {
    setState((s) => {
      if (s.dialog.mode !== "input") return s;
      const validation = validateBranchName(name);
      return {
        ...s,
        dialog: {
          ...s.dialog,
          branchName: name,
          validationError:
            name.length > 0 && !validation.valid ? validation.error : undefined,
        },
      };
    });
  }, []);

  // ベースブランチを設定
  const setBaseBranch = useCallback((mode: BaseBranchMode) => {
    setState((s) => {
      if (s.dialog.mode !== "input") return s;
      return { ...s, dialog: { ...s.dialog, baseBranch: mode } };
    });
  }, []);

  // エディタを開くオプションをトグル
  const toggleOpenEditor = useCallback(() => {
    setState((s) => {
      if (s.dialog.mode !== "input") return s;
      return { ...s, dialog: { ...s.dialog, openEditor: !s.dialog.openEditor } };
    });
  }, []);

  // アクティブフィールドを設定
  const setActiveField = useCallback(
    (field: "branchName" | "baseBranch" | "openEditor") => {
      setState((s) => {
        if (s.dialog.mode !== "input") return s;
        return { ...s, dialog: { ...s.dialog, activeField: field } };
      });
    },
    []
  );

  // 次のフィールドに移動
  const nextField = useCallback(() => {
    setState((s) => {
      if (s.dialog.mode !== "input") return s;
      const order = ["branchName", "baseBranch", "openEditor"] as const;
      const currentIndex = order.indexOf(s.dialog.activeField);
      const nextIndex = (currentIndex + 1) % order.length;
      const nextActiveField = order[nextIndex] ?? "branchName";
      return {
        ...s,
        dialog: { ...s.dialog, activeField: nextActiveField },
      };
    });
  }, []);

  // 作成を開始（バックグラウンド）
  const submit = useCallback(async () => {
    const currentDialog = state.dialog;
    if (currentDialog.mode !== "input") return;

    const { branchName, baseBranch, openEditor: shouldOpenEditor } =
      currentDialog;

    // バリデーション
    const validation = validateBranchName(branchName);
    if (!validation.valid) {
      setState((s) => ({
        ...s,
        dialog:
          s.dialog.mode === "input"
            ? { ...s.dialog, validationError: validation.error }
            : s.dialog,
      }));
      return;
    }

    // ペンディングリストに追加
    const pendingId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newPending: PendingWorktree = {
      id: pendingId,
      branchName,
      baseBranch,
      openEditor: shouldOpenEditor,
      status: "creating",
      startedAt: Date.now(),
    };

    // ダイアログを閉じて、ペンディングを追加
    setState((s) => ({
      dialog: { mode: "closed" },
      pending: [...s.pending, newPending],
    }));

    // バックグラウンドで作成
    try {
      const result = await createWorktreeNew(branchName, baseBranch);

      if (result.success) {
        // 成功: ペンディングを削除、リスト更新、メッセージ表示
        setState((s) => ({
          ...s,
          pending: s.pending.filter((p) => p.id !== pendingId),
        }));
        onSuccess();
        onStatusMessage(`✓ Created worktree: ${branchName}`, "success");

        // 設定を保存（次回のデフォルトとして使用）
        await saveGtriCreateSettings({
          baseBranchMode: baseBranch.type,
          openEditor: shouldOpenEditor,
        });

        // エディタを開く
        if (shouldOpenEditor && result.path) {
          await openEditorAtPath(result.path);
        }
      } else {
        // 失敗: ペンディングを削除、エラーメッセージ
        setState((s) => ({
          ...s,
          pending: s.pending.filter((p) => p.id !== pendingId),
        }));
        onStatusMessage(`✗ Failed to create: ${result.error}`, "error");
      }
    } catch (error) {
      setState((s) => ({
        ...s,
        pending: s.pending.filter((p) => p.id !== pendingId),
      }));
      onStatusMessage(
        `✗ Failed to create: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      );
    }
  }, [state.dialog, onSuccess, onStatusMessage]);

  return {
    state,
    openDialog,
    closeDialog,
    setBranchName,
    setBaseBranch,
    toggleOpenEditor,
    setActiveField,
    nextField,
    submit,
    isDialogOpen: state.dialog.mode === "input",
    hasPending: state.pending.length > 0,
  };
}
