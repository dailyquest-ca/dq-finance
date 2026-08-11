/**
 * CMHC mortgage default insurance.
 *
 * UNVERIFIED — awaiting human sign-off. The premium table was read from the
 * primary source on 2026-08-11 and CORRECTED; see the note on
 * CMHC_PREMIUM_BANDS_SOURCE for what changed.
 *
 * The premium is rolled into mortgage principal, unlike PTT and GST which are
 * cash at closing. Getting that distinction backwards changes affordability
 * materially in either direction.
 */

import type { SourcedValue } from "../../types.ts";

const CMHC_COST_PAGE =
  "https://www.cmhc-schl.gc.ca/consumers/home-buying/mortgage-loan-insurance-for-consumers/cmhc-mortgage-loan-insurance-cost";
const READ = "Primary source read 2026-08-11.";

/**
 * Premium as a percentage of the loan, banded by LOAN-TO-VALUE.
 *
 * CMHC publishes by LTV, not by down payment. The project docs this library was
 * seeded from expressed it as down-payment bands, which is a derived form —
 * correct as far as it went, but it covered only the three highest-LTV bands
 * and omitted the rest of the table entirely.
 *
 * Down payment is the complement of LTV: 5% down is 95% LTV.
 *
 * Deliberately NOT a SourcedSchedule — that type describes a progressive
 * schedule over a money axis, and this is a flat rate selected by an LTV band.
 * Forcing it into that shape would make the contiguity check meaningless.
 */
export const CMHC_PREMIUM_BANDS_BY_LTV: readonly {
  readonly maxLtv: number;
  readonly premiumRate: number;
  readonly nonTraditionalDownPayment?: boolean;
}[] = [
  { maxLtv: 0.65, premiumRate: 0.006 },
  { maxLtv: 0.75, premiumRate: 0.017 },
  { maxLtv: 0.8, premiumRate: 0.024 },
  { maxLtv: 0.85, premiumRate: 0.028 },
  { maxLtv: 0.9, premiumRate: 0.031 },
  { maxLtv: 0.95, premiumRate: 0.04 },
  { maxLtv: 0.95, premiumRate: 0.045, nonTraditionalDownPayment: true },
];

export const CMHC_PREMIUM_BANDS_SOURCE: SourcedValue = {
  value: CMHC_PREMIUM_BANDS_BY_LTV.length,
  unit: "count",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CMHC",
    citation: "Mortgage loan insurance cost — premium rate by loan-to-value ratio",
    url: CMHC_COST_PAGE,
    retrieved: "2026-08-11",
  },
  note:
    `${READ} CORRECTED against the source. Published table, premium on total loan: ` +
    `up to 65% LTV 0.60%; 65.01–75% 1.70%; 75.01–80% 2.40%; 80.01–85% 2.80%; ` +
    `85.01–90% 3.10%; 90.01–95% 4.00%; 90.01–95% with a non-traditional down payment 4.50%. ` +
    `The project docs held only three bands expressed as down payment (4.00% / 3.10% / 2.80%). ` +
    `Those three values map correctly onto 95% / 90% / 85% LTV, but four bands and the ` +
    `non-traditional case were missing. Premiums in Quebec, Ontario and Saskatchewan are ` +
    `subject to provincial sales tax — not modelled here yet.`,
};

/** Insurance is required below this down payment. */
export const CMHC_INSURANCE_REQUIRED_BELOW_DOWN_PAYMENT_RATE: SourcedValue = {
  value: 0.2,
  unit: "rate_decimal",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CMHC",
    citation: "Mortgage loan insurance — when mortgage loan insurance is required",
    url: CMHC_COST_PAGE,
    retrieved: "2026-08-11",
  },
  note: "Candidate 20%, drafted from project docs. The cost page did not state this directly; find the rule on the requirement page before signing off.",
};

/** Maximum purchase price eligible for insured financing. */
export const CMHC_MAX_INSURABLE_PRICE: SourcedValue = {
  value: 100000000,
  unit: "cad_cents",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CMHC",
    citation: "Mortgage loan insurance — maximum purchase price eligibility",
    url: CMHC_COST_PAGE,
    retrieved: "2026-08-11",
  },
  note:
    `${READ} NOT CONFIRMED, and the candidate looks wrong. The cost page does not state a ` +
    `maximum. CMHC's premium calculator page describes covering homes priced below $1,500,000, ` +
    `which suggests the cap moved from the $1,000,000 in the project docs. ` +
    `Treat the candidate as stale and find the authoritative figure before using it — this one ` +
    `changes eligibility outright, not just a number.`,
};

/** Minimum down payment: this rate on the portion up to the threshold below. */
export const MIN_DOWN_PAYMENT_RATE_LOWER_BAND: SourcedValue = {
  value: 0.05,
  unit: "rate_decimal",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CMHC",
    citation: "Minimum down payment requirements",
    url: CMHC_COST_PAGE,
    retrieved: "2026-08-11",
  },
  note:
    `${READ} Consistent with the source: 5% minimum for a purchase price of $500,000 or less; ` +
    `above $500,000 it is 5% on the first $500,000 and 10% on the remainder. Candidate matches.`,
};

export const MIN_DOWN_PAYMENT_BAND_THRESHOLD: SourcedValue = {
  value: 50000000,
  unit: "cad_cents",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CMHC",
    citation: "Minimum down payment requirements — band threshold",
    url: CMHC_COST_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${READ} $500,000. Candidate matches.`,
};

export const MIN_DOWN_PAYMENT_RATE_UPPER_BAND: SourcedValue = {
  value: 0.1,
  unit: "rate_decimal",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CMHC",
    citation: "Minimum down payment requirements — rate above the band threshold",
    url: CMHC_COST_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${READ} 10% on the portion above $500,000. Candidate matches.`,
};
