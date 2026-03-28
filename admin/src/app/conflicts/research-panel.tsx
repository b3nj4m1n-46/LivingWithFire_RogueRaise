"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search } from "lucide-react";

interface DatasetContext {
  sourceIdCode: string;
  sourceDataset: string;
  dataDictionary: string | null;
  readme: string | null;
}

interface KBResult {
  documentTitle: string;
  sectionTitle: string;
  sectionSummary: string;
  nodeId: string;
}

interface ResearchData {
  datasetContexts: DatasetContext[];
  knowledgeBaseResults: KBResult[];
}

interface ResearchPanelProps {
  conflictId: string;
  sourceA: string | null;
  sourceB: string | null;
  plantName: string;
  attributeName: string;
}

export function ResearchPanel({
  conflictId,
  plantName,
  attributeName,
}: ResearchPanelProps) {
  const [data, setData] = useState<ResearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function handleResearch() {
    setLoading(true);
    try {
      const res = await fetch(`/api/conflicts/${conflictId}/research`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Research request failed");
      const result: ResearchData = await res.json();
      setData(result);
      setFetched(true);
    } catch {
      toast.error("Failed to fetch research context");
    } finally {
      setLoading(false);
    }
  }

  if (!fetched && !loading) {
    return (
      <Button variant="outline" size="sm" onClick={handleResearch}>
        <Search className="mr-2 size-4" />
        Research
      </Button>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 rounded-md border bg-background p-4">
        <p className="text-sm font-medium">Fetching research context...</p>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const hasContexts = data.datasetContexts.some(
    (c) => c.dataDictionary || c.readme
  );
  const hasKB = data.knowledgeBaseResults.length > 0;

  if (!hasContexts && !hasKB) {
    return (
      <div className="rounded-md border bg-background px-4 py-3">
        <p className="text-sm text-muted-foreground">
          No research context found for {plantName} / {attributeName}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-md border bg-background p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        Research Context
      </p>

      {/* Dataset contexts */}
      {data.datasetContexts.map((ctx) => {
        if (!ctx.dataDictionary && !ctx.readme) return null;
        return (
          <DatasetContextCard key={ctx.sourceDataset} context={ctx} />
        );
      })}

      {/* Knowledge base results */}
      {hasKB && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Knowledge Base Matches</p>
          {data.knowledgeBaseResults.map((result) => (
            <div
              key={result.nodeId}
              className="rounded border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {result.documentTitle.replace(/_/g, " ").replace(".pdf", "")}
                </Badge>
                <span className="font-medium">{result.sectionTitle}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {result.sectionSummary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dataset Context Card ──────────────────────────────────────────────

function DatasetContextCard({ context }: { context: DatasetContext }) {
  const [expanded, setExpanded] = useState(false);

  // Extract key sections from DATA-DICTIONARY: rating scales, merge guidance
  const excerpt = context.dataDictionary
    ? extractExcerpt(context.dataDictionary)
    : null;

  return (
    <div className="rounded border px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{context.sourceIdCode}</Badge>
          <span className="text-sm font-medium">{context.sourceDataset}</span>
        </div>
        {context.dataDictionary && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Collapse" : "Show full"}
          </Button>
        )}
      </div>
      {excerpt && !expanded && (
        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
          {excerpt}
        </p>
      )}
      {expanded && context.dataDictionary && (
        <pre className="mt-2 max-h-96 overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">
          {context.dataDictionary}
        </pre>
      )}
    </div>
  );
}

function extractExcerpt(dataDictionary: string): string {
  // Look for rating scale or merge guidance sections
  const lines = dataDictionary.split("\n");
  const excerptLines: string[] = [];
  let capturing = false;
  let lineCount = 0;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (
      lower.includes("rating") ||
      lower.includes("scale") ||
      lower.includes("merge") ||
      lower.includes("methodology")
    ) {
      capturing = true;
      lineCount = 0;
    }
    if (capturing) {
      excerptLines.push(line);
      lineCount++;
      if (lineCount > 15) {
        capturing = false;
      }
    }
    if (excerptLines.length > 30) break;
  }

  return excerptLines.length > 0
    ? excerptLines.join("\n").trim()
    : dataDictionary.slice(0, 500) + "...";
}
