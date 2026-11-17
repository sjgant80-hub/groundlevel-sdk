// scripts/parity.mjs · the SDK and the live GroundLevel page must hold the same data and the same words.
// Reads the page (default: the published docs/index.html on GitHub; or a local path) and compares, field by field:
// the 31 cases, the 10 weave patterns and 7 strands, the 13 compliance rules (and each rule's verdict on a battery
// of inputs), and the authority-match wording. Exits 1 on any difference.   node scripts/parity.mjs [page]
import { readFileSync } from 'node:fs';
import { CASE_DB, WEAVE_PATTERNS, WEAVE_STRANDS, COMPLIANCE_RULES, scoreRisk } from '../src/index.js';

const src = process.argv[2]
  ? readFileSync(process.argv[2], 'utf8')
  : await (await fetch('https://raw.githubusercontent.com/sjgant80-hub/groundlevel/main/docs/index.html')).text();
const take = (decl, close) => { const a = src.indexOf(decl); if (a < 0) throw new Error('page has no ' + decl); return src.slice(a + decl.length - 1, src.indexOf(close, a) + close.length - 1); };
const page = {
  CASE_DB: eval(take('const CASE_DB = [', '\n];')),
  WEAVE_PATTERNS: eval('(' + take('const WEAVE_PATTERNS = {', '\n};') + ')'),
  WEAVE_STRANDS: eval(take('const WEAVE_STRANDS = [', '\n];')),
  COMPLIANCE_RULES: eval(take('const COMPLIANCE_RULES = [', '\n];')),
};
const fails = [];
const same = (what, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) fails.push(what); };
same('the cases', CASE_DB, page.CASE_DB);
same('the weave patterns', WEAVE_PATTERNS, page.WEAVE_PATTERNS);
same('the weave strands', WEAVE_STRANDS, page.WEAVE_STRANDS);
const words = (rules) => rules.map(({ id, framework, severity, gap, remedy }) => ({ id, framework, severity, gap, remedy }));
same('the compliance rules', words(COMPLIANCE_RULES), words(page.COMPLIANCE_RULES));
const V = ['', 'yes', 'no', 'maybe', 'planning', 'none', 'standard', 'stale', 'informal', 'documented', 'never', 'incident', 'us', '1', '2-9', '10-49', '250+'];
const KEYS = ['ca_jurisdiction', 'ca_size', 'ca_personal_data', 'ca_dpa', 'ca_privacy_policy', 'ca_dsar_process', 'ca_records', 'ca_uses_ai', 'ca_eu_users', 'ca_audit_log', 'ca_employment_contracts', 'ca_handbook', 't_and_c', 'ca_t_and_c', 'ca_subscription', 'ca_breach_plan', 'ca_health_safety', 'ca_cyber'];
let n = 0;
for (let i = 0; i < 4000; i++) {
  const v = {}; KEYS.forEach((k, j) => { const x = V[(i * 7 + j * 13 + (i >> j % 5)) % V.length]; if (x) v[k] = x; });
  const a = COMPLIANCE_RULES.map((r) => r.check(v)), b = page.COMPLIANCE_RULES.map((r) => r.check(v));
  n++; if (JSON.stringify(a) !== JSON.stringify(b)) { fails.push('a compliance verdict on ' + JSON.stringify(v)); break; }
}
for (const s of [8.75, 5, 1.25, 0]) {
  const rec = scoreRisk({ results: [{ cases: [{ _score: s }] }] }).recommendation;
  if (!src.includes(`'${rec}'`)) fails.push('the authority-match wording: ' + rec.slice(0, 40));
}
if (fails.length) { console.error('PARITY FAILED: the SDK and the live page differ in ' + fails.join('; ')); process.exit(1); }
console.log(`parity: ${CASE_DB.length} cases, ${Object.keys(WEAVE_PATTERNS).length} patterns, ${WEAVE_STRANDS.length} strands, ${COMPLIANCE_RULES.length} rules (${n} input sets) and the match wording are the page's own`);
