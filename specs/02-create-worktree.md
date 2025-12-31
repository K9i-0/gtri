# インタラクティブWorktree作成機能

## 概要

TUI上で新規worktreeを作成できる機能。ブランチ名とベースブランチを指定し、`gtr new` コマンドをバックグラウンドで実行する。

## 背景・課題

- 現状、新規worktree作成には別ターミナルで `gtr new <branch>` を実行する必要がある
- AI駆動開発では頻繁にworktreeを作成するため、TUIを離れる手間を減らしたい
- 作成後にエディタを自動起動したいケースが多い
- **worktree作成は数秒かかるため、待ち時間が体験を損なう**

## ユースケース

1. **開発者として**、新しいタスクを始める際にTUIを離れずにworktreeを作成したい
2. **開発者として**、worktree作成後に自動でエディタを起動して作業を開始したい
3. **開発者として**、作成前にブランチ名の重複を確認したい
4. **開発者として**、特定のブランチ（main、develop、feature/xxx等）をベースに新しいworktreeを作成したい
5. **開発者として**、worktree作成を待たずに他の作業を続けたい

## 設計方針

### バックグラウンド実行

worktree作成には数秒かかるため、以下の方針で実装する:

1. **即座にダイアログを閉じる**: Enterを押したらすぐにWorktreeリストに戻る
2. **バックグラウンド実行**: `gtr new` はバックグラウンドで実行
3. **進行状況の表示**: 作成中のworktreeをリスト内に「Creating...」として表示
4. **完了通知**: StatusBarに成功/失敗メッセージを表示

### ベースブランチの選択

以下の3つのモードをサポート:

| モード | 説明 | gtr コマンド |
|-------|------|-------------|
| デフォルトブランチ | main/master から作成（デフォルト） | `gtr new <branch>` |
| 選択中のworktreeから | リストで選択中のworktreeのブランチをベースに作成 | `gtr new <branch> --from <ref>` |
| main repoの現在のブランチから | main repoでチェックアウト中のブランチから作成 | `gtr new <branch> --from-current` |

**Note**:
- 「選択中のworktreeから」は、リストで現在選択されているworktreeのブランチを `--from` の値として使用
- 「main repoの現在のブランチから」は `--from-current` を使用。main repoで別ブランチをチェックアウトしている場合に有用
- main repoがデフォルトブランチの場合、「main repoの現在のブランチから」は「デフォルトブランチ」と同じ結果になる

## UI設計

### 通常状態（Worktreesタブ）

```
┌─ gtri ─────────────────────────────────────────────┐
│ Editor: cursor | AI: claude | Main: ~/repo         │
├────────────────────────────────────────────────────┤
│ [Worktrees]  Open PRs                              │
├────────────────────────────────────────────────────┤
│  ★ main           abc1234  ~/repo                  │
│  ○ feature/auth   def5678  ~/work/auth   #42      │
│  ○ fix/bug        ghi9012  ~/work/bug    #43      │
├────────────────────────────────────────────────────┤
│ j/k:move e:editor a:ai c:copy d:delete n:new q:quit│
└────────────────────────────────────────────────────┘
```

### Worktree作成モード - Step 1: ブランチ名入力

`n` キー押下後:

```
┌─ gtri ─────────────────────────────────────────────┐
│ Editor: cursor | AI: claude | Main: ~/repo         │
├────────────────────────────────────────────────────┤
│ [Worktrees]  Open PRs                              │
├────────────────────────────────────────────────────┤
│                                                    │
│   ┌─ New Worktree ─────────────────────────────┐   │
│   │                                            │   │
│   │  Branch name: feature/█                    │   │
│   │                                            │   │
│   │  Base: (default branch)           [Tab]   │   │
│   │                                            │   │
│   │  [ ] Open editor after creation   [Space] │   │
│   │                                            │   │
│   │  [Enter] Create   [Esc] Cancel             │   │
│   └────────────────────────────────────────────┘   │
│                                                    │
├────────────────────────────────────────────────────┤
│ Enter:create Tab:change-base Space:toggle Esc:cancel│
└────────────────────────────────────────────────────┘
```

### Worktree作成モード - Step 2: ベースブランチ選択

`Tab` キーで Base フィールドにフォーカスし、選択モードに入る:

