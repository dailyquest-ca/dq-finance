/**
 * Mortgage compounding — methodology, not a tax constant.
 *
 * This file is different from the data modules. It contains no rates and no
 * thresholds, only arithmetic that follows from a stated convention. That makes
 * it verifiable here: the tests prove the identities hold, and no CRA page is
 * involved. Methodology is the part of finance you CAN safely share between
 * projects; values are not.
 *
 * The convention: Canadian mortgages compound semi-annually, not in advance,
 * rather than monthly. This comes from the Interest Act, and it is the single
 * most commonly botched piece of Canadian mortgage math — using rate/12
 * produces a payment that looks plausible and is wrong for the entire
 * amortization.
 */

/**
 * Convert a nominal annual rate compounded semi-annually into the equivalent
 * effective monthly rate.
 *
 *     (1 + annual / 2) ^ (1/6) - 1
 *
 * Six because there are six months in a semi-annual period, so the sixth root
 * of the semi-annual growth factor is one month of growth.
 *
 * @param annualRate nominal annual rate as a decimal — 0.0525 for 5.25%
 * @throws if the rate is not a finite decimal fraction in [0, 1)
 */
export function semiAnnualToMonthlyRate(annualRate: number): number {
  if (!Number.isFinite(annualRate)) {
    throw new RangeError(`annualRate must be a finite number, got ${annualRate}`);
  }
  if (annualRate < 0 || annualRate >= 1) {
    throw new RangeError(
      `annualRate must be a decimal fraction in [0, 1) — 5.25% is 0.0525, not 5.25. Got ${annualRate}`,
    );
  }
  return Math.pow(1 + annualRate / 2, 1 / 6) - 1;
}

/**
 * The naive monthly rate, provided ONLY so callers can demonstrate the gap in
 * tests and reviews. Never use it for a Canadian mortgage.
 *
 * @deprecated Not actually deprecated — marked so an IDE strikes it through and
 *   nobody reaches for it by accident.
 */
export function naiveMonthlyRate(annualRate: number): number {
  return annualRate / 12;
}

/**
 * Level monthly payment for a fully amortizing loan, in integer cents.
 *
 * Uses the standard annuity formula with the monthly rate supplied by the
 * caller, so the compounding convention is an explicit decision at the call
 * site rather than an assumption buried here.
 *
 * @param principalCents loan principal in integer cents
 * @param monthlyRate effective monthly rate — pass semiAnnualToMonthlyRate() for Canada
 * @param months total number of payments
 */
export function levelPaymentCents(principalCents: number, monthlyRate: number, months: number): number {
  if (!Number.isInteger(principalCents) || principalCents < 0) {
    throw new RangeError(`principalCents must be a non-negative integer, got ${principalCents}`);
  }
  if (!Number.isInteger(months) || months <= 0) {
    throw new RangeError(`months must be a positive integer, got ${months}`);
  }
  if (!Number.isFinite(monthlyRate) || monthlyRate < 0) {
    throw new RangeError(`monthlyRate must be a non-negative finite number, got ${monthlyRate}`);
  }
  if (monthlyRate === 0) return Math.round(principalCents / months);

  const growth = Math.pow(1 + monthlyRate, months);
  return Math.round((principalCents * monthlyRate * growth) / (growth - 1));
}

/** Split one payment into interest and principal, in integer cents. */
export function amortizationSplitCents(
  balanceCents: number,
  monthlyRate: number,
  paymentCents: number,
): { interestCents: number; principalCents: number } {
  if (!Number.isInteger(balanceCents) || balanceCents < 0) {
    throw new RangeError(`balanceCents must be a non-negative integer, got ${balanceCents}`);
  }
  const interestCents = Math.round(balanceCents * monthlyRate);
  return { interestCents, principalCents: paymentCents - interestCents };
}
