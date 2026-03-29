import { fetchPlantDetail } from "@/lib/queries/plants";
import { PlantDetailClient } from "./plant-detail-client";

export const dynamic = "force-dynamic";

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ plantId: string }>;
}) {
  const { plantId } = await params;

  let data: Awaited<ReturnType<typeof fetchPlantDetail>> = null;
  try {
    data = await fetchPlantDetail(plantId);
  } catch {
    // DB may not be available
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Plant Not Found</h2>
        <p className="text-muted-foreground">
          No plant exists with this ID, or the database is unavailable.
        </p>
      </div>
    );
  }

  return <PlantDetailClient data={data} />;
}