```
│   │  Branch name: feature/new-api              │   │
│   │                                            │   │
│   │  Base: ▼ Select base branch                │   │
│   │    ● Default branch (main)                 │   │
│   │    ○ From selected: feature/auth           │   │
│   │    ○ From current (main repo): main        │   │
│   │                                            │   │
│   │  [ ] Open editor after creation            │   │
```

**表示内容**:
- `Default branch (main)` - デフォルトブランチ名を括弧内に表示
- `From selected: feature/auth` - 選択中のworktreeのブランチ名を表示
- `From current (main repo): main` - main repoの現在のブランチを表示

### 作成中の表示（Worktreeリスト内）

ダイアログを閉じた後、リスト内に作成中のworktreeを表示:

```
├────────────────────────────────────────────────────┤
│  ★ main           abc1234  ~/repo                  │
│  ○ feature/auth   def5678  ~/work/auth   #42      │
│  ⏳ feature/new-api         Creating...            │
│  ○ fix/bug        ghi9012  ~/work/bug    #43      │
├────────────────────────────────────────────────────┤
```

### 作成完了時

StatusBarに一時的なメッセージを表示（3秒後に消える）:

```
├────────────────────────────────────────────────────┤
│ ✓ Created worktree: feature/new-api                │
└────────────────────────────────────────────────────┘
```

エディタ自動起動オプションがONの場合:
```
├────────────────────────────────────────────────────┤
│ ✓ Created worktree: feature/new-api | Opening editor...│
└────────────────────────────────────────────────────┘
```

### エラー時

```
├────────────────────────────────────────────────────┤
│ ✗ Failed to create: Branch 'feature/auth' already exists│
└────────────────────────────────────────────────────┘
```

## キーバインド

### 通常状態

| キー | 動作 |
|-----|------|
| `n` | Worktree作成モードを開く |

### 作成モード

| キー | 動作 |
|-----|------|
| `Enter` | worktreeを作成（バックグラウンド）してダイアログを閉じる |
| `Esc` | キャンセルして閉じる |
| `Tab` | フィールド間を移動（Branch name → Base → Open editor） |
| `Space` | チェックボックスのトグル（Open editor オプション） |
| `↑` / `↓` | ベースブランチ選択時のオプション移動 |
| 文字入力 | アクティブなフィールドへの入力 |
| `Backspace` | 文字削除 |

## 技術仕様

### 型定義

```typescript
// ベースブランチの種類
type BaseBranchMode =
  | { type: 'default' }                      // デフォルトブランチから
  | { type: 'fromSelected'; ref: string }    // 選択中のworktreeのブランチから
  | { type: 'fromCurrent' };                 // main repoの現在のブランチから (--from-current)

// ダイアログの状態
type CreateWorktreeDialogState =
  | { mode: 'closed' }
  | {
      mode: 'input';
      branchName: string;
      baseBranch: BaseBranchMode;
      openEditor: boolean;
      activeField: 'branchName' | 'baseBranch' | 'openEditor';
      validationError?: string;
    };

// バックグラウンドで作成中のworktree
interface PendingWorktree {
  id: string;           // ユニークID
  branchName: string;
  baseBranch: BaseBranchMode;
  openEditor: boolean;
  status: 'creating' | 'success' | 'error';
  error?: string;
  path?: string;
  startedAt: number;
}

// App レベルの状態
interface CreateWorktreeState {
  dialog: CreateWorktreeDialogState;
  pending: PendingWorktree[];
}
```

### 状態管理

```typescript
// App.tsx または専用のhookで管理
const [createState, setCreateState] = useState<CreateWorktreeState>({
  dialog: { mode: 'closed' },
  pending: []
});
```

### gtr コマンドの構築

```typescript
function buildGtrCommand(
  branchName: string,
  baseBranch: BaseBranchMode
): string[] {
  const args = ['new'];

  switch (baseBranch.type) {
    case 'default':
      // gtr new <branch> --yes
      args.push(branchName, '--yes');
      break;

    case 'fromSelected':
      // gtr new <branch> --from <selected_worktree_branch> --yes
      args.push(branchName, '--from', baseBranch.ref, '--yes');
      break;

    case 'fromCurrent':
      // gtr new <branch> --from-current --yes
      args.push(branchName, '--from-current', '--yes');
      break;
  }

  return args;
}
```

### 新規コンポーネント

#### CreateWorktreeDialog.tsx

