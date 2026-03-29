"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ConflictFilterOptions,
  ConflictListFilters,
} from "@/lib/queries/conflicts";

interface ConflictsFiltersProps {
  options: ConflictFilterOptions;
  currentFilters: ConflictListFilters;
}

export function ConflictsFilters({
  options,
  currentFilters,
}: ConflictsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    params.delete("page");
    router.push(`/conflicts?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/conflicts");
  }

  function clearSourcePair() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sourceA");
    params.delete("sourceB");
    params.delete("page");
    router.push(`/conflicts?${params.toString()}`);
  }

  const hasSourcePair = currentFilters.sourceA && currentFilters.sourceB;

  const hasAnyFilter =
    currentFilters.status ||
    currentFilters.severity ||
    currentFilters.conflictType ||
    currentFilters.conflictMode ||
    currentFilters.attributeCategory ||
    currentFilters.sourceDataset ||
    hasSourcePair;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {hasSourcePair && (
        <Badge variant="secondary" className="gap-1 py-1.5 text-sm">
          {currentFilters.sourceA} vs {currentFilters.sourceB}
          <button
            onClick={clearSourcePair}
            className="ml-1 text-muted-foreground hover:text-foreground"
          >
            &times;
          </button>
        </Badge>
      )}

      {/* Status filter */}
      <Select
        value={currentFilters.status ?? ""}
        onValueChange={(val) => updateFilter("status", val || undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {options.statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Severity filter */}
      <Select
        value={currentFilters.severity ?? ""}
        onValueChange={(val) => updateFilter("severity", val || undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          {options.severities.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Conflict Type filter */}
      <Select
        value={currentFilters.conflictType ?? ""}
        onValueChange={(val) => updateFilter("conflictType", val || undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Conflict type" />
        </SelectTrigger>
        <SelectContent>
          {options.conflictTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {t.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Conflict Mode filter */}
      <Select
        value={currentFilters.conflictMode ?? ""}
        onValueChange={(val) => updateFilter("conflictMode", val || undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Mode" />
        </SelectTrigger>
        <SelectContent>
          {options.conflictModes.map((m) => (
            <SelectItem key={m} value={m}>
              {m.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Attribute Category filter */}
      <Select
        value={currentFilters.attributeCategory ?? ""}
        onValueChange={(val) =>
          updateFilter("attributeCategory", val || undefined)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Attribute category" />
        </SelectTrigger>
        <SelectContent>
          {options.attributeCategories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Source Dataset filter */}
      <Select
        value={currentFilters.sourceDataset ?? ""}
        onValueChange={(val) =>
          updateFilter("sourceDataset", val || undefined)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Source dataset" />
        </SelectTrigger>
        <SelectContent>
          {options.sourceDatasets.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasAnyFilter && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
