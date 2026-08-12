/**
 * Executes data/conformance.json — the same suite the Python reader runs.
 *
 * If a change to one language's gate logic is not mirrored in the other, this
 * fails in both test suites immediately. That is the whole point: two readers of
 * one JSON file, provably in agreement.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ALL_ENTRIES, isUsable } from "../index.ts";
import * as registry from "../registry.ts";
import type { Sourced, Tier } from "../types.ts";

const here = dirname(fileURLToPath(import.meta.url));
const conformance = JSON.parse(
  readFileSync(join(here, "..", "..", "data", "conformance.json"), "utf8"),
) as {
  fixtures: Record<string, Sourced>;
  cases: {
    why: string;
    registry: "fixtures" | "constants";
    name: string;
    asOf: string;
    expect: { value?: number; tiers?: [number, number | null, number][]; error?: string };
  }[];
};

const ERRORS: Record<string, new (...args: never[]) => Error> = {
  UnverifiedConstantError: registry.UnverifiedConstantError,
  ConstantOutOfEffectError: registry.ConstantOutOfEffectError,
  MalformedConstantError: registry.MalformedConstantError,
  UnknownConstantError: registry.UnknownConstantError,
};

describe("conformance (shared with the Python reader)", () => {
  for (const c of conformance.cases) {
    test(c.why, () => {
      const reg = c.registry === "fixtures" ? conformance.fixtures : ALL_ENTRIES;
      const call = () => registry.resolveFromRegistry(reg, c.name, c.asOf);

      if (c.expect.error) {
        const expected = ERRORS[c.expect.error];
        assert.ok(expected, `unknown error type in fixture: ${c.expect.error}`);
        assert.throws(call, expected!, `expected ${c.expect.error}`);
        return;
      }

      const got = call();

      if (c.expect.tiers) {
        const flattened = (got as readonly Tier[]).map((t) => [t.from, t.to, t.rate]);
        assert.deepEqual(flattened, c.expect.tiers);
      } else {
        assert.equal(got, c.expect.value);
      }
    });
  }

  test("the conformance file is not empty or truncated", () => {
    assert.ok(conformance.cases.length >= 16);
    assert.ok(conformance.cases.some((c) => c.expect.error));
    assert.ok(conformance.cases.some((c) => c.expect.value !== undefined));
    assert.ok(conformance.cases.some((c) => c.expect.tiers));
  });

  // Entries deliberately NOT verified, with the reason. Anything that leaves this
  // list must have had a primary source actually read. Mirrors UNVERIFIED_BY_DESIGN
  // in the Python suite.
  const UNVERIFIED_BY_DESIGN = [
    // CRA contribution-room page 404'd on 2026-08-11, so the 18% rate was never
    // read off a primary source. Must not be swept into a bulk verify.
    "ca.federal.rrspEarnedIncomeRate",
  ];

  test("exactly the expected entries are unverified", () => {
    const unverified = Object.entries(ALL_ENTRIES)
      .filter(([, e]) => e.status !== "verified")
      .map(([n]) => n)
      .sort();
    assert.deepEqual(unverified, [...UNVERIFIED_BY_DESIGN].sort());
  });

  test("every verified entry names a verifier, a date, and what the source said", () => {
    for (const [name, e] of Object.entries(ALL_ENTRIES)) {
      if (e.status !== "verified") continue;
      assert.ok(e.verifiedBy?.trim(), `${name} verified with no verifier named`);
      assert.ok(e.verifiedOn, `${name} verified with no date`);
      assert.ok(e.note, `${name} verified with no note recording what the source said`);
    }
  });

  test("verified entries are actually usable in window", () => {
    const usable = Object.entries(ALL_ENTRIES).filter(([, e]) => isUsable(e, "2026-08-12"));
    assert.ok(usable.length >= 18, `expected most entries usable, got ${usable.length}`);
  });
});
