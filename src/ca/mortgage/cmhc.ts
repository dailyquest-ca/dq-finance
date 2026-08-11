/**
 * CMHC mortgage default insurance.
 *
 * UNVERIFIED. Candidates drafted from existing Daily Quest project docs.
 *
 * The premium is rolled into mortgage principal, unlike PTT and GST which are
 * cash at closing. Getting that distinction backwards changes affordability
 * materially in either direction.
 */

import type { SourcedValue } from "../../types.ts";

const CMHC_PREMIUMS_PAGE = "https://www.cmhc-schl.gc.ca/consumers/home-buying/mortgage-loan-insurance-for-consumers";
const SEEDED = "Candidate drafted from project docs; not yet read off the primary source.";

/**
 * Premium as a percentage of the loan, banded by down payment.
 *
 * Deliberately NOT modelled as a SourcedSchedule: the schedule type describes
 * a progressive schedule over a money axis, and this is a flat rate selected by
 * a down-payment band. Forcing it into the wrong shape would make the tier
 * contiguity check meaningless.
 */
export const CMHC_PREMIUM_BANDS: readonly {
  readonly minDownPaymentRate: number;
  readonly maxDownPaymentRate: number;
  readonly premiumRate: number;
}[] = [
  { minDownPaymentRate: 0.05, maxDownPaymentRate: 0.0999, premiumRate: 0.04 },
  { minDownPaymentRate: 0.1, maxDownPaymentRate: 0.1499, premiumRate: 0.031 },
  { minDownPaymentRate: 0.15, maxDownPaymentRate: 0.1999, premiumRate: 0.028 },
];

export const CMHC_PREMIUM_BANDS_SOURCE: SourcedValue = {
  value: CMHC_PREMIUM_BANDS.length,
  unit: "count",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CMHC",
    citation: "Mortgage loan insurance premiums — premium rate by loan-to-value band",
    url: CMHC_PREMIUMS_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidates: 4.00% for 5–9.99% down, 3.10% for 10–14.99%, 2.80% for 15–19.99%. Also confirm the reported +1% surcharge for extended amortization, which project docs mention but do not pin to a source.`,
};

/** Insurance is required below this down payment, and unavailable above the price cap below. */
export const CMHC_INSURANCE_REQUIRED_BELOW_DOWN_PAYMENT_RATE: SourcedValue = {
  value: 0.2,
  unit: "rate_decimal",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "CMHC",
    citation: "Mortgage loan insurance — when insurance is required",
    url: CMHC_PREMIUMS_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate 20%.`,
};

/** Insured mortgages are unavailable at or above this purchase price. */
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
    url: CMHC_PREMIUMS_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate $1,000,000. This cap was reported as changing in recent policy updates — treat the project-docs value as likely stale and check carefully.`,
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
    url: CMHC_PREMIUMS_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate 5% on the first $500,000, 10% on the portion above.`,
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
    url: CMHC_PREMIUMS_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate $500,000.`,
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
    url: CMHC_PREMIUMS_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate 10%.`,
};
