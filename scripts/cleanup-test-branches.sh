#!/bin/bash
# テスト用ブランチのクリーンアップスクリプト

echo "=== Cleaning up test branches ==="

# Worktreeを削除
echo "Removing worktrees..."
git gtr rm demo/with-worktree --force 2>/dev/null || true

# ローカルブランチを削除
echo "Removing local branches..."
git branch -D demo/local-only 2>/dev/null || true
git branch -D demo/with-worktree 2>/dev/null || true
git branch -D demo/both 2>/dev/null || true

# リモートブランチを削除
echo "Removing remote branches..."
git push origin --delete demo/remote-only 2>/dev/null || true
git push origin --delete demo/both 2>/dev/null || true
git push origin --delete demo/with-worktree 2>/dev/null || true

echo ""
echo "=== Cleanup complete ==="
