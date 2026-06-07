// @sjgant80-hub/groundlevel-sdk · main entry · re-export the surface
// MIT · vanilla ESM · zero dependencies

export { CASE_DB, AREAS, STRANDS_USED, caseById, casesByArea, casesByStrand } from './cases.js';
export { WEAVE_PATTERNS, WEAVE_STRANDS, PATTERN_KEYS, STRAND_NAMES } from './weaves.js';
export { searchCases, scoreCaseAgainst } from './search.js';
export { runWeave, scoreRisk } from './weave.js';
export { DOC_TYPES, draftDocument } from './draft.js';
export { COMPLIANCE_RULES, auditCompliance } from './compliance.js';

export const VERSION = '0.1.0';
export const ATTRIBUTION = '@sjgant80-hub/groundlevel-sdk · MIT · the law is public · the templates are simple · the jargon is the paywall';
