"""Executes data/conformance.json — the same suite the TypeScript reader runs.

If a change to one language's gate logic is not mirrored in the other, this fails
in both test suites immediately. That is the whole point: two readers of one JSON
file, provably in agreement.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from dq_finance import registry

_DATA = Path(__file__).resolve().parents[2] / "data"
_CONFORMANCE = json.loads((_DATA / "conformance.json").read_text(encoding="utf-8"))
_CASES = _CONFORMANCE["cases"]


def _registry_for(case: dict) -> dict:
    return _CONFORMANCE["fixtures"] if case["registry"] == "fixtures" else registry.ALL_ENTRIES


@pytest.mark.parametrize("case", _CASES, ids=[c["why"] for c in _CASES])
def test_conformance_case(case: dict) -> None:
    reg = _registry_for(case)
    expect = case["expect"]

    if "error" in expect:
        expected_error = getattr(registry, expect["error"])
        with pytest.raises(expected_error):
            registry.resolve_from_registry(reg, case["name"], case["asOf"])
        return

    got = registry.resolve_from_registry(reg, case["name"], case["asOf"])

    if "tiers" in expect:
        flattened = [[t["from"], t.get("to"), t["rate"]] for t in got]
        assert flattened == expect["tiers"]
    else:
        assert got == expect["value"]


def test_every_case_is_exercised() -> None:
    """Guard against an empty or truncated conformance file silently passing."""
    assert len(_CASES) >= 16
    assert any("error" in c["expect"] for c in _CASES)
    assert any("value" in c["expect"] for c in _CASES)
    assert any("tiers" in c["expect"] for c in _CASES)