```typescript
import React from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
  state: CreateWorktreeDialogState;
  onBranchNameChange: (name: string) => void;
  onBaseBranchChange: (mode: BaseBranchMode) => void;
  onToggleOpenEditor: () => void;
  onChangeActiveField: (field: 'branchName' | 'baseBranch' | 'openEditor') => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CreateWorktreeDialog({
  state,
  onBranchNameChange,
  onBaseBranchChange,
  onToggleOpenEditor,
  onChangeActiveField,
  onSubmit,
  onCancel
}: Props) {
  if (state.mode === 'closed') return null;

  const { branchName, baseBranch, openEditor, activeField, validationError } = state;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="blue"
      paddingX={2}
      paddingY={1}
    >
      <Text bold>New Worktree</Text>

      {/* Branch name input */}
      <Box marginTop={1}>
        <Text color={activeField === 'branchName' ? 'blue' : undefined}>
          Branch name:{' '}
        </Text>
        {activeField === 'branchName' ? (
          <TextInput
            value={branchName}
            onChange={onBranchNameChange}
            onSubmit={onSubmit}
          />
        ) : (
          <Text>{branchName || '(empty)'}</Text>
        )}
      </Box>

      {/* Validation error */}
      {validationError && (
        <Box marginLeft={2}>
          <Text color="yellow">⚠ {validationError}</Text>
        </Box>
      )}

      {/* Base branch selector */}
      <Box marginTop={1} flexDirection="column">
        <Text color={activeField === 'baseBranch' ? 'blue' : undefined}>
          Base: {formatBaseBranch(baseBranch)}
        </Text>
        {activeField === 'baseBranch' && (
          <BaseBranchSelector
            value={baseBranch}
            onChange={onBaseBranchChange}
          />
        )}
      </Box>

      {/* Open editor checkbox */}
      <Box marginTop={1}>
        <Text color={activeField === 'openEditor' ? 'blue' : undefined}>
          [{openEditor ? 'x' : ' '}] Open editor after creation
        </Text>
      </Box>

      {/* Action hints */}
      <Box marginTop={1}>
        <Text dimColor>
          [Enter] Create   [Esc] Cancel
        </Text>
      </Box>
    </Box>
  );
}

function formatBaseBranch(mode: BaseBranchMode): string {
  switch (mode.type) {
    case 'default':
      return '(default branch)';
    case 'fromSelected':
      return `from ${mode.ref}`;
    case 'fromCurrent':
      return '(main repo current)';
  }
}
```

#### PendingWorktreeItem.tsx

作成中のworktreeをリスト内に表示:

```typescript
import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface Props {
  pending: PendingWorktree;
}

export function PendingWorktreeItem({ pending }: Props) {
  return (
    <Box>
      <Text>  </Text>
      <Text color="yellow">
        <Spinner type="dots" />
      </Text>
      <Text> {pending.branchName}</Text>
      <Box flexGrow={1} />
      <Text dimColor>Creating...</Text>
    </Box>
  );
}
```

### hooks/useCreateWorktree.ts

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import { createWorktreeBackground, validateBranchName, openEditor } from '../lib/gtr';

interface UseCreateWorktreeOptions {
  onSuccess: () => void;  // リストを更新
  onStatusMessage: (message: string, type: 'success' | 'error') => void;
}

