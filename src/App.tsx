import { useState, useEffect, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { useWorktrees } from "./hooks/useWorktrees.ts";
import { useNavigation } from "./hooks/useNavigation.ts";
import { useActions } from "./hooks/useActions.ts";
import { usePRs } from "./hooks/usePRs.ts";
import { Header } from "./components/Header.tsx";
import { WorktreeList } from "./components/WorktreeList.tsx";
import { PRList } from "./components/PRList.tsx";
import { TabBar } from "./components/TabBar.tsx";
import { StatusBar } from "./components/StatusBar.tsx";
import { ConfirmDialog } from "./components/ConfirmDialog.tsx";
import { openPRInBrowser } from "./lib/gtr.ts";
import type { TabType } from "./types/worktree.ts";

export function App() {
  const { exit } = useApp();
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("worktrees");
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

  const {
    worktrees,
    config,
    mainBranch,
    loading,
    prLoading,
    error,
    refresh,
    deletingBranch,
    setDeletingBranch,
    removeWorktreeFromList,
    ghAvailable,
  } = useWorktrees();

  // Navigation for worktrees
  const worktreeNav = useNavigation(worktrees.length);

  // PR list
  const {
    prs,
    loading: prListLoading,
    creatingBranch,
    refresh: prRefresh,
    createWorktree,
  } = usePRs(worktrees, ghAvailable, refresh);

  // Navigation for PRs
  const prNav = useNavigation(prs.length);

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

  // Get current navigation based on active tab
  const currentNav = activeTab === "worktrees" ? worktreeNav : prNav;

  useInput((input, key) => {
    if (loading || executing) return;

    // Confirm dialog mode
    if (confirmDelete) {
      if (input === "y" || input === "Y") {
        const branchToDelete = confirmDelete.branch;
        setDeletingBranch(branchToDelete);
        setConfirmDelete(null);

        executeDelete(confirmDelete).then((success) => {
          setDeletingBranch(null);
          if (success) {
            removeWorktreeFromList(branchToDelete);
            // 削除後、選択インデックスが範囲外にならないよう調整
            if (worktreeNav.selectedIndex >= worktrees.length - 1) {
              worktreeNav.selectIndex(Math.max(0, worktrees.length - 2));
            }
          }
        });
      } else {
        setConfirmDelete(null);
      }
      return;
    }

    // Tab switching
    if (key.tab) {
      setActiveTab((prev) => (prev === "worktrees" ? "prs" : "worktrees"));
      return;
    }

    // Quit
    if (input === "q" || key.escape) {
      exit();
      return;
    }

    // Navigation (works for both tabs)
    if (input === "j" || key.downArrow || (key.ctrl && input === "n")) {
      currentNav.moveDown();
      return;
    }
    if (input === "k" || key.upArrow || (key.ctrl && input === "p")) {
      currentNav.moveUp();
      return;
    }
    if (input === "g" || (key.ctrl && input === "a")) {
      currentNav.moveToTop();
      return;
    }
    if (input === "G" || (key.ctrl && input === "e")) {
      currentNav.moveToBottom();
      return;
    }
    if (/^[1-9]$/.test(input)) {
      currentNav.selectIndex(parseInt(input, 10) - 1);
      return;
    }

    // Refresh (works for both tabs)
    if (input === "r") {
      refresh();
      prRefresh();
      return;
    }

    // Tab-specific actions
    if (activeTab === "worktrees") {
      // Worktree tab actions
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
    } else {
      // PR tab actions
      const selectedPR = prs[prNav.selectedIndex];
      if (!selectedPR) return;

      if (input === "w") {
        createWorktree(selectedPR).then((success) => {
          if (success) {
            setStatusMessage(`Created worktree: ${selectedPR.headRefName}`);
            // 作成後、選択インデックスが範囲外にならないよう調整
            if (prNav.selectedIndex >= prs.length - 1) {
              prNav.selectIndex(Math.max(0, prs.length - 2));
            }
          } else {
            setStatusMessage(`Failed to create worktree: ${selectedPR.headRefName}`);
          }
        });
        return;
      }
      if (input === "p") {
        if (selectedPR.url) {
          openPRInBrowser(selectedPR.url);
          setStatusMessage(`Opening PR #${selectedPR.number}`);
        }
        return;
      }
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

      <TabBar
        activeTab={activeTab}
        worktreeCount={worktrees.length}
        prCount={prs.length}
      />

      {activeTab === "worktrees" ? (
        worktrees.length === 0 ? (
          <Box flexDirection="column">
            <Text>No worktrees found.</Text>
            <Text dimColor>Use `gtr new &lt;branch&gt;` to create one.</Text>
          </Box>
        ) : (
          <WorktreeList
            worktrees={worktrees}
            selectedIndex={worktreeNav.selectedIndex}
            prLoading={prLoading}
            deletingBranch={deletingBranch}
          />
        )
      ) : prListLoading ? (
        <Box>
          <Text>Loading PRs...</Text>
        </Box>
      ) : prs.length === 0 ? (
        <Box flexDirection="column">
          <Text>No open PRs without worktrees.</Text>
          <Text dimColor>All open PRs already have worktrees.</Text>
        </Box>
      ) : (
        <PRList
          prs={prs}
          selectedIndex={prNav.selectedIndex}
          creatingBranch={creatingBranch}
        />
      )}

      {confirmDelete && <ConfirmDialog worktree={confirmDelete} />}

      <StatusBar message={statusMessage || message} activeTab={activeTab} />
    </Box>
  );
}
