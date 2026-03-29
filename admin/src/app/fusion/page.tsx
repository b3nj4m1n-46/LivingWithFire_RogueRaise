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
    datasets = await fetchAvailableDatasets();
  } catch {
    // Filesystem issue — truly empty
  }
  try {
    batches = await fetchFusionBatches();
  } catch {
    // DB unavailable — show datasets without batch history
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Fusion</h2>
      <FusionLanding initialDatasets={datasets} initialBatches={batches} />
    </div>
  );
}
