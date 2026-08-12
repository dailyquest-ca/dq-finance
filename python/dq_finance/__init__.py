"""dq-finance — Canadian finance constants with enforced provenance.

Nothing here is a bare number. Every value carries the authority that set it, a
citation, a primary-source URL, an effective window, and whether a human has
actually checked it. ``resolve()`` refuses anything unverified or out of window.

``data/constants.json`` is the source of truth. This package and the TypeScript
reader in ``src/`` are two readers of the same file, so the two languages cannot
drift. ``data/conformance.json`` is executed by both test suites and proves it.

Read the README before adding an entry.
"""

from .compounding import (
    amortization_split_cents,
    level_payment_cents,
    naive_monthly_rate,
    semi_annual_to_monthly_rate,
)
from .registry import (
    ALL_ENTRIES,
    ConstantOutOfEffectError,
    MalformedConstantError,
    UnknownConstantError,
    UnverifiedConstantError,
    get_entry,
    in_effect,
    is_schedule,
    is_usable,
    resolve,
    resolve_from_registry,
    validate,
    verification_queue,
)

__all__ = [
    "ALL_ENTRIES",
    "ConstantOutOfEffectError",
    "MalformedConstantError",
    "UnknownConstantError",
    "UnverifiedConstantError",
    "amortization_split_cents",
    "get_entry",
    "in_effect",
    "is_schedule",
    "is_usable",
    "level_payment_cents",
    "naive_monthly_rate",
    "resolve",
    "resolve_from_registry",
    "semi_annual_to_monthly_rate",
    "validate",
    "verification_queue",
]
