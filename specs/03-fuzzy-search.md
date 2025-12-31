# ファジー検索/フィルタリング機能

## 概要

WorktreeリストおよびOpen PRsリストをインクリメンタルにフィルタリングする機能。ブランチ名、PRタイトル、作者名などで絞り込みができる。

## 背景・課題

- worktreeやPRが増えると目的のものを見つけるのに時間がかかる
- 上下キーで1つずつ移動するのは非効率
- 特定のPRをレビューしたい場合に素早くアクセスしたい

## ユースケース

1. **開発者として**、多くのworktreeの中から特定のブランチを素早く見つけたい
2. **レビュアーとして**、特定の作者のPRを絞り込んでレビューしたい
3. **開発者として**、PRタイトルのキーワードで該当するworktreeを探したい

## UI設計

### 通常状態

```
┌─ gtri ─────────────────────────────────────────────┐
│ Editor: cursor | AI: claude | Main: ~/repo         │
├────────────────────────────────────────────────────┤
│ [Worktrees]  Open PRs                              │
├────────────────────────────────────────────────────┤
│  ★ main           abc1234  ~/repo                  │
│  ○ feature/auth   def5678  ~/work/auth   #42      │
│  ○ fix/bug-123    ghi9012  ~/work/bug    #43      │
│  ○ feature/api    jkl3456  ~/work/api    #44      │
│  ○ docs/readme    mno7890  ~/work/docs   #45      │
├────────────────────────────────────────────────────┤
│ j/k:move e:editor /:filter q:quit                  │
└────────────────────────────────────────────────────┘
```

### フィルタモード

`/` キー押下後:

```
┌─ gtri ─────────────────────────────────────────────┐
│ Editor: cursor | AI: claude | Main: ~/repo         │
├────────────────────────────────────────────────────┤
│ [Worktrees]  Open PRs                              │
├────────────────────────────────────────────────────┤
│ Filter: auth█                                      │
├────────────────────────────────────────────────────┤
│  ○ feature/auth   def5678  ~/work/auth   #42      │
├────────────────────────────────────────────────────┤
│ 1 of 5 | Enter:select Esc:clear ↑↓:navigate        │
└────────────────────────────────────────────────────┘
```

### フィルタ結果なし

```
├────────────────────────────────────────────────────┤
│ Filter: xyz█                                       │
├────────────────────────────────────────────────────┤
│                                                    │
│             No matching worktrees                  │
│                                                    │
├────────────────────────────────────────────────────┤
│ 0 of 5 | Esc:clear                                 │
└────────────────────────────────────────────────────┘
```

### Open PRsタブでのフィルタ

```
┌─ gtri ─────────────────────────────────────────────┐
│ Editor: cursor | AI: claude | Main: ~/repo         │
├────────────────────────────────────────────────────┤
│ Worktrees  [Open PRs]                              │
├────────────────────────────────────────────────────┤
│ Filter: @alice█                                    │
├────────────────────────────────────────────────────┤
│  #42  Add authentication flow   feature/auth  @alice│
│  #48  Fix login redirect        fix/login     @alice│
├────────────────────────────────────────────────────┤
│ 2 of 12 | Enter:select Esc:clear ↑↓:navigate       │
└────────────────────────────────────────────────────┘
```

## キーバインド

### 通常状態

| キー | 動作 |
|-----|------|
| `/` | フィルタモードを開始 |

### フィルタモード

| キー | 動作 |
|-----|------|
| 文字入力 | フィルタ文字列の入力 |
| `Backspace` | 文字削除 |
| `Esc` | フィルタをクリアして通常モードに戻る |
| `Enter` | フィルタモードを終了（フィルタは維持） |
| `↑` / `k` | フィルタ結果内で上に移動 |
| `↓` / `j` | フィルタ結果内で下に移動 |
| `e` / `a` / `c` / `d` / `p` | 選択中のアイテムに対してアクション実行 |

## 検索対象

### Worktreesタブ

| フィールド | 説明 |
|-----------|------|
| ブランチ名 | `feature/auth` など |
| コミットハッシュ | `abc1234` など（短縮形） |
| パス | `~/work/auth` など |
| PR番号 | `#42` など |
| PR作者 | `@alice` など |
| PRタイトル | PRが紐づいている場合 |

### Open PRsタブ

