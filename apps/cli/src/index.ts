#!/usr/bin/env node
import { isSea } from "node:sea";
import {
  addUnitTask,
  completeTask,
  createJsonlTaskRepository,
  getTask,
  listTasks,
  planTaskExecution,
  scheduleTask,
  startTask,
  type RunnerAllowedEffect,
  type TaskRecord,
  type TaskStatus,
} from "@taskell/core";

type CommandResult = {
  exitCode: number;
  output: string;
};

type ParsedOptions = {
  basePath?: string;
  status?: TaskStatus;
  delta?: string;
  effect?: RunnerAllowedEffect;
  instruction?: string;
};

const statuses = ["inbox", "active", "done"] as const satisfies ReadonlyArray<TaskStatus>;
const effects = [
  "readOnly",
  "localWrite",
  "externalSideEffect",
] as const satisfies ReadonlyArray<RunnerAllowedEffect>;

const help = `Usage:
  taskell add <name> [--delta <text>] [--runner] [--effect <readOnly|localWrite|externalSideEffect>] [--instruction <text>]
  taskell list [--status <inbox|active|done>]
  taskell get <task-ref>
  taskell start <task-ref>
  taskell done <task-ref>
  taskell schedule <task-ref> <YYYY-MM-DD>
  taskell plan-runner <task-ref> [--effect <readOnly|localWrite|externalSideEffect>] [--instruction <text>]

Options:
  --base-path <path>  Use a custom Taskell data directory.

Task refs:
  Use issue-like task numbers such as 1 or #1.
`;

const isStatus = (value: string | undefined): value is TaskStatus =>
  statuses.includes(value as TaskStatus);

const isEffect = (value: string | undefined): value is RunnerAllowedEffect =>
  effects.includes(value as RunnerAllowedEffect);

const parseOptions = (
  args: string[],
): { positional: string[]; options: ParsedOptions; runner: boolean } => {
  const positional: string[] = [];
  const options: ParsedOptions = {};
  let runner = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--runner") {
      runner = true;
      continue;
    }

    if (arg === "--base-path") {
      options.basePath = args[(index += 1)];
      continue;
    }

    if (arg === "--status") {
      const status = args[(index += 1)];
      if (!isStatus(status)) {
        throw new Error(`Invalid status: ${status ?? ""}`);
      }
      options.status = status;
      continue;
    }

    if (arg === "--delta") {
      options.delta = args[(index += 1)];
      continue;
    }

    if (arg === "--effect") {
      const effect = args[(index += 1)];
      if (!isEffect(effect)) {
        throw new Error(`Invalid effect: ${effect ?? ""}`);
      }
      options.effect = effect;
      continue;
    }

    if (arg === "--instruction") {
      options.instruction = args[(index += 1)];
      continue;
    }

    positional.push(arg);
  }

  return { positional, options, runner };
};

const formatTask = (record: TaskRecord): string => {
  const dueDate = record.task.type === "scheduled" ? ` due:${record.task.dueDate.toString()}` : "";
  const delta = record.task.delta ? ` delta:${record.task.delta}` : "";
  return `#${record.task.number} [${record.status}] ${record.task.name}${dueDate}${delta}`;
};

const formatPlan = (
  record: TaskRecord,
  effect: RunnerAllowedEffect,
  instruction?: string,
): string => {
  const plan = planTaskExecution({
    task: record.task,
    intent: {
      mode: "runner",
      allowedEffect: effect,
      instruction,
    },
  });

  if (plan.kind === "approvalRequired") {
    return `approval-required #${record.task.number} effect:${plan.request.allowedEffect} status:${plan.request.status}`;
  }

  if (plan.kind === "runnerRequest") {
    return `runner-request #${record.task.number} effect:${plan.request.allowedEffect} status:${plan.request.status}`;
  }

  return `manual #${record.task.number}`;
};

export const run = async (argv: string[]): Promise<CommandResult> => {
  try {
    const [command, ...rest] = argv;
    const { positional, options, runner } = parseOptions(rest);
    const repository = createJsonlTaskRepository(options.basePath);

    if (!command || command === "help" || command === "--help" || command === "-h") {
      return { exitCode: 0, output: help };
    }

    if (command === "add") {
      const name = positional.join(" ");
      const result = await addUnitTask(repository, { name, delta: options.delta });
      if (result.isErr()) {
        return { exitCode: 1, output: result.error.message };
      }
      const record = result.value;
      const lines = [`added ${formatTask(record)}`];
      if (runner) {
        lines.push(formatPlan(record, options.effect ?? "localWrite", options.instruction));
      }
      return { exitCode: 0, output: lines.join("\n") };
    }

    if (command === "list") {
      const result = await listTasks(repository, { status: options.status });
      if (result.isErr()) {
        return { exitCode: 1, output: result.error.message };
      }
      return {
        exitCode: 0,
        output: result.value.length > 0 ? result.value.map(formatTask).join("\n") : "no tasks",
      };
    }

    if (command === "get") {
      const result = await getTask(repository, { ref: positional[0] ?? "" });
      return result.isOk()
        ? { exitCode: 0, output: formatTask(result.value) }
        : { exitCode: 1, output: result.error.message };
    }

    if (command === "start") {
      const result = await startTask(repository, { ref: positional[0] ?? "" });
      return result.isOk()
        ? { exitCode: 0, output: `started ${formatTask(result.value)}` }
        : { exitCode: 1, output: result.error.message };
    }

    if (command === "done") {
      const result = await completeTask(repository, { ref: positional[0] ?? "" });
      return result.isOk()
        ? { exitCode: 0, output: `done ${formatTask(result.value)}` }
        : { exitCode: 1, output: result.error.message };
    }

    if (command === "schedule") {
      const result = await scheduleTask(repository, {
        ref: positional[0] ?? "",
        dueDate: positional[1] ?? "",
      });
      return result.isOk()
        ? { exitCode: 0, output: `scheduled ${formatTask(result.value)}` }
        : { exitCode: 1, output: result.error.message };
    }

    if (command === "plan-runner") {
      const result = await getTask(repository, { ref: positional[0] ?? "" });
      return result.isOk()
        ? {
            exitCode: 0,
            output: formatPlan(result.value, options.effect ?? "localWrite", options.instruction),
          }
        : { exitCode: 1, output: result.error.message };
    }

    return { exitCode: 1, output: `Unknown command: ${command}\n\n${help}` };
  } catch (cause) {
    return {
      exitCode: 1,
      output: cause instanceof Error ? cause.message : "Unknown CLI error",
    };
  }
};

const main = async (): Promise<void> => {
  const result = await run(process.argv.slice(2));
  const write = result.exitCode === 0 ? process.stdout : process.stderr;
  write.write(`${result.output}\n`);
  process.exitCode = result.exitCode;
};

if (isSea() || import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
