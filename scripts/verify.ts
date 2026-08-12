/**
 * Record a human verification.
 *
 *   npm run verify -- <constant-name> --by "<who>"
 *   npm run verify -- --all --by "<who>"          (only what has been source-read)
 *
 * Flips status to "verified" and stamps verifiedBy and verifiedOn. Refuses
 * without a named verifier, because an attestation with nobody behind it is
 * worse than no attestation — it disables the machinery instead of arming it.
 *
 * This does not check anything. It records that a person did. Open the URL
 * first; the whole design rests on that step actually happening.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DATA = join(here, "..", "data", "constants.json");

const args = process.argv.slice(2);
const byIndex = args.indexOf("--by");
const by = byIndex >= 0 ? args[byIndex + 1] : undefined;
const targets = args.filter((a, i) => !a.startsWith("--") && i !== byIndex + 1);
const all = args.includes("--all");

if (!by?.trim()) {
  console.error(
    "Refusing: --by <name> is required.\n\n" +
      "Verification is a human act. A verified flag with nobody behind it is worse\n" +
      "than an unverified one, because it stops the library protecting you.\n\n" +
      '  npm run verify -- ca.federal.tfsaAnnualLimit2026 --by "zak"\n' +
      '  npm run verify -- --all --by "zak"',
  );
  process.exit(1);
}

if (!all && targets.length === 0) {
  console.error("Refusing: name at least one constant, or pass --all.");
  process.exit(1);
}

type Entry = { status: string; note?: string; verifiedBy?: string; verifiedOn?: string };
const data = JSON.parse(readFileSync(DATA, "utf8")) as Record<string, Entry>;

// Only entries whose note records an actual source read are eligible for --all.
// Anything still marked NOT CONFIRMED must be named explicitly, so a blanket
// verify cannot sweep up something nobody has looked at.
const sourceRead = (e: Entry) => /confirmed|CORRECTED|RENAMED/i.test(e.note ?? "") && !/NOT CONFIRMED/i.test(e.note ?? "");

const names = all ? Object.keys(data).filter((n) => sourceRead(data[n]!)) : targets;
const today = new Date().toISOString().slice(0, 10);

let changed = 0;
const skipped: string[] = [];

for (const name of names) {
  const entry = data[name];
  if (!entry) {
    console.error(`  unknown: ${name}`);
    process.exitCode = 1;
    continue;
  }
  if (entry.status === "verified") {
    skipped.push(`${name} (already verified by ${entry.verifiedBy})`);
    continue;
  }
  entry.status = "verified";
  entry.verifiedBy = by;
  entry.verifiedOn = today;
  changed++;
  console.log(`  verified: ${name}`);
}

if (changed > 0) writeFileSync(DATA, JSON.stringify(data, null, 2) + "\n");

for (const s of skipped) console.log(`  skipped:  ${s}`);

const remaining = Object.values(data).filter((e) => e.status !== "verified").length;
console.log(`\n${changed} recorded as verified by "${by}" on ${today}. ${remaining} still outstanding.`);
if (changed > 0) console.log("Run the tests before committing: npm test");
