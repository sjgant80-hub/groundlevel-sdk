// test/sdk.test.js · node --test runner · sanity guarantees for every export
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CASE_DB, AREAS, STRANDS_USED, caseById, casesByArea, casesByStrand,
  WEAVE_PATTERNS, WEAVE_STRANDS, PATTERN_KEYS, STRAND_NAMES,
  searchCases, scoreCaseAgainst,
  runWeave, scoreRisk,
  DOC_TYPES, draftDocument,
  COMPLIANCE_RULES, auditCompliance,
  VERSION,
} from '../src/index.js';

test('CASE_DB has at least 25 cases · every entry has required fields', () => {
  assert.ok(CASE_DB.length >= 25);
  CASE_DB.forEach(c => {
    assert.ok(c.id && c.citation && c.area && c.principle, `bad case: ${JSON.stringify(c).slice(0, 80)}`);
    assert.ok(Array.isArray(c.strands), `case ${c.id} missing strands array`);
  });
});

test('AREAS / STRANDS_USED derived correctly', () => {
  assert.ok(AREAS.includes('housing'));
  assert.ok(AREAS.includes('employment'));
  assert.ok(STRANDS_USED.includes('GUILD'));
});

test('case helpers · caseById / casesByArea / casesByStrand', () => {
  assert.ok(caseById('polkey-1987'));
  assert.equal(caseById('not-real'), null);
  assert.ok(casesByArea('employment').length >= 5);
  assert.ok(casesByStrand('GUILD').length >= 5);
});

test('WEAVE_PATTERNS · 10+ patterns · each has strands+keywords', () => {
  assert.ok(PATTERN_KEYS.length >= 10);
  Object.values(WEAVE_PATTERNS).forEach(p => {
    assert.ok(p.strands && p.keywords);
  });
  assert.equal(WEAVE_STRANDS.length, 7);
  assert.deepEqual(STRAND_NAMES.sort(), ['ADMIRALTY','CROWN','EQUITY','GUILD','HEARTH','LIBERTY','MAGNA']);
});

test('searchCases · returns scored, ranked hits', () => {
  const hits = searchCases('landlord deposit protection scheme');
  assert.ok(hits.length > 0);
  assert.ok(hits[0]._score > 0);
  for (let i = 1; i < hits.length; i++) assert.ok(hits[i - 1]._score >= hits[i]._score);
});

test('searchCases · area filter narrows pool', () => {
  const housing = searchCases('deposit', 'housing');
  const all = searchCases('deposit');
  assert.ok(all.length >= housing.length);
  housing.forEach(c => assert.equal(c.area, 'housing'));
});

test('searchCases · empty query returns empty', () => {
  assert.deepEqual(searchCases(''), []);
});

test('runWeave · returns 7 strands · contradiction array · no synthesis without ai', async () => {
  const w = await runWeave('employer dismissed me without process', 'unfair_dismissal');
  assert.equal(w.results.length, 7);
  assert.ok(Array.isArray(w.contradictions));
  assert.equal(w.synthesis, '');
});

test('runWeave · synthesis populated when aiComplete given', async () => {
  const w = await runWeave('gdpr breach class action', 'gdpr_breach', {
    aiComplete: async (sys, user) => 'AI synthesis placeholder for ' + user.slice(0, 20),
  });
  assert.ok(w.synthesis.startsWith('AI synthesis'));
});

test('scoreRisk · returns label/kind/recommendation', async () => {
  const w = await runWeave('landlord deposit unprotected', 'deposit_dispute');
  const r = scoreRisk(w);
  assert.ok(typeof r.pct === 'number');
  assert.ok(['STRONG','MODERATE','WEAK','MINIMAL'].includes(r.label));
  assert.ok(r.recommendation.length > 10);
});

test('draftDocument · default type is legal_brief · citations attached', async () => {
  const { draft, citations } = await draftDocument({
    facts: 'Platform owes $4200 for completed work.\nMultiple invoices ignored.',
  });
  assert.ok(draft.includes('LEGAL BRIEF'));
  assert.ok(Array.isArray(citations));
});

test('draftDocument · every DOC_TYPE produces non-empty draft', async () => {
  for (const type of DOC_TYPES) {
    const { draft } = await draftDocument({ type, facts: 'facts', parties: 'A v B', court: 'X' });
    assert.ok(draft.length > 100, `type ${type} produced empty draft`);
  }
});

test('auditCompliance · zero gaps when nothing risky declared', () => {
  const r = auditCompliance({
    ca_size: '1',
    ca_personal_data: 'none',
    ca_uses_ai: 'no',
    ca_employment_contracts: 'yes',
    ca_t_and_c: 'recent',
    ca_subscription: 'no',
    ca_dpa: 'yes',
    ca_privacy_policy: 'yes',
    ca_dsar_process: 'documented',
    ca_records: 'yes',
    ca_breach_plan: 'yes',
    ca_health_safety: 'yes',
    ca_cyber: 'none',
  });
  assert.equal(r.gaps.length, 0);
  assert.equal(r.score, 100);
});

test('auditCompliance · catches AI-without-audit-log gap', () => {
  const r = auditCompliance({ ca_uses_ai: 'yes', ca_eu_users: 'yes', ca_audit_log: 'no' });
  assert.ok(r.gaps.some(g => g.id === 'eu_ai_act_audit'));
});

test('COMPLIANCE_RULES · every rule has check/severity/gap/remedy', () => {
  COMPLIANCE_RULES.forEach(r => {
    assert.ok(r.id && r.framework && r.gap && r.remedy);
    assert.ok(['high','medium','low'].includes(r.severity));
    assert.equal(typeof r.check, 'function');
  });
});

test('VERSION exported', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});
