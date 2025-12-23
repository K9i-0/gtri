import { useState, useEffect, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { useWorktrees } from "./hooks/useWorktrees.ts";
import { useNavigation } from "./hooks/useNavigation.ts";
import { useActions } from "./hooks/useActions.ts";
import { Header } from "./components/Header.tsx";
import { WorktreeList } from "./components/WorktreeList.tsx";
import { StatusBar } from "./components/StatusBar.tsx";
import { ConfirmDialog } from "./components/ConfirmDialog.tsx";

export function App() {
  const { exit } = useApp();
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

  const { worktrees, config, mainBranch, loading, prLoading, error, refresh } =
    useWorktrees();

  // Navigation for worktrees
  const worktreeNav = useNavigation(worktrees.length);

  const {
    confirmDelete,
    setConfirmDelete,
    executing,
    message,
    executeEditor,
    executeAi,
    executeCopy,
    executeDelete,
    executePR,
  } = useActions();

  useInput((input, key) => {
    if (loading || executing) return;

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
    if (input === "p") {
      executePR(selected);
      return;
    }
    if (input === "r") {
      refresh();
      return;
    }
  });

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

      {worktrees.length === 0 ? (
        <Box flexDirection="column">
          <Text>No worktrees found.</Text>
          <Text dimColor>Use `gtr new &lt;branch&gt;` to create one.</Text>
        </Box>
      ) : (
        <WorktreeList
          worktrees={worktrees}
          selectedIndex={worktreeNav.selectedIndex}
          prLoading={prLoading}
        />
      )}
      {confirmDelete && <ConfirmDialog worktree={confirmDelete} />}

      <StatusBar message={statusMessage || message} />
    </Box>
  );
}
