import Link from "next/link";
import { fetchDashboardData } from "@/lib/queries/dashboard";
import { getAttributeCoverage } from "@/lib/queries/coverage";
import { SummaryCards } from "@/components/summary-cards";
import { BatchesTable } from "@/components/batches-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, coverage] = await Promise.all([
    fetchDashboardData(),
    getAttributeCoverage().catch(() => []),
  ]);
  const lowCoverageCount = coverage.filter((a) => a.coveragePct < 50).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <SummaryCards
        warrants={data.warrants}
        conflicts={data.conflicts}
        claims={data.claims}
        datasets={data.datasets}
        mappingStats={data.mappingStats}
        pendingSyncCount={data.pendingSyncCount}
        internalAuditConflictCount={data.internalAuditConflictCount}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card size="sm">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Plants</p>
            <p className="text-xl font-bold">{coverage[0]?.totalPlants?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Avg Coverage</p>
            <p className="text-xl font-bold">
              {coverage.length > 0
                ? `${(Math.round((coverage.reduce((s, a) => s + a.coveragePct, 0) / coverage.length) * 10) / 10)}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Low Coverage Attrs</p>
            <p className={`text-xl font-bold ${lowCoverageCount > 0 ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
              {lowCoverageCount}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Pending Conflicts</p>
            <p className={`text-xl font-bold ${data.conflicts.pending > 0 ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
              {data.conflicts.pending}
            </p>
          </CardContent>
        </Card>
      </div>
      {data.topConflictingPairs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Conflicting Source Pairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topConflictingPairs.map((pair) => (
                <Link
                  key={`${pair.source_a}-${pair.source_b}`}
                  href={`/conflicts?sourceA=${encodeURIComponent(pair.source_a)}&sourceB=${encodeURIComponent(pair.source_b)}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <span>
                    <span className="font-medium">{pair.source_a}</span>
                    {" vs "}
                    <span className="font-medium">{pair.source_b}</span>
                  </span>
                  <Badge variant="secondary">
                    {pair.count.toLocaleString()} pending
                  </Badge>
                </Link>
              ))}
            </div>
            <Button variant="outline" size="xs" className="mt-3" nativeButton={false} render={<Link href="/conflicts?view=matrix" />}>
              View full matrix
            </Button>
          </CardContent>
        </Card>
      )}

      <BatchesTable
        batches={data.batches}
        conflictsBySeverity={data.conflicts.bySeverity}
        criticalPendingCount={data.criticalPendingCount}
        unreviewedLatestBatchCount={data.unreviewedLatestBatchCount}
      />
    </div>
  );
}
