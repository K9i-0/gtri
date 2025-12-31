# README 最新化計画

## 現状分析

### 現行READMEの課題
- v1.4.0の最新機能が反映されていない
- gtrとの役割分担が不明確
- 中規模以上プロジェクトでの活用シーンが伝わらない
- demo.gifがCreateタブを含む古い内容（Createタブは1.2.0で削除済み）

### CHANGELOGから把握した最新機能（未反映）
| バージョン | 機能 | READMEへの反映 |
|-----------|------|---------------|
| v1.5.0 | **PRタブ追加**（PR #9） - Open PR一覧表示、`w`キーでworktree作成 | ❌ |
| v1.4.0 | 削除UX改善（スピナー、即時反映） | ❌ |
| v1.3.0 | 起動時バージョンチェック・更新通知 | ❌ |
| v1.2.0 | PR情報表示（author, status, クリック可能リンク） | ❌ |
| v1.2.0 | postCreateフックによる自動環境構築（mise対応） | ❌ |
| v1.2.0 | Createタブ削除 | ⚠️ demo.gifに残っている |

---

## 更新計画

### 1. 構成の見直し

```markdown
# gtri

> git-worktree-runnerのインタラクティブTUI

## なぜgtri？（NEW）
- 中規模以上のプロジェクトでのworktree管理
- PRレビュー時のworktree切り替え効率化
- チーム開発でのAIツール活用

## gtrとgtriの役割分担（NEW）
- gtr: worktree作成、設定ファイル（.gtrconfig）
- gtri: worktree一覧・管理・操作のインタラクティブUI

## Features
（既存 + 新機能追加）

## Installation

## Usage

## Keybindings

## 推奨ワークフロー（NEW）
- PRレビュー時の使い方
- チーム開発での活用例

## Requirements
```

### 2. 追加すべき新セクション

#### 2.1 「なぜgtri？」セクション
```markdown
## Why gtri?

gtri is designed for **team development on medium to large projects**:

- **Fast PR Review**: Instantly switch between worktrees to review PRs
- **AI-Assisted Development**: One-key AI tool integration (Claude Code, etc.)
- **Team Workflow**: See PR status, author, and links at a glance
- **Zero Context Switching**: No need to stash or commit WIP changes
```

#### 2.2 「gtrとgtriの使い分け」セクション（重要）

##### Worktree作成の使い分け

```markdown
## Creating Worktrees: gtr vs gtri

| Scenario | Tool | Command |
|----------|------|---------|
| **Your own task** | gtr | `gtr new feature/my-task` |
| **Reviewing others' PRs** | gtri | PRs tab → `w` key |

### Why This Makes Sense

**For your own tasks → `gtr new`**
- You need to **name the branch** yourself
- You may want to configure hooks in `.gtrconfig`
- Long-lived worktree (until feature complete)

**For PR reviews → gtri PRs tab**
- Branch name **already exists** (created by PR author)
- Just need to check out and review
- Short-lived worktree (until review complete)
- See PR metadata (author, draft status) before creating
```

##### 情報フローの違い

```
自分のタスク:
  Issue/要件 → ブランチ名を考える → gtr new feature/xxx
               ~~~~~~~~~~~~~~~~~~~~
               命名の意思決定が必要

他人のPRレビュー:
  gtri PRタブ → PR選択 → w キー → worktree作成
                ~~~~~~~~
                選ぶだけ（命名不要）
```

##### 内部的には同じ（gtr new）

> **Note**: gtriのPRタブ `w` キーも内部的には `gtr new` を呼び出している。
> `.gtrconfig` の設定（postCreateフック等）は**どちらでも同様に適用される**。
> 差があるのは「UIとワークフロー」であって「機能」ではない。

##### なぜこの使い分けが合理的か

| 観点 | 自分のタスク (gtr) | PRレビュー (gtri) |
|------|-------------------|------------------|
| ブランチ名 | 自分で命名 | 既に存在 |
| ベースブランチ | 選択が必要（main? develop?） | 考える必要なし（PRのheadをそのまま） |
| 必要な情報 | Issue/要件 | PR一覧・author・status |
| 寿命 | 長期（開発完了まで） | 短期（レビュー完了まで） |
| 頻度 | 低（1タスク1回） | 高（複数PR並行レビュー） |
| 最適UI | CLI（タイプが必要） | TUI（選択するだけ） |

