"""Mortgage arithmetic — the Python half.

Tests identities, not tax facts, so they are verifiable here without a government
page. Mirrors src/__tests__/compounding.test.ts.
"""

from __future__ import annotations

import pytest

from dq_finance import (
    amortization_split_cents,
    level_payment_cents,
    naive_monthly_rate,
    semi_annual_to_monthly_rate,
)


@pytest.mark.parametrize("annual", [0.01, 0.0525, 0.0625, 0.09, 0.15])
def test_six_months_reproduces_the_semi_annual_factor(annual: float) -> None:
    monthly = semi_annual_to_monthly_rate(annual)
    assert abs((1 + monthly) ** 6 - (1 + annual / 2)) < 1e-12


@pytest.mark.parametrize("annual", [0.01, 0.0525, 0.0625, 0.09])
def test_is_below_the_naive_rate(annual: float) -> None:
    assert semi_annual_to_monthly_rate(annual) < naive_monthly_rate(annual)


def test_the_gap_is_material_over_an_amortization() -> None:
    annual = 0.0525
    correct = level_payment_cents(50_000_000, semi_annual_to_monthly_rate(annual), 300)
    naive = level_payment_cents(50_000_000, naive_monthly_rate(annual), 300)
    assert naive > correct
    assert (naive - correct) * 300 > 100_000, "difference over the full term should exceed $1,000"


def test_zero_rate_is_degenerate_not_an_error() -> None:
    assert semi_annual_to_monthly_rate(0) == 0


@pytest.mark.parametrize("bad", [5.25, -0.01, float("nan")])
def test_rejects_a_percentage_where_a_decimal_belongs(bad: float) -> None:
    with pytest.raises(ValueError):
        semi_annual_to_monthly_rate(bad)


def test_zero_rate_loan_repays_evenly() -> None:
    assert level_payment_cents(120_000, 0, 12) == 10_000


def test_payment_retires_the_balance() -> None:
    principal, months = 50_000_000, 300
    monthly = semi_annual_to_monthly_rate(0.0525)
    payment = level_payment_cents(principal, monthly, months)

    balance = principal
    for _ in range(months):
        _, principal_part = amortization_split_cents(balance, monthly, payment)
        balance -= principal_part

    assert abs(balance) < 50_000, f"balance after full term was {balance} cents"


def test_balance_decreases_monotonically() -> None:
    monthly = semi_annual_to_monthly_rate(0.0625)
    payment = level_payment_cents(30_000_000, monthly, 240)
    balance = 30_000_000
    for i in range(240):
        _, principal_part = amortization_split_cents(balance, monthly, payment)
        assert principal_part > 0, f"payment {i} did not reduce principal — negative amortization"
        balance -= principal_part


@pytest.mark.parametrize(
    "args", [(1000.5, 0.004, 12), (1000, 0.004, 0), (-1000, 0.004, 12)]
)
def test_rejects_bad_inputs(args: tuple) -> None:
    with pytest.raises(ValueError):
        level_payment_cents(*args)
