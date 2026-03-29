import { fetchSyncPreview, type SyncPreviewRow } from "@/lib/queries/sync";
import { SyncClient } from "./sync-client";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  let preview: { claims: SyncPreviewRow[]; totalChanges: number };
  try {
    preview = await fetchSyncPreview();
  } catch {
    preview = { claims: [], totalChanges: 0 };
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Push to Production</h2>
      <SyncClient initialPreview={preview} />
    </div>
  );
}
