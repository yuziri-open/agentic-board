# AgenticBoard

AgenticBoard is a monorepo for running a local multi-agent operations board. The server API is already implemented in `packages/server`, and this repository now includes a React UI, a small CLI entrypoint, and CI type checking.

AgenticBoard はローカルで動かすマルチエージェント運用ボード用のモノレポです。`packages/server` の API 実装に加えて、React UI、CLI エントリーポイント、CI の型チェックを追加しています。

## Quick Start

### 日本語

1. Node.js 20 以上を用意します。
2. 依存をインストールします。

```bash
npm install
```

3. API サーバーを起動します。

```bash
npm run dev:server
```

4. 別ターミナルで UI を起動します。

```bash
npm run dev:ui
```

5. ブラウザで `http://localhost:5173` を開きます。UI は `/api` を Vite proxy 経由で `http://localhost:4000` に転送します。

CLI から既定ポートでサーバーを起動する場合:

```bash
npm start
```

CLI からポート指定する場合:

```bash
npm start -- --port 4100
```

### English

1. Use Node.js 20 or newer.
2. Install dependencies:

```bash
npm install
```

3. Start the API server:

```bash
npm run dev:server
```

4. In a second terminal, start the UI:

```bash
npm run dev:ui
```

5. Open `http://localhost:5173`. The UI forwards `/api` requests to `http://localhost:4000` through the Vite proxy.

Start the server through the CLI:

```bash
npm start
```

Start the server on a custom port:

```bash
npm start -- --port 4100
```

## Architecture

### 日本語

- `packages/server`: Hono + SQLite ベースの API サーバー。`/api` 以下の会社、エージェント、タスク、プロジェクト、アクティビティ API を提供します。
- `packages/shared`: サーバーと UI が共有する TypeScript 型定義です。
- `packages/ui`: Vite + React 19 + React Router 7 + React Query で構成したダークテーマ UI です。
- `bin/cli.ts`: `commander` ベースの CLI で、既定動作はサーバー起動です。
- `.github/workflows/ci.yml`: Node 20 で依存解決と `npm run typecheck` を実行します。

### English

- `packages/server`: Hono + SQLite API server exposing company, agent, task, project, dashboard, and activity endpoints under `/api`.
- `packages/shared`: shared TypeScript models consumed by both server and UI.
- `packages/ui`: dark-themed Vite + React 19 dashboard using React Router 7 and React Query.
- `bin/cli.ts`: `commander` CLI whose default behavior is to launch the server.
- `.github/workflows/ci.yml`: Node 20 workflow that installs dependencies and runs `npm run typecheck`.

## UI Overview

### 日本語

- ダークテーマベース、背景は `gray-950/900` 系、アクセントは `indigo-500` に揃えています。
- サイドバーに `Dashboard / Agents / Tasks / Projects / Activity` を配置しています。
- 最初の `company` を自動選択し、各ページがその会社 ID で `/api` を叩きます。
- `Tasks` ページは `backlog / todo / in_progress / in_review / done` の 5 列カンバンです。

### English

- The UI uses a dark theme with `gray-950/900` surfaces and `indigo-500` accents.
- The sidebar navigation includes `Dashboard / Agents / Tasks / Projects / Activity`.
- The first available company is selected automatically and every page scopes its API calls to that company.
- The `Tasks` page renders a five-column kanban board for `backlog / todo / in_progress / in_review / done`.

## API List

Base URL: `http://localhost:4000/api/`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/companies` | List companies / 会社一覧 |
| `GET` | `/companies/:id/agents` | List agents for a company / 会社配下のエージェント一覧 |
| `GET` | `/companies/:id/tasks` | List tasks for a company / 会社配下のタスク一覧 |
| `GET` | `/companies/:id/projects` | List projects for a company / 会社配下のプロジェクト一覧 |
| `GET` | `/companies/:id/dashboard` | Dashboard aggregate payload / ダッシュボード集計 |
| `GET` | `/companies/:id/activity` | Recent activity timeline / アクティビティ一覧 |
| `POST` | `/companies/:id/tasks` | Create task / タスク作成 |
| `PATCH` | `/tasks/:id` | Update task / タスク更新 |

## Scripts

```bash
npm run build
npm run typecheck
npm run dev:server
npm run dev:ui
npm start -- --port 4000
```

## Notes

- UI API access is implemented in `packages/ui/src/lib/api.ts` and always uses the `/api` prefix.
- The server can also serve the built UI from `packages/ui/dist` after `npm run build -w @agentic-board/ui`.
- CI currently focuses on type safety. Add test jobs later if runtime regression coverage is needed.
