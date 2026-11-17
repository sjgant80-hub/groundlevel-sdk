// test/gate.test.js · the tests the mutation gate needs: every rule's truth table, every threshold edge,
// every default and every document header pinned, so a flipped condition cannot pass unnoticed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CASE_DB, casesByArea, caseById, searchCases, scoreCaseAgainst, runWeave, scoreRisk,
  DOC_TYPES, draftDocument, COMPLIANCE_RULES, auditCompliance, PATTERN_KEYS,
} from '../src/index.js';

const tiensia = caseById('tiensia-2010');

test('casesByArea returns exactly that area', () => {
  const emp = casesByArea('employment');
  assert.ok(emp.length >= 5);
  assert.ok(emp.every((c) => c.area === 'employment'));
  assert.equal(emp.length, CASE_DB.filter((c) => c.area === 'employment').length);
});

test('searchCases: tokens under three letters do not count, and zero scores are dropped', () => {
  assert.deepEqual(searchCases('of'), []);
  assert.deepEqual(searchCases('zzzqqqx'), []);
});

test('searchCases: tags, statute and principle each add to the score', () => {
  const pen = searchCases('penalty');
  assert.equal(pen.find((c) => c.id === 'tiensia-2010')._score, 5); // in the haystack via tags (2) + tag match (3)
  assert.equal(searchCases('215').find((c) => c.id === 'tiensia-2010')._score, 2); // only in the statute
  assert.equal(searchCases('liability').find((c) => c.id === 'tiensia-2010')._score, 5); // haystack (2) + principle (3)
});

test('searchCases: the area filter keeps only that area and still finds hits', () => {
  const housing = searchCases('deposit', 'housing');
  assert.ok(housing.length > 0);
  assert.ok(housing.every((c) => c.area === 'housing'));
  assert.ok(housing.some((c) => c.id === 'tiensia-2010'));
  assert.equal(searchCases('deposit', 'housing', { limit: 1 }).length, 1);
});

test('scoreCaseAgainst: short tokens ignored, tags count, pattern keywords add one each, no pattern is fine', () => {
  assert.equal(scoreCaseAgainst(tiensia, 'of'), 0);
  assert.equal(scoreCaseAgainst(tiensia, 'penalty'), 2);
  assert.equal(scoreCaseAgainst(tiensia, 'penalty', null), 2);
  assert.equal(scoreCaseAgainst(tiensia, 'penalty', { keywords: ['deposit', 'tenancy'] }), 3);
});

test('runWeave: a pattern sets the strand weights, and strands only take their own cases', async () => {
  const w = await runWeave('employer dismissed me without process', 'unfair_dismissal');
  const by = Object.fromEntries(w.results.map((r) => [r.strand, r]));
  assert.equal(by.GUILD.weight, 1); assert.equal(by.CROWN.weight, 0.7); assert.equal(by.MAGNA.weight, 0);
  assert.ok(by.GUILD.cases.length > 0);
  assert.ok(by.GUILD.cases.every((c) => c.strands.includes('GUILD')));
  const plain = await runWeave('employer dismissed me without process');
  assert.ok(plain.results.every((r) => r.weight === 1));
});

test('runWeave: nothing matching means empty strands, not zero-score filler', async () => {
  const w = await runWeave('zzzqqqx wwwkkk');
  assert.ok(w.results.every((r) => r.cases.length === 0));
  assert.deepEqual(w.contradictions, []);
});

test('runWeave: contradictions are same-area, different-outcome pairs of strand top cases', async () => {
  const data = await runWeave('data breach gdpr damages');
  assert.deepEqual(data.contradictions, [
    { a: 'MAGNA', b: 'LIBERTY', area: 'data' }, { a: 'MAGNA', b: 'EQUITY', area: 'data' }, { a: 'MAGNA', b: 'GUILD', area: 'data' },
    { a: 'LIBERTY', b: 'CROWN', area: 'data' }, { a: 'CROWN', b: 'EQUITY', area: 'data' }, { a: 'CROWN', b: 'GUILD', area: 'data' },
  ]);
  const emp = await runWeave('employer dismissed me without process unfair');
  assert.deepEqual(emp.contradictions, [{ a: 'MAGNA', b: 'LIBERTY', area: 'data' }, { a: 'LIBERTY', b: 'CROWN', area: 'data' }]);
});

test('runWeave: an AI synthesis that throws is swallowed', async () => {
  const w = await runWeave('data breach', 'gdpr_breach', { aiComplete: async () => { throw new Error('down'); } });
  assert.equal(w.synthesis, '');
  assert.equal(PATTERN_KEYS.includes('gdpr_breach'), true);
});

