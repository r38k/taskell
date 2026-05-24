# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Taskellは個人用タスク管理ツール。ヘッドレスなタスク管理コアを中核に、CLI・MCP Server・Web・Bot など複数インターフェースから操作可能にすることを目指す。

## リポジトリ構成

pnpm workspace による monorepo。

- `packages/core/` — ヘッドレスなタスク管理コア（ドメイン層）
  - `src/core/` — 集約・値オブジェクト・ワークフロー・リポジトリポート
  - `src/util/` — ドメイン外のユーティリティ（Temporal ラッパ等）
- `apps/` — 将来の UI 層（CLI、Web など）を配置予定
- `docs/` — ユビキタス言語、設計ドキュメント、外部リサーチ

## アーキテクチャ方針

- ヘッドレスなコア + 複数インターフェースの構成
- コアは関数型 DDD：純粋関数・値オブジェクト・`neverthrow` の `Result` 型でドメインエラーを表現
- IO/ログ/Temporal 変換はドメイン外に追い出す
- リポジトリはポートとして抽象化し、実装（JSONL 等）は差し替え可能に

## 実装順序

1. `packages/core` のヘッドレスロジック
2. CLI（`apps/cli` 予定）
3. MCP Server
4. Web（Next.js）
5. Slack Bot（未定）

## コアコンセプト

- 「行動に移れること」の実現
- AIファーストではなく AIトグル可能
- 人的操作の最小化
- プロジェクト単位のタスク管理（サブタスク含む）

## 主要ドキュメント

- `README.md` — プロジェクト概要
- `docs/objective.md` — 開発目的、要件、スケジュール
- `docs/design.md` — ドメイン設計
- `docs/task.md` — タスクに関する概念
- `docs/reference.md` — 外部参考資料

## 開発コマンド

- 依存更新: `pnpm install`
- 検証: `pnpm verify`
- format: `pnpm format`
- lint: `pnpm lint`
- typecheck: `pnpm typecheck`
- test: `pnpm test`
- build: `pnpm build`
- 単一バイナリ生成: `pnpm cli:sea`
- ローカル `taskell` symlink 作成: `pnpm cli:install-local`

## ツール方針

- `vp` / Vite+ には依存しない。
- package build は `tsdown` を使う。
- test は `vitest` を直接使う。
- format / lint は `oxfmt` / `oxlint` を直接使う。
