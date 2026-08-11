/**
 * BC Property Transfer Tax.
 *
 * UNVERIFIED — awaiting human sign-off. The primary source was read on
 * 2026-08-11 and the findings are recorded per entry below.
 *
 * PTT is cash at closing. It cannot be funded by increasing mortgage principal,
 * and treating it as financeable is the error most likely to make a purchase
 * scenario look affordable when it is not.
 */

import type { SourcedSchedule, SourcedValue } from "../../types.ts";

const BC_PTT_PAGE = "https://www2.gov.bc.ca/gov/content/taxes/property-taxes/property-transfer-tax";
const READ = "Primary source read 2026-08-11.";

/** The general rate. Applies to all property classes. */
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
    citation: "Property transfer tax — general property transfer tax rate",
    url: BC_PTT_PAGE,
    retrieved: "2026-08-11",
  },
  note:
    `${READ} The general rate matches the candidate: 1% up to and including $200,000, ` +
    `2% above $200,000 up to and including $2,000,000, 3% above $2,000,000. ` +
    `But see BC_PTT_RESIDENTIAL_SURCHARGE_ABOVE_3M — the project docs this was drafted from ` +
    `stopped at 3% and omitted a further tax band entirely.`,
};

/**
 * A FURTHER 2% on the residential value above $3,000,000, on top of the general
 * 3%. For wholly residential property that means an effective 5% at the margin.
 *
 * Modelled separately rather than as a fourth tier because it is conditional on
 * property class: on mixed residential/commercial property it applies only to
 * the residential portion, so it cannot be expressed as a contiguous band over
 * total fair market value.
 *
 * This band was MISSING from the source documentation this library was seeded
 * from. Any existing calculation built on those docs understates PTT on
 * residential property above $3,000,000.
 */
export const BC_PTT_RESIDENTIAL_SURCHARGE_ABOVE_3M: SourcedValue = {
  value: 0.02,
  unit: "rate_decimal",
  jurisdiction: "CA-BC",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "BC Ministry of Finance",
    citation: "Property transfer tax — further 2% tax on residential property worth over $3,000,000",
    url: BC_PTT_PAGE,
    retrieved: "2026-08-11",
  },
  note:
    `${READ} Source states: "If the property has residential property worth over $3,000,000, ` +
    `a further 2% tax will be applied to the residential property value greater than $3,000,000." ` +
    `On mixed-class property the further 2% applies only to the residential portion. ` +
    `NOT PRESENT in the project docs — this is a genuine gap, not a restatement.`,
};

/** Threshold above which the residential surcharge applies. */
export const BC_PTT_RESIDENTIAL_SURCHARGE_THRESHOLD: SourcedValue = {
  value: 300000000,
  unit: "cad_cents",
  jurisdiction: "CA-BC",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "unverified",
  source: {
    authority: "BC Ministry of Finance",
    citation: "Property transfer tax — residential value threshold for the further 2% tax",
    url: BC_PTT_PAGE,
    retrieved: "2026-08-11",
  },
  note: `${READ} $3,000,000.`,
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
    citation: "First Time Home Buyers' Program — current exemption amounts, full exemption threshold",
    url: "https://www2.gov.bc.ca/gov/content/taxes/property-taxes/property-transfer-tax/exemptions/first-time-home-buyers/current-amount",
    retrieved: "2026-08-11",
  },
  note:
    "Candidate $835,000, phasing out to $860,000, drafted from project docs. NOT yet checked against the " +
    "exemption-amounts page — that page exists and is cited here, but its figures were not read. Verify both " +
    "this and the phase-out ceiling together.",
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
    url: "https://www2.gov.bc.ca/gov/content/taxes/property-taxes/property-transfer-tax/exemptions/first-time-home-buyers/current-amount",
    retrieved: "2026-08-11",
  },
  note: "Candidate $860,000, drafted from project docs. Not read off the source. Confirm whether the phase-out is linear.",
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
  note: "Candidate $1,100,000, phasing out to $1,150,000, drafted from project docs. Not read off the source.",
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
  note: "Candidate $1,150,000, drafted from project docs. Not read off the source.",
};