const one = (s) => ({ results: [{ cases: [{ _score: s }] }], contradictions: [] });
test('scoreRisk: the label edges sit exactly at 70, 40 and 10', () => {
  assert.equal(scoreRisk(one(8.75)).pct, 70); assert.equal(scoreRisk(one(8.75)).label, 'STRONG');
  assert.equal(scoreRisk(one(5)).label, 'MODERATE'); assert.equal(scoreRisk(one(5)).pct, 40);
  assert.equal(scoreRisk(one(1.25)).label, 'WEAK'); assert.equal(scoreRisk(one(1.25)).pct, 10);
  assert.equal(scoreRisk(one(1)).label, 'MINIMAL');
  assert.equal(scoreRisk(one(8.6)).label, 'MODERATE'); // 69
});

test('scoreRisk: reads the strand tops, deducts 8 per contradiction, tolerates missing parts', () => {
  assert.equal(scoreRisk({ results: [{ cases: [{ _score: 10 }] }] }).pct, 80);
  assert.equal(scoreRisk({ results: [{ cases: [{ _score: 10 }] }], contradictions: [{}, {}] }).pct, 64);
  assert.equal(scoreRisk({ results: [{ cases: [{ _score: 1 }] }], contradictions: [{}] }).pct, 0);
  assert.equal(scoreRisk({ results: [{ cases: [] }, { cases: [{ _score: 10 }] }] }).pct, 40);
  assert.equal(scoreRisk({}).pct, 0);
  assert.equal(scoreRisk(one(99)).pct, 100);
  const r = scoreRisk(one(10));
  assert.equal(r.kind, 'success');
  assert.match(r.basis, /not a prediction of the outcome/);
  assert.doesNotMatch(JSON.stringify([one(10), one(5), one(1.25), one(0)].map(scoreRisk)), /success rate|\d+-\d+%/);
});

const HEAD = {
  particulars_claim: 'PARTICULARS OF CLAIM', witness_statement: 'WITNESS STATEMENT OF', skeleton_argument: 'SKELETON ARGUMENT',
  position_statement: 'POSITION STATEMENT', legal_brief: 'LEGAL BRIEF', compliance_report: 'COMPLIANCE POSTURE REPORT', due_diligence: 'DUE DILIGENCE SUMMARY',
};
test('draftDocument: each type gets its own document, unknown types fall back to the brief', async () => {
  assert.deepEqual([...DOC_TYPES].sort(), Object.keys(HEAD).sort());
  for (const type of DOC_TYPES) {
    const { draft } = await draftDocument({ type, facts: 'facts' });
    assert.ok(draft.includes(HEAD[type]), type);
    for (const other of DOC_TYPES) if (other !== type && !HEAD[type].includes(HEAD[other])) assert.ok(!draft.includes(HEAD[other]), type + ' has ' + other);
  }
  assert.ok((await draftDocument({ type: 'nope', facts: 'x' })).draft.includes('LEGAL BRIEF'));
  assert.ok((await draftDocument({ facts: 'x' })).draft.includes('LEGAL BRIEF'));
});

test('draftDocument: given parties, court, relief and facts appear; defaults fill the gaps', async () => {
  const given = (await draftDocument({ type: 'particulars_claim', facts: 'First fact.\nSecond fact.', parties: 'Smith v Acme', court: 'COUNTY COURT AT LEEDS', relief: 'ORDER-XYZ' })).draft;
  for (const s of ['Smith v Acme', 'COUNTY COURT AT LEEDS', 'ORDER-XYZ', '1. First fact.', '2. Second fact.']) assert.ok(given.includes(s), s);
  const bare = (await draftDocument({ type: 'particulars_claim' })).draft;
  for (const s of ['[Claimant] v [Defendant]', 'IN THE COUNTY COURT', '[set out the orders sought]']) assert.ok(bare.includes(s), s);
  assert.ok(!bare.includes('undefined'));
  const ws = (await draftDocument({ type: 'witness_statement', facts: 'On 12 May I was dismissed.\nNo one investigated.' })).draft.split('\n');
  assert.ok(ws.includes('1. On 12 May I was dismissed.'), 'paragraphs are numbered from 1');
  assert.ok(ws.includes('2. No one investigated.'));
  assert.ok(given.split('\n').includes('1. First fact.'));
});

test('draftDocument: an AI enhancement replaces the draft; a failing one leaves it', async () => {
  assert.equal((await draftDocument({ facts: 'x' }, { aiComplete: async () => 'ENHANCED' })).draft, 'ENHANCED');
  assert.ok((await draftDocument({ facts: 'x' }, { aiComplete: async () => { throw new Error('down'); } })).draft.includes('LEGAL BRIEF'));
  assert.ok((await draftDocument({ facts: 'x' }, { aiComplete: async () => '' })).draft.includes('LEGAL BRIEF'));
});

