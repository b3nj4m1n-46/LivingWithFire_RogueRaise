import { execFile } from "node:child_process";
import { resolve } from "node:path";

const GENKIT_DIR = resolve(process.cwd(), "..", "genkit");
const BRIDGE_SCRIPT = resolve(GENKIT_DIR, "src", "scripts", "index-bridge.ts");

export async function callIndexBridge<T>(
  action: string,
  payload: Record<string, unknown>,
  timeout = 600_000 // 10 min default (indexing is slower than fusion)
): Promise<T> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "npx",
      ["tsx", BRIDGE_SCRIPT],
      {
        cwd: GENKIT_DIR,
        timeout,
        env: { ...process.env },
        maxBuffer: 10 * 1024 * 1024,
        shell: true, // Required on Windows for npx
      },
      (error, stdout, stderr) => {
        if (error) {
          let message = error.message;
          if (stderr) {
            try {
              const parsed = JSON.parse(stderr);
              message = parsed.error || stderr;
            } catch {
              message = stderr;
            }
          }
          return reject(new Error(message));
        }
        try {
          resolve(JSON.parse(stdout) as T);
        } catch {
          reject(new Error(`Invalid JSON from index bridge: ${stdout.slice(0, 500)}`));
        }
      }
    );
    child.stdin?.write(JSON.stringify({ action, ...payload }));
    child.stdin?.end();
  });
}
