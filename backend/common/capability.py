"""Honest "not configured" responses for boundaries with no knowledge behind them.

Authority: PRD_v2.0 §P5 (no invented regulatory content); TRD_v2.0 §30.

Several product surfaces are routed and typed but have no knowledge source yet:
there is no scheme catalogue, no workflow definitions, no statutory calendar and
no regulatory-change feed in the repository. Those screens must say so.

The alternative — shipping plausible-looking sample content — is worse than an
empty screen. A user cannot tell a hardcoded "15% to 35% capital subsidy" from a
verified one, so a demo fixture becomes an unsourced legal claim the moment it is
rendered. Every payload here therefore carries `available: false` plus the reason,
so the frontend can render a specific empty state instead of inventing rows.
"""

from __future__ import annotations

from typing import Any


def unavailable(
    *,
    capability: str,
    reason: str,
    requires: str,
    items_key: str = "items",
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Payload stating that a capability has no knowledge source yet.

    `items_key` keeps the collection field named as the frontend expects, so a
    screen can iterate an always-empty list without special-casing this shape.
    """
    payload: dict[str, Any] = {
        "capability": capability,
        "available": False,
        "reason": reason,
        "requires": requires,
        items_key: [],
        "count": 0,
    }
    if extra:
        payload.update(extra)
    return payload
