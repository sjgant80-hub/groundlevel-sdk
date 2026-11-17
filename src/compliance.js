// @sjgant80-hub/groundlevel-sdk · compliance · UK/EU rule-based audit
//
// expected input vars (all optional · sensible defaults assumed when missing):
//   ca_jurisdiction   · 'uk' | 'eu' | 'us' (default uk)
//   ca_size           · '1' | '2-9' | '10-49' | '50-249' | '250+'
//   ca_personal_data  · 'none' | 'minimal' | 'standard' | 'sensitive'
//   ca_dpa            · 'yes' | 'no'
//   ca_privacy_policy · 'yes' | 'no' | 'stale'
//   ca_dsar_process   · 'documented' | 'informal' | 'no'
//   ca_records        · 'yes' | 'no'  (Art 30 ROPA)
//   ca_uses_ai        · 'yes' | 'planning' | 'no'
//   ca_eu_users       · 'yes' | 'no' | 'maybe'
//   ca_audit_log      · 'yes' | 'no' (Art 12 logging chain)
//   ca_employment_contracts · 'yes' | 'no'
//   ca_handbook       · 'yes' | 'no'
//   ca_t_and_c        · 'recent' | 'old' | 'never'
//   ca_subscription   · 'yes' | 'no'
//   ca_breach_plan    · 'yes' | 'no'
//   ca_health_safety  · 'yes' | 'no'
//   ca_cyber          · 'none' | 'incident' | 'near_miss'

export const COMPLIANCE_RULES = [
  { id: 'uk_gdpr_dpa', framework: 'UK GDPR / DPA 2018', check: v => v.ca_jurisdiction !== 'us' && (!v.ca_dpa || v.ca_dpa === 'no'), severity: 'high', gap: 'No Data Processing Agreements with sub-processors · Art 28 UK GDPR breach.', remedy: 'Use the GDPR module · DPA template · execute with all sub-processors.' },
  { id: 'uk_gdpr_pp', framework: 'UK GDPR / DPA 2018', check: v => v.ca_jurisdiction !== 'us' && (v.ca_privacy_policy === 'no' || v.ca_privacy_policy === 'stale'), severity: 'high', gap: 'Privacy policy missing or stale (>12 months without review).', remedy: 'Use the GDPR module · privacy policy template · publish within 14 days.' },
  { id: 'uk_gdpr_dsar', framework: 'UK GDPR / DPA 2018', check: v => v.ca_jurisdiction !== 'us' && v.ca_personal_data !== 'none' && (v.ca_dsar_process === 'no' || v.ca_dsar_process === 'informal'), severity: 'medium', gap: 'No documented DSAR response process · 1-month statutory deadline cannot be reliably met.', remedy: 'Use the Data Access module · DSAR workflow template + internal checklist.' },
  { id: 'uk_gdpr_records', framework: 'UK GDPR Art 30', check: v => v.ca_size !== '1' && v.ca_size !== '2-9' && v.ca_records !== 'yes', severity: 'medium', gap: 'No Article 30 record of processing activities. Mandatory for organisations >250 employees and recommended for smaller orgs with regular processing.', remedy: 'Build ROPA template · GroundLevel data module.' },
  { id: 'eu_ai_act_audit', framework: 'EU AI Act Art 12', check: v => v.ca_uses_ai === 'yes' && (v.ca_eu_users === 'yes' || v.ca_eu_users === 'maybe') && v.ca_audit_log !== 'yes', severity: 'high', gap: 'AI in production with EU users and no automatic event log. If the system is high-risk, Article 12 logging applies from 2 December 2027 (Annex III) or 2 August 2028 (AI in Annex I products); Article 50 transparency already applies from 2 August 2026.', remedy: 'Use fall-euaiact audit-shim · drop-in install · single script tag.' },
  { id: 'eu_ai_act_planning', framework: 'EU AI Act planning', check: v => v.ca_uses_ai === 'planning' && (v.ca_eu_users === 'yes' || v.ca_eu_users === 'maybe'), severity: 'medium', gap: 'AI planned with EU exposure. Article 12 + Annex IV + Article 50 obligations attach BEFORE launch.', remedy: 'Use Article 12 audit shim + Annex IV template (fall-euaiact) ahead of launch.' },
  { id: 'employment_contracts', framework: 'Employment Rights Act 1996', check: v => v.ca_employment_contracts === 'no' && v.ca_size !== '1', severity: 'high', gap: 'No written employment particulars. Statutory right within 2 months of starting (ERA s.1).', remedy: 'Issue s.1 statements within 14 days. Use Employment module template.' },
  { id: 'employment_handbook', framework: 'ACAS Code', check: v => v.ca_size !== '1' && v.ca_size !== '2-9' && v.ca_handbook === 'no', severity: 'medium', gap: 'No employee handbook / grievance procedure. ACAS Code non-compliance can adjust Tribunal awards by ±25%.', remedy: 'Use the Employment module · grievance procedure template.' },
  { id: 'cra_terms', framework: 'Consumer Rights Act 2015', check: v => v.ca_t_and_c === 'never', severity: 'medium', gap: 'Consumer T&Cs never reviewed against CRA 2015 Part 2 unfair-terms rules.', remedy: 'Use the Consumer module · unfair-terms checklist.' },
  { id: 'cra_subscription', framework: 'CCRs 2013', check: v => v.ca_subscription === 'yes', severity: 'medium', gap: 'Auto-renewing subscriptions trigger CCRs 2013 disclosure + cancellation duties. Common source of trading-standards complaints.', remedy: 'Use the Subscription module · disclosure template + cancellation flow.' },
  { id: 'breach_plan', framework: 'UK GDPR · DPA 2018', check: v => v.ca_personal_data !== 'none' && (v.ca_breach_plan === 'no'), severity: 'high', gap: 'No data breach response plan. 72-hour reporting clock cannot be met without one.', remedy: 'Build breach playbook · template in GDPR module.' },
  { id: 'health_safety', framework: 'Health & Safety at Work Act 1974', check: v => (v.ca_size === '10-49' || v.ca_size === '50-249' || v.ca_size === '250+') && v.ca_health_safety === 'no', severity: 'high', gap: 'Written H&S policy required by law if 5+ employees.', remedy: 'Draft H&S policy · template available via Help → External resources.' },
  { id: 'cyber_incident', framework: 'UK GDPR · DPA 2018', check: v => v.ca_cyber === 'incident' && v.ca_breach_plan !== 'yes', severity: 'high', gap: 'Cyber incident occurred AND no breach response plan. Material risk for next incident.', remedy: 'Engage incident response specialist this week · plan breach playbook.' },
];

/**
 * Run the compliance audit against a posture-input object.
 * @param {object} vars · see above for keys
 * @returns {{gaps: Array, score: number}}
 */
export function auditCompliance(vars) {
  const v = Object(vars);
  const gaps = COMPLIANCE_RULES.filter(r => r.check(v));
  const score = Math.max(0, 100 - gaps.reduce((s, g) => s + ({ high: 15, medium: 8, low: 3 }[g.severity] || 5), 0));
  const summary = gaps.length === 0
    ? 'No major gaps detected against the configured rule set.'
    : `${gaps.length} gap(s) identified · score ${score}/100`;
  return { gaps, score, summary };
}
