import { useState, useCallback } from "react";
import type { Worktree } from "../types/worktree.ts";
import { openEditor, getAiCommand, removeWorktree } from "../lib/gtr.ts";
import { copyToClipboard } from "../lib/clipboard.ts";

interface UseActionsReturn {
  confirmDelete: Worktree | null;
  setConfirmDelete: (worktree: Worktree | null) => void;
  executing: boolean;
  message: string | null;
  executeEditor: (worktree: Worktree) => Promise<void>;
  executeAi: (worktree: Worktree) => Promise<void>;
  executeCopy: (worktree: Worktree) => Promise<void>;
  executeDelete: (worktree: Worktree) => Promise<boolean>;
  clearMessage: () => void;
}

export function useActions(): UseActionsReturn {
  const [confirmDelete, setConfirmDelete] = useState<Worktree | null>(null);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  const executeEditor = useCallback(async (worktree: Worktree) => {
    await openEditor(worktree.branch);
    setMessage(`Opening editor: ${worktree.branch}`);
    setTimeout(() => setMessage(null), 2000);
  }, []);

  const executeAi = useCallback(async (worktree: Worktree) => {
    const command = await getAiCommand(worktree.branch);
    if (command) {
      await copyToClipboard(command);
      setMessage(`Copied! Press Cmd+D, Cmd+V, Enter`);
      setTimeout(() => setMessage(null), 5000);
    }
  }, []);

  const executeCopy = useCallback(async (worktree: Worktree) => {
    const success = await copyToClipboard(worktree.path);
    if (success) {
      setMessage(`Copied: ${worktree.path}`);
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage("Failed to copy to clipboard");
      setTimeout(() => setMessage(null), 2000);
    }
  }, []);

  const executeDelete = useCallback(async (worktree: Worktree) => {
    setExecuting(true);
    try {
      const success = await removeWorktree(worktree.branch);
      if (success) {
        setMessage(`Deleted: ${worktree.branch}`);
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage(`Failed to delete: ${worktree.branch}`);
        setTimeout(() => setMessage(null), 2000);
      }
      return success;
    } finally {
      setExecuting(false);
      setConfirmDelete(null);
    }
  }, []);

  return {
    confirmDelete,
    setConfirmDelete,
    executing,
    message,
    executeEditor,
    executeAi,
    executeCopy,
    executeDelete,
    clearMessage,
  };
}
