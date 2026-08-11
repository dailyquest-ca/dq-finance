/**
 * dq-finance — Canadian finance constants with enforced provenance.
 *
 * Nothing here is a bare number. Every value carries the authority that set it,
 * a citation, a primary-source URL, an effective window, and whether a human has
 * actually checked it. `resolve()` refuses anything unverified or out of window.
 *
 * Read the README before adding an entry.
 */

export * from "./types.ts";
export {
  resolve,
  isUsable,
  validate,
  UnverifiedConstantError,
  ConstantOutOfEffectError,
  MalformedConstantError,
} from "./registry.ts";

export {
  semiAnnualToMonthlyRate,
  naiveMonthlyRate,
  levelPaymentCents,
  amortizationSplitCents,
} from "./ca/mortgage/compounding.ts";

import * as registered from "./ca/federal/registered-accounts.ts";
import * as ptt from "./ca/bc/property-transfer-tax.ts";
import * as cmhc from "./ca/mortgage/cmhc.ts";
import type { Sourced } from "./types.ts";

export { registered, ptt, cmhc };

/**
 * Every sourced entry in the library, keyed by a stable dotted name.
 *
 * This exists so the test suite can sweep the whole library rather than
 * relying on someone remembering to add a test per constant. A new module is
 * only truly registered once it appears here — see the coverage test.
 */
export const ALL_ENTRIES: Readonly<Record<string, Sourced>> = Object.freeze({
  "ca.federal.rrspDollarLimit2026": registered.RRSP_DOLLAR_LIMIT_2026,
  "ca.federal.rrspEarnedIncomeRate": registered.RRSP_EARNED_INCOME_RATE,
  "ca.federal.tfsaAnnualLimit2026": registered.TFSA_ANNUAL_LIMIT_2026,
  "ca.federal.fhsaAnnualLimit": registered.FHSA_ANNUAL_LIMIT,
  "ca.federal.fhsaLifetimeLimit": registered.FHSA_LIFETIME_LIMIT,
  "ca.federal.hbpWithdrawalLimit": registered.HBP_WITHDRAWAL_LIMIT,
  "ca.bc.pttSchedule": ptt.BC_PTT_SCHEDULE,
  "ca.bc.pttFtbFullExemptionCeiling": ptt.BC_PTT_FTB_FULL_EXEMPTION_CEILING,
  "ca.bc.pttFtbPhaseOutCeiling": ptt.BC_PTT_FTB_PHASE_OUT_CEILING,
  "ca.bc.pttNewBuildFullExemptionCeiling": ptt.BC_PTT_NEW_BUILD_FULL_EXEMPTION_CEILING,
  "ca.bc.pttNewBuildPhaseOutCeiling": ptt.BC_PTT_NEW_BUILD_PHASE_OUT_CEILING,
  "ca.mortgage.cmhcPremiumBands": cmhc.CMHC_PREMIUM_BANDS_SOURCE,
  "ca.mortgage.cmhcInsuranceRequiredBelowDownPaymentRate": cmhc.CMHC_INSURANCE_REQUIRED_BELOW_DOWN_PAYMENT_RATE,
  "ca.mortgage.cmhcMaxInsurablePrice": cmhc.CMHC_MAX_INSURABLE_PRICE,
  "ca.mortgage.minDownPaymentRateLowerBand": cmhc.MIN_DOWN_PAYMENT_RATE_LOWER_BAND,
  "ca.mortgage.minDownPaymentBandThreshold": cmhc.MIN_DOWN_PAYMENT_BAND_THRESHOLD,
  "ca.mortgage.minDownPaymentRateUpperBand": cmhc.MIN_DOWN_PAYMENT_RATE_UPPER_BAND,
});

/** Everything still awaiting a human check, for the verification queue report. */
export function verificationQueue(): { name: string; authority: string; url: string; note?: string }[] {
  return Object.entries(ALL_ENTRIES)
    .filter(([, e]) => e.status !== "verified")
    .map(([name, e]) => ({ name, authority: e.source.authority, url: e.source.url, note: e.note }));
}
