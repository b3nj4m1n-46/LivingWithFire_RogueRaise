import { queryProd } from "@/lib/production";
import { query } from "@/lib/dolt";

// --- Types ---

export interface PlantListRow {
  id: string;
  genus: string;
  species: string;
  common_name: string | null;
  attribute_count: number;
  last_updated: string | null;
}

export interface PlantListResult {
  plants: PlantListRow[];
  total: number;
  page: number;
  limit: number;
}

// --- Constants ---

const PAGE_SIZE = 50;

const SORTABLE_COLUMNS: Record<string, string> = {
  scientific_name: "p.genus, p.species",
  common_name: "p.common_name",
  last_updated: "p.last_updated",
  attribute_count: "attribute_count",
};

// --- Query Functions ---

export async function fetchPlantList(
  search?: string,
  page = 1,
  limit = PAGE_SIZE,
  sort = "scientific_name",
  order = "asc"
): Promise<PlantListResult> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      `(LOWER(p.genus || ' ' || p.species) LIKE $${paramIndex} OR LOWER(COALESCE(p.common_name, '')) LIKE $${paramIndex})`
    );
    params.push(term);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const orderCol = SORTABLE_COLUMNS[sort] ?? SORTABLE_COLUMNS.scientific_name;
  const orderDir = order === "desc" ? "DESC" : "ASC";
  const orderClause = `ORDER BY ${orderCol} ${orderDir}`;

  const offset = (page - 1) * limit;

  const [plants, countResult] = await Promise.all([
    queryProd<PlantListRow>(
      `SELECT
         p.id,
         p.genus,
         p.species,
         p.common_name,
         (SELECT COUNT(*)::int FROM "values" WHERE plant_id = p.id) AS attribute_count,
         p.last_updated
       FROM plants p
       ${whereClause}
       ${orderClause}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    ),
    queryProd<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM plants p ${whereClause}`,
      params
    ),
  ]);

  return {
    plants,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  };
}

// --- Plant Detail Types ---

export interface PlantDetailIdentity {
  id: string;
  genus: string;
  species: string;
  common_name: string | null;
  last_updated: string | null;
}

export interface AttributeValueRow {
  attribute_id: string;
  attribute_name: string;
  category: string | null;
  value: string;
  source_name: string | null;
  source_id: string | null;
}

export interface CurationOverlay {
  warrantCounts: Record<string, number>;
  conflictCounts: Record<string, number>;
  pendingClaims: Record<string, { id: string; status: string }>;
}

export interface PlantDetail {
  plant: PlantDetailIdentity;
  attributes: AttributeValueRow[];
  categories: string[];
  overlay: CurationOverlay;
  pendingSync: boolean;
  pendingClaimCount: number;
}

// --- Plant Detail Query ---

export async function fetchPlantDetail(
  plantId: string
): Promise<PlantDetail | null> {
  const [plant, attributes, warrantRows, conflictRows, claimRows] =
    await Promise.all([
      // 1. Plant identity (Neon)
      queryProd<PlantDetailIdentity>(
        `SELECT id, genus, species, common_name, last_updated
         FROM plants WHERE id = $1`,
        [plantId]
      ).then((rows) => rows[0] ?? null),

      // 2. All attribute values with category and source (Neon)
      queryProd<AttributeValueRow>(
        `SELECT
           v.attribute_id,
           a.name AS attribute_name,
           pa.name AS category,
           v."value",
           s.name AS source_name,
           v.source_id
         FROM "values" v
         JOIN attributes a ON a.id = v.attribute_id
         LEFT JOIN attributes pa ON pa.id = a.parent_attribute_id
         LEFT JOIN sources s ON s.id = v.source_id
         WHERE v.plant_id = $1
         ORDER BY pa.name, a.name`,
        [plantId]
      ),

      // 3. Warrant counts per attribute (Dolt)
      query<{ attribute_id: string; count: number }>(
        `SELECT attribute_id, COUNT(*)::int AS count
         FROM warrants
         WHERE plant_id = $1 AND status != 'excluded'
         GROUP BY attribute_id`,
        [plantId]
      ),

      // 4. Unresolved conflict counts per attribute (Dolt)
      query<{ attribute_name: string; count: number }>(
        `SELECT attribute_name, COUNT(*)::int AS count
         FROM conflicts
         WHERE plant_id = $1 AND status IN ('pending', 'annotated')
         GROUP BY attribute_name`,
        [plantId]
      ),

      // 5. Pending claims per attribute (Dolt)
      query<{ attribute_id: string; id: string; status: string }>(
        `SELECT attribute_id, id, status
         FROM claims
         WHERE plant_id = $1 AND status IN ('draft', 'approved')`,
        [plantId]
      ),
    ]);

  if (!plant) return null;

  // Build overlay records
  const warrantCounts: Record<string, number> = {};
  for (const r of warrantRows) {
    warrantCounts[r.attribute_id] = Number(r.count);
  }

  const conflictCounts: Record<string, number> = {};
  for (const r of conflictRows) {
    conflictCounts[r.attribute_name] = Number(r.count);
  }

  const pendingClaims: Record<string, { id: string; status: string }> = {};
  for (const r of claimRows) {
    pendingClaims[r.attribute_id] = { id: r.id, status: r.status };
  }

  const pendingClaimCount = claimRows.filter(
    (r) => r.status === "approved"
  ).length;

  // Extract distinct categories in query order
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const a of attributes) {
    const cat = a.category ?? "Uncategorized";
    if (!seen.has(cat)) {
      seen.add(cat);
      categories.push(cat);
    }
  }

  return {
    plant,
    attributes,
    categories,
    overlay: { warrantCounts, conflictCounts, pendingClaims },
    pendingSync: pendingClaimCount > 0,
    pendingClaimCount,
  };
}
