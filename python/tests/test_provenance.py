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


#: Entries deliberately NOT verified, with the reason. Anything that leaves this
#: list must have had a primary source actually read.
UNVERIFIED_BY_DESIGN = {
    # CRA contribution-room page 404'd on 2026-08-11, so the 18% rate was never
    # read off a primary source. Must not be swept into a bulk verify.
    "ca.federal.rrspEarnedIncomeRate",
    # Strategy thresholds measured from the 2016-2026 winner census (230,007 liquid US
    # name-months, split-adjusted, delisted retained). Deliberately unverified, for three
    # reasons that a human has to weigh before any of them can size a real position:
    #   * one decade, containing no full bear cycle, so every figure is regime-flattered
    #   * the census tested a SPRINT label (+70% in six months) only; whether these hold
    #     for a marathon label is an open question, not an assumption
    #   * research measurements are not authorities. A CRA table can be read and confirmed;
    #     an edge cannot, it can only be re-measured out of sample
    "strategy.momentum.sprintDepthFloor",
    "strategy.momentum.sprintOffHighFloor",
    "strategy.momentum.sprintTurnThreshold",
    "strategy.momentum.sprintRangeFloor",
    "strategy.momentum.marathonFormationMonths",
    "strategy.risk.heatCap",
}


def test_exactly_the_expected_entries_are_unverified() -> None:
    """Forces any change in verification state to be acknowledged, in both languages."""
    unverified = {n for n, e in registry.ALL_ENTRIES.items() if e.get("status") != "verified"}
    assert unverified == UNVERIFIED_BY_DESIGN, (
        "verification state changed — if intentional, update UNVERIFIED_BY_DESIGN with the reason"
    )


def test_every_verified_entry_names_a_verifier_and_a_date() -> None:
    for name, entry in registry.ALL_ENTRIES.items():
        if entry.get("status") != "verified":
            continue
        assert str(entry.get("verifiedBy", "")).strip(), f"{name} verified with no verifier named"
        assert entry.get("verifiedOn"), f"{name} verified with no date"
        assert entry.get("note"), f"{name} verified with no note recording what the source said"
