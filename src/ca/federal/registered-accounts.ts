/**
 * Canadian registered account limits.
 *
 * EVERY ENTRY HERE IS UNVERIFIED. The values are candidates drafted from
 * existing Daily Quest project documentation and from secondary reporting.
 * None of them has been read off a CRA page by a human. `resolve()` will
 * refuse all of them until someone does that and flips the status.
 *
 * The candidate value is present on purpose: verification should be a
 * thirty-second confirm-or-correct against the source, not a research task.
 * It is inert until verified — nothing can read it.
 */

import type { SourcedValue } from "../../types.ts";

const CRA_LIMITS_PAGE =
  "https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html";
const SEEDED = "Candidate drafted from project docs and secondary reporting; not yet read off the primary source.";

/** RRSP annual dollar limit (the cap; the other half of the test is 18% of prior-year earned income). */
export const RRSP_DOLLAR_LIMIT_2026: SourcedValue = {
  value: 3381000,
  unit: "cad_cents",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: "2026-12-31",
  status: "unverified",
  source: {
    authority: "CRA",
    citation: "MP, DB, RRSP, DPSP, ALDA, TFSA limits and the YMPE — RRSP dollar limit row, 2026",
    url: CRA_LIMITS_PAGE,
    retrieved: "2026-08-11",
  },
  note:
    "Primary source read 2026-08-11: the CRA limits table shows $33,810 for 2026 and $32,490 for 2025. " +
    "The candidate matches. Awaiting human sign-off.",
};

/** The income-based half of RRSP room: this fraction of prior-year earned income. */
export const RRSP_EARNED_INCOME_RATE: SourcedValue = {
  value: 0.18,
  unit: "rate_decimal",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CRA",
    citation: "RRSP contribution room — 18% of prior year earned income, less pension adjustment",
    url: CRA_LIMITS_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} This rate has been stable for many years but still needs a source check. Room is 18% of prior-year earned income OR the dollar limit above, whichever is LESS, minus the pension adjustment.`,
};

/** TFSA annual contribution room. Indexed and rounded to the nearest $500. */
export const TFSA_ANNUAL_LIMIT_2026: SourcedValue = {
  value: 700000,
  unit: "cad_cents",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: "2026-12-31",
  status: "unverified",
  source: {
    authority: "CRA",
    citation: "TFSA contribution room — annual limit, 2026",
    url: CRA_LIMITS_PAGE,
    retrieved: "2026-08-11",
  },
  note:
    "Primary source read 2026-08-11: the CRA limits table shows $7,000 for both 2026 and 2025. " +
    "The candidate matches. Awaiting human sign-off. Indexed to inflation in $500 increments, so it does not move every year. Withdrawn amounts return to room on 1 January of the FOLLOWING year, not immediately.",
};

/** FHSA annual contribution limit. */
export const FHSA_ANNUAL_LIMIT: SourcedValue = {
  value: 800000,
  unit: "cad_cents",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CRA",
    citation: "First Home Savings Account — annual participation room",
    url: CRA_LIMITS_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate $8,000. Carry-forward rules apply; confirm whether unused room accumulates and to what cap.`,
};

/** FHSA lifetime contribution limit. */
export const FHSA_LIFETIME_LIMIT: SourcedValue = {
  value: 4000000,
  unit: "cad_cents",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CRA",
    citation: "First Home Savings Account — lifetime contribution limit",
    url: CRA_LIMITS_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate $40,000.`,
};

/** Home Buyers' Plan maximum RRSP withdrawal. */
export const HBP_WITHDRAWAL_LIMIT: SourcedValue = {
  value: 6000000,
  unit: "cad_cents",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CRA",
    citation: "Home Buyers' Plan — maximum withdrawal amount",
    url: CRA_LIMITS_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate $60,000. Repayment schedule and the grace period before repayments begin also need capturing — they affect any projection past the withdrawal year.`,
};
