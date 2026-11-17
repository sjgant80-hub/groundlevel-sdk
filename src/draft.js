// @sjgant80-hub/groundlevel-sdk · draft · court-ready document templates

import { searchCases } from './search.js';

export const DOC_TYPES = [
  'particulars_claim', 'witness_statement', 'skeleton_argument',
  'position_statement', 'legal_brief', 'compliance_report', 'due_diligence',
];

/**
 * Draft a court-ready legal document.
 * @param {object} input
 * @param {string} input.type · one of DOC_TYPES (defaults to 'legal_brief')
 * @param {string} input.facts · factual narrative, line per paragraph
 * @param {string} [input.parties] · '[Claimant] v [Defendant]' or similar
 * @param {string} [input.court] · 'COUNTY COURT' or tribunal name
 * @param {string} [input.relief] · the orders / remedies sought
 * @param {object} [opts]
 * @param {function} [opts.aiComplete] · optional async (system, user) → string for prose enhancement
 * @returns {Promise<{draft:string, citations:Case[]}>}
 */
export async function draftDocument(input, opts = {}) {
  const inp = Object(input), o = Object(opts);
  const type = inp.type || 'legal_brief';
  const facts = String(inp.facts || '');
  const parties = inp.parties || '[Claimant] v [Defendant]';
  const court = inp.court || 'COUNTY COURT';
  const relief = inp.relief || '[set out the orders sought]';

  const cases = searchCases(facts, undefined, { limit: 4 });
  const citationList = cases.map(c => `· ${c.citation} — ${c.principle}`).join('\n');
  const today = new Date().toISOString().slice(0, 10);

  const FORMATS = {
    particulars_claim: `IN THE ${court}\n\nClaim No: [TO BE ASSIGNED]\n\nBETWEEN:\n${parties}\n\n___\n\nPARTICULARS OF CLAIM\n\n${facts.split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => `${i + 1}. ${l}`).join('\n\n')}\n\nRELIEF SOUGHT\n\n${relief}\n\nCITED AUTHORITIES\n${citationList}\n\nSTATEMENT OF TRUTH\nI believe the facts stated in these Particulars are true.\n\nSigned: ____________________  Date: ____________________`,
    witness_statement: `IN THE ${court}\n\n${parties}\n\nWITNESS STATEMENT OF [YOUR NAME]\n\nI, [your name], of [your address], state as follows:\n\n${facts.split('\n').map((l, i) => `${i + 1}. ${l.trim()}`).filter(p => p.trim()).join('\n\n')}\n\nSTATEMENT OF TRUTH\nI believe that the facts stated in this witness statement are true.\n\nSigned: ____________________  Dated: ____________________`,
    skeleton_argument: `SKELETON ARGUMENT\n\nFor: ${parties}\nBefore: ${court}\n\nINTRODUCTION\nThe issue for determination is set out below.\n\nFACTS\n${facts}\n\nLAW\n${citationList}\n\nSUBMISSIONS\n[Submission 1 · based on the leading authority cited above]\n[Submission 2 · responding to the anticipated counter-argument]\n[Submission 3 · the relief sought and its proportionality]\n\nCONCLUSION\nFor the reasons above, [the desired outcome] is invited.\n\nDated: ____________________  Signed: ____________________`,
    position_statement: `POSITION STATEMENT\n\nProvided for: ${court}\nFrom: ${parties}\n\nBACKGROUND\n${facts.split('\n').slice(0, 6).join('\n')}\n\nKEY ISSUES\n· [Issue 1]\n· [Issue 2]\n· [Issue 3]\n\nOUR POSITION\nWe believe the most likely just outcome is: ${relief}.\n\nRELEVANT AUTHORITIES\n${citationList}\n\nOPEN TO\n· Mediated settlement on terms consistent with the above\n· Alternative remedies (ADR before contested hearing)\n\nDated: ____________________`,
    legal_brief: `LEGAL BRIEF · ADVISORY\n\nClient: [name]\nDate: ${today}\nMatter: ${court}\n\nFACTS\n${facts}\n\nAPPLICABLE LAW\n${citationList}\n\nANALYSIS\n[Where the law applied to these facts leads. Use the optional aiComplete hook to expand.]\n\nRECOMMENDED ACTION\n${relief}\n\nRISKS / OPEN QUESTIONS\n· [Identify the strongest counter-argument]\n· [Identify the evidence-gap that would change the recommendation]\n\nDISCLAIMER: this is a draft advisory. Not legal advice. Attorney review required.`,
    compliance_report: `COMPLIANCE POSTURE REPORT\n\nClient: [name]\nDate: ${today}\nFramework(s): UK GDPR · EU AI Act · CRA 2015 · ERA 1996\n\nEXECUTIVE SUMMARY\n[Summarise the posture in 3 sentences]\n\nKEY GAPS\n[Run the Compliance Audit (auditCompliance) to populate this section]\n\nREMEDIATION ROADMAP\n· Immediate (≤30 days) · [item]\n· Near-term (1-3 months) · [item]\n· Strategic (3-12 months) · [item]\n\nCITED AUTHORITIES\n${citationList}\n\nDATE: ${today}`,
    due_diligence: `DUE DILIGENCE SUMMARY\n\nTarget: [name]\nScope: ${facts.slice(0, 200)}\nDate: ${today}\n\nFINDINGS\n${facts}\n\nLEGAL RISK SUMMARY\n${citationList}\n\nFLAGS\n· [material flag 1]\n· [material flag 2]\n\nRECOMMENDED CONDITIONS\n· [warranty / indemnity / escrow term]\n\nDated: ____________________`,
  };

  let draft = Object.hasOwn(FORMATS, type) ? FORMATS[type] : FORMATS.legal_brief;

  if (typeof o.aiComplete === 'function') {
    const sys = `You are GroundLevel Pro's document drafter. Take the user's draft template and tighten the prose to court-ready legal English. Preserve citations exactly. Don't invent facts. Format for A4 print.`;
    try {
      const enhanced = await o.aiComplete(sys, draft);
      if (enhanced) draft = enhanced;
    } catch (e) { /* swallow · enhancement is optional */ }
  }

  return { draft, citations: cases };
}
