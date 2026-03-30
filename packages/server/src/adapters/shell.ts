import { spawn } from "node:child_process";
import type { Adapter, DiagnosisResult, ExecutionContext, ExecutionResult } from "./types.js";

function runShell(context: ExecutionContext): Promise<ExecutionResult> {
  const startedAt = Date.now();
  const config = context.agent.adapterConfig ?? {};
  const command = typeof config.command === "string" ? config.command : context.prompt;
  const shell = typeof config.shell === "string" ? (config.shell === "true" ? true : config.shell) : true;

  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: context.workingDir ?? process.cwd(),
      env: {
        ...process.env,
        AGENTIC_BOARD_PROMPT: context.prompt,
        AGENTIC_BOARD_TASK_ID: context.task?.id ?? "",
        ...context.env
      },
      stdio: ["ignore", "pipe", "pipe"],
      shell
    });

    let stdout = "";
    let stderr = "";
    let timeout: NodeJS.Timeout | undefined;

    if (context.timeoutMs) {
      timeout = setTimeout(() => {
        child.kill("SIGTERM");
      }, context.timeoutMs);
    }

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      resolve({
        status: code === 0 ? "success" : "error",
        stdout,
        stderr,
        durationMs: Date.now() - startedAt
      });
    });
  });
}

async function diagnoseShell(): Promise<DiagnosisResult> {
  return { ok: true, message: "shell adapter uses the host shell at execution time." };
}

export const shellAdapter: Adapter = {
  type: "shell",
  label: "Shell Command",
  execute: runShell,
  diagnose: diagnoseShell
};
