---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## Development Workflow

1. ブランチを切ってから作業を始める
2. testや型チェックを行う (`bun run typecheck && bun test`)
3. ビルドしたうえで動作確認を依頼 (`bun run build`)
4. PRの作成まで行う

## Screenshots Update

READMEのスクリーンショットを更新する手順。[freeze](https://github.com/charmbracelet/freeze)を使用。

### 必要なツール

```bash
brew install charmbracelet/tap/freeze
```

### 撮影手順

```bash
# 1. PRステータス表示用のworktreeを作成（必要に応じて）
git gtr new feature/notifications --yes
git gtr new feature/api-v2 --yes

# 2. tmuxでgtriを起動（高さ32が適切）
tmux new-session -d -s gtri-screenshot -x 90 -y 32 './gtri'

# 3. Worktreesタブをキャプチャ（-e でANSI色を保持）
sleep 3 && tmux capture-pane -t gtri-screenshot -e -p | freeze -l ansi -o screenshots/worktrees.png --window --shadow.blur 20 --padding 20

# 4. Open PRsタブに切り替えてキャプチャ
tmux send-keys -t gtri-screenshot Tab && sleep 1 && tmux capture-pane -t gtri-screenshot -e -p | freeze -l ansi -o screenshots/open-prs.png --window --shadow.blur 20 --padding 20

# 5. クリーンアップ
tmux kill-session -t gtri-screenshot
git gtr rm feature/notifications --yes
git gtr rm feature/api-v2 --yes
```

### freezeオプション

- `-l ansi`: ANSI出力として解釈
- `--window`: macOS風ウィンドウ枠
- `--shadow.blur 20`: シャドウ
- `--padding 20`: 内側余白
- `-e` (tmux): ANSI色を保持
