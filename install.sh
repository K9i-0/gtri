#!/bin/bash
set -e

echo "Installing gtri..."

# OS/Arch検出
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# バイナリ名決定
case "$OS-$ARCH" in
  darwin-arm64) BINARY="gtri-darwin-arm64" ;;
  darwin-x86_64) BINARY="gtri-darwin-x64" ;;
  linux-x86_64) BINARY="gtri-linux-x64" ;;
  *)
    echo "Error: Unsupported platform: $OS-$ARCH"
    echo "Supported: macOS (arm64, x64), Linux (x64)"
    exit 1
    ;;
esac

# 最新リリースのバージョン取得
VERSION=$(curl -s https://api.github.com/repos/K9i-0/gtri/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
if [ -z "$VERSION" ]; then
  echo "Error: Failed to get latest version"
  exit 1
fi

URL="https://github.com/K9i-0/gtri/releases/download/$VERSION/$BINARY"

# インストール先
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

echo "Downloading gtri $VERSION for $OS-$ARCH..."
curl -fsSL "$URL" -o /tmp/gtri
chmod +x /tmp/gtri

echo "Installing to $INSTALL_DIR (may require sudo)..."
if [ -w "$INSTALL_DIR" ]; then
  mv /tmp/gtri "$INSTALL_DIR/gtri"
else
  sudo mv /tmp/gtri "$INSTALL_DIR/gtri"
fi

echo ""
echo "gtri $VERSION installed successfully!"
echo "Run 'gtri' in a git repository to get started."
