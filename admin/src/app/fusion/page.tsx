import {
  fetchAvailableDatasets,
  fetchFusionBatches,
  type DatasetInfo,
  type FusionBatch,
} from "@/lib/queries/fusion";
import { FusionLanding } from "./fusion-landing";

export const dynamic = "force-dynamic";

export default async function FusionPage() {
  let datasets: DatasetInfo[] = [];
  let batches: FusionBatch[] = [];
  try {
    [datasets, batches] = await Promise.all([
      fetchAvailableDatasets(),
      fetchFusionBatches(),
    ]);
  } catch {
    // Render with empty data — the client can still trigger mapping
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Fusion</h2>
      <FusionLanding initialDatasets={datasets} initialBatches={batches} />
    </div>
  );
}
