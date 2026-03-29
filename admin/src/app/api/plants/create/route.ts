import pool from "@/lib/dolt";

interface AttributeInput {
  attributeId: string;
  attributeName: string;
  value: string;
  sourceIdCode: string;
  sourceValue?: string;
  sourceDataset?: string;
  matchConfidence: number;
}

interface CreatePlantBody {
  genus: string;
  species: string;
  commonName?: string;
  notes?: string;
  attributes: AttributeInput[];
  curatorNotes?: string;
}

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const body: CreatePlantBody = await request.json();
    const { genus, species, commonName, notes, attributes, curatorNotes } = body;

    if (!genus?.trim() || !species?.trim()) {
      return Response.json(
        { error: "genus and species are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(attributes) || attributes.length === 0) {
      return Response.json(
        { error: "At least one attribute is required" },
        { status: 400 }
      );
    }

    // Generate plant UUID
    const plantIdResult = await client.query<{ id: string }>(
      "SELECT gen_random_uuid()::text AS id"
    );
    const plantId = plantIdResult.rows[0].id;

    // Insert plant into Dolt staging
    await client.query(
      `INSERT INTO plants (id, genus, species, common_name, notes, last_updated)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [plantId, genus.trim(), species.trim(), commonName?.trim() || null, notes?.trim() || null]
    );

    const plantName = `${genus.trim()} ${species.trim()}`;
    let warrantCount = 0;
    let claimCount = 0;

    // Create warrants + claims for each attribute
    for (const attr of attributes) {
      // Generate warrant UUID
      const warrantIdResult = await client.query<{ id: string }>(
        "SELECT gen_random_uuid()::text AS id"
      );
      const warrantId = warrantIdResult.rows[0].id;

      // Insert warrant
      await client.query(
        `INSERT INTO warrants (
          id, warrant_type, status,
          plant_id, plant_genus, plant_species,
          attribute_id, attribute_name,
          value, source_value,
          source_id_code, source_dataset,
          match_method, match_confidence,
          admin_notes, created_at
        ) VALUES (
          $1, 'manual_entry', 'included',
          $2, $3, $4,
          $5, $6,
          $7, $8,
          $9, $10,
          'exact', $11,
          $12, NOW()
        )`,
        [
          warrantId,
          plantId,
          genus.trim(),
          species.trim(),
          attr.attributeId,
          attr.attributeName,
          attr.value,
          attr.sourceValue || attr.value,
          attr.sourceIdCode,
          attr.sourceDataset || null,
          attr.matchConfidence,
          curatorNotes || null,
        ]
      );
      warrantCount++;

      // Generate claim UUID
      const claimIdResult = await client.query<{ id: string }>(
        "SELECT gen_random_uuid()::text AS id"
      );
      const claimId = claimIdResult.rows[0].id;

      // Insert pre-approved claim
      await client.query(
        `INSERT INTO claims (
          id, status,
          plant_id, attribute_id,
          plant_name, attribute_name,
          categorical_value, synthesized_text,
          confidence, confidence_reasoning,
          warrant_count,
          approved_by, approved_at,
          created_at
        ) VALUES (
          $1, 'approved',
          $2, $3,
          $4, $5,
          $6, $7,
          $8, $9,
          $10,
          'admin', NOW(),
          NOW()
        )`,
        [
          claimId,
          plantId,
          attr.attributeId,
          plantName,
          attr.attributeName,
          attr.value,
          "Manual entry by curator",
          "HIGH",
          "Curator-reviewed manual entry",
          1,
        ]
      );
      claimCount++;

      // Insert claim_warrant junction
      const cwIdResult = await client.query<{ id: string }>(
        "SELECT gen_random_uuid()::text AS id"
      );
      await client.query(
        `INSERT INTO claim_warrants (id, claim_id, warrant_id) VALUES ($1, $2, $3)`,
        [cwIdResult.rows[0].id, claimId, warrantId]
      );
    }

    // Dolt: stage and commit
    await client.query(`SELECT dolt_add('.')`);

    const commitMsg = `Manual entry: ${plantName} (${attributes.length} attributes from ${new Set(attributes.map((a) => a.sourceIdCode)).size} sources)`;
    const commitResult = await client.query(
      `SELECT dolt_commit('-m', $1)`,
      [commitMsg]
    );

    const commitRow = commitResult.rows[0];
    const commitHash =
      typeof commitRow === "object"
        ? Object.values(commitRow as Record<string, unknown>)[0]
        : String(commitRow);

    return Response.json({
      plantId,
      commitHash: String(commitHash),
      warrantCount,
      claimCount,
    });
  } catch (error) {
    console.error("POST /api/plants/create error:", error);

    try {
      await client.query(`SELECT dolt_checkout('.')`);
    } catch {
      // Ignore cleanup errors
    }

    return Response.json(
      { error: "Failed to create plant" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
