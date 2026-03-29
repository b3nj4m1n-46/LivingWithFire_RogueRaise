import {
  fetchMatrixData,
  type MatrixFilters,
} from "@/lib/queries/conflict-matrix";
import { fetchConflictFilterOptions } from "@/lib/queries/conflicts";
import { MatrixClient } from "./matrix-client";

export const dynamic = "force-dynamic";

export default async function MatrixPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  const filters: MatrixFilters = {
    status: params.status,
    severity: params.severity,
    conflictType: params.conflictType,
  };

  const [data, filterOptions] = await Promise.all([
    fetchMatrixData(filters),
    fetchConflictFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Conflict Matrix</h2>
      <MatrixClient
        data={data}
        currentFilters={filters}
        filterOptions={{
          statuses: filterOptions.statuses,
          severities: filterOptions.severities,
          conflictTypes: filterOptions.conflictTypes,
        }}
      />
    </div>
  );
}
