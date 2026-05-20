import { describe, expect, test } from "vite-plus/test";
import { run } from "./index.js";

describe("taskell cli", () => {
  test("prints help", async () => {
    const result = await run(["help"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("taskell add");
  });

  test("rejects an invalid status option", async () => {
    const result = await run(["list", "--status", "waiting"]);

    expect(result.exitCode).toBe(1);
    expect(result.output).toBe("Invalid status: waiting");
  });

  test("formats command help with task references", async () => {
    const result = await run(["help"]);

    expect(result.output).toContain("taskell start <task-ref>");
    expect(result.output).toContain("taskell done <task-ref>");
  });
});
