# @sjgant80-hub/groundlevel-sdk

> Sovereign legal research SDK · 50+ landmark UK cases · 7-strand weave engine · risk scoring · compliance audit · document drafting.
> Zero runtime dependencies · works in Node 18+ and every modern browser · MIT.

This is the SDK extracted from the [GroundLevel Pro](https://github.com/sjgant80-hub/groundlevel) sovereign legal toolkit. Attorneys, legal-tech builders, paralegals, and indie devs can `import` it directly without reading the 12,000-line single-file app.

```
the law is public · the templates are simple · the jargon is the paywall
groundlevel-sdk removes the paywall · for builders who'd rather code than buy
```

---

## Install

```bash
# from GitHub Packages (this repo)
npm install @sjgant80-hub/groundlevel-sdk \
  --registry https://npm.pkg.github.com
```

Add this once to your `~/.npmrc` to default `@sjgant80-hub/*` to GitHub Packages:

```ini
@sjgant80-hub:registry=https://npm.pkg.github.com
```

You can also `import` directly from esm.sh / jsDelivr without installing:

```js
import { searchCases, runWeave } from 'https://esm.sh/gh/sjgant80-hub/groundlevel-sdk/src/index.js';
```

---

## Surface

| Export | Returns | What it does |
|---|---|---|
| `CASE_DB` | `Case[]` | 50+ landmark UK cases · housing, employment, data, consumer, money, court, regulatory, public, international |
| `WEAVE_PATTERNS` | `Record<string, Pattern>` | 10 pre-built archetypal patterns (unfair_dismissal, deposit_dispute, gdpr_breach, etc.) |
| `WEAVE_STRANDS` | `Strand[]` | 7 perspectives · MAGNA, LIBERTY, CROWN, EQUITY, HEARTH, GUILD, ADMIRALTY |
| `searchCases(query, area?, opts?)` | `Case[]` | Keyword search the case DB with optional area scope |
| `runWeave(query, patternKey?, opts?)` | `{results, contradictions, synthesis}` | 7-strand parallel research + contradiction detection + optional AI synthesis |
| `scoreRisk(weaveResult)` | `{pct, label, kind, recommendation}` | STRONG · MODERATE · WEAK · INADVISABLE |
| `draftDocument(input, opts?)` | `{draft, citations}` | Particulars · witness statement · skeleton argument · position statement · legal brief · compliance report · DD summary |
| `auditCompliance(vars)` | `{gaps, score, summary}` | UK GDPR · EU AI Act · ERA 1996 · CRA 2015 · H&S · cyber posture |

Every async function that accepts an `aiComplete` option will work fine without it — pass `(system, user) => providerCall(system, user)` for AI enhancement, or omit for pure T0 (template-only) operation.

---

## Quick start

```js
import { searchCases, runWeave, scoreRisk, draftDocument, auditCompliance } from '@sjgant80-hub/groundlevel-sdk';

// 1 · search the case DB
const hits = searchCases('landlord deposit not protected', 'housing');
console.log(hits[0].citation);
// → "Tiensia v Vision Enterprises Ltd [2010] EWCA Civ 1224"

// 2 · run the 7-strand weave
const weave = await runWeave('employer dismissed me without process', 'unfair_dismissal');
console.log(weave.results.find(r => r.strand === 'GUILD').cases[0].principle);
// → "Procedural fairness · Polkey reduction for would-have-dismissed-anyway."

// 3 · score the legal risk
const risk = scoreRisk(weave);
console.log(`${risk.label} (${risk.pct}%) · ${risk.recommendation}`);

// 4 · draft a court-ready document
const { draft, citations } = await draftDocument({
  type: 'witness_statement',
  facts: 'On 12 May, I was summarily dismissed.\nNo investigation took place.',
  parties: 'Smith v Acme Ltd',
  court: 'EMPLOYMENT TRIBUNAL',
});
console.log(draft); // ready to print to A4

// 5 · run the compliance audit
const { gaps, score } = auditCompliance({
  ca_size: '10-49',
  ca_uses_ai: 'yes',
  ca_eu_users: 'yes',
  ca_audit_log: 'no',
  ca_dpa: 'no',
  ca_breach_plan: 'no',
});
console.log(`Posture score: ${score}/100`);
gaps.forEach(g => console.log(`· [${g.severity}] ${g.framework}: ${g.gap}`));
```

---

## Optional · AI enhancement hook

Every async function can be enhanced with your own provider. Pass an `aiComplete(system, user)` async function:

```js
const ai = async (system, user) => {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: 1500, system, messages: [{ role: 'user', content: user }] }),
  });
  const j = await r.json();
  return j.content[0].text;
};

const weave = await runWeave('platform owes me $4,200 unpaid', 'platform_unpaid', { aiComplete: ai });
console.log(weave.synthesis); // 3-paragraph synthesis
```

The SDK never makes a network call by itself. You control the keys, the provider, and the policy.

---

## What about the templates?

50+ letter templates with cited statute live in the [main GroundLevel repo](https://github.com/sjgant80-hub/groundlevel) — they're tightly coupled to the UI for variable injection. The SDK gives you the **research engine** (cases + weave + risk) and the **document drafter** (court documents with auto-cited authorities).

If you want the templates programmatically, file an issue describing your use-case and we'll discuss an export shape.

---

## The 7 strands

| Strand | Icon | Angle |
|---|---|---|
| MAGNA | ⚖ | Constitutional / fundamental rights |
| LIBERTY | 🕊 | Personal liberty / privacy |
| CROWN | 👑 | Criminal / regulatory |
| EQUITY | ⚪ | Fairness / conscience / equitable remedies |
| HEARTH | 🏠 | Housing / family / welfare |
| GUILD | ⚒ | Employment / commercial / trade |
| ADMIRALTY | ⚓ | Cross-border / maritime / international |

The weave engine searches each strand in parallel, weighted by the pattern you specify (or evenly if none). Contradictions are flagged automatically.

---

## Sister packages

- [`@sjgant80-hub/groundlevel-worker`](https://github.com/sjgant80-hub/groundlevel-worker) · Cloudflare Worker REST API · POST /case-search · POST /weave · POST /compliance-audit
- [`@sjgant80-hub/groundlevel-shim`](https://github.com/sjgant80-hub/groundlevel-shim) · CDN drop-in `<script>` for legal helpers on any site
- [`@sjgant80-hub/groundlevel-mcp`](https://github.com/sjgant80-hub/groundlevel-mcp) · MCP server · case-search, weave, compliance-audit as MCP tools for Claude Code, Cursor, any MCP client
- [`@sjgant80-hub/groundlevel-obsidian`](https://github.com/sjgant80-hub/groundlevel-obsidian) · Obsidian plugin · case-search hotkey · drop cited cases into the active note
- [GroundLevel Pro](https://github.com/sjgant80-hub/groundlevel) · the full UI

All consume this SDK. The DB and the engines live in one place — every downstream tool stays consistent automatically.

---

## Caveats

- **Not legal advice.** This is information and templates. A solicitor reviews the output before any irreversible step.
- **UK-focused.** Most of the case DB is England & Wales. US / EU / Asia entries exist but are illustrative — verify against primary sources for your jurisdiction.
- **Statutes drift.** Verify any cited Act is still in force. Open an issue if you spot a stale citation; PRs welcome.

---

## Licence

MIT. Use freely. Fork freely. The law is public.

**◊·κ=φ⁴**
