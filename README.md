# GroundLevel SDK

**Live page, with a try-it panel, the API and the proof:** https://sjgant80-hub.github.io/groundlevel-sdk/

A JavaScript library with the engines behind GroundLevel: 31 UK cases you can search, a 7-strand research weave that also flags where the authorities point different ways, a 13-rule compliance check (UK GDPR, the EU AI Act, employment, consumer and health and safety law) and seven court-document drafts.

It is the [GroundLevel](https://sjgant80-hub.github.io/groundlevel/) page's own code, as modules. It gives information, not legal advice: the case notes are short summaries, and the match score measures keyword relevance, not your chance of winning.

## Install

```bash
npm install github:sjgant80-hub/groundlevel-sdk
```

It is not on the npm registry; it installs from this repository. Pin a commit for production: `npm install github:sjgant80-hub/groundlevel-sdk#<commit>`.

## Use

```js
import { searchCases, runWeave, scoreRisk, auditCompliance } from '@ai-native-solutions/groundlevel-sdk';

const hits = searchCases('landlord did not protect my deposit', 'housing');
const weave = await runWeave('employer dismissed me without process', 'unfair_dismissal');
const match = scoreRisk(weave);            // { label: 'STRONG' | 'MODERATE' | 'WEAK' | 'MINIMAL', pct, recommendation, basis }
const audit = auditCompliance({ ca_uses_ai: 'yes', ca_eu_users: 'yes', ca_audit_log: 'no' });
```

## API

| Export | What it does |
|---|---|
| `CASE_DB · caseById · casesByArea · casesByStrand` | The 31 cases, and lookups by id, area or strand. |
| `searchCases(query, area?, { limit })` | Cases ranked by keyword relevance (default limit 8). Never throws: a non-string query returns []. |
| `runWeave(query, pattern?, { perStrand, aiComplete })` | The 7-strand weave: top cases per strand, conflicts, and an optional synthesis if you pass your own model call. |
| `scoreRisk(weave)` | STRONG, MODERATE, WEAK or MINIMAL (how well the cases match), with the percentage, a recommendation and what the number measures. |
| `draftDocument({ type, facts, parties, court, relief })` | Particulars of claim, witness statement, skeleton argument, position statement, legal brief, compliance report or due diligence summary, with matching cases cited. |
| `auditCompliance(answers) · COMPLIANCE_RULES` | The gaps your answers reveal across 13 rules, a score out of 100 (high gaps cost 15, medium 8) and a summary. |
| `WEAVE_PATTERNS · WEAVE_STRANDS · PATTERN_KEYS · STRAND_NAMES · DOC_TYPES · VERSION` | The tables behind the functions. |

## How it is kept honest

- The cases, the weave patterns, the compliance rules and the drafting templates are the GroundLevel page's own. scripts/parity.mjs reads the published page and fails the build if a single case, rule, pattern or wording differs; the 13 rules are also compared verdict by verdict on 4,000 sets of answers.
- The search scores a case by where your words appear: anywhere in its text (2), in its tags (3) or in its principle (3). Words under three letters do not count.
- The weave asks the same question from seven angles (strands): constitutional, liberty, criminal and regulatory, equity, housing, employment and commerce, cross-border. A pattern weights the strands. Where two strands' top cases are in the same area with different outcomes, it says so: that is a conflict you need to deal with.
- The match score averages the strands' top relevance, takes 8 off for each conflict, and labels the result. It measures how much of the bundled case set fits your words. It is not a prediction of the outcome.
- Every function is tested, and a mutation gate flips each comparison and condition in the code to check a test notices. The build fails unless every flip is caught, or the gate records in writing why that flip cannot change any result.

Run it yourself: `npm test`, `npm run parity`, `npm run example`. CI runs the same, plus the mutation gate, on every push.

## Not included

- The GroundLevel page's letters and storage: those are the app; this is the engine.
- Any network or AI provider: pass your own aiComplete if you want a synthesis.

## Licence and supplier

MIT, © Simon Gant. Supplied by [AI Native Solutions](https://www.ai-nativesolutions.com); support is agreed per deployment.
