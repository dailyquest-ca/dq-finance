/**
 * Mortgage arithmetic.
 *
 * These test identities, not tax facts, so they can be verified here without a
 * CRA page. Each asserts a property that must hold for the math to be right,
 * rather than an expected output copied from the implementation.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  semiAnnualToMonthlyRate,
  naiveMonthlyRate,
  levelPaymentCents,
  amortizationSplitCents,
} from "../ca/mortgage/compounding.ts";

describe("semiAnnualToMonthlyRate", () => {
  test("six months of compounding reproduces the semi-annual growth factor", () => {
    // The defining property: (1 + monthly)^6 === 1 + annual/2
    for (const annual of [0.01, 0.0525, 0.0625, 0.09, 0.15]) {
      const monthly = semiAnnualToMonthlyRate(annual);
      assert.ok(
        Math.abs(Math.pow(1 + monthly, 6) - (1 + annual / 2)) < 1e-12,
        `six months of ${monthly} did not compound to the semi-annual factor for ${annual}`,
      );
    }
  });

  test("is strictly below the naive rate/12, which is why rate/12 overstates payments", () => {
    for (const annual of [0.01, 0.0525, 0.0625, 0.09]) {
      assert.ok(
        semiAnnualToMonthlyRate(annual) < naiveMonthlyRate(annual),
        `semi-annual monthly rate should be below rate/12 at ${annual}`,
      );
    }
  });

  test("the gap is small per month but material over an amortization", () => {
    const annual = 0.0525;
    const correct = levelPaymentCents(50000000, semiAnnualToMonthlyRate(annual), 300);
    const naive = levelPaymentCents(50000000, naiveMonthlyRate(annual), 300);
    assert.ok(naive > correct, "the naive convention should overstate the payment");
    // Over 25 years the difference compounds into real money; assert it is not
    // a rounding artifact.
    assert.ok((naive - correct) * 300 > 100000, "difference over the full term should exceed $1,000");
  });

  test("zero rate is the degenerate case, not an error", () => {
    assert.equal(semiAnnualToMonthlyRate(0), 0);
  });

  test("rejects a percentage passed where a decimal belongs", () => {
    assert.throws(() => semiAnnualToMonthlyRate(5.25), RangeError);
    assert.throws(() => semiAnnualToMonthlyRate(-0.01), RangeError);
    assert.throws(() => semiAnnualToMonthlyRate(Number.NaN), RangeError);
  });
});

describe("levelPaymentCents", () => {
  test("a zero-rate loan repays principal evenly", () => {
    assert.equal(levelPaymentCents(120000, 0, 12), 10000);
  });

  test("payment covers interest and retires the balance to approximately zero", () => {
    const principal = 50000000;
    const monthly = semiAnnualToMonthlyRate(0.0525);
    const months = 300;
    const payment = levelPaymentCents(principal, monthly, months);

    let balance = principal;
    for (let i = 0; i < months; i++) {
      const { principalCents } = amortizationSplitCents(balance, monthly, payment);
      balance -= principalCents;
    }
    // Rounding to whole cents each month accumulates a small residue; it must
    // be trivial relative to the loan, and must not be negative-large.
    assert.ok(Math.abs(balance) < 50000, `balance after full term was ${balance} cents, expected near zero`);
  });

  test("the loan balance decreases monotonically under a positive schedule", () => {
    const monthly = semiAnnualToMonthlyRate(0.0625);
    const payment = levelPaymentCents(30000000, monthly, 240);
    let balance = 30000000;
    for (let i = 0; i < 240; i++) {
      const { principalCents } = amortizationSplitCents(balance, monthly, payment);
      assert.ok(principalCents > 0, `payment ${i} did not reduce principal — negative amortization`);
      balance -= principalCents;
    }
  });

  test("rejects float principal, since money is integer cents", () => {
    assert.throws(() => levelPaymentCents(1000.5, 0.004, 12), RangeError);
    assert.throws(() => levelPaymentCents(1000, 0.004, 0), RangeError);
    assert.throws(() => levelPaymentCents(-1000, 0.004, 12), RangeError);
  });
});
