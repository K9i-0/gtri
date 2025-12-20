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
  const { worktrees, config, loading, error, refresh } = useWorktrees();
  const { selectedIndex, moveUp, moveDown, moveToTop, moveToBottom, selectIndex } =
    useNavigation(worktrees.length);
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
      moveDown();
      return;
    }
    if (input === "k" || key.upArrow || (key.ctrl && input === "p")) {
      moveUp();
      return;
    }
    if (input === "g" || (key.ctrl && input === "a")) {
      moveToTop();
      return;
    }
    if (input === "G" || (key.ctrl && input === "e")) {
      moveToBottom();
      return;
    }
    if (/^[1-9]$/.test(input)) {
      selectIndex(parseInt(input, 10) - 1);
      return;
    }

    // Actions
    const selected = worktrees[selectedIndex];
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
  });

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
        <Text dimColor>Make sure you are in a git repository with gtr installed.</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box>
        <Text>Loading worktrees...</Text>
      </Box>
    );
  }

  if (worktrees.length === 0) {
    return (
      <Box flexDirection="column">
        <Header config={config} />
        <Text>No worktrees found.</Text>
        <Text dimColor>Use 'git gtr new &lt;branch&gt;' to create one.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header config={config} />
      <WorktreeList worktrees={worktrees} selectedIndex={selectedIndex} />
      {confirmDelete && <ConfirmDialog worktree={confirmDelete} />}
      <StatusBar message={message} />
    </Box>
  );
}
