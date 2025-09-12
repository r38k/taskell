## 仮設計2

[コアコンセプト]
タスクは状態変化であり，関数である．
タスクの実施に対する状態の変化を記述できないものはタスクではない．

## データモデル

表現したいデータ
- 生のタスク(雑タスク)
- スケジュール月タスク
- タスクセット

```ts
type Task = {
    id: string;
    name: string;
    delta?: string;
}

type ScheduledTask = Task & {
    dueDate: Date;
}

type TaskSet = {
  id: string;
  name: string;
  tasks: ReadonlyArray<Task>;
}
```

とりあえず最小限で進める

## データフロー

必要な操作
- タスクの追加
- スケジュールの追加
- タスクセットの追加
- タスク開始
- タスク完了

```ts
function addTask(name: string, delta?: string): Task;
function addScheduledTask(name: string, dueDate: Date, delta?: string): ScheduledTask;
function addTaskSet(tasks: ReadonlyArray<Task>): TaskSet;

function setSchedule(task: Task, dueDate: Date): ScheduledTask;
function groupTask(name: string, tasks: ReadonlyArray<Task>): TaskSet;

// task/scheduled/tasksetでそれぞれ必要？
function startTask(task: Task): Task;
function doneTask(task: Task): Task;
```

## データストア

とりあえず，ローカルにjsonlファイルで保存する．
`~/.config/taskell/{}.jsonl`に保存する．

タスクのステータスはdone or notのシンプルな形で，ディレクトリ分けて完了したら移動する．
(ステータスは3つでもいいかも，ファイル移動だけだし)
タスクの編集はファイルを編集する．

タスク，スケジュールタスク，タスクセットをそれぞれ別のディレクトリにするかどうか．

ディレクトリ構成
- ~/.config/taskell/
  - task/
    - unit/
      - inbox
      - active
      - done
    - scheduled/
      - inbox
      - active
      - done
    - taskset/
      - inbox
      - active
      - done

## CLI

シンプルなCLIにするか，Claude Codeのような少しリッチなCLIにするか．
今後のことを考えると，リッチでもいいのかもしれない．

React Inkでやってみよう．

必要なコンポーネント
- 入力欄
- タスク一覧
  - 期日順とかできるといいね

最低限これがあれば使えはするか