※ 設定（`.gtrconfig`）は両方で共通。postCreateフック等はどちらで作成しても実行される。

##### README記載案

```markdown
## gtr + gtri Workflow

### Initial Setup (once)

Configure gtr with your preferred tools:

\`\`\`bash
gtr config set gtr.editor.default cursor
gtr config set gtr.ai.default claude
\`\`\`

### Daily Workflow

| Task | Tool | How |
|------|------|-----|
| Start your own feature | `gtr new feature/xxx` | Name your branch |
| Review teammate's PR | `gtri` → PRs tab → `w` | Select from list |
| Switch between worktrees | `gtri` → Worktrees tab | Navigate with j/k |
| Open in editor/AI | `gtri` → `e` or `a` | One keypress |
| Clean up after merge | `gtri` → `d` | Delete worktree |
```

#### 2.3 「PRレビューワークフロー」セクション
```markdown
## PR Review Workflow

1. Launch `gtri` to see all active worktrees with PR info
2. Press `p` to open PR in browser
3. Press `e` to open in editor for review
4. Press `a` to launch AI tool for analysis
5. Press `d` to clean up after merge
```

### 3. 画像・スクリーンショットの刷新

#### 3.1 demo.gif 更新
- **必須**: Createタブのシーンを削除（v1.2.0で機能削除済み）
- **追加**: PR情報表示のシーン
- **追加**: 削除時のスピナー表示

#### 3.2 スクリーンショット追加案
| 用途 | 内容 | 形式 |
|------|------|------|
| ヒーローイメージ | PR情報付きworktree一覧 | screenshot.png |
| 機能紹介 | 削除確認ダイアログ | inline |
| ワークフロー | gtr + gtri の連携図 | diagram (mermaid?) |

#### 3.3 demo.tape 更新内容
```tape
# 削除する部分
- Tab（Createタブへの切り替え）
- Createタブでのナビゲーション

# 追加する部分（v1.5.0 PRタブ対応）
+ Worktreesタブでの操作
  + PR情報が表示されている状態
  + `p`キーでPRを開く
  + `d`キーでworktree削除（スピナー表示）
+ PRsタブでの操作（NEW - PR #9）
  + Tab キーでPRsタブに切り替え
  + Open PR一覧の表示
  + `w`キーでworktree作成（スピナー表示）
  + 作成後Worktreesタブに自動切り替わる様子
```

### 4. 中規模以上プロジェクト向けアピール

#### 強調ポイント
1. **並行作業**: 複数PRを同時レビュー可能
2. **状態保持**: 各worktreeの変更が干渉しない
3. **可視性**: PR状態・author一覧表示
4. **自動化**: postCreateフックで環境自動構築

#### 追加する文言例
```markdown
### For Teams

gtri shines in team environments:

- **Multiple reviewers**: Each reviewer works in isolated worktrees
- **Context preservation**: Switch between tasks without stashing
- **PR visibility**: See who's working on what at a glance
- **Automated setup**: `postCreate` hook runs `mise install`, `npm install`, etc.
```

---

## 実装タスク

### Phase 1: コンテンツ更新
- [ ] README.md に新セクション追加
- [ ] README.ja.md に日本語版追加
- [ ] 最新機能（v1.2.0〜v1.4.0）をFeatures反映

### Phase 2: ビジュアル更新
- [ ] demo.tape更新（Createタブ削除、PR表示追加）
- [ ] 新しいdemo.gif生成（`vhs demo.tape`）
- [ ] （オプション）静的スクリーンショット追加

### Phase 3: レビュー
- [ ] 動作確認
- [ ] 英語・日本語の整合性チェック

---

## 参考: 現行demo.tapeの問題点

```tape
# === Create Tab ===     ← 削除された機能
Tab
Sleep 1.5s
Type "j"
...
```

v1.2.0でCreateタブは削除されているため、この部分をdemo.tapeから削除し、
代わりにPR情報表示や削除UXのデモを追加する必要がある。
