import type { AdapterType, Agent, Task } from "@agentic-board/shared";

export interface ExecutionContext {
  agent: Agent;
  task?: Task;
  prompt: string;
  workingDir?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface ExecutionResult {
  status: "success" | "error";
  stdout: string;
  stderr: string;
  costCents?: number;
  tokensUsed?: number;
  durationMs: number;
}

export interface DiagnosisResult {
  ok: boolean;
  message: string;
}

export interface Adapter {
  type: AdapterType;
  label: string;
  execute(context: ExecutionContext): Promise<ExecutionResult>;
  diagnose(): Promise<DiagnosisResult>;
}
