"""The gate.

Nothing reaches a calculation without passing through here, and this refuses to
hand back a value that is unverified or outside its effective window. That is the
no-assumed-values doctrine expressed as control flow rather than as a paragraph
someone might remember.

A blank cell is safer than a wrong cell — so the failure mode is a raised
exception, never a fallback, a default, or a stale value.

This mirrors ``src/registry.ts`` exactly. ``data/conformance.json`` is executed by
both test suites and proves the two agree.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Mapping

_DATA_DIR = Path(__file__).resolve().parents[2] / "data"
_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class UnverifiedConstantError(Exception):
    """Raised when a constant has not been checked against its source by a human."""

    def __init__(self, name: str, entry: Mapping[str, Any]) -> None:
        source = entry["source"]
        super().__init__(
            f'"{name}" has not been verified against its source and cannot be used.\n'
            f'  Authority: {source["authority"]}\n'
            f'  Citation:  {source["citation"]}\n'
            f'  Source:    {source["url"]}\n\n'
            "Open the URL, confirm the figure, then set status to \"verified\" with "
            "verifiedBy and verifiedOn. Do not work around this by inlining the number."
        )


class ConstantOutOfEffectError(Exception):
    """Raised when a constant is read for a date outside its effective window."""

    def __init__(self, name: str, entry: Mapping[str, Any], as_of: str) -> None:
        super().__init__(
            f'"{name}" is not in effect on {as_of} '
            f'(effective {entry["effectiveFrom"]} to {entry.get("effectiveTo") or "open"}).\n'
            f'  Source: {entry["source"]["url"]}\n\n'
            "A new tax year needs a new entry, verified against the current publication. "
            "Do not extend effectiveTo without re-checking the source — indexation moves these."
        )


class MalformedConstantError(Exception):
    """Raised when an entry itself is broken. A defect in dq-finance, not the caller."""

    def __init__(self, name: str, problem: str) -> None:
        super().__init__(
            f'"{name}" is malformed: {problem}. This is a defect in dq-finance, not in the caller.'
        )


class UnknownConstantError(Exception):
    """Raised when a name is not in the registry."""

    def __init__(self, name: str) -> None:
        super().__init__(
            f'"{name}" is not in the registry. Add it to data/constants.json with a primary source.'
        )


def _load(filename: str) -> dict[str, Any]:
    return json.loads((_DATA_DIR / filename).read_text(encoding="utf-8"))


#: Every sourced entry, keyed by a stable dotted name. Loaded from the shared JSON
#: that the TypeScript reader also loads, so the two cannot drift.
ALL_ENTRIES: dict[str, Any] = _load("constants.json")


def is_schedule(entry: Mapping[str, Any]) -> bool:
    return "tiers" in entry


def validate(name: str, entry: Mapping[str, Any]) -> None:
    """Structural check. Runs on every read and across the registry in tests."""
    source = entry.get("source") or {}
    if not str(source.get("authority", "")).strip():
        raise MalformedConstantError(name, "source.authority is empty")
    if not str(source.get("citation", "")).strip():
        raise MalformedConstantError(name, "source.citation is empty")
    url = str(source.get("url", "")).strip()
    if not url:
        raise MalformedConstantError(name, "source.url is empty")
    if not url.startswith("https://"):
        raise MalformedConstantError(name, f'source.url must be https, got "{url}"')
    if not _ISO_DATE.match(str(source.get("retrieved", ""))):
        raise MalformedConstantError(
            name, f'source.retrieved must be YYYY-MM-DD, got "{source.get("retrieved")}"'
        )

    effective_from = str(entry.get("effectiveFrom", ""))
    effective_to = entry.get("effectiveTo")
    if not _ISO_DATE.match(effective_from):
        raise MalformedConstantError(name, f'effectiveFrom must be YYYY-MM-DD, got "{effective_from}"')
    if effective_to is not None and not _ISO_DATE.match(str(effective_to)):
        raise MalformedConstantError(name, f'effectiveTo must be YYYY-MM-DD or null, got "{effective_to}"')
    if effective_to is not None and str(effective_to) < effective_from:
        raise MalformedConstantError(name, "effectiveTo is before effectiveFrom")

    if entry.get("status") == "verified":
        if not str(entry.get("verifiedBy", "")).strip():
            raise MalformedConstantError(name, 'status is "verified" but verifiedBy is empty')
        if not _ISO_DATE.match(str(entry.get("verifiedOn", ""))):
            raise MalformedConstantError(
                name, 'status is "verified" but verifiedOn is not a YYYY-MM-DD date'
            )

    if is_schedule(entry):
        tiers = entry["tiers"]
        if not tiers:
            raise MalformedConstantError(name, "schedule has no tiers")
        previous_to: int | None = None
        for i, tier in enumerate(tiers):
            frm, to, rate = tier["from"], tier.get("to"), tier["rate"]
            # bool is a subclass of int in Python; exclude it explicitly.
            if not isinstance(frm, int) or isinstance(frm, bool):
                raise MalformedConstantError(name, f'tier {i} "from" must be an integer (cents), got {frm}')
            if to is not None and (not isinstance(to, int) or isinstance(to, bool)):
                raise MalformedConstantError(name, f'tier {i} "to" must be an integer (cents) or null')
            if to is not None and to <= frm:
                raise MalformedConstantError(name, f"tier {i} is empty or inverted")
            if i > 0 and frm != previous_to:
                raise MalformedConstantError(
                    name,
                    f"tier {i} starts at {frm} but tier {i - 1} ends at {previous_to} "
                    "— schedules must be contiguous",
                )
            if rate < 0 or rate > 1:
                raise MalformedConstantError(
                    name, f"tier {i} rate {rate} is not a decimal fraction between 0 and 1"
                )
            previous_to = to
        if previous_to is not None:
            raise MalformedConstantError(name, "the final tier must be open-ended (to: null)")
        return

    value = entry.get("value")
    unit = entry.get("unit")
    if not isinstance(value, (int, float)) or isinstance(value, bool) or value != value:
        raise MalformedConstantError(name, "value is not a finite number")
    if unit == "cad_cents" and (not isinstance(value, int) or isinstance(value, bool)):
        raise MalformedConstantError(
            name, f"cad_cents value {value} is not an integer — money is never a float"
        )
    if unit == "rate_decimal" and (value < 0 or value > 1):
        raise MalformedConstantError(
            name, f"rate_decimal value {value} is outside 0..1 — 6.25% is 0.0625, not 6.25"
        )


def in_effect(entry: Mapping[str, Any], as_of: str) -> bool:
    if as_of < entry["effectiveFrom"]:
        return False
    effective_to = entry.get("effectiveTo")
    if effective_to is not None and as_of > effective_to:
        return False
    return True


def is_usable(entry: Mapping[str, Any], as_of: str) -> bool:
    """Non-throwing check, for building a verification queue or a status page."""
    return entry.get("status") == "verified" and in_effect(entry, as_of)


def resolve_from_registry(
    registry: Mapping[str, Any], name: str, as_of: str
) -> int | float | list[dict[str, Any]]:
    if not _ISO_DATE.match(as_of):
        raise MalformedConstantError(name, f'asOf must be a YYYY-MM-DD date, got "{as_of}"')
    entry = registry.get(name)
    if entry is None:
        raise UnknownConstantError(name)
    validate(name, entry)
    if entry.get("status") != "verified":
        raise UnverifiedConstantError(name, entry)
    if not in_effect(entry, as_of):
        raise ConstantOutOfEffectError(name, entry, as_of)
    return entry["tiers"] if is_schedule(entry) else entry["value"]


def resolve(name: str, as_of: str) -> int | float | list[dict[str, Any]]:
    """Read a constant by name.

    Raises unless it is well-formed, verified, and in effect on ``as_of``.

    :param as_of: ISO date the calculation applies to — a transaction date or a
        tax-year date, never "today" by default. Passing today's date to a
        historical calculation is how last year's rate silently reaches this
        year's filing, so the caller must be explicit.
    """
    return resolve_from_registry(ALL_ENTRIES, name, as_of)


def get_entry(name: str) -> Mapping[str, Any] | None:
    """The raw entry, including provenance, for inspection and reporting."""
    return ALL_ENTRIES.get(name)


def verification_queue() -> list[dict[str, Any]]:
    """Everything still awaiting a human check."""
    return [
        {
            "name": name,
            "authority": entry["source"]["authority"],
            "url": entry["source"]["url"],
            "note": entry.get("note"),
        }
        for name, entry in ALL_ENTRIES.items()
        if entry.get("status") != "verified"
    ]
