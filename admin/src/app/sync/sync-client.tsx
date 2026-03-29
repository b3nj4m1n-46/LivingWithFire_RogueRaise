"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SyncPreviewRow } from "@/lib/queries/sync";

interface SyncClientProps {
  initialPreview: {
    claims: SyncPreviewRow[];
    totalChanges: number;
  };
}

export function SyncClient({ initialPreview }: SyncClientProps) {
  const router = useRouter();
  const [preview, setPreview] = useState(initialPreview);
  const [pushing, setPushing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<{
    pushed: number;
    commitHash: string;
  } | null>(null);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/sync/preview");
      if (!res.ok) throw new Error("Failed to fetch preview");
      const data = await res.json();
      setPreview(data);
    } catch {
      toast.error("Failed to refresh preview");
    } finally {
      setRefreshing(false);
    }
  }

  async function handlePush() {
    setPushing(true);
    try {
      const res = await fetch("/api/sync/push", { method: "POST" });
      if (!res.ok) throw new Error("Push failed");
      const data = await res.json();
      setResult(data);
      setPreview({ claims: [], totalChanges: 0 });
      toast.success(`Pushed ${data.pushed} claim(s) to production`);
      router.refresh();
    } catch {
      toast.error("Failed to push to production");
    } finally {
      setPushing(false);
    }
  }

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sync Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-bold text-green-600">
            {result.pushed} claim(s) pushed
          </p>
          <p className="text-sm text-muted-foreground">
            Dolt commit:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {result.commitHash}
            </code>
          </p>
          <Button variant="outline" onClick={() => setResult(null)}>
            View sync status
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (preview.totalChanges === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No approved claims pending sync
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve claims in the Claims page, then return here to push them to
            production.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {preview.totalChanges} pending
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <Dialog>
          <DialogTrigger
            render={<Button variant="default" disabled={pushing} />}
          >
            {pushing ? "Pushing..." : "Push to Production"}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Push to Production</DialogTitle>
              <DialogDescription>
                You are about to push {preview.totalChanges} change(s) to the
                production database. This will update the live app.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                onClick={handlePush}
                disabled={pushing}
              >
                {pushing ? "Pushing..." : "Confirm Push"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption className="py-4">
              Preview of changes that will be pushed to production.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Plant</TableHead>
                <TableHead>Attribute</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>New Value</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.claims.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium italic">
                    {row.plantName}
                  </TableCell>
                  <TableCell>{row.attributeName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.oldValue ?? (
                      <span className="italic">no value</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{row.newValue}</TableCell>
                  <TableCell>
                    <ConfidenceBadge confidence={row.confidence} />
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

function ConfidenceBadge({ confidence }: { confidence: string }) {
  switch (confidence) {
    case "HIGH":
      return <Badge variant="default">High</Badge>;
    case "MODERATE":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500 text-yellow-700 dark:text-yellow-400"
        >
          Moderate
        </Badge>
      );
    case "LOW":
      return <Badge variant="destructive">Low</Badge>;
    default:
      return <Badge variant="secondary">{confidence}</Badge>;
  }
}
