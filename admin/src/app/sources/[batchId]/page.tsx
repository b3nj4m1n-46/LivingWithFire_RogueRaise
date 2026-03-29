"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PipelineProgress, PipelineStep } from "@/lib/queries/sources";

function stepStatusBadge(status: PipelineStep["status"]) {
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

export default function BatchProgressPage() {
  const params = useParams<{ batchId: string }>();
  const batchId = params.batchId;

  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/sources/${batchId}/status`);
        if (!res.ok) throw new Error("Failed to fetch status");
        const data: PipelineProgress = await res.json();
        if (active) setProgress(data);
        return data.status;
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Error");
        return "error";
      }
    }

    // Initial fetch
    poll();

    const id = setInterval(async () => {
      const status = await poll();
      if (status === "completed" || status === "failed" || status === "error") {
        clearInterval(id);
      }
    }, 5000);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [batchId]);

  if (error && !progress) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Pipeline Progress</h2>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Pipeline Progress</h2>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </div>
    );
  }

  const isTerminal =
    progress.status === "completed" || progress.status === "failed";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pipeline Progress</h2>
        <Badge
          variant={
            progress.status === "completed"
              ? "default"
              : progress.status === "failed"
                ? "destructive"
                : "outline"
          }
        >
          {progress.status}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Source: <span className="font-medium">{progress.sourceDataset}</span>
        {!isTerminal && " — auto-refreshing every 5 seconds"}
      </p>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progress.steps.map((s, i) => (
              <div key={s.name} className="flex items-start gap-4">
                {/* Connector line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      s.status === "completed"
                        ? "bg-primary text-primary-foreground"
                        : s.status === "running"
                          ? "border-2 border-primary text-primary"
                          : s.status === "failed"
                            ? "bg-destructive text-destructive-foreground"
                            : "border border-border text-muted-foreground"
                    }`}
                  >
                    {s.status === "completed"
                      ? "\u2713"
                      : s.status === "failed"
                        ? "\u2717"
                        : i + 1}
                  </div>
                  {i < progress.steps.length - 1 && (
                    <div
                      className={`h-8 w-px ${
                        s.status === "completed" ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.label}</span>
                    {stepStatusBadge(s.status)}
                  </div>
                  {s.detail && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary stats — shown when complete or partial */}
      {(progress.stats.plantsMatched != null ||
        progress.stats.warrantsCreated != null) && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {progress.stats.totalRecords != null && (
                <div>
                  <p className="text-2xl font-bold">
                    {progress.stats.totalRecords.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Source Records
                  </p>
                </div>
              )}
              {progress.stats.plantsMatched != null && (
                <div>
                  <p className="text-2xl font-bold">
                    {progress.stats.plantsMatched.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Plants Matched
                  </p>
                </div>
              )}
              {progress.stats.warrantsCreated != null && (
                <div>
                  <p className="text-2xl font-bold">
                    {progress.stats.warrantsCreated.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Warrants Created
                  </p>
                </div>
              )}
              {progress.stats.conflictsDetected != null && (
                <div>
                  <p className="text-2xl font-bold">
                    {progress.stats.conflictsDetected.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Conflicts Detected
                  </p>
                </div>
              )}
            </div>
            {progress.stats.commitHash && (
              <p className="mt-4 text-sm text-muted-foreground">
                Dolt commit:{" "}
                <code className="font-mono">{progress.stats.commitHash}</code>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation links */}
      {isTerminal && (
        <div className="flex gap-3">
          <Link href="/sources">
            <Button variant="outline">Back to Sources</Button>
          </Link>
          <Link href={`/warrants`}>
            <Button variant="outline">View Warrants</Button>
          </Link>
          <Link href={`/conflicts`}>
            <Button variant="outline">View Conflicts</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
