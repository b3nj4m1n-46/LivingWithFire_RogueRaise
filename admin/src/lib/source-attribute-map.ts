/**
 * Reverse index: given a production attribute UUID, find which source
 * databases carry data for it. Derived at runtime from SOURCE_DATABASES
 * (source-registry.ts) and COLUMN_TO_ATTRIBUTE (attribute-map.ts).
 */

import path from "path";
import {
  DATABASE_SOURCES_ROOT,
  SOURCE_DATABASES,
  type SourceEntry,
} from "@/lib/source-registry";
import {
  resolveAttribute,
  CALCULATED_ATTRIBUTE_IDS,
} from "@/lib/attribute-map";

export interface SourceAttributeLink {
  sourceId: string;
  displayName: string;
  category: string;
  dbPath: string;
  tableName: string;
  nameColumn: string;
  sourceColumn: string;
}

let reverseIndex: Map<string, SourceAttributeLink[]> | null = null;

function buildReverseIndex(): Map<string, SourceAttributeLink[]> {
  const index = new Map<string, SourceAttributeLink[]>();

  for (const entry of SOURCE_DATABASES) {
    const dbPath = path.join(
      DATABASE_SOURCES_ROOT,
      entry.folder,
      entry.dbFile || "plants.db"
    );

    for (const col of entry.keyColumns) {
      const mapping = resolveAttribute(col);
      if (!mapping) continue;
      if (CALCULATED_ATTRIBUTE_IDS.has(mapping.attributeId)) continue;

      const link: SourceAttributeLink = {
        sourceId: entry.sourceId,
        displayName: entry.displayName,
        category: entry.category,
        dbPath,
        tableName: entry.tableName,
        nameColumn: entry.nameColumn,
        sourceColumn: col,
      };

      const existing = index.get(mapping.attributeId);
      if (existing) {
        existing.push(link);
      } else {
        index.set(mapping.attributeId, [link]);
      }
    }
  }

  return index;
}

export function getSourcesForAttribute(
  attributeId: string
): SourceAttributeLink[] {
  if (!reverseIndex) {
    reverseIndex = buildReverseIndex();
  }
  return reverseIndex.get(attributeId) ?? [];
}
