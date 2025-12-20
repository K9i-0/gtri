#!/bin/bash
# テスト用ブランチのセットアップスクリプト

set -e

MODE="${1:-test}"

# デモ用ブランチのクリーンアップ
cleanup_demo() {
  echo "Cleaning up demo branches..."
  # worktree削除
  git gtr rm feature/user-auth --force 2>/dev/null || true
  git gtr rm feature/dark-theme --force 2>/dev/null || true
  git gtr rm feature/search-filter --force 2>/dev/null || true
  git gtr rm fix/login-bug --force 2>/dev/null || true
  # リモートブランチ削除
  git push origin --delete feature/user-auth 2>/dev/null || true
  git push origin --delete feature/dark-theme 2>/dev/null || true
  git push origin --delete feature/search-filter 2>/dev/null || true
  git push origin --delete fix/login-bug 2>/dev/null || true
  git push origin --delete feature/api-v2 2>/dev/null || true
  git push origin --delete feature/notifications 2>/dev/null || true
}

# テスト用ブランチのクリーンアップ
cleanup_test() {
  echo "Cleaning up test branches..."
  git branch -D demo/local-only 2>/dev/null || true
  git branch -D demo/with-worktree 2>/dev/null || true
  git branch -D demo/both 2>/dev/null || true
  git push origin --delete demo/remote-only 2>/dev/null || true
  git push origin --delete demo/both 2>/dev/null || true
  git gtr rm demo/with-worktree --force 2>/dev/null || true
}

# デモ用ブランチのセットアップ
setup_demo() {
  echo ""
  echo "=== Setting up demo branches ==="
  cleanup_demo

  echo ""
  echo "Creating demo branches..."

  # worktreeありのブランチ（3つ）
  echo "  - feature/user-auth (with worktree)"
  git push origin main:feature/user-auth 2>/dev/null || true
  git gtr new origin/feature/user-auth --yes

  echo "  - feature/dark-theme (with worktree)"
  git push origin main:feature/dark-theme 2>/dev/null || true
  git gtr new origin/feature/dark-theme --yes

  echo "  - fix/login-bug (with worktree)"
  git push origin main:fix/login-bug 2>/dev/null || true
  git gtr new origin/fix/login-bug --yes

  # リモートのみのブランチ（Createタブ用）
  echo "  - feature/search-filter (remote only)"
  git push origin main:feature/search-filter

  echo "  - feature/api-v2 (remote only)"
  git push origin main:feature/api-v2

  echo "  - feature/notifications (remote only)"
  git push origin main:feature/notifications

  git fetch origin

  echo ""
  echo "=== Demo setup complete ==="
  echo ""
  echo "Worktrees (shown in Worktrees tab):"
  echo "  - feature/user-auth"
  echo "  - feature/dark-theme"
  echo "  - fix/login-bug"
  echo ""
  echo "Remote branches (shown in Create tab):"
  echo "  - feature/search-filter"
  echo "  - feature/api-v2"
  echo "  - feature/notifications"
}

# テスト用ブランチのセットアップ
setup_test() {
  echo ""
  echo "=== Setting up test branches ==="
  cleanup_test

  echo ""
  echo "Creating test branches..."

  echo "  - demo/local-only (local only)"
  git branch demo/local-only

  echo "  - demo/remote-only (remote only)"
  git push origin main:demo/remote-only

  echo "  - demo/both (local + remote)"
  git branch demo/both
  git push origin demo/both

  echo "  - demo/with-worktree (has worktree)"
  git gtr new demo/with-worktree --yes

  git fetch origin

  echo ""
  echo "=== Test setup complete ==="
  echo ""
  echo "Test branches:"
  echo "  - demo/local-only   : Local only"
  echo "  - demo/remote-only  : Remote only"
  echo "  - demo/both         : Both local and remote"
  echo "  - demo/with-worktree: Has a worktree"
}

case "$MODE" in
  demo)
    setup_demo
    ;;
  test)
    setup_test
    ;;
  clean)
    cleanup_demo
    cleanup_test
    echo "Cleanup complete."
    ;;
  *)
    echo "Usage: $0 [demo|test|clean]"
    echo ""
    echo "  demo  - Set up branches for demo GIF recording"
    echo "  test  - Set up branches for testing (default)"
    echo "  clean - Clean up all test/demo branches"
    exit 1
    ;;
esac
