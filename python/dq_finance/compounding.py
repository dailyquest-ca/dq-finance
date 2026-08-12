"""Mortgage compounding — methodology, not a tax constant.

This module is different from the data. It contains no rates and no thresholds,
only arithmetic that follows from a stated convention. That makes it verifiable
here: the tests prove the identities hold, and no government page is involved.
Methodology is the part of finance you CAN safely share between projects;
values are not.

The convention: Canadian mortgages compound semi-annually, not in advance,
rather than monthly. This comes from the Interest Act, and it is the single most
commonly botched piece of Canadian mortgage math — using rate/12 produces a
payment that looks plausible and is wrong for the entire amortization.

Mirrors ``src/ca/mortgage/compounding.ts``.
"""

from __future__ import annotations


def semi_annual_to_monthly_rate(annual_rate: float) -> float:
    """Convert a nominal annual rate compounded semi-annually to the effective monthly rate.

        (1 + annual / 2) ** (1/6) - 1

    Six because there are six months in a semi-annual period, so the sixth root
    of the semi-annual growth factor is one month of growth.

    :param annual_rate: nominal annual rate as a decimal — 0.0525 for 5.25%
    :raises ValueError: if the rate is not a decimal fraction in [0, 1)
    """
    if not isinstance(annual_rate, (int, float)) or isinstance(annual_rate, bool):
        raise ValueError(f"annual_rate must be a number, got {annual_rate!r}")
    if annual_rate != annual_rate:  # NaN
        raise ValueError("annual_rate must be a finite number, got nan")
    if annual_rate < 0 or annual_rate >= 1:
        raise ValueError(
            "annual_rate must be a decimal fraction in [0, 1) — 5.25% is 0.0525, "
            f"not 5.25. Got {annual_rate}"
        )
    return (1 + annual_rate / 2) ** (1 / 6) - 1


def naive_monthly_rate(annual_rate: float) -> float:
    """The naive monthly rate, provided ONLY so callers can demonstrate the gap.

    Never use this for a Canadian mortgage.
    """
    return annual_rate / 12


def level_payment_cents(principal_cents: int, monthly_rate: float, months: int) -> int:
    """Level monthly payment for a fully amortizing loan, in integer cents.

    Uses the standard annuity formula with the monthly rate supplied by the
    caller, so the compounding convention is an explicit decision at the call
    site rather than an assumption buried here.
    """
    if not isinstance(principal_cents, int) or isinstance(principal_cents, bool) or principal_cents < 0:
        raise ValueError(f"principal_cents must be a non-negative integer, got {principal_cents!r}")
    if not isinstance(months, int) or isinstance(months, bool) or months <= 0:
        raise ValueError(f"months must be a positive integer, got {months!r}")
    if monthly_rate < 0 or monthly_rate != monthly_rate:
        raise ValueError(f"monthly_rate must be a non-negative finite number, got {monthly_rate!r}")
    if monthly_rate == 0:
        return round(principal_cents / months)

    growth = (1 + monthly_rate) ** months
    return round((principal_cents * monthly_rate * growth) / (growth - 1))


def amortization_split_cents(
    balance_cents: int, monthly_rate: float, payment_cents: int
) -> tuple[int, int]:
    """Split one payment into (interest_cents, principal_cents)."""
    if not isinstance(balance_cents, int) or isinstance(balance_cents, bool) or balance_cents < 0:
        raise ValueError(f"balance_cents must be a non-negative integer, got {balance_cents!r}")
    interest_cents = round(balance_cents * monthly_rate)
    return interest_cents, payment_cents - interest_cents