// every rule's truth table: [rule id, input, should it fire]
const rule = (id) => COMPLIANCE_RULES.find((r) => r.id === id).check;
const TABLE = [
  ['uk_gdpr_dpa', {}, true], ['uk_gdpr_dpa', { ca_dpa: 'no' }, true], ['uk_gdpr_dpa', { ca_dpa: 'yes' }, false], ['uk_gdpr_dpa', { ca_jurisdiction: 'us' }, false],
  ['uk_gdpr_pp', { ca_privacy_policy: 'no' }, true], ['uk_gdpr_pp', { ca_privacy_policy: 'stale' }, true], ['uk_gdpr_pp', { ca_privacy_policy: 'yes' }, false],
  ['uk_gdpr_pp', {}, false], ['uk_gdpr_pp', { ca_jurisdiction: 'us', ca_privacy_policy: 'no' }, false],
  ['uk_gdpr_dsar', { ca_dsar_process: 'no' }, true], ['uk_gdpr_dsar', { ca_dsar_process: 'informal' }, true], ['uk_gdpr_dsar', { ca_dsar_process: 'documented' }, false],
  ['uk_gdpr_dsar', { ca_personal_data: 'none', ca_dsar_process: 'no' }, false], ['uk_gdpr_dsar', { ca_jurisdiction: 'us', ca_dsar_process: 'no' }, false], ['uk_gdpr_dsar', {}, false],
  ['uk_gdpr_records', {}, true], ['uk_gdpr_records', { ca_size: '10-49' }, true], ['uk_gdpr_records', { ca_size: '1' }, false], ['uk_gdpr_records', { ca_size: '2-9' }, false],
  ['uk_gdpr_records', { ca_records: 'yes' }, false],
  ['eu_ai_act_audit', { ca_uses_ai: 'yes', ca_eu_users: 'yes' }, true], ['eu_ai_act_audit', { ca_uses_ai: 'yes', ca_eu_users: 'maybe' }, true],
  ['eu_ai_act_audit', { ca_uses_ai: 'yes', ca_eu_users: 'no' }, false], ['eu_ai_act_audit', { ca_uses_ai: 'planning', ca_eu_users: 'yes' }, false],
  ['eu_ai_act_audit', { ca_uses_ai: 'yes', ca_eu_users: 'yes', ca_audit_log: 'yes' }, false], ['eu_ai_act_audit', { ca_eu_users: 'yes' }, false],
  ['eu_ai_act_planning', { ca_uses_ai: 'planning', ca_eu_users: 'yes' }, true], ['eu_ai_act_planning', { ca_uses_ai: 'planning', ca_eu_users: 'maybe' }, true],
  ['eu_ai_act_planning', { ca_uses_ai: 'planning', ca_eu_users: 'no' }, false], ['eu_ai_act_planning', { ca_uses_ai: 'yes', ca_eu_users: 'yes' }, false], ['eu_ai_act_planning', { ca_eu_users: 'maybe' }, false],
  ['employment_contracts', { ca_employment_contracts: 'no' }, true], ['employment_contracts', { ca_employment_contracts: 'no', ca_size: '2-9' }, true],
  ['employment_contracts', { ca_employment_contracts: 'no', ca_size: '1' }, false], ['employment_contracts', { ca_employment_contracts: 'yes' }, false], ['employment_contracts', {}, false],
  ['employment_handbook', { ca_handbook: 'no' }, true], ['employment_handbook', { ca_handbook: 'no', ca_size: '10-49' }, true], ['employment_handbook', { ca_handbook: 'no', ca_size: '1' }, false],
  ['employment_handbook', { ca_handbook: 'no', ca_size: '2-9' }, false], ['employment_handbook', { ca_handbook: 'yes' }, false], ['employment_handbook', {}, false],
  ['cra_terms', { ca_t_and_c: 'never' }, true], ['cra_terms', { ca_t_and_c: 'old' }, false],
  ['cra_subscription', { ca_subscription: 'yes' }, true], ['cra_subscription', { ca_subscription: 'no' }, false],
  ['breach_plan', { ca_breach_plan: 'no' }, true], ['breach_plan', { ca_personal_data: 'none', ca_breach_plan: 'no' }, false], ['breach_plan', { ca_breach_plan: 'yes' }, false], ['breach_plan', {}, false],
  ['health_safety', { ca_size: '10-49', ca_health_safety: 'no' }, true], ['health_safety', { ca_size: '50-249', ca_health_safety: 'no' }, true],
  ['health_safety', { ca_size: '250+', ca_health_safety: 'no' }, true], ['health_safety', { ca_size: '2-9', ca_health_safety: 'no' }, false],
  ['health_safety', { ca_size: '10-49', ca_health_safety: 'yes' }, false], ['health_safety', { ca_size: '250+' }, false],
  ['cyber_incident', { ca_cyber: 'incident' }, true], ['cyber_incident', { ca_cyber: 'incident', ca_breach_plan: 'no' }, true],
  ['cyber_incident', { ca_cyber: 'incident', ca_breach_plan: 'yes' }, false], ['cyber_incident', { ca_cyber: 'near_miss' }, false],
];
test('every compliance rule fires exactly on its own conditions', () => {
  for (const [id, v, want] of TABLE) assert.equal(rule(id)(v), want, id + ' ' + JSON.stringify(v));
  assert.deepEqual([...new Set(TABLE.map((t) => t[0]))].sort(), COMPLIANCE_RULES.map((r) => r.id).sort());
});

