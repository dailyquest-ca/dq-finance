# dq-finance

Canadian finance constants with **enforced** provenance, readable from **TypeScript and Python**.

Every value carries the authority that set it, a citation, a primary-source URL, an effective window, and whether a human has actually checked it. Nothing can be read until someone has.

```ts
import { resolve, registered } from "@dailyquest/finance";

const limit = resolve("ca.federal.tfsaAnnualLimit2026", registered.TFSA_ANNUAL_LIMIT_2026, "2026-06-30");
// UnverifiedConstantError: "ca.federal.tfsaAnnualLimit2026" has not been verified
// against its source and cannot be used.
//   Authority: CRA
//   Source:    https://www.canada.ca/en/revenue-agency/services/tax/rates.html
```

That error is the library working. A blank cell is safer than a wrong cell.

## Why this exists rather than a shared rules document

Three repos stated the same tax rules independently, and none of them could tell you where a number came from. A markdown file cannot fail closed. A typed accessor can.

The no-assumed-values doctrine used to be a paragraph someone had to remember. Here it is control flow:

| Doctrine | Enforcement |
| --- | --- |
| Every constant needs a named source | `validate()` rejects a missing authority, citation, or non-https URL. Test fails the build |
| Never invent a value | Nothing is readable until `status: "verified"` with a named verifier and a date |
| Fail closed when unconfirmed | `resolve()` throws. There is no fallback, default, or last-known-good path |
| Money is never a float | `cad_cents` values must be integers. A float fails validation |
| Rates are decimals | `rate_decimal` outside 0–1 fails — `6.25` where `0.0625` belongs is caught |
| A new tax year needs new verification | Past `effectiveTo`, `resolve()` throws. January breaks loudly instead of quietly reusing last year |

## Current state

**Zero of 17 entries are verified.** Nothing in this library can reach a calculation yet.

That is deliberate. The values present are *candidates* drafted from existing Daily Quest project documentation and from secondary reporting — none has been read off a government page by a human. Publishing them as facts would be the exact failure this library exists to prevent.

```bash
npm run queue      # what needs a human, grouped by source
npm test           # both languages
npm run test:ts    # 35 tests
npm run test:py    # 44 tests
```

## One source of truth, two readers

`data/constants.json` holds every entry. The TypeScript reader in `src/` and the Python package in `python/dq_finance/` both load it — neither owns the data, so they cannot drift.

Math belongs in Python, presentation in TypeScript, and both need the same numbers.

```python
from dq_finance import resolve
limit = resolve("ca.federal.tfsaAnnualLimit2026", transaction_date)
```

```ts
import { resolve } from "@dailyquest/finance";
const limit = resolve("ca.federal.tfsaAnnualLimit2026", transactionDate);
```

`data/conformance.json` is a shared suite of 16 cases executed by **both** test suites. A change to one language's gate that is not mirrored in the other fails in both, immediately. That is the guarantee — not a convention, a test.

Verification is confirm-or-correct against the URL, not research — the candidate is right there. Roughly a sitting per authority.

## Verifying an entry

1. `npm run queue` and pick a source
2. Open the URL and find the figure named in `citation`
3. Correct `value` if it differs — this happens, and it is the point
4. Set `status: "verified"`, `verifiedBy`, `verifiedOn`
5. Update `source.retrieved` to today
6. `npm test`

**Never flip a status without opening the page.** A verified flag with no one behind it is worse than an unverified one, because it stops the machinery from protecting you.

## What is and isn't in scope

**In:** values that come from a Canadian authority — CRA, CMHC, a provincial ministry — and the methodology that operates on them.

**Out:** anything a third party asserts without provenance. There is no upstream package to inherit here; nothing tax-related exists in the Claude plugin marketplace, and neither CRA nor the IRS publishes a machine-readable feed of rate tables. Even if one appeared, an auto-updating tax constant is precisely the silent-change failure this design refuses.

**Methodology is different.** `src/ca/mortgage/compounding.ts` holds arithmetic, not facts: Canadian mortgages compound semi-annually, so the monthly rate is `(1 + annual/2)^(1/6) - 1`. Its tests assert identities — six months of compounding reproduces the semi-annual factor — so they are verifiable here without a government page. That is why methodology is safe to share between projects and values are not.

## Layout

```
src/
├── types.ts                  SourcedValue, SourcedSchedule, Provenance
├── registry.ts               resolve(), validate(), the three error types
├── index.ts                  ALL_ENTRIES registry and the verification queue
├── ca/
│   ├── federal/              registered accounts
│   ├── bc/                   property transfer tax
│   └── mortgage/             CMHC, and compounding methodology
└── __tests__/
```

Adding a jurisdiction is deliberate, not speculative. Every entry added is verification work someone has to do, and an unverified entry blocks nothing until code tries to read it — so an unused jurisdiction is pure carrying cost.

## Consumers

`north-kove` and `finpath` both hold finance rules that belong here. Migrate a rule only once its entry is verified — moving an unverified value into this library and reading it anyway would defeat the whole design.
