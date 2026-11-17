// examples/basic.js · the surface end to end · run: node examples/basic.js
import { CASE_DB, searchCases, runWeave, scoreRisk, draftDocument, auditCompliance, VERSION } from '../src/index.js';

console.log(`groundlevel-sdk v${VERSION} · ${CASE_DB.length} cases`);
const hits = searchCases('landlord did not protect my deposit', 'housing');
console.log('top case:', hits[0].citation);
const weave = await runWeave('employer dismissed me without process', 'unfair_dismissal');
const match = scoreRisk(weave);
console.log(`authority match: ${match.label} (${match.pct}%) · ${match.basis}`);
const { draft, citations } = await draftDocument({ type: 'witness_statement', facts: 'On 12 May I was dismissed.\nNo one investigated.', parties: 'Smith v Acme Ltd', court: 'EMPLOYMENT TRIBUNAL' });
console.log(`witness statement: ${draft.split('\n').length} lines, ${citations.length} cases cited`);
const audit = auditCompliance({ ca_size: '10-49', ca_uses_ai: 'yes', ca_eu_users: 'yes', ca_audit_log: 'no', ca_dpa: 'no', ca_breach_plan: 'no' });
console.log(audit.summary);
if (!hits.length || !citations || audit.gaps.length < 3) { console.error('the example did not produce what it should'); process.exit(1); }
