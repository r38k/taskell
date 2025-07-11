以下のように要点を整理・構造化しておくと、開発・記録・共有の観点でも扱いやすくなります。

---

### 開発目的

* **課題意識**: VSCode + Markdown、Notionではタスクが増えると管理が煩雑になる
* **目的**: 自分にとって使いやすく、かつ設計・技術の理解を深められるタスク管理ツールの構築

---

### 機能要件（MVP）

* タスクの追加・削除・一覧
* プロジェクト単位でのタスク管理（サブタスク含む）
* 人的操作を最小限に（AIファーストではなくトグル可能）

---

### アーキテクチャ設計

* **コア**: ヘッドレスなタスク管理ロジック
* **UI層**（順に実装）:

  1. CLI
  2. MCP Server
  3. Web（Next.js）
  4. Slack Bot（未定）

---

### 技術スタック（暫定）

| 層          | 使用技術                |
| ---------- | ------------------- |
| CLI        | Deno, TypeScript(React inkも気になる) |
| MCP Server | Deno or Node.js, TS |
| Web        | Next.js, TypeScript |
| テスト        | Vitest              |

---

### スケジュール（2025年）

| 月    | 内容                       |
| ---- | ------------------------ |
| 5月   | データ構造設計・文書化、データフロー設計・文書化 |
| 6月   | CLI デモ作成                 |
| 7月   | UI接続抽象設計、データストア選定        |
| 8月   | ヘッドレスロジック実装              |
| 9月   | CLI Tool 実装              |
| 10月  | MCP Server 実装            |
| 11月～ | Web 実装（Next.js）          |
| 1月～  | 改善・拡張（Slack Bot等は余力次第）   |

---

### 開発ポリシー

* タスク管理はAIファースト「ではない」
* UIは後付け可能なヘッドレス構造を採用
* 状況共有はGitHub Public Repository + READMEでの進捗記載

---

必要であれば、次は「データ構造」と「データフロー」について具体的な検討に入れます。どこから詰めたいか指示してください。
