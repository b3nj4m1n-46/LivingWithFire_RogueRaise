import { fetchMappingBatch } from "@/lib/queries/fusion";
import { Card, CardContent } from "@/components/ui/card";
import { FusionClient } from "./fusion-client";

export const dynamic = "force-dynamic";

export default async function FusionBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  const batch = await fetchMappingBatch(batchId);

  if (!batch) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Schema Mapping Review</h2>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              Batch not found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The analysis batch &quot;{batchId}&quot; does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Schema Mapping Review</h2>
        <p className="text-sm text-muted-foreground">
          {batch.source_dataset}{" "}
          <span className="font-mono">{batch.source_id_code}</span>
        </p>
      </div>
      <FusionClient batch={batch} />
    </div>
  );
}
