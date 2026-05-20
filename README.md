# 概要

個人用タスクツール taskell(仮)
※たまたまHaskellを触りはじめたことから命名

学習用も兼ねている．

# コンセプト

「行動に移れること」

# 構想

ヘッドレスのタスク管理ロジックを元に，CLI，Web，MCP Server，Botなどの各種インターフェースからタスクを操作可能にする．
基本はCLIがメインとなる．

# 現在の構成

- `packages/core`: タスク概念と操作のヘッドレス core
- `apps/cli`: core を操作する CLI
- `docs/adr`: 設計判断の記録

# セットアップ

このプロジェクトは Vite+ と pnpm workspace を使う．

Node.js は `mise.toml` で固定している．

```sh
mise trust
mise install
```

依存関係を更新する場合:

```sh
vp install
```

# 開発時の確認

```sh
pnpm ready
```

`ready` は format，lint，test，build を実行する．

pnpm の shim 側で Node.js の engine warning が出ることがあるが，Vite+ / mise 側で Node 25.9 が使えていればビルド自体は通る．

# CLI

通常の JS CLI をビルドする:

```sh
vp run @taskell/cli#build
```

実行例:

```sh
apps/cli/dist/js/index.mjs help
apps/cli/dist/js/index.mjs add "READMEを更新する"
apps/cli/dist/js/index.mjs list
apps/cli/dist/js/index.mjs start 1
apps/cli/dist/js/index.mjs schedule '#1' 2026-05-20
apps/cli/dist/js/index.mjs plan-runner 1 --effect externalSideEffect
apps/cli/dist/js/index.mjs done 1
```

データ保存先を分ける場合は `--base-path` を使う:

```sh
apps/cli/dist/js/index.mjs add "試す" --base-path /tmp/taskell-data
apps/cli/dist/js/index.mjs list --base-path /tmp/taskell-data
```

# 単一バイナリ

Node.js の Single Executable Applications (SEA) で CLI を単一バイナリ化する．

前提:

- Node.js 25.9.0
- `node --build-sea` が使えること

ビルド:

```sh
mise exec node@25.9 -- vp run @taskell/cli#build:sea
```

生成物:

```sh
apps/cli/dist/taskell
```

実行:

```sh
apps/cli/dist/taskell help
apps/cli/dist/taskell add "SEAで動かす"
apps/cli/dist/taskell list
```

CLI では内部 ID ではなく issue 番号のような task number を使う．

```sh
taskell add "READMEを更新する"
# added #1 [inbox] READMEを更新する

taskell start 1
taskell done '#1'
```

完了済みタスクは番号参照と採番の対象外になるため，番号は後で再利用される．

SEA ビルドは内部で以下を行う．

1. CLI と core 依存を `apps/cli/dist/sea/index.cjs` に bundle する
2. `apps/cli/sea-config.json` を使って `node --build-sea` を実行する
3. `apps/cli/dist/taskell` を生成する

# メモ

ツールのコア機能が考えつかない
一旦標準機能だけで考えるか？
