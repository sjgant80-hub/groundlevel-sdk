// @sjgant80-hub/groundlevel-sdk · weave · 7-strand parallel research engine

import { CASE_DB } from './cases.js';
import { WEAVE_PATTERNS, WEAVE_STRANDS } from './weaves.js';
import { scoreCaseAgainst } from './search.js';

/**
 * Run the 7-strand weave on a query.
 * @param {string} query · the factual question
 * @param {string} [patternKey] · optional pattern key from WEAVE_PATTERNS (eg 'unfair_dismissal')
 * @param {object} [opts]
 * @param {number} [opts.perStrand=4] · max cases per strand
 * @param {function} [opts.aiComplete] · optional async (system, user) → string for synthesis paragraph
 * @returns {Promise<{results: Strand[], contradictions: any[], synthesis: string}>}
 */
export async function runWeave(query, patternKey, opts = {}) {
  const o = Object(opts);
  const perStrand = o.perStrand ?? 4;
  const pattern = Object.hasOwn(WEAVE_PATTERNS, patternKey) ? WEAVE_PATTERNS[patternKey] : null;
  const results = WEAVE_STRANDS.map(strand => {
    const weight = pattern ? (pattern.strands[strand.name] || 0) : 1;
    const cases = CASE_DB
      .filter(c => (c.strands || []).includes(strand.name))
      .map(c => ({ ...c, _score: scoreCaseAgainst(c, query, pattern) * weight }))
      .filter(c => c._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, perStrand);
    return { strand: strand.name, icon: strand.icon, angle: strand.angle, cases, weight };
  });

  // contradiction detection · outcome differences within the same domain
  const contradictions = [];
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const ai = results[i].cases[0], aj = results[j].cases[0];
      if (ai && aj && ai.area === aj.area && ai.outcome !== aj.outcome && ai.outcome !== 'rule' && aj.outcome !== 'rule') {
        contradictions.push({ a: results[i].strand, b: results[j].strand, area: ai.area });
      }
    }
  }

  // optionally AI-synthesise
  let synthesis = '';
  if (typeof o.aiComplete === 'function') {
    const corpus = results.map(r => `[${r.strand}] ${r.cases.slice(0, 2).map(c => c.citation + ' — ' + c.principle).join('; ')}`).join('\n');
    const sys = `You are the GroundLevel Pro weave synthesiser. Given a legal query and 7-strand search results, write a 3-paragraph synthesis: (1) where the strongest argument lives, (2) the strongest opposing risk, (3) one concrete next action. Use plain English. Cite cases by citation. Don't invent.`;
    try {
      const out = await o.aiComplete(sys, `Query: ${query}\n\nWeave results:\n${corpus}`);
      if (out) synthesis = out;
    } catch (e) { /* swallow · synthesis is optional */ }
  }

  return { results, contradictions, synthesis };
}

/**
 * Score the legal risk of a completed weave result.
 * @param {object} weaveResult · return value of runWeave()
 * @returns {{pct:number,label:string,kind:string,recommendation:string}}
 */
export function scoreRisk(weaveResult) {
  const w = Object(weaveResult);
  const tops = (Array.isArray(w.results) ? w.results : []).map(r => {
    const cs = Object(r).cases;
    return Array.isArray(cs) ? (+Object(cs[0])._score || 0) : 0;
  });
  const avg = tops.length ? tops.reduce((a, b) => a + b, 0) / tops.length : 0;
  let pct = Math.min(100, Math.round(avg * 8));
  pct -= (Array.isArray(w.contradictions) ? w.contradictions : []).length * 8;
  pct = Math.max(0, pct);

  let label, kind, recommendation;
  if (pct >= 70)      { label = 'STRONG';      kind = 'success'; recommendation = 'Strong matching authority across the strands. Check that each cited case fits your facts, then use the matching letter or template.'; }
  else if (pct >= 40) { label = 'MODERATE';    kind = 'warn';    recommendation = 'Some matching authority. Gather more evidence before formal action, and consider mediation.'; }
  else if (pct >= 10) { label = 'WEAK';        kind = 'warn';    recommendation = 'Little matching authority. Weigh the time and cost against what you could recover; settling outside court is usually better than litigation.'; }
  else                { label = 'MINIMAL';     kind = 'alert';   recommendation = 'Few of the seven strands found matching authority for these facts. Get professional legal advice before any irreversible step: this tool may not see angles a lawyer can.'; }

  return { pct, label, kind, recommendation, basis: 'How strongly the bundled cases match these facts (keyword relevance, contradictions deducted). It is not a prediction of the outcome.' };
}
