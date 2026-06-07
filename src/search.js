// @sjgant80-hub/groundlevel-sdk · search · keyword search across the case DB

import { CASE_DB } from './cases.js';

/**
 * Search the bundled UK case database by free-text query.
 * @param {string} query · free-text query · 3+ char tokens contribute
 * @param {string} [areaFilter] · optional area scope ('housing'|'employment'|'data'|'consumer'|'money'|'court'|'regulatory'|'public'|'international')
 * @param {object} [opts]
 * @param {number} [opts.limit=8] · max results returned
 * @returns {Array<Case & {_score:number}>}
 */
export function searchCases(query, areaFilter, opts = {}) {
  const limit = opts.limit ?? 8;
  if (!query) return [];
  const terms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
  const pool = areaFilter ? CASE_DB.filter(c => c.area === areaFilter) : CASE_DB;
  return pool.map(c => {
    let score = 0;
    const haystack = (c.summary + ' ' + c.principle + ' ' + (c.tags || []).join(' ') + ' ' + (c.statute || '') + ' ' + c.sub).toLowerCase();
    terms.forEach(t => {
      if (haystack.includes(t)) score += 2;
      if ((c.tags || []).some(tag => tag.includes(t))) score += 3;
      if (c.principle.toLowerCase().includes(t)) score += 3;
    });
    return { ...c, _score: score };
  }).filter(c => c._score > 0).sort((a, b) => b._score - a._score).slice(0, limit);
}

/**
 * Score a single case against a query and pattern · used by the weave engine.
 * @internal
 */
export function scoreCaseAgainst(c, query, pattern) {
  let s = 0;
  const terms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
  const hay = (c.summary + ' ' + c.principle + ' ' + (c.tags || []).join(' ')).toLowerCase();
  terms.forEach(t => { if (hay.includes(t)) s += 2; });
  if (pattern && pattern.keywords) {
    pattern.keywords.forEach(k => { if (hay.includes(k.toLowerCase())) s += 1; });
  }
  return s;
}
