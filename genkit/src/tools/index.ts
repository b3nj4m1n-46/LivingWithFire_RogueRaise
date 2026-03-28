export { doltPool, queryDolt } from './dolt.js';
export { getDatasetContext } from './datasetContext.js';
export { lookupProductionPlant } from './lookupPlant.js';
export { getSourceMetadata } from './sourceMetadata.js';
export { resolveSynonym } from './resolveSynonym.js';
export { fuzzyMatchPlant } from './fuzzyMatch.js';

// Convenience array for flows that want all tools available
import { queryDolt as _queryDolt } from './dolt.js';
import { getDatasetContext as _getDatasetContext } from './datasetContext.js';
import { lookupProductionPlant as _lookupProductionPlant } from './lookupPlant.js';
import { getSourceMetadata as _getSourceMetadata } from './sourceMetadata.js';
import { resolveSynonym as _resolveSynonym } from './resolveSynonym.js';
import { fuzzyMatchPlant as _fuzzyMatchPlant } from './fuzzyMatch.js';

export const allTools = [
  _queryDolt,
  _getDatasetContext,
  _lookupProductionPlant,
  _getSourceMetadata,
  _resolveSynonym,
  _fuzzyMatchPlant,
];
