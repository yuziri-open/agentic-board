#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command, InvalidArgumentError } from "commander";

function parsePort(value: string) {
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new InvalidArgumentError("Port must be an integer between 1 and 65535.");
  }

  return port;
}

const program = new Command();
program
  .name("agentic-board")
  .description("Start the AgenticBoard server and serve the UI build when present.")
  .option("-p, --port <port>", "Port to bind the API/UI server to.", parsePort, 4000)
  .parse();

const options = program.opts<{ port: number }>();
const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = resolve(here, "../packages/server/src/index.ts");
const child = spawn(process.execPath, ["--import", "tsx", serverEntry], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(options.port)
  }
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal);
    }
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
