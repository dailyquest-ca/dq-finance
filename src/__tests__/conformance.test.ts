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

  test("nothing in the shipped registry is usable yet", () => {
    const usable = Object.entries(ALL_ENTRIES).filter(([, e]) => isUsable(e, "2026-08-11"));
    assert.deepEqual(usable.map(([n]) => n), []);
  });
});
