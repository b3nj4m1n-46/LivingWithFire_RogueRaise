import { fetchCommitLog } from "@/lib/queries/history";
import { HistoryClient } from "./history-client";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const entries = await fetchCommitLog(50, 0);

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">History</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Dolt commit log — every data change is tracked as a versioned commit.
      </p>
      <HistoryClient initialEntries={entries} />
    </div>
  );
}
