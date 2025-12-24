---
allowed-tools: Bash(git:*), Bash(gh:*), Bash(./scripts/release.sh:*), Read, Edit, Grep, Glob
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
2. Run `./scripts/release.sh $ARGUMENTS` to:
   - Update package.json version
   - Update src/lib/update.ts CURRENT_VERSION
   - Commit, tag, and push
