// @ai-native-solutions/groundlevel-sdk · the public surface · MIT · plain ESM · zero dependencies
// The same 31 cases, weave, compliance rules and drafting the GroundLevel page runs
// (https://sjgant80-hub.github.io/groundlevel/), as importable modules. No DOM, no network, no storage.

export { CASE_DB, AREAS, STRANDS_USED, caseById, casesByArea, casesByStrand } from './cases.js';
export { WEAVE_PATTERNS, WEAVE_STRANDS, PATTERN_KEYS, STRAND_NAMES } from './weaves.js';
export { searchCases, scoreCaseAgainst } from './search.js';
export { runWeave, scoreRisk } from './weave.js';
export { DOC_TYPES, draftDocument } from './draft.js';
export { COMPLIANCE_RULES, auditCompliance } from './compliance.js';

export const VERSION = '1.1.0';
export const ATTRIBUTION = '@ai-native-solutions/groundlevel-sdk · MIT · AI Native Solutions · information, not legal advice';
