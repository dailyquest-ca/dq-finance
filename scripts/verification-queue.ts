/**
 * Prints what still needs a human to open a URL and confirm a number.
 *
 * Run: npm run queue
 *
 * This is the work the library cannot do for you. Everything else — noticing a
 * missing citation, catching a float where cents belong, breaking on a tax-year
 * rollover — is automated. Confirming that a figure on a government page says
 * what we think it says is not.
 */

import { ALL_ENTRIES, verificationQueue } from "../src/index.ts";

const queue = verificationQueue();
const total = Object.keys(ALL_ENTRIES).length;
const verified = total - queue.length;

console.log(`\ndq-finance verification queue\n${"=".repeat(60)}`);
console.log(`${verified} of ${total} entries verified.\n`);

if (queue.length === 0) {
  console.log("Nothing outstanding.\n");
  process.exit(0);
}

const byAuthority = new Map<string, typeof queue>();
for (const item of queue) {
  const list = byAuthority.get(item.authority) ?? [];
  list.push(item);
  byAuthority.set(item.authority, list);
}

// Grouped by authority so one sitting covers one source.
for (const [authority, items] of [...byAuthority].sort()) {
  console.log(`${authority} (${items.length})`);
  const urls = new Set(items.map((i) => i.url));
  for (const url of urls) console.log(`  ${url}`);
  for (const item of items) {
    console.log(`    - ${item.name}`);
    if (item.note) console.log(`        ${item.note}`);
  }
  console.log("");
}

console.log(`To verify one: open the URL, confirm the figure, then set`);
console.log(`  status: "verified", verifiedBy: "<name>", verifiedOn: "<YYYY-MM-DD>"`);
console.log(`and correct the value if it differs. Never flip the status without opening the page.\n`);
