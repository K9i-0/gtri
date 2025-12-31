# CI/CDステータス表示機能

## 概要

PRに紐づくGitHub Actionsの実行状況をWorktreeリストおよびOpen PRsリストに表示する機能。

## 背景・課題

- 現状、CIの状態を確認するには `gh run list` や GitHub Web UIを開く必要がある
- レビュー前にCIが通っているか確認したい
- CI失敗時に素早く対処したい
- **WorktreeタブとPRタブでPR情報の表示ロジックが重複している**

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

## UI共通化

CI機能の実装に合わせて、WorktreeタブとPRタブで重複しているUIロジックを共通化する。

### 現状の課題

| ファイル | 行数 | 問題 |
|---------|-----|------|
| WorktreeList.tsx | 26行 | PRList.tsxとほぼ同一のスクロール・選択ロジック |
| PRList.tsx | 27行 | WorktreeList.tsxとほぼ同一 |
| WorktreeItem.tsx | 95行 | PR表示ロジックが埋め込まれている |
| PRItem.tsx | 63行 | 同様のPR表示ロジック |

### 共通化する新規コンポーネント

#### 1. CIStatusIcon.tsx

CIステータスをアイコンで表示する共通コンポーネント:

```typescript
// src/components/CIStatusIcon.tsx
import { Text } from 'ink';

interface Props {
  status: CIStatus | undefined;
}

export function CIStatusIcon({ status }: Props) {
  switch (status) {
    case 'success':
      return <Text color="green">✓</Text>;
    case 'failure':
      return <Text color="red">✗</Text>;
    case 'running':
    case 'pending':
      return <Text color="yellow">⏳</Text>;
    case 'skipped':
      return <Text dimColor>⊘</Text>;
    default:
      return <Text dimColor>○</Text>;
  }
}
```

#### 2. PRBadge.tsx

PR情報（番号、状態、CI、著者）を表示する共通コンポーネント:

```typescript
// src/components/PRBadge.tsx
import { Box, Text } from 'ink';
import Link from 'ink-link';
import { CIStatusIcon } from './CIStatusIcon';

interface Props {
  prInfo: PRInfo;
  showState?: boolean;      // OPEN/MERGED/CLOSED を表示するか
  showTitle?: boolean;      // タイトルを表示するか
  maxTitleLength?: number;  // タイトルの最大長
}

export function PRBadge({ prInfo, showState = false, showTitle = false, maxTitleLength = 40 }: Props) {
  const { number, state, title, url, author, isDraft, ci } = prInfo;

  return (
    <Box gap={1}>
      {/* CI Status */}
      <CIStatusIcon status={ci?.status} />

      {/* PR State (optional) */}
      {showState && (
        <Text color={getStateColor(state)}>[{state}]</Text>
      )}

      {/* Draft badge */}
      {isDraft && <Text dimColor>[Draft]</Text>}

      {/* PR number with link */}
      <Link url={url}>
        <Text color="cyan">#{number}</Text>
      </Link>

      {/* Author */}
      <Link url={`https://github.com/${author.login}`}>
        <Text color="yellow">@{author.login}</Text>
      </Link>

      {/* Title (optional) */}
      {showTitle && (
        <Text>{truncateTitle(title, maxTitleLength)}</Text>
      )}
    </Box>
  );
}

function getStateColor(state: PRInfo['state']): string {
  switch (state) {
    case 'OPEN': return 'green';
    case 'MERGED': return 'magenta';
    case 'CLOSED': return 'red';
  }
}

function truncateTitle(title: string, maxLength: number): string {
  return title.length > maxLength
    ? title.substring(0, maxLength - 3) + '...'
    : title;
}
```

#### 3. ScrollableList.tsx

スクロール可能なリストの共通コンポーネント:

```typescript
// src/components/ScrollableList.tsx
import { Box, Text } from 'ink';

interface Props<T> {
  items: T[];
  selectedIndex: number;
  renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
  getKey: (item: T) => string | number;
  visibleCount?: number;
}

const DEFAULT_VISIBLE_COUNT = 7;