| フィールド | 説明 |
|-----------|------|
| PR番号 | `#42` または `42` |
| PRタイトル | "Add authentication flow" など |
| ブランチ名 | `feature/auth` など |
| 作者 | `@alice` または `alice` |

## 検索アルゴリズム

### 基本方針

- **部分一致**: 入力文字列がフィールドのどこかに含まれていればマッチ
- **大文字小文字無視**: 検索は case-insensitive
- **複数フィールド検索**: すべての検索対象フィールドに対してOR検索
- **ファジーマッチ（オプション）**: 将来的に `fzf` 風のファジーマッチも検討

### 特殊プレフィックス

| プレフィックス | 意味 | 例 |
|--------------|------|-----|
| `@` | 作者で検索 | `@alice` |
| `#` | PR番号で検索 | `#42` |
| `b:` | ブランチ名のみで検索 | `b:feature` |
| `t:` | PRタイトルのみで検索 | `t:auth` |

### 実装

```typescript
interface FilterOptions {
  query: string;
  fields: ('branch' | 'hash' | 'path' | 'prNumber' | 'prTitle' | 'author')[];
}

function parseQuery(input: string): FilterOptions {
  // プレフィックスの解析
  if (input.startsWith('@')) {
    return { query: input.slice(1), fields: ['author'] };
  }
  if (input.startsWith('#')) {
    return { query: input.slice(1), fields: ['prNumber'] };
  }
  if (input.startsWith('b:')) {
    return { query: input.slice(2), fields: ['branch'] };
  }
  if (input.startsWith('t:')) {
    return { query: input.slice(2), fields: ['prTitle'] };
  }

  // デフォルト: すべてのフィールドを検索
  return {
    query: input,
    fields: ['branch', 'hash', 'path', 'prNumber', 'prTitle', 'author']
  };
}

function matchesFilter(item: Worktree | PR, options: FilterOptions): boolean {
  const query = options.query.toLowerCase();
  if (!query) return true;

  for (const field of options.fields) {
    const value = getFieldValue(item, field)?.toLowerCase();
    if (value?.includes(query)) {
      return true;
    }
  }

  return false;
}
```

## 技術仕様

### 状態管理

```typescript
interface FilterState {
  isActive: boolean;
  query: string;
  filteredIndices: number[];  // 元のリストでのインデックス
}

const [filterState, setFilterState] = useState<FilterState>({
  isActive: false,
  query: '',
  filteredIndices: []
});
```

### hooks/useFilter.ts

```typescript
import { useState, useCallback, useMemo } from 'react';

export function useFilter<T>(items: T[], filterFn: (item: T, query: string) => boolean) {
  const [isActive, setIsActive] = useState(false);
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query) return items;
    return items.filter(item => filterFn(item, query));
  }, [items, query, filterFn]);

  const filteredIndices = useMemo(() => {
    if (!query) return items.map((_, i) => i);
    return items
      .map((item, i) => ({ item, index: i }))
      .filter(({ item }) => filterFn(item, query))
      .map(({ index }) => index);
  }, [items, query, filterFn]);

  const activate = useCallback(() => {
    setIsActive(true);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setQuery('');
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  return {
    isActive,
    query,
    setQuery,
    filteredItems,
    filteredIndices,
    activate,
    deactivate,
    clearQuery,
    resultCount: filteredItems.length,
    totalCount: items.length
  };
}
```

### コンポーネント更新

#### FilterBar.tsx（新規）

```typescript
import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
  isActive: boolean;
  query: string;
  onChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
}

export function FilterBar({ isActive, query, onChange, resultCount, totalCount }: Props) {
  if (!isActive) return null;

  return (
    <Box>
      <Text color="blue">Filter: </Text>
      <TextInput
        value={query}
        onChange={onChange}
        placeholder="Type to filter..."
      />
      <Text dimColor> ({resultCount} of {totalCount})</Text>
    </Box>
  );
}
```

#### WorktreeList.tsx の更新

