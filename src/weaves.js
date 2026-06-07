// @sjgant80-hub/groundlevel-sdk · weaves · 7-strand pattern library

export const WEAVE_PATTERNS = {
  unfair_dismissal: { strands: { CROWN: 0.7, EQUITY: 0.9, GUILD: 1.0, LIBERTY: 0.4 }, keywords: ['unfair', 'dismissal', 'redundancy', 'misconduct', 'procedure'] },
  deposit_dispute: { strands: { HEARTH: 1.0, EQUITY: 0.8, MAGNA: 0.3 }, keywords: ['deposit', 'protection', 'tenancy', 'landlord', 'tds', 'mydeposits', 'dps'] },
  gdpr_breach: { strands: { LIBERTY: 1.0, EQUITY: 0.7, CROWN: 0.5, ADMIRALTY: 0.4 }, keywords: ['gdpr', 'data', 'breach', 'dsar', 'ico', 'art8'] },
  consumer_refund: { strands: { EQUITY: 1.0, GUILD: 0.8 }, keywords: ['consumer', 'refund', 'cra', 'section75', 'chargeback'] },
  whistleblowing: { strands: { GUILD: 1.0, LIBERTY: 0.9, MAGNA: 0.7, CROWN: 0.5 }, keywords: ['whistleblowing', 'pida', 'disclosure', 'protected'] },
  platform_unpaid: { strands: { GUILD: 1.0, EQUITY: 0.8, ADMIRALTY: 0.5 }, keywords: ['platform', 'freelancer', 'unpaid', 'invoice', 'lba'] },
  frozen_account: { strands: { EQUITY: 0.9, GUILD: 0.8, ADMIRALTY: 0.6, CROWN: 0.5 }, keywords: ['frozen', 'paypal', 'fos', 'cfpb', 'payment', 'processor'] },
  illegal_eviction: { strands: { HEARTH: 1.0, CROWN: 0.8, LIBERTY: 0.7 }, keywords: ['eviction', 'illegal', 'pea1977', 'harassment'] },
  discrimination: { strands: { GUILD: 0.9, EQUITY: 1.0, MAGNA: 0.6, LIBERTY: 0.6 }, keywords: ['discrimination', 'equality', 'protected', 'characteristic'] },
  subscription_trap: { strands: { EQUITY: 1.0, GUILD: 0.6 }, keywords: ['subscription', 'autorenewal', 'cancel', 'ccrs2013'] },
};

export const WEAVE_STRANDS = [
  { name: 'MAGNA',     icon: '⚖', angle: 'Constitutional / fundamental rights' },
  { name: 'LIBERTY',   icon: '🕊', angle: 'Personal liberty / privacy' },
  { name: 'CROWN',     icon: '👑', angle: 'Criminal / regulatory' },
  { name: 'EQUITY',    icon: '⚪', angle: 'Fairness / conscience / equitable remedies' },
  { name: 'HEARTH',    icon: '🏠', angle: 'Housing / family / welfare' },
  { name: 'GUILD',     icon: '⚒', angle: 'Employment / commercial / trade' },
  { name: 'ADMIRALTY', icon: '⚓', angle: 'Cross-border / maritime / international' },
];

export const PATTERN_KEYS = Object.keys(WEAVE_PATTERNS);
export const STRAND_NAMES = WEAVE_STRANDS.map(s => s.name);
