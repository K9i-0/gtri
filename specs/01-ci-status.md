# CI/CDステータス表示機能

## 概要

PRに紐づくGitHub Actionsの実行状況をWorktreeリストおよびOpen PRsリストに表示する機能。

## 背景・課題

- 現状、CIの状態を確認するには `gh run list` や GitHub Web UIを開く必要がある
- レビュー前にCIが通っているか確認したい
- CI失敗時に素早く対処したい

## ユースケース

1. **開発者として**、worktree一覧でCIの状態を確認し、失敗しているものを優先的に対処したい
2. **レビュアーとして**、Open PRsタブでCIが通っているPRを優先的にレビューしたい
3. **開発者として**、CI実行中のPRを把握し、完了を待ってからマージしたい

## UI設計

### Worktreesタブでの表示

```
  ○ feature/auth     abc1234  ~/work/auth   ✓ #42 @alice
  ○ fix/bug-123      def5678  ~/work/bug    ⏳ #43 @bob
  ○ feature/api      ghi9012  ~/work/api    ✗ #44 @you
  ○ refactor/core    jkl3456  ~/work/core   ○ #45 @carol (no CI)
```

### Open PRsタブでの表示

```
  #42  Add authentication flow        feature/auth     ✓  @alice
  #43  Fix critical bug               fix/bug-123      ⏳  @bob
  #44  New API endpoints              feature/api      ✗  @you
```

### ステータスアイコン

| アイコン | 意味 | 色 |
|---------|------|-----|
| `✓` | 成功 (success) | green |
| `✗` | 失敗 (failure) | red |
| `⏳` | 実行中 (in_progress, queued, pending) | yellow |
| `○` | CI未設定 / 該当なし | dim |
| `⊘` | スキップ (skipped) | dim |

## キーバインド

| キー | 動作 | 説明 |
|-----|------|------|
| `s` | CIステータス詳細表示 | 選択中のworktree/PRのCI詳細をステータスバーに表示 |
| `S` | GitHub ActionsをブラウザでOpen | `gh run view --web` 相当 |

## 技術仕様

### データ取得

#### 使用するGitHub CLI コマンド

```bash
# PRに紐づく最新のチェック状態を取得
gh pr view <pr_number> --json statusCheckRollup --jq '.statusCheckRollup'

# または、複数PRを一括取得（パフォーマンス向上）
gh pr list --json number,statusCheckRollup
```

#### レスポンス例

```json
{
  "statusCheckRollup": [
    {
      "name": "build",
      "status": "COMPLETED",
      "conclusion": "SUCCESS",
      "startedAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T10:05:00Z"
    },
    {
      "name": "test",
      "status": "IN_PROGRESS",
      "conclusion": null
    }
  ]
}
```

### 型定義

```typescript
// src/types/worktree.ts に追加

type CIStatus = 'success' | 'failure' | 'pending' | 'running' | 'skipped' | 'none';

interface CICheckRun {
  name: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED';
  conclusion: 'SUCCESS' | 'FAILURE' | 'NEUTRAL' | 'CANCELLED' | 'SKIPPED' | 'TIMED_OUT' | null;
  startedAt?: string;
  completedAt?: string;
}

interface CIInfo {
  status: CIStatus;
  checks: CICheckRun[];
  summary: string;  // "3/4 checks passed" など
}

// PRInfo に追加
interface PRInfo {
  // ... existing fields
  ci?: CIInfo;
}
```

### 実装箇所

#### 1. lib/gtr.ts

```typescript
// 新規追加
export async function getCIStatus(prNumber: number): Promise<CIInfo> {
  const result = await runGhCommand([
    'pr', 'view', String(prNumber),
    '--json', 'statusCheckRollup'
  ]);
  // パース処理
}

// getPRInfoBatch を拡張して statusCheckRollup も取得
export async function getPRInfoBatch(branches: string[]): Promise<Map<string, PRInfo>> {
  // --json に statusCheckRollup を追加
}
```

#### 2. components/WorktreeItem.tsx

```typescript
// CIステータスアイコンの表示を追加
function CIStatusIcon({ status }: { status: CIStatus }) {
  switch (status) {
    case 'success': return <Text color="green">✓</Text>;
    case 'failure': return <Text color="red">✗</Text>;
    case 'running':
    case 'pending': return <Text color="yellow">⏳</Text>;
    case 'skipped': return <Text dimColor>⊘</Text>;
    default: return <Text dimColor>○</Text>;
  }
}
```

#### 3. components/PRItem.tsx

同様にCIステータスアイコンを追加

### パフォーマンス考慮

1. **バッチ取得**: `gh pr list` で一括取得し、個別API呼び出しを避ける
2. **キャッシュ**: CI情報は30秒程度キャッシュし、頻繁なAPI呼び出しを防ぐ
3. **遅延読み込み**: 初回表示時はCI情報なしで表示し、バックグラウンドで取得後に更新

### キャッシュ戦略

```typescript
interface CICache {
  data: Map<number, CIInfo>;
  lastUpdated: number;
  ttl: number;  // default: 30000ms
}
```

## エラーハンドリング

| エラー | 対応 |
|-------|------|
| GitHub API rate limit | ステータスを `○` (none) として表示、ステータスバーに警告 |
| ネットワークエラー | 前回のキャッシュを使用、なければ `○` |
| PRが見つからない | `○` として表示 |
| gh CLI未インストール | CI機能を無効化（既存の動作と同様） |

## 設定オプション（将来的な拡張）

```ini
# .gtrconfig
[gtri]
  ci-check = true          # CI表示の有効/無効
  ci-cache-ttl = 30        # キャッシュTTL（秒）
  ci-auto-refresh = false  # 自動更新の有効/無効
```

## テスト計画

### ユニットテスト

1. `getCIStatus` のパース処理
2. CIステータスの集約ロジック（複数チェックがある場合）
3. キャッシュの有効期限切れ判定

### 統合テスト

1. モックAPIを使用したCI情報表示
2. エラー時のフォールバック動作

## 実装優先度

1. **Phase 1**: 基本的なCIステータス表示（アイコンのみ）
2. **Phase 2**: 詳細表示（`s` キー）
3. **Phase 3**: GitHub Actions Webページを開く（`S` キー）
4. **Phase 4**: キャッシュ・パフォーマンス最適化

## 依存関係

- GitHub CLI (`gh`) がインストール済みであること
- リポジトリがGitHub ActionsまたはCI/CDを使用していること

## 参考

- [GitHub CLI - gh pr view](https://cli.github.com/manual/gh_pr_view)
- [GitHub Checks API](https://docs.github.com/en/rest/checks)
