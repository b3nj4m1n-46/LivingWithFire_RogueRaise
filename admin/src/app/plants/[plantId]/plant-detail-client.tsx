"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlantDetail } from "@/lib/queries/plants";

interface PlantDetailClientProps {
  data: PlantDetail;
}

export function PlantDetailClient({ data }: PlantDetailClientProps) {
  const { plant, attributes, categories, overlay, pendingSync, pendingClaimCount } = data;

  // Group attributes by category
  const grouped: Record<string, typeof attributes> = {};
  for (const attr of attributes) {
    const cat = attr.category ?? "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(attr);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              <span className="italic">
                {plant.genus} {plant.species}
              </span>
            </h2>
            {pendingSync && (
              <Link href="/sync">
                <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
                  {pendingClaimCount} pending sync
                </Badge>
              </Link>
            )}
          </div>
          {plant.common_name && (
            <p className="text-lg text-muted-foreground">{plant.common_name}</p>
          )}
          {plant.last_updated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(plant.last_updated).toLocaleDateString()}
            </p>
          )}
        </div>
        <Link href="/plants">
          <Button variant="outline" size="sm">
            Back to Plants
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{attributes.length} attribute values</span>
        <span>{categories.length} categories</span>
      </div>

      {/* Attribute sections by category */}
      {categories.map((category) => {
        const catAttrs = grouped[category] ?? [];
        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{category}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attribute</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Curation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catAttrs.map((attr, idx) => {
                    const warrants = overlay.warrantCounts[attr.attribute_id] ?? 0;
                    const conflicts = overlay.conflictCounts[attr.attribute_name] ?? 0;
                    const claim = overlay.pendingClaims[attr.attribute_id];

                    return (
                      <TableRow key={`${attr.attribute_id}-${idx}`}>
                        <TableCell>
                          <Link
                            href={`/claims/${data.plant.id}/${attr.attribute_id}`}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {attr.attribute_name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          {attr.value}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {attr.source_name ?? (
                            <span className="italic">unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5 flex-wrap">
                            {warrants > 0 && (
                              <Badge variant="secondary">
                                {warrants} warrant{warrants !== 1 ? "s" : ""}
                              </Badge>
                            )}
                            {conflicts > 0 && (
                              <Badge variant="destructive">
                                {conflicts} conflict{conflicts !== 1 ? "s" : ""}
                              </Badge>
                            )}
                            {claim && (
                              <Badge
                                variant={
                                  claim.status === "approved"
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {claim.status}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {attributes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No attribute values found for this plant.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
