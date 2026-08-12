/**
 * dq-finance — Canadian finance constants with enforced provenance.
 *
 * Nothing here is a bare number. Every value carries the authority that set it,
 * a citation, a primary-source URL, an effective window, and whether a human has
 * actually checked it. `resolve()` refuses anything unverified or out of window.
 *
 * **`data/constants.json` is the source of truth.** This module and the Python
 * package in `python/dq_finance/` are two readers of the same file, so the two
 * languages cannot drift. `data/conformance.json` proves they agree.
 *
 * Read the README before adding an entry.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveFromRegistry } from "./registry.ts";
import type { Sourced, Tier } from "./types.ts";

export * from "./types.ts";
export {
  isUsable,
  inEffect,
  validate,
  UnverifiedConstantError,
  ConstantOutOfEffectError,
  MalformedConstantError,
  UnknownConstantError,
} from "./registry.ts";

export {
  semiAnnualToMonthlyRate,
  naiveMonthlyRate,
  levelPaymentCents,
  amortizationSplitCents,
} from "./ca/mortgage/compounding.ts";

const here = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(here, "..", "data", "constants.json");

/** Every sourced entry, keyed by a stable dotted name. Loaded from the shared JSON. */
export const ALL_ENTRIES: Readonly<Record<string, Sourced>> = Object.freeze(
  JSON.parse(readFileSync(DATA_PATH, "utf8")) as Record<string, Sourced>,
);

/**
 * Read a constant by name. Throws unless it is well-formed, verified, and in
 * effect on `asOf`.
 *
 * @param asOf ISO date the calculation applies to — a transaction date or a
 *   tax-year date, never "today" by default. Passing today's date to a
 *   historical calculation is how last year's rate silently reaches this year's
 *   filing, so the caller must be explicit.
 */
export function resolve(name: string, asOf: string): number | readonly Tier[] {
  return resolveFromRegistry(ALL_ENTRIES, name, asOf);
}

/** The raw entry, including provenance, for inspection and reporting. */
export function getEntry(name: string): Sourced | undefined {
  return ALL_ENTRIES[name];
}

/** Everything still awaiting a human check, for the verification queue report. */
export function verificationQueue(): { name: string; authority: string; url: string; note?: string }[] {
  return Object.entries(ALL_ENTRIES)
    .filter(([, e]) => e.status !== "verified")
    .map(([name, e]) => ({ name, authority: e.source.authority, url: e.source.url, note: e.note }));
}
