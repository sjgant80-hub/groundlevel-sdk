// examples/basic.js · prove the surface works end-to-end
// run: node examples/basic.js

import {
  CASE_DB, WEAVE_PATTERNS, STRAND_NAMES,
  searchCases, runWeave, scoreRisk,
  draftDocument, auditCompliance,
  VERSION,
} from '../src/index.js';

console.log(`@sjgant80-hub/groundlevel-sdk · v${VERSION}`);
console.log(`◊ ${CASE_DB.length} cases · ${Object.keys(WEAVE_PATTERNS).length} patterns · ${STRAND_NAMES.length} strands`);
console.log('');

// 1 · case search
console.log('── search: "landlord deposit not protected" in housing ──');
const hits = searchCases('landlord deposit not protected', 'housing');
hits.slice(0, 3).forEach(c => console.log(`  ${c._score}pt · ${c.citation}`));
console.log('');

// 2 · weave
console.log('── weave: "employer dismissed me without process" (unfair_dismissal) ──');
const weave = await runWeave('employer dismissed me without process', 'unfair_dismissal');
weave.results.forEach(r => {
  const top = r.cases[0];
  console.log(`  ${r.strand.padEnd(10)} weight=${r.weight.toFixed(1)} ${top ? '→ ' + top.citation : '— no strong hit'}`);
});
console.log(`  contradictions: ${weave.contradictions.length}`);
console.log('');

// 3 · risk
console.log('── risk score ──');
const risk = scoreRisk(weave);
console.log(`  ${risk.label} (${risk.pct}%) · ${risk.recommendation}`);
console.log('');

// 4 · draft
console.log('── draft: witness_statement ──');
const { draft, citations } = await draftDocument({
  type: 'witness_statement',
  facts: 'On 12 May, I was summarily dismissed.\nNo investigation took place.\nA grievance was filed and ignored.',
  parties: 'Smith v Acme Ltd',
  court: 'EMPLOYMENT TRIBUNAL',
});
console.log('  draft starts with:');
console.log('    ' + draft.split('\n').slice(0, 5).join('\n    '));
console.log(`  ${citations.length} citations auto-attached`);
console.log('');

// 5 · compliance
console.log('── audit: small EU-facing SaaS with no audit log ──');
const audit = auditCompliance({
  ca_size: '10-49',
  ca_uses_ai: 'yes',
  ca_eu_users: 'yes',
  ca_audit_log: 'no',
  ca_dpa: 'no',
  ca_breach_plan: 'no',
});
console.log(`  posture score: ${audit.score}/100`);
audit.gaps.forEach(g => console.log(`  · [${g.severity}] ${g.framework}: ${g.gap}`));
console.log('');
console.log('◊ all engines green · the law is public');
