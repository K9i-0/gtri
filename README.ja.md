# gtri

[English](README.md)

> [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) のインタラクティブTUI

![gtri demo](demo.gif)

## 機能

- Vim/Emacs風キーバインド (j/k, Ctrl+N/P)
- worktreeの素早いナビゲーションと管理
- ブランチからworktreeを作成（Createタブ）
- エディタ・AIツール連携
- セルフアップデート機能

## インストール

### ワンコマンドインストール

```bash
curl -fsSL https://raw.githubusercontent.com/K9i-0/gtri/main/install.sh | bash
```

### バイナリダウンロード

[GitHub Releases](https://github.com/K9i-0/gtri/releases) から最新バイナリをダウンロード

### ソースから

```bash
git clone https://github.com/K9i-0/gtri.git
cd gtri
bun install
bun run build
```

## 使い方

```bash
cd your-git-repo
gtri              # インタラクティブTUIを起動
gtri update       # 最新版にアップデート
gtri version      # バージョン表示
gtri help         # ヘルプ表示
```

## キーバインド

### Worktreesタブ

| キー | 動作 |
|------|------|
| `Tab` | Createタブに切り替え |
| `j` / `↓` / `Ctrl+N` | 下に移動 |
| `k` / `↑` / `Ctrl+P` | 上に移動 |
| `g` / `Ctrl+A` | 先頭に移動 |
| `G` / `Ctrl+E` | 末尾に移動 |
| `1-9` | 番号で選択 |
| `e` | エディタで開く |
| `a` | AIコマンドをクリップボードにコピー |
| `c` | worktreeパスをコピー |
| `d` | worktreeを削除 |
| `r` | リストを更新 |
| `q` / `Esc` | 終了 |

### Createタブ

| キー | 動作 |
|------|------|
| `Tab` | Worktreesタブに切り替え |
| `j` / `↓` / `Ctrl+N` | 下に移動 |
| `k` / `↑` / `Ctrl+P` | 上に移動 |
| `Enter` | 選択したブランチからworktreeを作成 |
| `n` | 新規ブランチ + worktreeを作成 |
| `r` | リストを更新 |
| `q` / `Esc` | 終了 |

## 必要条件

- [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) がインストールされていること

## ライセンス

MIT
