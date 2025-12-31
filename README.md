# gtri

[日本語](README.ja.md)

> Interactive TUI for [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) - Making worktree management practical for AI-driven development

![gtri demo](demo.gif)

## Why gtri?

[git-worktree-runner (gtr)](https://github.com/coderabbitai/git-worktree-runner) is a powerful tool for managing git worktrees, especially useful for AI-driven development workflows. However, daily worktree operations can be cumbersome:

- **gtr list** shows worktrees, but deleting, checking PR status, or launching AI tools requires additional commands
- Reviewing teammates' PRs means manually looking up branch names and creating worktrees

**gtri** wraps gtr with an interactive TUI, making these workflows seamless:

| Worktrees Tab | Open PRs Tab |
|---------------|--------------|
| Manage existing worktrees | Review teammates' PRs |
| One key to launch editor/AI | One key to create worktree |
| See PR status at a glance | See all open PRs without worktrees |

## When to use gtr vs gtri

| Task | Tool | Why |
|------|------|-----|
| Create worktree for your task | `gtr new` | Specify base branch explicitly |
| Configure hooks, settings | `.gtrconfig` | Team-shared configuration |
| Manage existing worktrees | `gtri` | Visual navigation, quick actions |
| Review teammates' PRs | `gtri` | See PRs, create worktree instantly |

**gtri is ideal for mid-to-large team projects** where you frequently switch between your own work and reviewing others' PRs.

### Setting up .gtrconfig

gtr supports a [`.gtrconfig`](https://github.com/coderabbitai/git-worktree-runner?tab=readme-ov-file#configuration) file for team-shared settings. Commit it to your repo:

```ini
[files]
include = .env.local, .env.development

[hooks]
postCreate = mise install, bun install

[defaults]
editor = cursor
ai = claude
```

gtri automatically uses these settings when launching editor/AI or creating worktrees.

## Features

- **Two-tab interface**: Worktrees tab + Open PRs tab
- **Worktrees tab**: View all worktrees with PR status (including Draft indicator)
- **Open PRs tab**: See PRs without worktrees, create worktree with `w` key
- **Quick actions**: Launch editor (`e`), copy AI command (`a`), delete (`d`)
- **Vim/Emacs keybindings**: Navigate with j/k, Ctrl+N/P

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

### Common

| Key | Action |
|-----|--------|
| `Tab` | Switch between Worktrees/Open PRs tabs |
| `j` / `↓` / `Ctrl+N` | Move down |
| `k` / `↑` / `Ctrl+P` | Move up |
| `g` / `Ctrl+A` | Go to top |
| `G` / `Ctrl+E` | Go to bottom |
| `1-9` | Select by number |
| `r` | Refresh list |
| `q` / `Esc` | Quit |

### Worktrees Tab

| Key | Action |
|-----|--------|
| `e` | Open in editor |
| `a` | Copy AI command to clipboard |
| `c` | Copy worktree path |
| `d` | Delete worktree |
| `p` | Open PR in browser |

### Open PRs Tab

| Key | Action |
|-----|--------|
| `w` | Create worktree for selected PR |
| `p` | Open PR in browser |

## Requirements

- [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) must be installed
- [GitHub CLI (gh)](https://cli.github.com/) for PR features

## Tech Stack

| Technology | Usage |
|------------|-------|
| [Bun](https://bun.sh/) | Runtime, bundler, test runner, single-binary compiler |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [React](https://react.dev/) + [Ink](https://github.com/vadimdemedes/ink) | Terminal UI with React components |

### Highlights

- **Thin wrapper**: Core functionality relies on battle-tested tools ([gtr](https://github.com/coderabbitai/git-worktree-runner), [gh](https://cli.github.com/), git) - gtri just provides a friendly UI
- **Single binary distribution**: `bun build --compile` creates a standalone executable with no runtime dependencies
- **Cross-platform**: Builds for darwin-arm64, darwin-x64, linux-x64
- **React for CLI**: Declarative terminal UI using familiar React patterns

## License

MIT
