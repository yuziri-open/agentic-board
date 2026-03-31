# リネームタスク: agentic-board → KAISHA

## 概要
ブランド名のみ変更。コード構造・ロジック・アーキテクチャは一切変えない。

## 変更対象

### 1. package.json（ルート + 全packages）
- `"name": "agentic-board"` → `"name": "kaisha"`
- `"@agentic-board/server"` → `"@kaisha/server"`
- `"@agentic-board/ui"` → `"@kaisha/ui"`
- `"@agentic-board/shared"` → `"@kaisha/shared"`
- workspacesのパスはそのまま
- `"bin"` のキーを `"kaisha"` に変更
- `"description"` を日本語に: `"KAISHA — AIエージェントで会社を動かすプラットフォーム"`

### 2. bin/cli.ts / bin/cli.js
- "AgenticBoard" → "KAISHA" （表示名のみ）
- コマンド名: `agentic-board` → `kaisha`

### 3. README.md
- タイトル: `# AgenticBoard` → `# KAISHA（会社）`
- `npx agentic-board` → `npx kaisha`
- 説明文を日本語メインに（英語はサブ）
- GitHubリンク: `yuziri-open/kaisha`

### 4. DESIGN.md
- ヘッダー: `AgenticBoard` → `KAISHA`
- CLI例の `agentic-board` → `kaisha`

### 5. UI内テキスト
- packages/ui/src/pages/ の各ページ: "AgenticBoard" → "KAISHA"
- packages/ui/index.html: `<title>` を "KAISHA" に
- Layout.tsx等にブランド名表示があれば変更

### 6. サーバー
- 起動ログ: "AgenticBoard" → "KAISHA"

### 7. LICENSE
- 追記不要（オリジナルコード）

### 8. .github/workflows/ci.yml
- ジョブ名にAgenticBoardがあれば変更

## 変更しないもの
- ディレクトリ構造
- API設計
- DBスキーマ
- アダプター実装
- UIコンポーネント構造
- ルーティング
- ビルド設定（パス以外）

## 確認項目
- `npm install` が通ること
- `npm run typecheck` が通ること（可能なら）
- grep で "agentic-board" / "AgenticBoard" が残っていないこと
