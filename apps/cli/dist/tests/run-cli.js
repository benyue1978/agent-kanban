import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
export async function runCli(args, env = {}) {
    const cliEntry = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/src/index.js");
    return await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [cliEntry, ...args], {
            env: {
                ...process.env,
                ...env,
            },
            stdio: ["ignore", "pipe", "pipe"],
        });
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
