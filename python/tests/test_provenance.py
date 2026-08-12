"""The doctrine, as a test — the Python half.

Mirrors src/__tests__/provenance.test.ts. Both sweep the same JSON, so a
malformed entry fails in both languages.
"""

from __future__ import annotations

from dq_finance import registry


def test_every_entry_is_structurally_well_formed() -> None:
    for name, entry in registry.ALL_ENTRIES.items():
        registry.validate(name, entry)  # raises on failure


def test_every_entry_cites_an_https_primary_source() -> None:
    for name, entry in registry.ALL_ENTRIES.items():
        source = entry["source"]
        assert source["url"].startswith("https://"), f"{name} has a non-https source"
        assert len(source["authority"]) > 1, f"{name} has no authority"
        assert len(source["citation"]) > 5, f"{name} citation is too vague to re-check"


def test_no_entry_claims_verification_without_a_verifier() -> None:
    for name, entry in registry.ALL_ENTRIES.items():
        if entry.get("status") != "verified":
            continue
        assert str(entry.get("verifiedBy", "")).strip(), f"{name} is verified but names no verifier"
        assert entry.get("verifiedOn"), f"{name} has no verification date"


def test_money_is_integer_cents() -> None:
    for name, entry in registry.ALL_ENTRIES.items():
        if registry.is_schedule(entry) or entry.get("unit") != "cad_cents":
            continue
        value = entry["value"]
        assert isinstance(value, int) and not isinstance(value, bool), (
            f"{name} stores money as a non-integer: {value}"
        )


def test_rates_are_decimal_fractions() -> None:
    for name, entry in registry.ALL_ENTRIES.items():
        if registry.is_schedule(entry) or entry.get("unit") != "rate_decimal":
            continue
        assert 0 <= entry["value"] <= 1, f'{name} rate {entry["value"]} looks like a percentage'


def test_schedules_are_contiguous_and_open_ended() -> None:
    for name, entry in registry.ALL_ENTRIES.items():
        if not registry.is_schedule(entry):
            continue
        tiers = entry["tiers"]
        assert tiers, f"{name} has no tiers"
        assert tiers[-1].get("to") is None, f"{name} top tier must be open-ended"
        for i in range(1, len(tiers)):
            assert tiers[i]["from"] == tiers[i - 1].get("to"), f"{name} has a gap at tier {i}"


def test_nothing_is_usable_yet() -> None:
    """Expected to change as entries are verified. Makes the current state explicit."""
    usable = [n for n, e in registry.ALL_ENTRIES.items() if registry.is_usable(e, "2026-08-11")]
    assert usable == [], (
        "an entry became usable — if intentional, update this test with the verification evidence"
    )
