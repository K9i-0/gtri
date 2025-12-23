#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 1.3.0"
  exit 1
fi

echo "Releasing v${VERSION}..."

# Update package.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" package.json
echo "✓ Updated package.json"

# Update src/lib/update.ts CURRENT_VERSION
sed -i '' "s/const CURRENT_VERSION = \".*\"/const CURRENT_VERSION = \"${VERSION}\"/" src/lib/update.ts
echo "✓ Updated src/lib/update.ts"

# Commit
git add package.json src/lib/update.ts CHANGELOG.md
git commit -m "chore: release v${VERSION}"
echo "✓ Committed"

# Create tag
git tag "v${VERSION}"
echo "✓ Created tag v${VERSION}"

# Push
git push && git push --tags
echo "✓ Pushed to remote"

echo ""
echo "🎉 Released v${VERSION} successfully!"
