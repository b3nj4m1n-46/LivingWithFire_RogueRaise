import { fetchAllReliability } from "@/lib/queries/reliability";
import { ReliabilityClient } from "./reliability-client";

export const dynamic = "force-dynamic";

export default async function ReliabilityPage() {
  const rows = await fetchAllReliability();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Source Reliability</h1>
        <p className="text-muted-foreground">
          Manage per-source reliability weights. Steward scores override auto-scores in synthesis.
        </p>
      </div>
      <ReliabilityClient initialRows={rows} />
    </div>
  );
}
