# 🎯 KAISHA — AI Workforce Dashboard

> AIエージェントチームの管理・可視化・オーケストレーション
> **誰でも5分で使える、軽量OSSのAIワークフォース管理ツール**

---

## コンセプト

### ポジショニング
- **Paperclip**: 企業向け・重い・PostgreSQL必須・モノレポ
- **CrewAI/LangGraph**: フレームワーク（コード書かないと使えない）
- **KAISHA（これ）**: **Web UIファースト・SQLite・npx一発・誰でも使える**

### ターゲット
1. AI活用個人（伊織さんのような人）
2. 小規模チーム（2〜10人）
3. 開発者が自分のAIエージェントチームを管理したい人

### 差別化
| 項目 | Paperclip | KAISHA |
|------|-----------|-------------|
| セットアップ | pnpm + PostgreSQL | `npx kaisha` |
| DB | PostgreSQL (embedded) | **SQLite** (ゼロ設定) |
| 複雑さ | 企業向け・governance重い | シンプル・個人向け |
| アダプター | 独自プロトコル | **標準CLI呼び出し** |
| i18n | 英語のみ | **日英対応** |
| ライセンス | MIT | **MIT** |

---

## アーキテクチャ

```
┌──────────────────────────────────┐
│     React UI (Vite + Tailwind)   │
│     ダッシュボード・タスク管理      │
├──────────────────────────────────┤
│     Hono REST API (TypeScript)   │
│     軽量・高速・型安全             │
├──────────────────────────────────┤
│     SQLite (Drizzle ORM)         │
│     ゼロ設定・ファイル1つ          │
├──────────────────────────────────┤
│     Adapter Layer                │
│     Claude Code / Codex / Shell  │
└──────────────────────────────────┘
```

### 技術スタック
| レイヤー | 技術 | 理由 |
|---------|------|------|
| Frontend | React 19 + Vite + Tailwind CSS 4 + shadcn/ui | モダン・高速・美しい |
| Backend | **Hono** (Node.js) | Express.jsより軽量・型安全・Web Standards |
| Database | **SQLite** (better-sqlite3) + Drizzle ORM | ゼロ設定・1ファイル・高速 |
| Realtime | Server-Sent Events (SSE) | WebSocketより簡単 |
| CLI | commander.js | `npx kaisha` |
| Build | tsup (server) + Vite (UI) | 高速ビルド |

### ディレクトリ構成
```
agentic-board/
├── packages/
│   ├── server/           # Hono API + SQLite
│   │   ├── src/
│   │   │   ├── db/       # Drizzle schema + migrations
│   │   │   ├── routes/   # REST endpoints
│   │   │   ├── services/ # Business logic
│   │   │   ├── adapters/ # Agent adapters
│   │   │   └── index.ts  # Entry point
│   │   └── package.json
│   ├── ui/               # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── App.tsx
│   │   └── package.json
│   └── shared/           # Shared types
│       └── src/
│           └── types.ts
├── bin/
│   └── cli.ts            # npx entry point
├── package.json          # Root (npm workspace)
├── tsconfig.json
├── README.md             # 日英README
├── LICENSE               # MIT
└── .github/
    └── workflows/
        └── ci.yml
```

---

## データモデル

### Company（組織）
```sql
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### Agent（エージェント）
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker',  -- ceo, manager, worker
  title TEXT,
  capabilities TEXT,
  adapter_type TEXT NOT NULL,  -- claude_code, codex, shell, http
  adapter_config TEXT,  -- JSON
  reports_to TEXT REFERENCES agents(id),
  status TEXT DEFAULT 'idle',  -- idle, running, error, paused
  budget_monthly_cents INTEGER DEFAULT 0,
  spent_monthly_cents INTEGER DEFAULT 0,
  last_heartbeat_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### Task（タスク）
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  project_id TEXT REFERENCES projects(id),
  parent_id TEXT REFERENCES tasks(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'backlog',  -- backlog, todo, in_progress, in_review, done, cancelled
  priority TEXT DEFAULT 'medium',  -- critical, high, medium, low
  assignee_id TEXT REFERENCES agents(id),
  task_number INTEGER,
  identifier TEXT,  -- e.g. "SEO-42"
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### Project（プロジェクト）
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',  -- active, archived
  workspace_path TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### Run（実行履歴）
```sql
CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  task_id TEXT REFERENCES tasks(id),
  status TEXT DEFAULT 'running',  -- running, success, error, cancelled
  adapter_type TEXT NOT NULL,
  stdout TEXT,
  stderr TEXT,
  cost_cents INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  duration_ms INTEGER
);
```

### Activity（監査ログ）
```sql
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  agent_id TEXT,
  action TEXT NOT NULL,  -- task.created, task.status_changed, agent.heartbeat, etc.
  target_type TEXT,  -- task, agent, project
  target_id TEXT,
  details TEXT,  -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## API設計 (REST)

### Companies
```
GET    /api/companies
POST   /api/companies
GET    /api/companies/:id
PATCH  /api/companies/:id
DELETE /api/companies/:id
```

### Agents
```
GET    /api/companies/:companyId/agents
POST   /api/companies/:companyId/agents
GET    /api/agents/:id
PATCH  /api/agents/:id
DELETE /api/agents/:id
POST   /api/agents/:id/invoke          # Heartbeat手動実行
GET    /api/agents/:id/runs             # 実行履歴
```

### Tasks
```
GET    /api/companies/:companyId/tasks
POST   /api/companies/:companyId/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/checkout          # タスク取得（排他）
POST   /api/tasks/:id/release           # タスク解放
GET    /api/tasks/:id/children          # 子タスク一覧
```

