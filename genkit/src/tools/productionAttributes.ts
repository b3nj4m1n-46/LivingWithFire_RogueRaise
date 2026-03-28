import { z } from 'zod';
import { ai } from '../config.js';
import { doltPool } from './dolt.js';

const attributeRow = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  parentName: z.string().nullable(),
  valueType: z.string(),
  valuesAllowed: z.string().nullable(),
  selectionType: z.string().nullable(),
});

export const getProductionAttributes = ai.defineTool(
  {
    name: 'getProductionAttributes',
    description:
      'Returns the full production attribute hierarchy (125 attributes) from the staging DB. ' +
      'Each attribute includes its UUID, name, parent category, value type, and allowed values. ' +
      'Use this to understand the target schema when mapping source columns.',
    inputSchema: z.object({
      category: z
        .string()
        .optional()
        .describe('Optional: filter by top-level parent category name (case-insensitive)'),
    }),
    outputSchema: z.object({
      attributes: z.array(attributeRow),
      count: z.number(),
    }),
  },
  async (input) => {
    const baseSql = `
      SELECT a.id, a.name,
             a.parent_attribute_id AS "parentId",
             p.name AS "parentName",
             a.value_type AS "valueType",
             a.values_allowed AS "valuesAllowed",
             a.selection_type AS "selectionType"
      FROM attributes a
      LEFT JOIN attributes p ON a.parent_attribute_id = p.id`;

    let sql: string;
    let params: string[];

    if (input.category) {
      sql = `${baseSql} WHERE LOWER(p.name) = LOWER($1) ORDER BY a.name`;
      params = [input.category];
    } else {
      sql = `${baseSql} ORDER BY p.name NULLS FIRST, a.name`;
      params = [];
    }

    const result = await doltPool.query(sql, params);

    const attributes = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      parentId: (row.parentId as string) ?? null,
      parentName: (row.parentName as string) ?? null,
      valueType: row.valueType as string,
      valuesAllowed: (row.valuesAllowed as string) ?? null,
      selectionType: (row.selectionType as string) ?? null,
    }));

    return { attributes, count: attributes.length };
  },
);
