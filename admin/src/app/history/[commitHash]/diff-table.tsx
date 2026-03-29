"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { DoltDiffRow } from "@/lib/queries/history";

// Columns to exclude from display (internal Dolt metadata)
const HIDDEN_COLUMNS = new Set([
  "diff_type",
  "from_commit",
  "to_commit",
  "from_commit_date",
  "to_commit_date",
]);

function getDisplayColumns(rows: DoltDiffRow[]): string[] {
  if (rows.length === 0) return [];

  const allKeys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!HIDDEN_COLUMNS.has(key)) {
        allKeys.add(key);
      }
    }
  }

  // Group into base columns (strip from_/to_ prefixes)
  const bases = new Set<string>();
  for (const key of allKeys) {
    if (key.startsWith("from_")) bases.add(key.slice(5));
    else if (key.startsWith("to_")) bases.add(key.slice(3));
    else bases.add(key);
  }

  return Array.from(bases).sort();
}

function rowBg(diffType: string): string {
  switch (diffType) {
    case "added":
      return "bg-green-50 dark:bg-green-950/30";
    case "modified":
      return "bg-yellow-50 dark:bg-yellow-950/30";
    case "removed":
      return "bg-red-50 dark:bg-red-950/30";
    default:
      return "";
  }
}

function diffLabel(diffType: string): string {
  switch (diffType) {
    case "added":
      return "+";
    case "modified":
      return "~";
    case "removed":
      return "-";
    default:
      return "";
  }
}

function CellValue({
  row,
  column,
}: {
  row: DoltDiffRow;
  column: string;
}) {
  const fromKey = `from_${column}`;
  const toKey = `to_${column}`;
  const fromVal = row[fromKey];
  const toVal = row[toKey];

  // For plain columns (no from_/to_ prefix)
  if (!(fromKey in row) && !(toKey in row) && column in row) {
    return <span className="text-xs">{formatVal(row[column])}</span>;
  }

  if (row.diff_type === "added") {
    return <span className="text-xs text-green-700 dark:text-green-400">{formatVal(toVal)}</span>;
  }

  if (row.diff_type === "removed") {
    return <span className="text-xs text-red-700 dark:text-red-400">{formatVal(fromVal)}</span>;
  }

  // Modified — show old -> new if values differ
  if (row.diff_type === "modified") {
    const from = formatVal(fromVal);
    const to = formatVal(toVal);
    if (from === to) {
      return <span className="text-xs">{to}</span>;
    }
    return (
      <span className="text-xs">
        <span className="text-red-600 line-through dark:text-red-400">{from}</span>
        {" "}
        <span className="text-green-700 dark:text-green-400">{to}</span>
      </span>
    );
  }

  return <span className="text-xs">{formatVal(toVal ?? fromVal)}</span>;
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function DiffTable({
  rows,
  tableName,
}: {
  rows: DoltDiffRow[];
  tableName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const columns = getDisplayColumns(rows);

  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">No row changes.</p>;
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="mb-2"
      >
        {expanded ? "Hide" : "Show"} {rows.length} row{rows.length !== 1 ? "s" : ""} in {tableName}
      </Button>

      {expanded && (
        <div className="max-h-96 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                {columns.map((col) => (
                  <TableHead key={col} className="text-xs whitespace-nowrap">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className={rowBg(row.diff_type)}>
                  <TableCell className="text-center font-mono text-xs font-bold">
                    {diffLabel(row.diff_type)}
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col} className="max-w-48 truncate">
                      <CellValue row={row} column={col} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