export function useCreateWorktree({ onSuccess, onStatusMessage }: UseCreateWorktreeOptions) {
  const [state, setState] = useState<CreateWorktreeState>({
    dialog: { mode: 'closed' },
    pending: []
  });

  // ダイアログを開く
  const openDialog = useCallback(() => {
    setState(s => ({
      ...s,
      dialog: {
        mode: 'input',
        branchName: '',
        baseBranch: { type: 'default' },
        openEditor: false,
        activeField: 'branchName'
      }
    }));
  }, []);

  // ダイアログを閉じる
  const closeDialog = useCallback(() => {
    setState(s => ({
      ...s,
      dialog: { mode: 'closed' }
    }));
  }, []);

  // フィールド更新
  const setBranchName = useCallback((name: string) => {
    setState(s => {
      if (s.dialog.mode !== 'input') return s;
      const validation = validateBranchName(name);
      return {
        ...s,
        dialog: {
          ...s.dialog,
          branchName: name,
          validationError: validation.valid ? undefined : validation.error
        }
      };
    });
  }, []);

  const setBaseBranch = useCallback((mode: BaseBranchMode) => {
    setState(s => {
      if (s.dialog.mode !== 'input') return s;
      return { ...s, dialog: { ...s.dialog, baseBranch: mode } };
    });
  }, []);

  const toggleOpenEditor = useCallback(() => {
    setState(s => {
      if (s.dialog.mode !== 'input') return s;
      return { ...s, dialog: { ...s.dialog, openEditor: !s.dialog.openEditor } };
    });
  }, []);

  const setActiveField = useCallback((field: 'branchName' | 'baseBranch' | 'openEditor') => {
    setState(s => {
      if (s.dialog.mode !== 'input') return s;
      return { ...s, dialog: { ...s.dialog, activeField: field } };
    });
  }, []);

  // 作成を開始（バックグラウンド）
  const submit = useCallback(async () => {
    if (state.dialog.mode !== 'input') return;

    const { branchName, baseBranch, openEditor: shouldOpenEditor } = state.dialog;

    // バリデーション
    const validation = validateBranchName(branchName);
    if (!validation.valid) {
      setState(s => ({
        ...s,
        dialog: { ...s.dialog, validationError: validation.error }
      }));
      return;
    }

    // ペンディングリストに追加
    const pendingId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newPending: PendingWorktree = {
      id: pendingId,
      branchName,
      baseBranch,
      openEditor: shouldOpenEditor,
      status: 'creating',
      startedAt: Date.now()
    };

    // ダイアログを閉じて、ペンディングを追加
    setState(s => ({
      dialog: { mode: 'closed' },
      pending: [...s.pending, newPending]
    }));

    // バックグラウンドで作成
    try {
      const result = await createWorktreeBackground(branchName, baseBranch);

      if (result.success) {
        // 成功: ペンディングを削除、リスト更新、メッセージ表示
        setState(s => ({
          ...s,
          pending: s.pending.filter(p => p.id !== pendingId)
        }));
        onSuccess();
        onStatusMessage(`✓ Created worktree: ${branchName}`, 'success');

        // エディタを開く
        if (shouldOpenEditor && result.path) {
          await openEditor(result.path);
        }
      } else {
        // 失敗: ペンディングを削除、エラーメッセージ
        setState(s => ({
          ...s,
          pending: s.pending.filter(p => p.id !== pendingId)
        }));
        onStatusMessage(`✗ Failed to create: ${result.error}`, 'error');
      }
    } catch (error) {
      setState(s => ({
        ...s,
        pending: s.pending.filter(p => p.id !== pendingId)
      }));
      onStatusMessage(`✗ Failed to create: ${error}`, 'error');
    }
  }, [state.dialog, onSuccess, onStatusMessage]);

  return {
    state,
    openDialog,
    closeDialog,
    setBranchName,
    setBaseBranch,
    toggleOpenEditor,
    setActiveField,
    submit,
    hasPending: state.pending.length > 0
  };
}
```

### lib/gtr.ts への追加

```typescript
export interface CreateWorktreeResult {
  success: boolean;
  path?: string;
  error?: string;
}

