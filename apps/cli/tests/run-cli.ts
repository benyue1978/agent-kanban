import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export interface CliResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

export async function runCli(
  args: string[],
  env: NodeJS.ProcessEnv = {},
  options: { cwd?: string; stdin?: string } = {}
): Promise<CliResult> {
  const cliEntry = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../dist/index.js"
  );

  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliEntry, ...args], {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...env,
      },
      stdio: [options.stdin !== undefined ? "pipe" : "ignore", "pipe", "pipe"],
    });

    if (options.stdin !== undefined) {
      child.stdin?.write(options.stdin);
      child.stdin?.end();
    }

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      });
    });
  });
}
