import { useState, useMemo, useEffect, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { useWorktrees } from "./hooks/useWorktrees.ts";
import { useBranches } from "./hooks/useBranches.ts";
import { useNavigation } from "./hooks/useNavigation.ts";
import { useActions } from "./hooks/useActions.ts";
import { Header } from "./components/Header.tsx";
import { TabBar } from "./components/TabBar.tsx";
import { WorktreeList } from "./components/WorktreeList.tsx";
import { BranchList } from "./components/BranchList.tsx";
import { BranchInput } from "./components/BranchInput.tsx";
import { StatusBar } from "./components/StatusBar.tsx";
import { ConfirmDialog } from "./components/ConfirmDialog.tsx";
import { createWorktree } from "./lib/gtr.ts";

type Mode = "worktrees" | "create";
type InputMode = "none" | "new-branch";

export function App() {
  const { exit } = useApp();
  const [mode, setMode] = useState<Mode>("worktrees");
  const [inputMode, setInputMode] = useState<InputMode>("none");
  const [newBranchName, setNewBranchName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const statusTimeoutRef = useRef<Timer | null>(null);

  // Clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        setStatusMessage("");
      }, 3000);
    }
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, [statusMessage]);

  const { worktrees, config, mainBranch, loading, error, refresh } =
    useWorktrees();
  const worktreeBranches = useMemo(
    () => worktrees.map((wt) => wt.branch),
    [worktrees]
  );
  const { branches, loading: branchesLoading, refresh: refreshBranches } =
    useBranches(worktreeBranches);

  // Navigation for worktrees tab
  const worktreeNav = useNavigation(worktrees.length);
  // Navigation for create tab
  const branchNav = useNavigation(branches.length);

  const {
    confirmDelete,
    setConfirmDelete,
    executing,
    message,
    executeEditor,
    executeAi,
    executeCopy,
    executeDelete,
  } = useActions();

  const handleCreateWorktree = async (branch: string, from?: string) => {
    // origin/xxx -> xxx (strip origin/ prefix for worktree name)
    const branchName = branch.replace(/^origin\//, "");
    setStatusMessage(`Creating worktree: ${branchName}...`);
    const result = await createWorktree(branchName, from ? { from: from.replace(/^origin\//, "") } : undefined);
    if (result.success) {
      setStatusMessage(`Created worktree: ${branchName}`);
      await refresh();
      await refreshBranches();
      setMode("worktrees");
    } else {
      setStatusMessage(`Error: ${result.error}`);
    }
  };

  useInput((input, key) => {
    if (loading || executing) return;

    // Input mode for new branch name
    if (inputMode === "new-branch") {
      if (key.escape) {
        setInputMode("none");
        setNewBranchName("");
      }
      return; // TextInput handles other keys
    }

    // Confirm dialog mode
    if (confirmDelete) {
      if (input === "y" || input === "Y") {
        executeDelete(confirmDelete).then(() => refresh());
      } else {
        setConfirmDelete(null);
      }
      return;
    }

    // Quit
    if (input === "q" || key.escape) {
      exit();
      return;
    }

    // Tab switching
    if (key.tab) {
      setMode(mode === "worktrees" ? "create" : "worktrees");
      return;
    }

    // Mode-specific handling
    if (mode === "worktrees") {
      handleWorktreesInput(input, key);
    } else {
      handleCreateInput(input, key);
    }
  });

  const handleWorktreesInput = (input: string, key: any) => {
    // Navigation
    if (input === "j" || key.downArrow || (key.ctrl && input === "n")) {
      worktreeNav.moveDown();
      return;
    }
    if (input === "k" || key.upArrow || (key.ctrl && input === "p")) {
      worktreeNav.moveUp();
      return;
    }
    if (input === "g" || (key.ctrl && input === "a")) {
      worktreeNav.moveToTop();
      return;
    }
    if (input === "G" || (key.ctrl && input === "e")) {
      worktreeNav.moveToBottom();
      return;
    }
    if (/^[1-9]$/.test(input)) {
      worktreeNav.selectIndex(parseInt(input, 10) - 1);
      return;
    }

    // Actions
    const selected = worktrees[worktreeNav.selectedIndex];
    if (!selected) return;

    if (input === "e") {
      executeEditor(selected);
      return;
    }
    if (input === "a") {
      executeAi(selected);
      return;
    }
    if (input === "c") {
      executeCopy(selected);
      return;
    }
    if (input === "d") {
      if (!selected.isMain) {
        setConfirmDelete(selected);
      }
      return;
    }
    if (input === "r") {
      refresh();
      return;
    }
  };

  const handleCreateInput = (input: string, key: any) => {
    // Navigation
    if (input === "j" || key.downArrow || (key.ctrl && input === "n")) {
      branchNav.moveDown();
      return;
    }
    if (input === "k" || key.upArrow || (key.ctrl && input === "p")) {
      branchNav.moveUp();
      return;
    }
    if (input === "g" || (key.ctrl && input === "a")) {
      branchNav.moveToTop();
      return;
    }
    if (input === "G" || (key.ctrl && input === "e")) {
      branchNav.moveToBottom();
      return;
    }

    const selected = branches[branchNav.selectedIndex];
    if (!selected) return;

    // Enter: Create worktree from selected branch
    if (key.return) {
      if (selected.hasWorktree) {
        setStatusMessage("Worktree already exists for this branch");
        return;
      }
      handleCreateWorktree(selected.name);
      return;
    }

    // n: New branch from selected
    if (input === "n") {
      setInputMode("new-branch");
      setNewBranchName("");
      return;
    }

    // r: Refresh
    if (input === "r") {
      refreshBranches();
      return;
    }
  };

  const handleNewBranchSubmit = (name: string) => {
    if (!name.trim()) {
      setInputMode("none");
      return;
    }
    const selected = branches[branchNav.selectedIndex];
    if (selected) {
      handleCreateWorktree(name.trim(), selected.name);
    }
    setInputMode("none");
    setNewBranchName("");
  };

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
        <Text dimColor>
          Make sure you are in a git repository with gtr installed.
        </Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box>
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header config={config} mainBranch={mainBranch} />
      <TabBar activeTab={mode} />

      {mode === "worktrees" ? (
        <>
          {worktrees.length === 0 ? (
            <Box flexDirection="column">
              <Text>No worktrees found.</Text>
              <Text dimColor>Press Tab to create one.</Text>
            </Box>
          ) : (
            <WorktreeList
              worktrees={worktrees}
              selectedIndex={worktreeNav.selectedIndex}
            />
          )}
          {confirmDelete && <ConfirmDialog worktree={confirmDelete} />}
        </>
      ) : (
        <>
          {branchesLoading ? (
            <Text>Loading branches...</Text>
          ) : (
            <BranchList
              branches={branches}
              selectedIndex={branchNav.selectedIndex}
            />
          )}
          {inputMode === "new-branch" && (
            <BranchInput
              baseBranch={branches[branchNav.selectedIndex]?.name || ""}
              value={newBranchName}
              onChange={setNewBranchName}
              onSubmit={handleNewBranchSubmit}
            />
          )}
        </>
      )}

      <StatusBar message={statusMessage || message} activeTab={mode} />
    </Box>
  );
}