```typescript
export function WorktreeList({
  worktrees,
  selectedIndex,
  filter  // 追加
}: Props) {
  const displayItems = filter.isActive
    ? filter.filteredItems
    : worktrees;

  // 選択インデックスの調整
  const adjustedIndex = filter.isActive
    ? filter.filteredIndices.indexOf(selectedIndex)
    : selectedIndex;

  return (
    <Box flexDirection="column">
      {filter.isActive && (
        <FilterBar
          isActive={filter.isActive}
          query={filter.query}
          onChange={filter.setQuery}
          resultCount={filter.resultCount}
          totalCount={filter.totalCount}
        />
      )}

      {displayItems.length === 0 ? (
        <Box justifyContent="center" paddingY={2}>
          <Text dimColor>No matching worktrees</Text>
        </Box>
      ) : (
        displayItems.map((wt, i) => (
          <WorktreeItem
            key={wt.path}
            worktree={wt}
            isSelected={i === adjustedIndex}
          />
        ))
      )}
    </Box>
  );
}
```

### App.tsx でのキー処理

```typescript
// フィルタモードの処理を追加
useInput((input, key) => {
  // フィルタモード開始
  if (input === '/' && !filter.isActive && !createWorktree.state.mode !== 'closed') {
    filter.activate();
    return;
  }

  // フィルタモード中
  if (filter.isActive) {
    if (key.escape) {
      filter.deactivate();
      return;
    }
    if (key.return) {
      // フィルタモード終了（フィルタは維持）
      // ただし、フィルタ結果が0件の場合はクリア
      if (filter.resultCount === 0) {
        filter.deactivate();
      }
      return;
    }
    // 上下移動はフィルタ結果内で行う
    if (input === 'j' || key.downArrow) {
      navigation.moveDown(filter.resultCount);
      return;
    }
    // ... 他のキー処理
  }

  // 通常のキー処理
  // ...
});
```

## ハイライト表示

検索クエリにマッチした部分をハイライト表示:

```typescript
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <Text>{text}</Text>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return <Text>{text}</Text>;

  return (
    <Text>
      {text.slice(0, index)}
      <Text backgroundColor="yellow" color="black">
        {text.slice(index, index + query.length)}
      </Text>
      {text.slice(index + query.length)}
    </Text>
  );
}
```

## パフォーマンス考慮

1. **デバウンス**: 入力ごとにフィルタリングするのではなく、100ms程度のデバウンスを適用
2. **メモ化**: `useMemo` でフィルタ結果をキャッシュ
3. **仮想化**: 結果が多い場合も現状の最大7行表示で対応（既存のスクロール機能を利用）

```typescript
// デバウンス実装
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 使用例
const debouncedQuery = useDebounce(filter.query, 100);
const filteredItems = useMemo(() =>
  items.filter(item => filterFn(item, debouncedQuery)),
  [items, debouncedQuery]
);
```

## StatusBarの更新

フィルタモード中は StatusBar を更新:

```typescript
// 通常時
"j/k:move e:editor /:filter q:quit"

// フィルタモード
"↑↓:navigate Enter:select Esc:clear"

// フィルタモード（結果なし）
"Esc:clear"
```

## エラーハンドリング

| 状況 | 対応 |
|------|------|
| フィルタ結果が0件 | "No matching worktrees/PRs" メッセージを表示 |
| 不正な正規表現（将来対応） | エスケープして部分一致検索にフォールバック |

## 実装優先度

1. **Phase 1**: 基本的なフィルタ入力とブランチ名検索
2. **Phase 2**: 複数フィールド検索（PR番号、作者など）
3. **Phase 3**: 特殊プレフィックス（`@`, `#`, `b:`, `t:`）
4. **Phase 4**: マッチ部分のハイライト表示
5. **Phase 5**: デバウンスとパフォーマンス最適化

## テスト計画

### ユニットテスト

1. `parseQuery` のプレフィックス解析
2. `matchesFilter` の各フィールドでのマッチング
3. 大文字小文字の無視
4. 空クエリでの全件表示

### 統合テスト

1. フィルタモードの開始・終了
2. インクリメンタル検索の動作
3. フィルタ結果内でのナビゲーション
4. フィルタ中のアクション実行

## 依存関係

- `ink-text-input` パッケージ（既にインストール済み）

## 将来的な拡張

1. **ファジーマッチ**: `fzf` 風のスコアリングによるマッチ
2. **検索履歴**: 過去のフィルタクエリを記憶
3. **保存フィルタ**: よく使うフィルタをショートカットとして保存
4. **複合検索**: AND/OR 検索のサポート（例: `auth AND @alice`）
5. **正規表現サポート**: `/regex/` 形式での検索
