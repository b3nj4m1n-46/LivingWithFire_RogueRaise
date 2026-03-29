import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROMPTS_DIR = resolve(import.meta.dirname);

/**
 * Load a .md prompt template and replace {{placeholder}} tokens
 * with the provided values.
 */
export function loadPrompt(
  filename: string,
  vars: Record<string, string>,
): string {
  const raw = readFileSync(resolve(PROMPTS_DIR, filename), 'utf-8');
  return raw.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    if (key in vars) return vars[key];
    throw new Error(`Missing prompt variable "{{${key}}}" in ${filename}`);
  });
}
