/**
 * BC Property Transfer Tax.
 *
 * UNVERIFIED. Candidates drafted from existing Daily Quest project docs.
 *
 * PTT is cash at closing. It cannot be funded by increasing mortgage principal,
 * and treating it as financeable is the error most likely to make a purchase
 * scenario look affordable when it is not.
 */

import type { SourcedSchedule, SourcedValue } from "../../types.ts";

const BC_PTT_PAGE = "https://www2.gov.bc.ca/gov/content/taxes/property-taxes/property-transfer-tax";
const SEEDED = "Candidate drafted from project docs; not yet read off the primary source.";

export const BC_PTT_SCHEDULE: SourcedSchedule = {
  tiers: [
    { from: 0, to: 20000000, rate: 0.01 },
    { from: 20000000, to: 200000000, rate: 0.02 },
    { from: 200000000, to: null, rate: 0.03 },
  ],
  jurisdiction: "CA-BC",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "BC Ministry of Finance",
    citation: "Property transfer tax — general rate of tax",
    url: BC_PTT_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidates: 1% on the first $200,000, 2% from $200,000 to $2,000,000, 3% above $2,000,000. Check whether a further band applies to residential property above $3,000,000 — project docs do not mention one and that is a plausible gap.`,
};

/** First-time buyer exemption: full relief at or below this price. */
export const BC_PTT_FTB_FULL_EXEMPTION_CEILING: SourcedValue = {
  value: 83500000,
  unit: "cad_cents",
  jurisdiction: "CA-BC",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "BC Ministry of Finance",
    citation: "First Time Home Buyers' Program — full exemption threshold",
    url: BC_PTT_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate $835,000, phasing out to $860,000.`,
};

/** First-time buyer exemption: relief reaches zero at this price. */
export const BC_PTT_FTB_PHASE_OUT_CEILING: SourcedValue = {
  value: 86000000,
  unit: "cad_cents",
  jurisdiction: "CA-BC",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "BC Ministry of Finance",
    citation: "First Time Home Buyers' Program — partial exemption upper bound",
    url: BC_PTT_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate $860,000. Confirm whether the phase-out is linear.`,
};

/** Newly built home exemption: full relief at or below this price. */
export const BC_PTT_NEW_BUILD_FULL_EXEMPTION_CEILING: SourcedValue = {
  value: 110000000,
  unit: "cad_cents",
  jurisdiction: "CA-BC",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "BC Ministry of Finance",
    citation: "Newly Built Home Exemption — full exemption threshold",
    url: BC_PTT_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate $1,100,000, phasing out to $1,150,000.`,
};

export const BC_PTT_NEW_BUILD_PHASE_OUT_CEILING: SourcedValue = {
  value: 115000000,
  unit: "cad_cents",
  jurisdiction: "CA-BC",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "BC Ministry of Finance",
    citation: "Newly Built Home Exemption — partial exemption upper bound",
    url: BC_PTT_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${SEEDED} Candidate $1,150,000.`,
};
