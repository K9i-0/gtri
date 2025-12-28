# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-12-28

### Added

- Delete UX improvements with spinner and local state update

### Fixed

- Handle bun compiled binary argv correctly
- Worktree deletion with force option and dirty warning
- Update permission denied with sudo fallback
- SSL certificate errors fallback to curl

## [1.3.0] - 2025-12-24

### Added

- Startup version check with update notification

### Changed

- Extract release process to shell script

## [1.2.0] - 2025-12-24

### Added

- PR information display in worktree tab (author, status, clickable links)
- Worktree environment setup with mise install support
- postCreate hook for automatic environment configuration

### Changed

- Remove Create tab feature
- Use main repo path instead of worktree path for AI tools

### Fixed

- Use upstream branch for PR lookup
- Handle noUncheckedIndexedAccess in getPRInfo
- Use correct [hooks] section format in gtrconfig

## [1.1.0] - 2025-12-20

### Added
- Self-update functionality (`gtri update`)
- Create tab for worktree creation from branches
- Testing infrastructure with `bun test`
- GitHub Actions for CI and releases
- Main repo branch display in header
- One-command installer script

### Changed
- Filter out main and detached worktrees from list

## [1.0.0] - 2025-12-20

### Added
- Initial release
- Interactive TUI for git-worktree-runner
- Worktree list with editor/AI launch
