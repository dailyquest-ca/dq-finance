/**
 * The gate.
 *
 * Nothing in this library reaches a calculation without passing through here,
 * and this refuses to hand back a value that is unverified or outside its
 * effective window. That is the no-assumed-values doctrine expressed as
 * control flow rather than as a paragraph someone might remember.
 *
 * A blank cell is safer than a wrong cell — so the failure mode is a thrown
 * error, never a fallback, a default, or a stale value.
 */

import { isSchedule, type Sourced, type SourcedSchedule, type SourcedValue, type Tier } from "./types.ts";

export class UnverifiedConstantError extends Error {
  constructor(name: string, entry: Sourced) {
    super(
      `"${name}" has not been verified against its source and cannot be used.\n` +
        `  Authority: ${entry.source.authority}\n` +
        `  Citation:  ${entry.source.citation}\n` +
        `  Source:    ${entry.source.url}\n\n` +
        `Open the URL, confirm the figure, then set status to "verified" with ` +
        `verifiedBy and verifiedOn. Do not work around this by inlining the number.`,
    );
    this.name = "UnverifiedConstantError";
  }
}

export class ConstantOutOfEffectError extends Error {
  constructor(name: string, entry: Sourced, asOf: string) {
    super(
      `"${name}" is not in effect on ${asOf} ` +
        `(effective ${entry.effectiveFrom} to ${entry.effectiveTo ?? "open"}).\n` +
        `  Source: ${entry.source.url}\n\n` +
        `A new tax year needs a new entry, verified against the current publication. ` +
        `Do not extend effectiveTo without re-checking the source — indexation moves these.`,
    );
    this.name = "ConstantOutOfEffectError";
  }
}

export class UnknownConstantError extends Error {
  constructor(name: string) {
    super(`"${name}" is not in the registry. Add it to data/constants.json with a primary source.`);
    this.name = "UnknownConstantError";
  }
}

export class MalformedConstantError extends Error {
  constructor(name: string, problem: string) {
    super(`"${name}" is malformed: ${problem}. This is a defect in dq-finance, not in the caller.`);
    this.name = "MalformedConstantError";
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Structural check. Runs on every read and across the whole registry in tests,
 * so a badly formed entry fails loudly rather than being silently trusted.
 */
export function validate(name: string, entry: Sourced): void {
  const { source } = entry;
  if (!source?.authority?.trim()) throw new MalformedConstantError(name, "source.authority is empty");
  if (!source?.citation?.trim()) throw new MalformedConstantError(name, "source.citation is empty");
  if (!source?.url?.trim()) throw new MalformedConstantError(name, "source.url is empty");
  if (!/^https:\/\//.test(source.url)) {
    throw new MalformedConstantError(name, `source.url must be https, got "${source.url}"`);
  }
  if (!ISO_DATE.test(source.retrieved)) {
    throw new MalformedConstantError(name, `source.retrieved must be YYYY-MM-DD, got "${source.retrieved}"`);
  }
  if (!ISO_DATE.test(entry.effectiveFrom)) {
    throw new MalformedConstantError(name, `effectiveFrom must be YYYY-MM-DD, got "${entry.effectiveFrom}"`);
  }
  if (entry.effectiveTo !== null && !ISO_DATE.test(entry.effectiveTo)) {
    throw new MalformedConstantError(name, `effectiveTo must be YYYY-MM-DD or null, got "${entry.effectiveTo}"`);
  }
  if (entry.effectiveTo !== null && entry.effectiveTo < entry.effectiveFrom) {
    throw new MalformedConstantError(name, "effectiveTo is before effectiveFrom");
  }
  if (entry.status === "verified") {
    if (!entry.verifiedBy?.trim()) {
      throw new MalformedConstantError(name, 'status is "verified" but verifiedBy is empty');
    }
    if (!ISO_DATE.test(entry.verifiedOn ?? "")) {
      throw new MalformedConstantError(name, 'status is "verified" but verifiedOn is not a YYYY-MM-DD date');
    }
  }

  if (isSchedule(entry)) {
    if (entry.tiers.length === 0) throw new MalformedConstantError(name, "schedule has no tiers");
    let previousTo: number | null = null;
    for (const [i, tier] of entry.tiers.entries()) {
      if (!Number.isInteger(tier.from)) {
        throw new MalformedConstantError(name, `tier ${i} "from" must be an integer (cents), got ${tier.from}`);
      }
      if (tier.to !== null && !Number.isInteger(tier.to)) {
        throw new MalformedConstantError(name, `tier ${i} "to" must be an integer (cents) or null`);
      }
      if (tier.to !== null && tier.to <= tier.from) {
        throw new MalformedConstantError(name, `tier ${i} is empty or inverted`);
      }
      if (i > 0 && tier.from !== previousTo) {
        throw new MalformedConstantError(
          name,
          `tier ${i} starts at ${tier.from} but tier ${i - 1} ends at ${previousTo} — schedules must be contiguous with no gap or overlap`,
        );
      }
      if (tier.rate < 0 || tier.rate > 1) {
        throw new MalformedConstantError(name, `tier ${i} rate ${tier.rate} is not a decimal fraction between 0 and 1`);
      }
      previousTo = tier.to;
    }
    if (previousTo !== null) {
      throw new MalformedConstantError(name, "the final tier must be open-ended (to: null)");
    }
    return;
  }

  const v = entry as SourcedValue;
  if (!Number.isFinite(v.value)) throw new MalformedConstantError(name, "value is not a finite number");
  if (v.unit === "cad_cents" && !Number.isInteger(v.value)) {
    throw new MalformedConstantError(name, `cad_cents value ${v.value} is not an integer — money is never a float`);
  }
  if (v.unit === "rate_decimal" && (v.value < 0 || v.value > 1)) {
    throw new MalformedConstantError(name, `rate_decimal value ${v.value} is outside 0..1 — 6.25% is 0.0625, not 6.25`);
  }
}

export function inEffect(entry: Sourced, asOf: string): boolean {
  if (asOf < entry.effectiveFrom) return false;
  if (entry.effectiveTo !== null && asOf > entry.effectiveTo) return false;
  return true;
}

/**
 * Read a constant. Throws unless it is well-formed, verified, and in effect.
 *
 * @param asOf ISO date the calculation applies to — a transaction date or a
 *   tax-year date, never "today" by default. Passing today's date to a
 *   historical calculation is how last year's rate silently reaches this year's
 *   filing, so the caller must be explicit.
 */
export function resolveFromRegistry(
  registry: Readonly<Record<string, Sourced>>,
  name: string,
  asOf: string,
): number | readonly Tier[] {
  if (!ISO_DATE.test(asOf)) {
    throw new MalformedConstantError(name, `asOf must be a YYYY-MM-DD date, got "${asOf}"`);
  }
  const entry = registry[name];
  if (!entry) throw new UnknownConstantError(name);
  validate(name, entry);
  if (entry.status !== "verified") throw new UnverifiedConstantError(name, entry);
  if (!inEffect(entry, asOf)) throw new ConstantOutOfEffectError(name, entry, asOf);
  return isSchedule(entry) ? (entry as SourcedSchedule).tiers : (entry as SourcedValue).value;
}

/** Non-throwing check, for building a verification queue or a status page. */
export function isUsable(entry: Sourced, asOf: string): boolean {
  return entry.status === "verified" && inEffect(entry, asOf);
}
