"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { ReliabilityRow } from "@/lib/queries/reliability";

interface ReliabilityClientProps {
  initialRows: ReliabilityRow[];
}

const METHODOLOGY_OPTIONS = [
  { value: "", label: "—" },
  { value: "meta_analysis", label: "Meta-Analysis" },
  { value: "experimental", label: "Experimental" },
  { value: "field_observation", label: "Field Observation" },
  { value: "literature_review", label: "Literature Review" },
  { value: "modeling", label: "Modeling" },
  { value: "expert_opinion", label: "Expert Opinion" },
];

const SPECIFICITY_OPTIONS = [
  { value: "", label: "—" },
  { value: "local", label: "Local" },
  { value: "regional", label: "Regional" },
  { value: "national", label: "National" },
  { value: "global", label: "Global" },
];

const CURRENCY_OPTIONS = [
  { value: "", label: "—" },
  { value: "current", label: "Current" },
  { value: "recent", label: "Recent" },
  { value: "dated", label: "Dated" },
];

function scoreColor(score: number | null): string {
  if (score === null) return "";
  if (score >= 0.8) return "text-green-600 dark:text-green-400";
  if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBadgeVariant(score: number | null) {
  if (score === null) return "secondary" as const;
  if (score >= 0.8) return "default" as const;
  if (score >= 0.6) return "secondary" as const;
  return "outline" as const;
}

export function ReliabilityClient({ initialRows }: ReliabilityClientProps) {
  const [rows, setRows] = useState(initialRows);
  const [saving, setSaving] = useState<string | null>(null);
  const [autoScoring, setAutoScoring] = useState(false);
  const [suggesting, setSuggesting] = useState<string | null>(null);

  async function handleFieldChange(
    sourceIdCode: string,
    field: string,
    value: string | boolean | number | null
  ) {
    // Optimistic update
    setRows((prev) =>
      prev.map((r) =>
        r.source_id_code === sourceIdCode ? { ...r, [field]: value } : r
      )
    );

    setSaving(sourceIdCode);
    try {
      const res = await fetch("/api/sources/reliability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id_code: sourceIdCode, [field]: value }),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setRows((prev) =>
        prev.map((r) =>
          r.source_id_code === sourceIdCode ? updated : r
        )
      );
    } catch {
      toast.error(`Failed to save ${field} for ${sourceIdCode}`);
      // Revert
      setRows((prev) =>
        prev.map((r) =>
          r.source_id_code === sourceIdCode
            ? initialRows.find((ir) => ir.source_id_code === sourceIdCode) ?? r
            : r
        )
      );
    } finally {
      setSaving(null);
    }
  }

  async function handleAutoScoreAll() {
    setAutoScoring(true);
    try {
      const res = await fetch("/api/sources/reliability/auto-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Auto-score failed");
      const data = await res.json();
      setRows(data.results);
      toast.success(`Auto-scored ${data.updated} sources`);
    } catch {
      toast.error("Failed to auto-score");
    } finally {
      setAutoScoring(false);
    }
  }

  async function handleAiSuggest(sourceIdCode: string) {
    setSuggesting(sourceIdCode);
    try {
      const res = await fetch("/api/sources/reliability/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceIdCode }),
      });
      if (!res.ok) throw new Error("AI suggest failed");
      const { suggestions } = await res.json();

      // Apply suggestions as a batch update
      const patchRes = await fetch("/api/sources/reliability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_id_code: sourceIdCode,
          ...suggestions,
        }),
      });
      if (!patchRes.ok) throw new Error("Apply failed");
      const updated = await patchRes.json();
      setRows((prev) =>
        prev.map((r) =>
          r.source_id_code === sourceIdCode ? updated : r
        )
      );
      toast.success(`AI suggestions applied to ${sourceIdCode}`);
    } catch {
      toast.error(`AI suggest failed for ${sourceIdCode}`);
    } finally {
      setSuggesting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoScoreAll}
          disabled={autoScoring}
        >
          {autoScoring ? "Scoring..." : "Auto-Score All"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Methodology</TableHead>
                <TableHead>Peer Rev.</TableHead>
                <TableHead>Sample</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Specificity</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Auto Score</TableHead>
                <TableHead>Steward Score</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.source_id_code}
                  className={saving === row.source_id_code ? "opacity-60" : ""}
                >
                  <TableCell className="font-medium">
                    <Badge variant="secondary">{row.source_id_code}</Badge>
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded border bg-transparent px-1 py-0.5 text-sm"
                      value={row.methodology_type ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          row.source_id_code,
                          "methodology_type",
                          e.target.value || null
                        )
                      }
                    >
                      {METHODOLOGY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={row.peer_reviewed}
                      onChange={(e) =>
                        handleFieldChange(
                          row.source_id_code,
                          "peer_reviewed",
                          e.target.checked
                        )
                      }
                      className="size-4"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-7 w-20 text-sm"
                      value={row.sample_size ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          row.source_id_code,
                          "sample_size",
                          e.target.value || null
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.geographic_scope ?? "—"}
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded border bg-transparent px-1 py-0.5 text-sm"
                      value={row.geographic_specificity ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          row.source_id_code,
                          "geographic_specificity",
                          e.target.value || null
                        )
                      }
                    >
                      {SPECIFICITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded border bg-transparent px-1 py-0.5 text-sm"
                      value={row.temporal_currency ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          row.source_id_code,
                          "temporal_currency",
                          e.target.value || null
                        )
                      }
                    >
                      {CURRENCY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.publication_year ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-mono ${scoreColor(row.auto_score)}`}>
                      {row.auto_score?.toFixed(2) ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-7 w-16 text-sm font-mono"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={row.reliability_score ?? ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v >= 0 && v <= 1) {
                          handleFieldChange(
                            row.source_id_code,
                            "reliability_score",
                            Math.round(v * 100) / 100
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleAiSuggest(row.source_id_code)}
                      disabled={suggesting === row.source_id_code}
                    >
                      {suggesting === row.source_id_code ? "..." : "AI"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
