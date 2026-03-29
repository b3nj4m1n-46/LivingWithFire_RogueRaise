import Link from "next/link";
import { fetchSourceRegistry } from "@/lib/queries/sources";
import { Card, CardContent } from "@/components/ui/card";
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

export const dynamic = "force-dynamic";

function statusVariant(status: string | null) {
  switch (status) {
    case "completed":
      return "default" as const;
    case "running":
      return "outline" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

export default async function SourcesPage() {
  let datasets: Awaited<ReturnType<typeof fetchSourceRegistry>> = [];
  try {
    datasets = await fetchSourceRegistry();
  } catch {
    // Render empty — DB may not be available
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Data Set Sources</h2>
        <Link href="/sources/upload">
          <Button>Upload New Source</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead>Dictionary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Analyzed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No source datasets found.
                  </TableCell>
                </TableRow>
              ) : (
                datasets.map((ds) => (
                  <TableRow key={ds.folder}>
                    <TableCell className="font-mono text-sm">
                      {ds.sourceId}
                    </TableCell>
                    <TableCell>
                      {ds.lastBatchId ? (
                        <Link
                          href={`/sources/${ds.lastBatchId}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {ds.name}
                        </Link>
                      ) : (
                        ds.name
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{ds.category}</TableCell>
                    <TableCell className="text-right">
                      {ds.plantCount?.toLocaleString() ?? "—"}
                    </TableCell>
                    <TableCell>
                      {ds.hasDictionary ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {ds.lastBatchStatus ? (
                        <Badge variant={statusVariant(ds.lastBatchStatus)}>
                          {ds.lastBatchStatus}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ds.lastAnalyzedAt
                        ? new Date(ds.lastAnalyzedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
