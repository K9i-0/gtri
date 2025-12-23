---
allowed-tools: Bash(git:*), Bash(gh:*), Read, Edit, Grep, Glob
argument-hint: <version>
description: Release a new version (update CHANGELOG, package.json, tag, push)
---

## Context

- Current version in package.json: !`grep '"version"' package.json`
- Latest tag: !`git tag -l --sort=-v:refname | head -1`
- Recent commits since last tag: !`git log $(git tag -l --sort=-v:refname | head -1)..HEAD --oneline`
- Merged PRs: !`gh pr list --state merged --limit 10 --json number,title,mergedAt`

## Task

Release version $ARGUMENTS:

1. Read CHANGELOG.md and update with new version section
2. Update package.json version to $ARGUMENTS
3. Commit: `chore: release v$ARGUMENTS`
4. Create tag: `git tag v$ARGUMENTS`
5. Push: `git push && git push --tags`
