import { useState, useCallback } from "react";
import type {
  ActionItem,
  ActionSelectDialogState,
  Worktree,
  PRInfo,
} from "../types/worktree.ts";

interface WorktreeActionHandlers {
  executeEditor: (wt: Worktree) => Promise<void>;
  executeAi: (wt: Worktree) => Promise<void>;
  executeCopy: (wt: Worktree) => Promise<void>;
  setConfirmDelete: (wt: Worktree | null) => void;
  executePR: (wt: Worktree) => Promise<void>;
  openCreateDialog: () => void;
}

interface PRActionHandlers {
  createWorktree: (pr: PRInfo) => Promise<boolean>;
  openPRInBrowser: (url: string) => void;
  setStatusMessage: (msg: string) => void;
}

interface UseActionSelectOptions {
  worktreeHandlers: WorktreeActionHandlers;
  prHandlers: PRActionHandlers;
}

interface UseActionSelectReturn {
  state: ActionSelectDialogState;
  isOpen: boolean;
  openForWorktree: (wt: Worktree) => void;
  openForPR: (pr: PRInfo) => void;
  close: () => void;
  moveUp: () => void;
  moveDown: () => void;
  executeSelected: () => void;
  executeByKey: (key: string) => boolean;
}

function getWorktreeActions(
  worktree: Worktree,
  handlers: WorktreeActionHandlers
): ActionItem[] {
  const actions: ActionItem[] = [
    {
      key: "e",
      label: "Editor",
      action: () => handlers.executeEditor(worktree),
    },
    {
      key: "a",
      label: "AI",
      action: () => handlers.executeAi(worktree),
    },
    {
      key: "c",
      label: "Copy path",
      action: () => handlers.executeCopy(worktree),
    },
    {
      key: "d",
      label: "Delete",
      action: () => handlers.setConfirmDelete(worktree),
      disabled: worktree.isMain,
      disabledReason: "Cannot delete main worktree",
    },
    {
      key: "p",
      label: worktree.prInfo ? `Open PR #${worktree.prInfo.number}` : "Open PR",
      action: () => handlers.executePR(worktree),
      disabled: !worktree.prInfo,
      disabledReason: "No PR for this branch",
    },
    {
      key: "n",
      label: "New worktree",
      action: () => handlers.openCreateDialog(),
    },
  ];
  return actions;
}

function getPRActions(pr: PRInfo, handlers: PRActionHandlers): ActionItem[] {
  return [
    {
      key: "w",
      label: "Create worktree",
      action: () => {
        handlers.createWorktree(pr).then((success) => {
          if (success) {
            handlers.setStatusMessage(`Created worktree: ${pr.headRefName}`);
          } else {
            handlers.setStatusMessage(
              `Failed to create worktree: ${pr.headRefName}`
            );
          }
        });
      },
    },
    {
      key: "p",
      label: `Open PR #${pr.number}`,
      action: () => {
        if (pr.url) {
          handlers.openPRInBrowser(pr.url);
          handlers.setStatusMessage(`Opening PR #${pr.number}`);
        }
      },
      disabled: !pr.url,
      disabledReason: "No PR URL available",
    },
  ];
}

export function useActionSelect({
  worktreeHandlers,
  prHandlers,
}: UseActionSelectOptions): UseActionSelectReturn {
  const [state, setState] = useState<ActionSelectDialogState>({ mode: "closed" });

  const isOpen = state.mode === "open";

  const openForWorktree = useCallback(
    (wt: Worktree) => {
      const actions = getWorktreeActions(wt, worktreeHandlers);
      setState({
        mode: "open",
        selectedIndex: 0,
        actions,
        targetLabel: wt.branch,
      });
    },
    [worktreeHandlers]
  );

  const openForPR = useCallback(
    (pr: PRInfo) => {
      const actions = getPRActions(pr, prHandlers);
      setState({
        mode: "open",
        selectedIndex: 0,
        actions,
        targetLabel: `PR #${pr.number}`,
      });
    },
    [prHandlers]
  );

  const close = useCallback(() => {
    setState({ mode: "closed" });
  }, []);

  const moveUp = useCallback(() => {
    setState((prev) => {
      if (prev.mode !== "open") return prev;
      const newIndex = Math.max(0, prev.selectedIndex - 1);
      return { ...prev, selectedIndex: newIndex };
    });
  }, []);

  const moveDown = useCallback(() => {
    setState((prev) => {
      if (prev.mode !== "open") return prev;
      const newIndex = Math.min(prev.actions.length - 1, prev.selectedIndex + 1);
      return { ...prev, selectedIndex: newIndex };
    });
  }, []);

  const executeSelected = useCallback(() => {
    if (state.mode !== "open") return;
    const action = state.actions[state.selectedIndex];
    if (action && !action.disabled) {
      action.action();
      close();
    }
  }, [state, close]);

  const executeByKey = useCallback(
    (key: string): boolean => {
      if (state.mode !== "open") return false;
      const action = state.actions.find((a) => a.key === key);
      if (action && !action.disabled) {
        action.action();
        close();
        return true;
      }
      return false;
    },
    [state, close]
  );

  return {
    state,
    isOpen,
    openForWorktree,
    openForPR,
    close,
    moveUp,
    moveDown,
    executeSelected,
    executeByKey,
  };
}
