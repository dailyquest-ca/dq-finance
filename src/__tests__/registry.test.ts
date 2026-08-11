/**
 * The gate, tested.
 *
 * These prove the library fails closed. If any of these ever go green in the
 * wrong direction, an unverified tax number can reach a calculation.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolve, isUsable, UnverifiedConstantError, ConstantOutOfEffectError, MalformedConstantError } from "../registry.ts";
import { ALL_ENTRIES } from "../index.ts";
import type { SourcedValue } from "../types.ts";

const base = {
  unit: "cad_cents",
  jurisdiction: "CA",
  effectiveFrom: "2026-01-01",
  effectiveTo: "2026-12-31",
  source: {
    authority: "CRA",
    citation: "A citation specific enough to re-check",
    url: "https://www.canada.ca/en/revenue-agency/services/tax/rates.html",
    retrieved: "2026-08-11",
  },
} as const;

const verified: SourcedValue = { ...base, value: 700000, status: "verified", verifiedBy: "zak", verifiedOn: "2026-08-11" };
const unverified: SourcedValue = { ...base, value: 700000, status: "unverified" };

describe("resolve", () => {
  test("returns the value when verified and in effect", () => {
    assert.equal(resolve("test.ok", verified, "2026-06-30"), 700000);
  });

  test("throws on an unverified value rather than returning it", () => {
    assert.throws(() => resolve("test.unverified", unverified, "2026-06-30"), UnverifiedConstantError);
  });

  test("throws before the effective window opens", () => {
    assert.throws(() => resolve("test.early", verified, "2025-12-31"), ConstantOutOfEffectError);
  });

  test("throws after the effective window closes", () => {
    assert.throws(() => resolve("test.late", verified, "2027-01-01"), ConstantOutOfEffectError);
  });

  test("a tax-year rollover breaks loudly instead of returning last year's number", () => {
    // The failure mode this library exists to prevent: 2026's limit quietly
    // used for a 2027 calculation.
    assert.throws(() => resolve("test.rollover", verified, "2027-03-15"), ConstantOutOfEffectError);
  });

  test("requires an explicit asOf date, so 'today' is never assumed", () => {
    assert.throws(() => resolve("test.badDate", verified, "not-a-date"), MalformedConstantError);
    assert.throws(() => resolve("test.badDate", verified, ""), MalformedConstantError);
  });

  test("open-ended values resolve at any date at or after the start", () => {
    const openEnded: SourcedValue = { ...verified, effectiveTo: null };
    assert.equal(resolve("test.open", openEnded, "2099-01-01"), 700000);
    assert.throws(() => resolve("test.open", openEnded, "2020-01-01"), ConstantOutOfEffectError);
  });

  test("the error message points at the source rather than just failing", () => {
    try {
      resolve("test.unverified", unverified, "2026-06-30");
      assert.fail("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      assert.match(msg, /canada\.ca/, "the error must give the reader somewhere to go");
      assert.match(msg, /Do not work around this/, "the error must close off the obvious workaround");
    }
  });
});

describe("isUsable", () => {
  test("reports without throwing, for status pages and queues", () => {
    assert.equal(isUsable(verified, "2026-06-30"), true);
    assert.equal(isUsable(unverified, "2026-06-30"), false);
    assert.equal(isUsable(verified, "2027-06-30"), false);
  });
});

describe("the shipped library", () => {
  test("no seeded entry is usable yet — every one awaits human verification", () => {
    // This test is expected to change as entries are verified. It exists to
    // make the current state explicit rather than implied: right now, nothing
    // in this library can reach a calculation.
    const usable = Object.entries(ALL_ENTRIES).filter(([, e]) => isUsable(e, "2026-08-11"));
    assert.deepEqual(
      usable.map(([n]) => n),
      [],
      "an entry became usable — if that was intentional, update this test with the verification evidence",
    );
  });
});
