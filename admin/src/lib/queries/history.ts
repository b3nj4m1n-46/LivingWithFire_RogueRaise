import { query, queryOne } from "@/lib/dolt";

export interface DoltLogEntry {
  commit_hash: string;
  committer: string;
  date: string;
  message: string;
}

export interface DoltDiffRow {
  diff_type: string;
  [key: string]: unknown;
}

export interface TableDiffSummary {
  table_name: string;
  added: number;
  modified: number;
  deleted: number;
  rows: DoltDiffRow[];
}

const DIFFABLE_TABLES = [
  "warrants",
  "conflicts",
  "claims",
  "claim_warrants",
  "analysis_batches",
] as const;

export async function fetchCommitLog(
  limit: number,
  offset: number
): Promise<DoltLogEntry[]> {
  return query<DoltLogEntry>(
    "SELECT commit_hash, committer, date, message FROM dolt_log ORDER BY date DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );
}

export async function fetchParentHash(
  commitHash: string
): Promise<string | null> {
  // Try dolt_commit_ancestors first (available in DoltgreSQL)
  try {
    const row = await queryOne<{ parent_hash: string }>(
      "SELECT parent_hash FROM dolt_commit_ancestors WHERE commit_hash = $1 AND parent_index = 0",
      [commitHash]
    );
    return row?.parent_hash ?? null;
  } catch {
    // Fallback: get the next commit in log order
    const row = await queryOne<{ commit_hash: string }>(
      `SELECT commit_hash FROM dolt_log
       WHERE date < (SELECT date FROM dolt_log WHERE commit_hash = $1 LIMIT 1)
       ORDER BY date DESC LIMIT 1`,
      [commitHash]
    );
    return row?.commit_hash ?? null;
  }
}

async function fetchTableDiff(
  tableName: string,
  fromCommit: string,
  toCommit: string
): Promise<DoltDiffRow[]> {
  // Validate table name against allowlist to prevent SQL injection
  if (!DIFFABLE_TABLES.includes(tableName as (typeof DIFFABLE_TABLES)[number])) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  try {
    return await query<DoltDiffRow>(
      `SELECT * FROM dolt_commit_diff_${tableName} WHERE from_commit = $1 AND to_commit = $2`,
      [fromCommit, toCommit]
    );
  } catch {
    // Table may not have changes or may not exist in diff
    return [];
  }
}

export async function fetchCommitDiffSummary(
  commitHash: string
): Promise<TableDiffSummary[]> {
  const parentHash = await fetchParentHash(commitHash);
  if (!parentHash) {
    // Initial commit — no parent to diff against
    return [];
  }

  const summaries: TableDiffSummary[] = [];

  const results = await Promise.all(
    DIFFABLE_TABLES.map(async (table) => {
      const rows = await fetchTableDiff(table, parentHash, commitHash);
      return { table, rows };
    })
  );

  for (const { table, rows } of results) {
    if (rows.length === 0) continue;

    let added = 0;
    let modified = 0;
    let deleted = 0;
    for (const row of rows) {
      if (row.diff_type === "added") added++;
      else if (row.diff_type === "modified") modified++;
      else if (row.diff_type === "removed") deleted++;
    }

    summaries.push({ table_name: table, added, modified, deleted, rows });
  }

  return summaries;
}

export async function fetchUncommittedCount(): Promise<number> {
  const row = await queryOne<{ changes: string }>(
    "SELECT COUNT(*) as changes FROM dolt_status"
  );
  return Number(row?.changes ?? 0);
}
