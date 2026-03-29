"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ── Types ────────────────────────────────────────────────────────────────

interface AuditSummary {
  batchId: string;
  completedAt: string;
  warrantsCreated: number;
  conflictsDetected: number;
  notes: string | null;
}

interface AgentCounts {
  pendingConflicts: number;
  unsynthesizedPairs: number;
  lastAudit: AuditSummary | null;
}

interface BatchRow {
  id: string;
  batch_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  warrants_created: number | null;
  conflicts_detected: number | null;
  claims_generated: number | null;
  dolt_commit_hash: string | null;
  notes: string | null;
}

interface StepProgress {
  currentStep?: string;
  steps?: Record<string, { status: string; detail?: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function batchTypeLabel(type: string): string {
  switch (type) {
    case "internal_audit":
      return "Internal Audit";
    case "classify_existing":
      return "Conflict Classification";
    case "bulk_synthesize":
      return "Claim Synthesis";
    default:
      return type;
  }
}

function parseStepProgress(notes: string | null): StepProgress | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === "object" && parsed.steps) return parsed;
    return null;
  } catch {
    return null;
  }
}

function stepStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="default">Complete</Badge>;
    case "running":
      return <Badge variant="outline">Running...</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

// ── Component ────────────────────────────────────────────────────────────

export function OperationsTab() {
  const [counts, setCounts] = useState<AgentCounts | null>(null);
  const [running, setRunning] = useState<BatchRow[]>([]);
  const [recent, setRecent] = useState<BatchRow[]>([]);
  const [launching, setLaunching] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<Record<string, unknown> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/counts");
      if (res.ok) setCounts(await res.json());
    } catch {
      // ignore
    }
  }, []);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/status");
      if (res.ok) {
        const data = await res.json();
        setRunning(data.running);
        setRecent(data.recent);
        return data.running.length;
      }
    } catch {
      // ignore
    }
    return 0;
  }, []);

  // Initial load
  useEffect(() => {
    fetchCounts();
    fetchStatus();
  }, [fetchCounts, fetchStatus]);

  // Polling: start when running ops exist, stop when none
  useEffect(() => {
    if (running.length > 0 || launching) {
      if (!pollRef.current) {
        pollRef.current = setInterval(async () => {
          const runningCount = await fetchStatus();
          if (runningCount === 0 && !launching) {
            // All done — refresh counts and stop polling
            fetchCounts();
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        }, 5000);
      }
    }
    return () => {
      if (pollRef.current && running.length === 0 && !launching) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [running.length, launching, fetchStatus, fetchCounts]);

  // ── Actions ──────────────────────────────────────────────────────────

  async function runAudit() {
    setLaunching("audit");
    setAuditResult(null);
    try {
      const res = await fetch("/api/audit/internal", { method: "POST" });
      if (!res.ok) throw new Error("Audit failed");
      const data = await res.json();
      setAuditResult(data);
      fetchCounts();
      fetchStatus();
    } catch (err) {
      setAuditResult({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLaunching(null);
    }
  }

  async function runClassify() {
    setLaunching("classify");
    try {
      const res = await fetch("/api/agents/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "internal" }),
      });
      if (res.status === 409) {
        // Already running
        setLaunching(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to start classification");
      // Trigger status polling
      await fetchStatus();
    } catch {
      // ignore
    } finally {
      setLaunching(null);
    }
  }

  async function runSynthesize() {
    setLaunching("synthesize");
    try {
      const res = await fetch("/api/agents/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 100 }),
      });
      if (res.status === 409) {
        setLaunching(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to start synthesis");
      await fetchStatus();
    } catch {
      // ignore
    } finally {
      setLaunching(null);
    }
  }

  // ── Derived state ────────────────────────────────────────────────────

  const isAuditRunning =
    launching === "audit" || running.some((b) => b.batch_type === "internal_audit");
  const isClassifyRunning =
    launching === "classify" || running.some((b) => b.batch_type === "classify_existing");
  const isSynthesizeRunning =
    launching === "synthesize" || running.some((b) => b.batch_type === "bulk_synthesize");

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Active Operations */}
      {running.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {running.map((batch) => {
              const progress = parseStepProgress(batch.notes);
              return (
                <div key={batch.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {batchTypeLabel(batch.batch_type)}
                    </div>
                    <Badge variant="outline">Running...</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Started: {formatDate(batch.started_at)}
                  </p>
                  {progress?.steps && (
                    <div className="space-y-2">
                      {Object.entries(progress.steps).map(([name, step]) => (
                        <div key={name} className="flex items-center gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium border border-border">
                            {step.status === "completed"
                              ? "\u2713"
                              : step.status === "running"
                                ? "\u25CB"
                                : "\u00B7"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm capitalize">{name}</span>
                              {stepStatusBadge(step.status)}
                            </div>
                            {step.detail && (
                              <p className="text-xs text-muted-foreground">{step.detail}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Internal Audit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Internal Audit</CardTitle>
            <Button
              onClick={runAudit}
              disabled={isAuditRunning}
              size="sm"
            >
              {isAuditRunning ? "Running..." : "Run Internal Audit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scans production data for multi-source disagreements, invalid values,
            and missing provenance. Creates warrants and conflicts for issues found.
          </p>

          {auditResult && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="font-medium text-sm">
                {"error" in auditResult ? (
                  <span className="text-destructive">Audit failed: {String(auditResult.error)}</span>
                ) : (
                  "Audit Complete"
                )}
              </div>
              {!("error" in auditResult) && (
                <div className="grid gap-2 sm:grid-cols-3 text-sm">
                  <div>
                    <span className="font-medium">{Number(auditResult.warrants_created ?? 0)}</span>{" "}
                    warrants created
                  </div>
                  <div>
                    <span className="font-medium">{Number(auditResult.conflicts_created ?? 0)}</span>{" "}
                    conflicts detected
                  </div>
                  <div>
                    <span className="font-medium">{Number(auditResult.disagreements_found ?? 0)}</span>{" "}
                    disagreements
                  </div>
                </div>
              )}
            </div>
          )}

          {counts?.lastAudit && !auditResult && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="text-sm text-muted-foreground">
                Last audit: {formatDate(counts.lastAudit.completedAt)}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <div>
                  <span className="font-medium">{counts.lastAudit.warrantsCreated}</span>{" "}
                  warrants created
                </div>
                <div>
                  <span className="font-medium">{counts.lastAudit.conflictsDetected}</span>{" "}
                  conflicts detected
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Conflict Classification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bulk Conflict Classification</CardTitle>
            <Button
              onClick={runClassify}
              disabled={isClassifyRunning || (counts?.pendingConflicts ?? 0) === 0}
              size="sm"
            >
              {isClassifyRunning ? "Classifying..." : "Re-classify Pending"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Runs the conflict classifier on all pending conflicts to assign
            conflict types, severity, and specialist routes.
          </p>
          {counts && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-bold">{counts.pendingConflicts}</span>
              <span className="text-sm text-muted-foreground">
                pending conflicts awaiting classification
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Claim Synthesis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bulk Claim Synthesis</CardTitle>
            <Button
              onClick={runSynthesize}
              disabled={isSynthesizeRunning || (counts?.unsynthesizedPairs ?? 0) === 0}
              size="sm"
            >
              {isSynthesizeRunning ? "Synthesizing..." : "Synthesize Claims"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Finds plant-attribute pairs with warrants but no claim, and runs AI
            synthesis to generate draft claims (up to 100 per batch).
          </p>
          {counts && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-bold">{counts.unsynthesizedPairs}</span>
              <span className="text-sm text-muted-foreground">
                plant-attribute pairs awaiting synthesis
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Operations */}
      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recent.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={batch.status === "completed" ? "default" : "destructive"}
                    >
                      {batch.status}
                    </Badge>
                    <span className="font-medium">
                      {batchTypeLabel(batch.batch_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    {batch.warrants_created != null && (
                      <span>{batch.warrants_created} warrants</span>
                    )}
                    {batch.conflicts_detected != null && (
                      <span>{batch.conflicts_detected} conflicts</span>
                    )}
                    {batch.claims_generated != null && (
                      <span>{batch.claims_generated} claims</span>
                    )}
                    <span>{formatDate(batch.completed_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
