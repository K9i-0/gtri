# gtri

[日本語](README.ja.md)

> Interactive TUI for [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner)

![gtri demo](demo.gif)

## Features

- Vim/Emacs-style keybindings (j/k, Ctrl+N/P)
- Quick worktree navigation and management
- Create worktrees from branches (Create tab)
- Editor and AI tool integration
- Self-update functionality

## Installation

### Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/K9i-0/gtri/main/install.sh | bash
```

### Download Binary

Download the latest binary from [GitHub Releases](https://github.com/K9i-0/gtri/releases).

### From Source

```bash
git clone https://github.com/K9i-0/gtri.git
cd gtri
bun install
bun run build
```

## Usage

```bash
cd your-git-repo
gtri              # Launch interactive TUI
gtri update       # Update to the latest version
gtri version      # Show version
gtri help         # Show help
```

## Keybindings

### Worktrees Tab

| Key | Action |
|-----|--------|
| `Tab` | Switch to Create tab |
| `j` / `↓` / `Ctrl+N` | Move down |
| `k` / `↑` / `Ctrl+P` | Move up |
| `g` / `Ctrl+A` | Go to top |
| `G` / `Ctrl+E` | Go to bottom |
| `1-9` | Select by number |
| `e` | Open in editor |
| `a` | Copy AI command to clipboard |
| `c` | Copy worktree path |
| `d` | Delete worktree |
| `r` | Refresh list |
| `q` / `Esc` | Quit |

### Create Tab

| Key | Action |
|-----|--------|
| `Tab` | Switch to Worktrees tab |
| `j` / `↓` / `Ctrl+N` | Move down |
| `k` / `↑` / `Ctrl+P` | Move up |
| `Enter` | Create worktree from selected branch |
| `n` | Create new branch + worktree |
| `r` | Refresh list |
| `q` / `Esc` | Quit |

## Requirements

- [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) must be installed

## License

MIT