export async function createWorktreeBackground(
  branchName: string,
  baseBranch: BaseBranchMode
): Promise<CreateWorktreeResult> {
  try {
    const args = buildGtrCommand(branchName, baseBranch);
    const result = await runCommand(args);

    if (result.exitCode !== 0) {
      return {
        success: false,
        error: result.stderr || 'Unknown error'
      };
    }

    // 出力からパスを抽出
    const pathMatch = result.stdout.match(/Created worktree at (.+)/);
    const path = pathMatch?.[1] || '';

    return {
      success: true,
      path
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function buildGtrCommand(branchName: string, baseBranch: BaseBranchMode): string[] {
  const args = ['new'];

  switch (baseBranch.type) {
    case 'default':
      args.push(branchName, '--yes');
      break;
    case 'fromSelected':
      args.push(branchName, '--from', baseBranch.ref, '--yes');
      break;
    case 'fromCurrent':
      args.push(branchName, '--from-current', '--yes');
      break;
  }

  return args;
}

// ブランチ名のバリデーション
export function validateBranchName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Branch name cannot be empty' };
  }

  // Gitのブランチ名規則に従う
  const invalidChars = /[\s~^:?*\[\\]/;
  if (invalidChars.test(name)) {
    return { valid: false, error: 'Branch name contains invalid characters' };
  }

  if (name.startsWith('-') || name.endsWith('.') || name.endsWith('/')) {
    return { valid: false, error: 'Invalid branch name format' };
  }

  return { valid: true };
}
```

### WorktreeList.tsx の更新

ペンディング中のworktreeを表示に含める:

```typescript
export function WorktreeList({
  worktrees,
  selectedIndex,
  pendingWorktrees,  // 追加
  // ...
}: Props) {
  // ペンディングをworktreeリストに挿入（最後に表示）
  const allItems = [
    ...worktrees.map(wt => ({ type: 'worktree' as const, data: wt })),
    ...pendingWorktrees.map(p => ({ type: 'pending' as const, data: p }))
  ];

  return (
    <Box flexDirection="column">
      {allItems.map((item, i) => (
        item.type === 'worktree' ? (
          <WorktreeItem
            key={item.data.path}
            worktree={item.data}
            isSelected={i === selectedIndex}
          />
        ) : (
          <PendingWorktreeItem
            key={item.data.id}
            pending={item.data}
          />
        )
      ))}
    </Box>
  );
}
```

## 入力バリデーション

### ブランチ名の検証

| チェック項目 | エラーメッセージ |
|------------|----------------|
| 空文字 | "Branch name cannot be empty" |
| 不正文字（スペース、~、^、:、?、*、[、\） | "Branch name contains invalid characters" |
| `-` で始まる | "Invalid branch name format" |
| `.` で終わる | "Invalid branch name format" |
| `/` で終わる | "Invalid branch name format" |
| 既存ブランチと重複 | gtr がエラーを返す（バックグラウンド実行後に検出） |

### リアルタイムバリデーション

入力中にバリデーションを行い、エラーがある場合は入力欄の下に表示:

```
│   │  Branch name: feature/my branch█           │   │
│   │  ⚠ Branch name contains invalid characters │   │
```

## エラーハンドリング

| エラー | 対応 |
|-------|------|
| ブランチ名が既に存在 | StatusBarにエラーメッセージを表示 |
| ベースブランチが存在しない | StatusBarにエラーメッセージを表示 |
| gtr コマンド失敗 | StatusBarにエラーメッセージを表示 |
| ディスク容量不足 | gtr のエラーメッセージをStatusBarに表示 |
| 権限エラー | gtr のエラーメッセージをStatusBarに表示 |

## StatusBarの更新

```typescript
// 通常時
"j/k:move e:editor a:ai c:copy d:delete n:new q:quit"

// 作成モード（ブランチ名入力中）
"Enter:create Tab:next-field Esc:cancel"

// 作成モード（ベースブランチ選択中）
"↑↓:select Enter:confirm Tab:next-field Esc:cancel"

// 作成中（ダイアログ閉じた後）
"Creating: feature/new-api..."  // 一時的に表示
```

## 実装優先度

1. **Phase 1**: 基本的なダイアログとブランチ名入力（デフォルトブランチからのみ）
2. **Phase 2**: バックグラウンド実行とリスト内表示
3. **Phase 3**: ベースブランチ選択機能
4. **Phase 4**: 「Open editor after creation」オプション
5. **Phase 5**: リアルタイムバリデーション表示

## テスト計画

### ユニットテスト

1. `validateBranchName` のテスト
2. `buildGtrCommand` のテスト
   - `default`: `gtr new <branch> --yes`
   - `fromSelected`: `gtr new <branch> --from <ref> --yes`
   - `fromCurrent`: `gtr new <branch> --from-current --yes`
3. `createWorktreeBackground` のモックテスト
4. 状態遷移のテスト

### 統合テスト

1. ダイアログの表示・非表示
2. 入力からworktree作成開始までの一連のフロー
3. ペンディング表示の正常動作
4. 成功/エラー時のStatusBar表示

## 依存関係

- `ink-text-input` パッケージ（既にインストール済み）
- `gtr new` コマンドが利用可能であること

## 将来的な拡張

1. **ブランチ名のオートコンプリート**: 既存ブランチ名やIssue番号からの補完
2. **テンプレート**: `feature/`、`fix/`、`chore/` などのプレフィックスを選択
3. **Issue連携**: GitHub Issue番号を入力して自動的にブランチ名を生成
4. **並列作成**: 複数のworktreeを同時に作成
5. **キャンセル機能**: 作成中のworktreeをキャンセル（難しいかも）
