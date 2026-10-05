"""Business activity text normalization shared by discovery and interpretation."""

from __future__ import annotations

import re


def strip_negations(text: str) -> str:
    """Strip negative clauses (e.g. 'no cement manufacturing', 'does not produce...')
    so negative exclusions are not falsely matched as positive business activities.
    """
    if not text:
        return ""
    pattern = r"\b(?:no|not|neither|nor|without|does\s+not|doesn't|do\s+not|don't|has\s+no|have\s+no|excluding|except\s+for|except)\s+[^.;\n]+"
    return re.sub(pattern, " ", text, flags=re.IGNORECASE)