### Projects
```
GET    /api/companies/:companyId/projects
POST   /api/companies/:companyId/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

### Runs
```
GET    /api/runs/:id
GET    /api/agents/:agentId/runs
```

### Activity Feed
```
GET    /api/companies/:companyId/activity
GET    /api/activity/stream              # SSE
```

### Dashboard
```
GET    /api/companies/:companyId/dashboard  # 集計データ
```

---

## Adapter System

### 共通インターフェース
```typescript
interface Adapter {
  type: string;
  label: string;
  
  // エージェント実行
  execute(context: ExecutionContext): Promise<ExecutionResult>;
  
  // 環境チェック（CLIインストール確認等）
  diagnose(): Promise<DiagnosisResult>;
}

interface ExecutionContext {
  agent: Agent;
  task?: Task;
  prompt: string;
  workingDir?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

interface ExecutionResult {
  status: 'success' | 'error';
  stdout: string;
  stderr: string;
  costCents?: number;
  tokensUsed?: number;
  durationMs: number;
}
```

### Claude Code Adapter
```typescript
// claude -p --output-format json "プロンプト"
{
  type: 'claude_code',
  label: 'Claude Code',
  config: {
    model: 'claude-sonnet-4-20250514',  // デフォルト
    permissionMode: 'bypassPermissions',
    dangerouslySkipPermissions: true,
  }
}
```

### Codex Adapter
```typescript
// codex exec "プロンプト" --cwd <path>
{
  type: 'codex',
  label: 'OpenAI Codex',
  config: {
    model: 'gpt-5.4-codex',
    approval: 'full-auto',
  }
}
```

### Shell Adapter
```typescript
// 任意のシェルコマンド実行
{
  type: 'shell',
  label: 'Shell Command',
  config: {
    command: 'python my_agent.py',
    shell: 'powershell',  // or bash
  }
}
```

### HTTP Adapter
```typescript
// Webhook呼び出し
{
  type: 'http',
  label: 'HTTP Webhook',
  config: {
    url: 'https://api.example.com/agent',
    method: 'POST',
    headers: {},
  }
}
```

---

## UI設計

### ページ構成
1. **Dashboard** (`/`) — 全体サマリー（タスク進捗、エージェント状態、コスト）
2. **Agents** (`/agents`) — エージェント一覧、組織図ビュー
3. **Tasks** (`/tasks`) — カンバンボード + リストビュー
4. **Projects** (`/projects`) — プロジェクト別タスク管理
5. **Activity** (`/activity`) — リアルタイム監査ログ
6. **Settings** (`/settings`) — 会社設定、アダプター設定

### Dashboard コンポーネント
```
┌─────────────────────────────────────────────────┐
│  📊 KAISHA — Iori.corp                          │
├──────────┬──────────┬──────────┬───────────────┤
│ Tasks    │ Agents   │ Cost     │ Today          │
│ 12 active│ 5 online │ $42.30   │ 3 completed    │
│ 3 review │ 1 idle   │ this mo  │ 2 in progress  │
├──────────┴──────────┴──────────┴───────────────┤
│                                                  │
│  [Kanban Board]                                  │
│  Backlog | Todo | In Progress | Review | Done    │
│  ┌────┐  ┌────┐  ┌─────────┐  ┌────┐  ┌────┐  │
│  │SEO │  │SEO │  │SEO-44   │  │SEO │  │SEO │  │
│  │-48 │  │-47 │  │記事執筆  │  │-45 │  │-42 │  │
│  └────┘  └────┘  │Pen 🟢   │  └────┘  └────┘  │
│                   └─────────┘                    │
│                                                  │
├──────────────────────────────────────────────────┤
│  📋 Recent Activity                              │
│  17:20 Pen completed SEO-44 "椿山荘 ランチ 記事"   │
│  17:15 Guard started review SEO-45               │
│  17:00 Jack assigned SEO-44 to Pen               │
└──────────────────────────────────────────────────┘
```

---

## CLI設計

### インストール & 起動
```bash
# ワンコマンドで起動
npx kaisha

# または
npm install -g kaisha
kaisha
```

### CLI コマンド
```bash
kaisha                    # サーバー起動 (default: localhost:4000)
kaisha --port 3100        # ポート指定
kaisha init               # 初期設定ウィザード
kaisha agents list        # エージェント一覧
kaisha tasks list         # タスク一覧
kaisha invoke <agentId>   # 手動Heartbeat
```

---

## 開発フェーズ

### Phase 1: MVP（今回実装）
- [x] プロジェクト構造
- [x] SQLite + Drizzle スキーマ
- [x] Hono REST API（全エンドポイント）
- [x] Claude Code adapter
- [x] Codex adapter
- [x] Shell adapter
- [x] React UI（Dashboard + Agents + Tasks）
- [x] CLI (`npx kaisha`)
- [x] README（日英）
- [x] GitHub Actions CI

### Phase 2: 拡張（後日）
- [ ] SSE リアルタイム更新
- [ ] 組織図ビジュアライゼーション
- [ ] HTTP adapter
- [ ] Budget enforcement
- [ ] i18n（完全日本語対応）
- [ ] Docker対応
- [ ] Plugin system

---

## 名前候補

| 名前 | 意味 | npm |
|------|------|-----|
| **kaisha** | 会社・AIで会社を動かす | ✅ 決定 |
| agentic-board | エージェント管理ボード | （旧名） |
| agentctl | kubectl風 | ❓ |
| ai-workforce | そのまま | ❓ |

→ **`kaisha`** で行きましょう。

---

## ライセンス
MIT License
