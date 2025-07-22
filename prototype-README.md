# Taskell - Simple Task Management Prototype

シンプルなタスク管理ツールのプロトタイプです。「done/not done」の状態と、完了時のオプショナルな状態記述をサポートします。

## インストール・セットアップ

Denoが必要です: https://deno.land/

```bash
# リポジトリをクローン
git clone https://github.com/r38k/taskell.git
cd taskell

# 実行権限を付与（Unix系OS）
chmod +x taskell
```

## 基本的な使い方

### タスクの追加
```bash
./taskell add "Fix API authentication bug"
./taskell add "Write documentation"
```

### タスクの完了（オプショナルな状態記述付き）
```bash
# 状態記述なし
./taskell done 1

# 状態記述あり
./taskell done 2 "Documentation completed with examples"
```

### タスクの表示
```bash
# 全タスク表示
./taskell list

# 未完了タスクのみ
./taskell pending

# 完了済みタスクのみ
./taskell completed

# 特定タスクの詳細
./taskell show 1
```

### その他の操作
```bash
# タスクを未完了に戻す
./taskell undone 1

# タスクの削除
./taskell delete 1
```

## 使用例

```bash
# 新しいタスクを追加
$ ./taskell add "Fix API authentication bug"
Added task [1]: Fix API authentication bug

# タスクリストを表示
$ ./taskell list
All tasks:
[1] ○ Fix API authentication bug (created 2025/07/22)

# タスクを完了（状態記述付き）
$ ./taskell done 1 "Fixed token validation logic in middleware"
Marked task [1] as done: Fix API authentication bug
State: Fixed token validation logic in middleware

# 完了済みタスクを確認
$ ./taskell completed
Completed tasks:
[1] ✓ Fix API authentication bug (completed 2025/07/22)
    → Fixed token validation logic in middleware
```

## 特徴

- **シンプル**: done/not done の2状態のみ
- **状態記述**: タスク完了時にオプションで状態を記述可能
- **ファイルベース**: `taskell.json` ファイルにデータを保存
- **軽量**: 外部依存なし、Denoのみで動作

## データ保存

タスクデータは実行ディレクトリの `taskell.json` ファイルに保存されます。

## テスト実行

```bash
deno test test/task-manager.test.ts
```