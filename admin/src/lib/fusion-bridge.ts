import { execFile } from "node:child_process";
import { resolve } from "node:path";

const GENKIT_DIR = resolve(process.cwd(), "..", "genkit");
const BRIDGE_SCRIPT = resolve(GENKIT_DIR, "src", "scripts", "fusion-bridge.ts");

export async function callFusionBridge<T>(
  action: string,
  payload: Record<string, unknown>,
  timeout = 300_000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "npx",
      ["tsx", BRIDGE_SCRIPT],
      {
        cwd: GENKIT_DIR,
        timeout, // default 5 min, longer for full-analysis
        env: { ...process.env },
        maxBuffer: 10 * 1024 * 1024, // 10MB for large mapping results
        shell: true, // Required on Windows for npx
      },
      (error, stdout, stderr) => {
        if (error) {
          // Capture the real execFile error info (killed, signal, timeout, etc.)
          const execInfo = [
            (error as NodeJS.ErrnoException).code ? `code=${(error as NodeJS.ErrnoException).code}` : '',
            (error as { killed?: boolean }).killed ? 'killed=true' : '',
            (error as { signal?: string }).signal ? `signal=${(error as { signal?: string }).signal}` : '',
          ].filter(Boolean).join(', ');

          let message = '';
          if (stderr) {
            // stderr has progress logs (redirected console.log) + possibly a
            // JSON error blob appended at the very end (no newline before it).
            // Try to extract the JSON error from the tail of stderr.
            const jsonStart = stderr.lastIndexOf('{"error"');
            if (jsonStart !== -1) {
              try {
                const parsed = JSON.parse(stderr.slice(jsonStart));
                message = parsed.error || parsed.stack || '';
              } catch { /* fall through */ }
            }
          }

          if (!message) {
            message = execInfo
              ? `Bridge process died (${execInfo})`
              : error.message.length > 500
                ? error.message.slice(0, 500)
                : error.message;
          }

          console.error(`fusion-bridge [${action}] failed: ${message}`);
          return reject(new Error(message));
        }
        try {
          resolve(JSON.parse(stdout) as T);
        } catch {
          reject(new Error(`Invalid JSON from bridge: ${stdout.slice(0, 500)}`));
        }
      }
    );
    child.stdin?.write(JSON.stringify({ action, ...payload }));
    child.stdin?.end();
  });
}
