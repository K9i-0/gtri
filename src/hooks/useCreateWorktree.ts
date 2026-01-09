import { useState, useCallback } from "react";
import type {
  CreateWorktreeState,
  BaseBranchMode,
  PendingWorktree,
} from "../types/worktree.ts";
import {
  createWorktreeNewStreaming,
  validateBranchName,
  openEditorAtPath,
  getCurrentBranch,
  getDefaultBranch,
  getGtriCreateSettings,
  saveGtriCreateSettings,
  getLocalBranches,
} from "../lib/gtr.ts";

interface UseCreateWorktreeOptions {
  onWorktreeCreated: (path: string, branch: string) => void; // 新しいworktreeをリストに追加
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
  submit: () => Promise<void>;
  isDialogOpen: boolean;
  hasPending: boolean;
  // 新しいコールバック
  selectBaseOption: (index: number) => void;
  setBranchFilter: (filter: string) => void;
  setBranchIndex: (index: number) => void;
  selectBranch: (branch: string) => void;
  goBack: () => void;
}

export function useCreateWorktree({
  onWorktreeCreated,
  onStatusMessage,
  selectedWorktreeBranch,
}: UseCreateWorktreeOptions): UseCreateWorktreeReturn {
  const [state, setState] = useState<CreateWorktreeState>({
    dialog: { mode: "closed" },
    pending: [],
  });

  // ダイアログを開く
  const openDialog = useCallback(async () => {
    // コンテキスト情報と設定を取得
    const [currentBranch, defaultBranch, savedSettings, branches] =
      await Promise.all([
        getCurrentBranch(),
        getDefaultBranch(),
        getGtriCreateSettings(),
        getLocalBranches(),
      ]);

    setState((s) => ({
      ...s,
      dialog: {
        mode: "open",
        step: "selectBase",
        branchName: "",
        baseBranch: { type: "default" },
        openEditor: savedSettings.openEditor,
        selectedWorktreeBranch,
        currentBranch,
        defaultBranch,
        selectedBaseIndex: 0,
        branches,
        branchFilter: "",
        selectedBranchIndex: 0,
      },
    }));
  }, [selectedWorktreeBranch]);

  // ダイアログを閉じる
  const closeDialog = useCallback(() => {
    setState((s) => ({
      ...s,
      dialog: { mode: "closed" },
    }));
  }, []);

  // Step 1: ベースブランチ選択オプションを選ぶ
  const selectBaseOption = useCallback(
    (index: number) => {
      setState((s) => {
        if (s.dialog.mode !== "open") return s;

        const { selectedWorktreeBranch } = s.dialog;
        const hasSelectedBranch = !!selectedWorktreeBranch;

        // オプション数を計算（selectedWorktreeBranchがある場合は4つ、なければ3つ）
        const optionCount = hasSelectedBranch ? 4 : 3;

        // 上下キーでの移動（単にindexを更新）
        // Enter時は確定処理
        if (index === s.dialog.selectedBaseIndex) {
          // 同じインデックス = Enterで確定
          // オプション順: 0=default, 1=fromCurrent, 2=fromSelected(optional), last=chooseBranch
          if (index === 0) {
            // From default
            return {
              ...s,
              dialog: {
                ...s.dialog,
                step: "input" as const,
                baseBranch: { type: "default" as const },
              },
            };
          }
          if (index === 1) {
            // From current
            return {
              ...s,
              dialog: {
                ...s.dialog,
                step: "input" as const,
                baseBranch: { type: "fromCurrent" as const },
              },
            };
          }
          if (hasSelectedBranch && index === 2) {
            // From selected
            return {
              ...s,
              dialog: {
                ...s.dialog,
                step: "input" as const,
                baseBranch: { type: "fromSelected" as const, ref: selectedWorktreeBranch },
              },
            };
          }
          // Choose branch... (last option)
          return {
            ...s,
            dialog: {
              ...s.dialog,
              step: "chooseBranch" as const,
              selectedBranchIndex: 0,
              branchFilter: "",
            },
          };
        }

        // インデックスを更新（上下キー操作）
        return {
          ...s,
          dialog: {
            ...s.dialog,
            selectedBaseIndex: index,
          },
        };
      });
    },
    []
  );

  // Step 1.5: ブランチフィルターを更新
  const setBranchFilter = useCallback((filter: string) => {
    setState((s) => {
      if (s.dialog.mode !== "open" || s.dialog.step !== "chooseBranch") return s;

      // フィルター変更時は選択インデックスをリセット
      return {
        ...s,
        dialog: {
          ...s.dialog,
          branchFilter: filter,
          selectedBranchIndex: 0,
        },
      };
    });
  }, []);

  // Step 1.5: ブランチインデックスを更新（j/k移動用）
  const setBranchIndex = useCallback((index: number) => {
    setState((s) => {
      if (s.dialog.mode !== "open" || s.dialog.step !== "chooseBranch") return s;

      return {
        ...s,
        dialog: {
          ...s.dialog,
          selectedBranchIndex: index,
        },
      };
    });
  }, []);

  // Step 1.5: ブランチを選択
  const selectBranch = useCallback((branch: string) => {
    setState((s) => {
      if (s.dialog.mode !== "open") return s;

      return {
        ...s,
        dialog: {
          ...s.dialog,
          step: "input" as const,
          baseBranch: { type: "specific" as const, ref: branch },
        },
      };
    });
  }, []);

  // 前のステップに戻る
  const goBack = useCallback(() => {
    setState((s) => {
      if (s.dialog.mode !== "open") return s;

      if (s.dialog.step === "chooseBranch") {
        return {
          ...s,
          dialog: {
            ...s.dialog,
            step: "selectBase" as const,
            branchFilter: "",
            selectedBranchIndex: 0,
          },
        };
      }

      if (s.dialog.step === "input") {
        return {
          ...s,
          dialog: {
            ...s.dialog,
            step: "selectBase" as const,
          },
        };
      }

      return s;
    });
  }, []);

  // ブランチ名を設定（リアルタイムバリデーション付き）
  const setBranchName = useCallback((name: string) => {
    setState((s) => {
      if (s.dialog.mode !== "open") return s;
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
      if (s.dialog.mode !== "open") return s;
      return { ...s, dialog: { ...s.dialog, baseBranch: mode } };
    });
  }, []);

  // エディタを開くオプションをトグル
  const toggleOpenEditor = useCallback(() => {
    setState((s) => {
      if (s.dialog.mode !== "open") return s;
      return { ...s, dialog: { ...s.dialog, openEditor: !s.dialog.openEditor } };
    });
  }, []);

  // 作成を開始（バックグラウンド）
  const submit = useCallback(async () => {
    const currentDialog = state.dialog;
    if (currentDialog.mode !== "open" || currentDialog.step !== "input") return;

    const { branchName, baseBranch, openEditor: shouldOpenEditor } =
      currentDialog;

    // バリデーション
    const validation = validateBranchName(branchName);
    if (!validation.valid) {
      setState((s) => ({
        ...s,
        dialog:
          s.dialog.mode === "open"
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

    // 進行中のパスを保持（progressコールバック用）
    let currentPath: string | undefined;

    // バックグラウンドで作成（ストリーミング版）
    try {
      const result = await createWorktreeNewStreaming(
        branchName,
        baseBranch,
        (progress) => {
          switch (progress.type) {
            case "path_detected":
              // パスが検出された（まだworktree作成中）
              currentPath = progress.path;
              break;

            case "worktree_created":
              // worktree作成完了（copy/hooks処理開始前）
              // ready状態に移行し、リストに追加
              setState((s) => ({
                ...s,
                pending: s.pending.map((p) =>
                  p.id === pendingId
                    ? { ...p, status: "ready" as const, path: currentPath }
                    : p
                ),
              }));
              // 新しいworktreeをリストに追加（全体リフレッシュせず）
              if (currentPath) {
                onWorktreeCreated(currentPath, branchName);
              }
              break;

            case "copying":
              // copy処理中
              setState((s) => ({
                ...s,
                pending: s.pending.map((p) =>
                  p.id === pendingId
                    ? { ...p, processingHint: "copying" as const }
                    : p
                ),
              }));
              break;

            case "hooks":
              // hooks処理中
              setState((s) => ({
                ...s,
                pending: s.pending.map((p) =>
                  p.id === pendingId
                    ? { ...p, processingHint: "hooks" as const }
                    : p
                ),
              }));
              break;

            case "completed":
              // 全処理完了（ペンディングを削除）
              break;
          }
        }
      );

      if (result.success) {
        // 成功: ペンディングを削除、メッセージ表示
        setState((s) => ({
          ...s,
          pending: s.pending.filter((p) => p.id !== pendingId),
        }));
        onStatusMessage(`Created worktree: ${branchName}`, "success");

        // 設定を保存（次回のデフォルトとして使用）
        // specific の場合は default として保存
        const modeToSave =
          baseBranch.type === "specific" ? "default" : baseBranch.type;
        await saveGtriCreateSettings({
          baseBranchMode: modeToSave,
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
        onStatusMessage(`Failed to create: ${result.error}`, "error");
      }
    } catch (error) {
      setState((s) => ({
        ...s,
        pending: s.pending.filter((p) => p.id !== pendingId),
      }));
      onStatusMessage(
        `Failed to create: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      );
    }
  }, [state.dialog, onWorktreeCreated, onStatusMessage]);

  return {
    state,
    openDialog,
    closeDialog,
    setBranchName,
    setBaseBranch,
    toggleOpenEditor,
    submit,
    isDialogOpen: state.dialog.mode === "open",
    hasPending: state.pending.length > 0,
    selectBaseOption,
    setBranchFilter,
    setBranchIndex,
    selectBranch,
    goBack,
  };
}