const CLEAN = { ca_size: '1', ca_personal_data: 'none', ca_uses_ai: 'no', ca_employment_contracts: 'yes', ca_t_and_c: 'recent', ca_subscription: 'no',
  ca_dpa: 'yes', ca_privacy_policy: 'yes', ca_dsar_process: 'documented', ca_records: 'yes', ca_breach_plan: 'yes', ca_health_safety: 'yes', ca_cyber: 'none' };
test('auditCompliance: high costs 15, medium 8, the score floors at 0, and the summary says which', () => {
  const a = auditCompliance({ ...CLEAN, ca_dpa: 'no' });
  assert.deepEqual(a.gaps.map((g) => g.id), ['uk_gdpr_dpa']); assert.equal(a.score, 85); assert.equal(a.summary, '1 gap(s) identified · score 85/100');
  assert.equal(auditCompliance({ ...CLEAN, ca_subscription: 'yes' }).score, 92);
  assert.equal(auditCompliance({ ...CLEAN, ca_dpa: 'no', ca_subscription: 'yes' }).score, 77);
  const clean = auditCompliance(CLEAN);
  assert.equal(clean.score, 100); assert.equal(clean.summary, 'No major gaps detected against the configured rule set.');
  const worst = auditCompliance({ ca_size: '50-249', ca_personal_data: 'sensitive', ca_dpa: 'no', ca_privacy_policy: 'no', ca_dsar_process: 'no',
    ca_uses_ai: 'yes', ca_eu_users: 'yes', ca_employment_contracts: 'no', ca_handbook: 'no', ca_t_and_c: 'never', ca_subscription: 'yes',
    ca_breach_plan: 'no', ca_health_safety: 'no', ca_cyber: 'incident' });
  assert.equal(worst.score, 0);
  assert.ok(worst.gaps.length >= 10);
});

const JUNK = [undefined, null, 0, 42, NaN, '', true, [], {}, () => 1, Symbol.iterator, 'constructor', '__proto__', { results: 5 }, { results: [{}], contradictions: 'x' }];
test('garbage in: the pure functions never throw and fall back to their empty answers', async () => {
  for (const j of JUNK) {
    assert.deepEqual(searchCases(j), [], String(typeof j));
    assert.equal(typeof scoreCaseAgainst(j, j, j), 'number');
    assert.equal(scoreRisk(j).pct, 0);
    assert.deepEqual(auditCompliance(j).gaps.map((g) => g.id), auditCompliance({}).gaps.map((g) => g.id));
    const w = await runWeave(j, j, j);
    assert.equal(w.results.length, 7);
    const d = await draftDocument(j, j);
    assert.equal(typeof d.draft, 'string');
  }
  assert.equal(scoreCaseAgainst(tiensia, 'penalty', { keywords: 5 }), 2);
  assert.equal(scoreCaseAgainst(tiensia, 'x', { keywords: [7, 'DEPOSIT'] }), 1);
  assert.equal(scoreCaseAgainst({ tags: 'penalty' }, 'penalty'), 2);
  assert.equal(searchCases('act', undefined, null).length, 8); // null options: the default limit of 8 applies
  assert.equal(searchCases('act').length, 8); assert.equal(searchCases('act', undefined, { limit: 30 }).length, 22);
  assert.ok((await runWeave('employer dismissed', 'constructor')).results.every((r) => r.weight === 1));
  assert.ok((await draftDocument({ type: 'constructor', facts: 'x' })).draft.includes('LEGAL BRIEF'));
  assert.equal(scoreRisk({ results: [{ cases: 'no' }, { cases: [{ _score: 10 }] }] }).pct, 40);
  assert.equal(scoreRisk({ results: [{ cases: [{ _score: 'abc' }] }] }).pct, 0);
});

test('the Article 12 gap gives the dates that apply, not the old 2 August 2026', () => {
  const g = COMPLIANCE_RULES.find((r) => r.id === 'eu_ai_act_audit').gap;
  assert.match(g, /2 December 2027/); assert.match(g, /2 August 2028/); assert.doesNotMatch(g, /Aug 2 2026|Required from/);
});
