"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DatasetInfo, FusionBatch } from "@/lib/queries/fusion";

function statusVariant(status: string) {
  switch (status) {
    case "completed":
      return "default" as const;
    case "mapping_review":
      return "secondary" as const;
    case "executing":
    case "running":
      return "outline" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

interface FusionLandingProps {
  initialDatasets: DatasetInfo[];
  initialBatches: FusionBatch[];
}

export function FusionLanding({
  initialDatasets,
  initialBatches,
}: FusionLandingProps) {
  const router = useRouter();
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [mapping, setMapping] = useState(false);

  const datasets = initialDatasets;
  const batches = initialBatches;

  async function handleMapSchema() {
    if (!selectedFolder) {
      toast.error("Select a dataset first");
      return;
    }

    const ds = datasets.find((d) => d.folder === selectedFolder);
    if (!ds) return;

    setMapping(true);
    try {
      const res = await fetch("/api/fusion/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetFolder: ds.folder,
          sourceDataset: ds.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Map schema failed");
      }

      const data = await res.json();
      toast.success(
        `Mapped ${data.summary.total} columns (${data.summary.direct} direct, ${data.summary.crosswalk} crosswalk)`
      );
      router.push(`/fusion/${data.batchId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to map schema"
      );
    } finally {
      setMapping(false);
    }
  }

  // Group datasets by category
  const grouped = datasets.reduce<Record<string, DatasetInfo[]>>((acc, ds) => {
    (acc[ds.category] ??= []).push(ds);
    return acc;
  }, {});

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Map a Source Dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="flex-1">
            <Select
              value={selectedFolder}
              onValueChange={(val) => setSelectedFolder(val ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a dataset..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(grouped).map(([category, items]) => (
                  <SelectGroup key={category}>
                    <SelectLabel>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectLabel>
                    {items.map((ds) => (
                      <SelectItem key={ds.folder} value={ds.folder}>
                        {ds.name}
                        {ds.plantCount ? ` (${ds.plantCount} plants)` : ""}
                        {" — "}
                        {ds.sourceId}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleMapSchema}
            disabled={!selectedFolder || mapping}
          >
            {mapping ? "Mapping..." : "Map Schema"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {batches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No analysis batches yet. Map a dataset to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Warrants</TableHead>
                  <TableHead className="text-right">Conflicts</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Link
                        href={`/fusion/${b.id}`}
                        className="font-medium hover:underline"
                      >
                        {b.source_dataset}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {b.source_id_code}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {b.batch_type}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(b.status)}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {b.warrants_created ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {b.conflicts_detected ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(b.started_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
