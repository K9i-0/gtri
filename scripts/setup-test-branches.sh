#!/bin/bash
# テスト用ブランチのセットアップスクリプト

set -e

echo "=== Setting up test branches ==="

# 既存のテストブランチをクリーンアップ
echo "Cleaning up existing test branches..."
git branch -D demo/local-only 2>/dev/null || true
git branch -D demo/with-worktree 2>/dev/null || true
git branch -D demo/both 2>/dev/null || true
git push origin --delete demo/remote-only 2>/dev/null || true
git push origin --delete demo/both 2>/dev/null || true

# 既存のテストworktreeをクリーンアップ
git gtr rm demo/with-worktree --force 2>/dev/null || true

echo ""
echo "Creating test branches..."

# 1. ローカルのみのブランチ
echo "  - demo/local-only (local only)"
git branch demo/local-only

# 2. リモートのみのブランチ
echo "  - demo/remote-only (remote only)"
git push origin main:demo/remote-only

# 3. ローカル＋リモートのブランチ
echo "  - demo/both (local + remote)"
git branch demo/both
git push origin demo/both

# 4. worktreeがあるブランチ
echo "  - demo/with-worktree (has worktree)"
git gtr new demo/with-worktree --yes

# fetchしてリモートブランチを反映
git fetch origin

echo ""
echo "=== Setup complete ==="
echo ""
echo "Test branches:"
echo "  - demo/local-only   : Local only (not shown in Create tab)"
echo "  - demo/remote-only  : Remote only (origin/demo/remote-only)"
echo "  - demo/both         : Both local and remote"
echo "  - demo/with-worktree: Has a worktree (marked with ●)"
echo ""
echo "Run './gtri' and press Tab to test the Create tab"