export function ScrollableList<T>({
  items,
  selectedIndex,
  renderItem,
  getKey,
  visibleCount = DEFAULT_VISIBLE_COUNT
}: Props<T>) {
  // 選択項目を中央に保つためのスクロール計算
  const halfVisible = Math.floor(visibleCount / 2);
  let startIndex = Math.max(0, selectedIndex - halfVisible);
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  if (endIndex - startIndex < visibleCount) {
    startIndex = Math.max(0, endIndex - visibleCount);
  }

  const visibleItems = items.slice(startIndex, endIndex);
  const hasMoreAbove = startIndex > 0;
  const hasMoreBelow = endIndex < items.length;

  return (
    <Box flexDirection="column">
      {hasMoreAbove && (
        <Box marginLeft={2}>
          <Text dimColor>↑ more ({startIndex})</Text>
        </Box>
      )}

      {visibleItems.map((item, i) => {
        const actualIndex = startIndex + i;
        return (
          <Box key={getKey(item)}>
            {renderItem(item, actualIndex, actualIndex === selectedIndex)}
          </Box>
        );
      })}

      {hasMoreBelow && (
        <Box marginLeft={2}>
          <Text dimColor>↓ more ({items.length - endIndex})</Text>
        </Box>
      )}
    </Box>
  );
}
```

### リファクタリング後の構成

```
src/components/
├── common/
│   ├── CIStatusIcon.tsx      # NEW: CIアイコン
│   ├── PRBadge.tsx           # NEW: PR情報バッジ
│   └── ScrollableList.tsx    # NEW: 汎用リスト
├── WorktreeList.tsx          # ScrollableListを使用
├── WorktreeItem.tsx          # PRBadgeを使用
├── PRList.tsx                # ScrollableListを使用
└── PRItem.tsx                # PRBadgeを使用
```

### 使用例

#### WorktreeItem.tsx（リファクタ後）

```typescript
export function WorktreeItem({ worktree, isSelected, index, prLoading }: Props) {
  return (
    <Box flexDirection="column">
      {/* Line 1: Branch info */}
      <Box gap={1}>
        <Text>{worktree.isMain ? '★' : '○'}</Text>
        <Text color={isSelected ? 'green' : undefined}>{worktree.branch}</Text>
        <Text dimColor>{worktree.shortHash}</Text>
        <Text dimColor>({index + 1})</Text>
      </Box>

      {/* Line 2: Path */}
      <Box marginLeft={4}>
        <Text dimColor>{worktree.path}</Text>
      </Box>

      {/* Line 3: PR info (using shared component) */}
      {prLoading ? (
        <Box marginLeft={4}>
          <Text dimColor>Loading PR...</Text>
        </Box>
      ) : worktree.prInfo && (
        <Box marginLeft={4}>
          <PRBadge prInfo={worktree.prInfo} showState />
        </Box>
      )}
    </Box>
  );
}
```

#### PRItem.tsx（リファクタ後）

```typescript
export function PRItem({ pr, isSelected, index, isCreating }: Props) {
  return (
    <Box flexDirection="column">
      {/* Line 1: PR info (using shared component) */}
      <Box gap={1}>
        <PRBadge prInfo={pr} showTitle maxTitleLength={50} />
        <Text dimColor>({index + 1})</Text>
      </Box>

      {/* Line 2: Branch info */}
      <Box marginLeft={4}>
        <Text dimColor>Branch: {pr.headRefName}</Text>
      </Box>

      {isCreating && (
        <Box marginLeft={4}>
          <Text color="yellow">Creating worktree...</Text>
        </Box>
      )}
    </Box>
  );
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

1. **Phase 1**: UI共通化（リファクタリング）
   - CIStatusIcon.tsx 作成
   - PRBadge.tsx 作成
   - ScrollableList.tsx 作成
   - WorktreeItem.tsx / PRItem.tsx をリファクタ
   - WorktreeList.tsx / PRList.tsx をリファクタ
2. **Phase 2**: 基本的なCIステータス表示（アイコンのみ）
   - PRInfo に ci フィールド追加
   - getPRInfoBatch で statusCheckRollup を取得
   - PRBadge で CIStatusIcon を表示
3. **Phase 3**: 詳細表示（`s` キー）
4. **Phase 4**: GitHub Actions Webページを開く（`S` キー）
5. **Phase 5**: キャッシュ・パフォーマンス最適化

## 依存関係

- GitHub CLI (`gh`) がインストール済みであること
- リポジトリがGitHub ActionsまたはCI/CDを使用していること

## 参考

- [GitHub CLI - gh pr view](https://cli.github.com/manual/gh_pr_view)
- [GitHub Checks API](https://docs.github.com/en/rest/checks)
