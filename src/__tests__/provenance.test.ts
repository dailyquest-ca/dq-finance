/**
 * The doctrine, as a test.
 *
 * These assertions are the whole point of the library. A constant that cannot
 * name its source, or that claims verification without a verifier, fails the
 * build here rather than surfacing as a wrong number in a filing years later.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ALL_ENTRIES, verificationQueue } from "../index.ts";
import { validate, MalformedConstantError } from "../registry.ts";
import { isSchedule } from "../types.ts";

describe("provenance", () => {
  test("every entry is structurally well-formed", () => {
    for (const [name, entry] of Object.entries(ALL_ENTRIES)) {
      assert.doesNotThrow(() => validate(name, entry), `${name} failed validation`);
    }
  });

  test("every entry cites an https primary source", () => {
    for (const [name, entry] of Object.entries(ALL_ENTRIES)) {
      assert.match(entry.source.url, /^https:\/\//, `${name} has a non-https source`);
      assert.ok(entry.source.authority.length > 1, `${name} has no authority`);
      assert.ok(entry.source.citation.length > 5, `${name} citation is too vague to re-check`);
    }
  });

  test("no entry claims verification without a named verifier and date", () => {
    for (const [name, entry] of Object.entries(ALL_ENTRIES)) {
      if (entry.status !== "verified") continue;
      assert.ok(entry.verifiedBy?.trim(), `${name} is verified but names no verifier`);
      assert.match(entry.verifiedOn ?? "", /^\d{4}-\d{2}-\d{2}$/, `${name} has no verification date`);
    }
  });

  test("money is stored as integer cents, never a float", () => {
    for (const [name, entry] of Object.entries(ALL_ENTRIES)) {
      if (isSchedule(entry)) continue;
      if (entry.unit !== "cad_cents") continue;
      assert.ok(Number.isInteger(entry.value), `${name} stores money as a non-integer: ${entry.value}`);
    }
  });

  test("rates are decimal fractions, not percentages", () => {
    for (const [name, entry] of Object.entries(ALL_ENTRIES)) {
      if (isSchedule(entry)) continue;
      if (entry.unit !== "rate_decimal") continue;
      assert.ok(entry.value >= 0 && entry.value <= 1, `${name} rate ${entry.value} looks like a percentage`);
    }
  });

  test("schedules are contiguous and open-ended at the top", () => {
    for (const [name, entry] of Object.entries(ALL_ENTRIES)) {
      if (!isSchedule(entry)) continue;
      assert.ok(entry.tiers.length > 0, `${name} has no tiers`);
      assert.equal(entry.tiers.at(-1)?.to, null, `${name} top tier must be open-ended`);
      for (let i = 1; i < entry.tiers.length; i++) {
        assert.equal(entry.tiers[i]!.from, entry.tiers[i - 1]!.to, `${name} has a gap or overlap at tier ${i}`);
      }
    }
  });

  test("a malformed entry is rejected, not silently trusted", () => {
    assert.throws(
      () =>
        validate("test.noUrl", {
          value: 1,
          unit: "count",
          jurisdiction: "CA",
          effectiveFrom: "2026-01-01",
          effectiveTo: null,
          status: "unverified",
          source: { authority: "CRA", citation: "somewhere", url: "", retrieved: "2026-01-01" },
        }),
      MalformedConstantError,
    );

    assert.throws(
      () =>
        validate("test.floatMoney", {
          value: 100.5,
          unit: "cad_cents",
          jurisdiction: "CA",
          effectiveFrom: "2026-01-01",
          effectiveTo: null,
          status: "unverified",
          source: { authority: "CRA", citation: "a citation", url: "https://x.ca", retrieved: "2026-01-01" },
        }),
      MalformedConstantError,
      "money as a float must be rejected",
    );

    assert.throws(
      () =>
        validate("test.percentAsRate", {
          value: 6.25,
          unit: "rate_decimal",
          jurisdiction: "CA",
          effectiveFrom: "2026-01-01",
          effectiveTo: null,
          status: "unverified",
          source: { authority: "CRA", citation: "a citation", url: "https://x.ca", retrieved: "2026-01-01" },
        }),
      MalformedConstantError,
      "6.25 as a rate_decimal must be rejected",
    );

    assert.throws(
      () =>
        validate("test.verifiedWithoutVerifier", {
          value: 1,
          unit: "count",
          jurisdiction: "CA",
          effectiveFrom: "2026-01-01",
          effectiveTo: null,
          status: "verified",
          source: { authority: "CRA", citation: "a citation", url: "https://x.ca", retrieved: "2026-01-01" },
        }),
      MalformedConstantError,
      "verified status without a verifier must be rejected",
    );
  });

  test("the verification queue reports what still needs a human", () => {
    const queue = verificationQueue();
    for (const item of queue) {
      assert.ok(item.url.startsWith("https://"), `${item.name} queued without a checkable URL`);
    }
    // Not an assertion about the count — this test documents the queue exists
    // and is well-formed. The count is expected to fall to zero over time.
    assert.ok(Array.isArray(queue));
  });
});
