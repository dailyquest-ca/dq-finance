/**
 * The shape every value in this library must take.
 *
 * A bare number is not a fact. A number with an authority, a citation, a URL,
 * an effective window, and a human who checked it is a fact. This module makes
 * the second thing the only representable thing.
 */

/** Jurisdiction a value applies to. Extend deliberately, not speculatively. */
export type Jurisdiction = "CA" | "CA-BC";

/**
 * Units are explicit because the most expensive class of bug in financial code
 * is a correct number in the wrong unit. There is no "just a number" here.
 */
export type Unit =
  /** Canadian dollars stored as integer cents. Never a float. */
  | "cad_cents"
  /** A rate as a decimal fraction: 0.0625 is 6.25%. */
  | "rate_decimal"
  /** A dimensionless count, e.g. a number of years. */
  | "count";

/**
 * Where a value came from. Every field is required — a partial citation is
 * the same as no citation, because it cannot be re-checked.
 */
export interface Provenance {
  /** The body with authority over this value. "CRA", "CMHC", "BC Ministry of Finance". */
  readonly authority: string;
  /** Enough detail for a human to find the exact figure on the page. */
  readonly citation: string;
  /** Primary source. Not a blog, not a bank's summary, not an accounting firm's PDF. */
  readonly url: string;
  /** ISO date the URL was actually read. Tells you how stale the check is. */
  readonly retrieved: string;
}

/**
 * "verified" means a human opened the URL and confirmed the value.
 * Nothing else counts — not a web search, not a model's recollection,
 * not a figure carried over from a previous version of the codebase.
 */
export type VerificationStatus = "verified" | "unverified";

export interface SourcedValue<T extends number = number> {
  readonly value: T;
  readonly unit: Unit;
  readonly jurisdiction: Jurisdiction;
  /** ISO date this value starts applying. */
  readonly effectiveFrom: string;
  /** ISO date it stops applying, or null if open-ended. */
  readonly effectiveTo: string | null;
  readonly source: Provenance;
  readonly status: VerificationStatus;
  /** Who confirmed it against the source. Required when status is "verified". */
  readonly verifiedBy?: string;
  /** ISO date of that confirmation. Required when status is "verified". */
  readonly verifiedOn?: string;
  /** Anything a future reader needs to interpret the value correctly. */
  readonly note?: string;
}

/** A tier in a progressive schedule — tax brackets, premium bands, transfer tax. */
export interface Tier {
  /** Inclusive lower bound in cad_cents. */
  readonly from: number;
  /** Exclusive upper bound in cad_cents, or null for the top tier. */
  readonly to: number | null;
  /** Rate applying within this tier, as a decimal. */
  readonly rate: number;
}

export interface SourcedSchedule {
  readonly tiers: readonly Tier[];
  readonly jurisdiction: Jurisdiction;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly source: Provenance;
  readonly status: VerificationStatus;
  readonly verifiedBy?: string;
  readonly verifiedOn?: string;
  readonly note?: string;
}

export type Sourced = SourcedValue | SourcedSchedule;

export function isSchedule(entry: Sourced): entry is SourcedSchedule {
  return "tiers" in entry;
}
