"""Configurable Notification Policies for compliance deadlines.

Authority: PRD_v2.0 §20; TRD_v2.0 §30, §31.

Policies decouple the reminder schedule from hardcoded day offsets:
- LOW: [7, 1]
- MEDIUM: [14, 7, 1]
- HIGH: [30, 7, 1]
- CRITICAL: [30, 14, 7, 3, 1]

The default policy reproduces existing behavior strictly:
- T-7: Google Calendar only.
- T-1: Google Calendar + Email.
- Other offsets: No notification.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from apps.calendar.models import NotificationChannel, NotificationPriority


@dataclass(frozen=True)
class NotificationPolicy:
    name: str
    priority: NotificationPriority
    offsets: list[int]
    channels_by_offset: dict[int, list[str]]
    overdue_cadence: list[int] = field(default_factory=lambda: [1, 7, 14, 30])
    overdue_channels: list[str] = field(
        default_factory=lambda: [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
    )
    escalate_on_overdue: bool = False
    escalate_on_offsets: list[int] = field(default_factory=list)

    def get_channels_for_offset(self, offset_days: int) -> list[str]:
        return list(self.channels_by_offset.get(offset_days, []))

    def is_offset_trigger(self, offset_days: int) -> bool:
        return offset_days in self.channels_by_offset

    def is_overdue_trigger(self, days_overdue: int) -> bool:
        return days_overdue in self.overdue_cadence


# The default policy reproduces today's behavior exactly
DEFAULT_NOTIFICATION_POLICY = NotificationPolicy(
    name="default",
    priority=NotificationPriority.MEDIUM,
    offsets=[7, 1],
    channels_by_offset={
        7: [NotificationChannel.GOOGLE_CALENDAR],
        1: [NotificationChannel.GOOGLE_CALENDAR, NotificationChannel.EMAIL],
    },
    overdue_cadence=[1, 7, 14, 30],
    overdue_channels=[NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    escalate_on_overdue=False,
    escalate_on_offsets=[],
)

LOW_NOTIFICATION_POLICY = NotificationPolicy(
    name="low",
    priority=NotificationPriority.LOW,
    offsets=[7, 1],
    channels_by_offset={
        7: [NotificationChannel.GOOGLE_CALENDAR],
        1: [NotificationChannel.GOOGLE_CALENDAR, NotificationChannel.EMAIL],
    },
    overdue_cadence=[1, 7, 14, 30],
    overdue_channels=[NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    escalate_on_overdue=False,
    escalate_on_offsets=[],
)

MEDIUM_NOTIFICATION_POLICY = NotificationPolicy(
    name="medium",
    priority=NotificationPriority.MEDIUM,
    offsets=[14, 7, 1],
    channels_by_offset={
        14: [NotificationChannel.GOOGLE_CALENDAR],
        7: [NotificationChannel.GOOGLE_CALENDAR],
        1: [NotificationChannel.GOOGLE_CALENDAR, NotificationChannel.EMAIL],
    },
    overdue_cadence=[1, 7, 14, 30],
    overdue_channels=[NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    escalate_on_overdue=False,
    escalate_on_offsets=[],
)

HIGH_NOTIFICATION_POLICY = NotificationPolicy(
    name="high",
    priority=NotificationPriority.HIGH,
    offsets=[30, 7, 1],
    channels_by_offset={
        30: [NotificationChannel.IN_APP],
        7: [NotificationChannel.GOOGLE_CALENDAR, NotificationChannel.IN_APP],
        1: [NotificationChannel.GOOGLE_CALENDAR, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    },
    overdue_cadence=[1, 7, 14, 30],
    overdue_channels=[NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    escalate_on_overdue=True,
    escalate_on_offsets=[1],
)

CRITICAL_NOTIFICATION_POLICY = NotificationPolicy(
    name="critical",
    priority=NotificationPriority.CRITICAL,
    offsets=[30, 14, 7, 3, 1],
    channels_by_offset={
        30: [NotificationChannel.IN_APP],
        14: [NotificationChannel.IN_APP],
        7: [NotificationChannel.GOOGLE_CALENDAR, NotificationChannel.IN_APP],
        3: [NotificationChannel.GOOGLE_CALENDAR, NotificationChannel.EMAIL],
        1: [NotificationChannel.GOOGLE_CALENDAR, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    },
    overdue_cadence=[1, 3, 7, 14, 30],
    overdue_channels=[NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    escalate_on_overdue=True,
    escalate_on_offsets=[3, 1],
)

NAMED_POLICIES: dict[str, NotificationPolicy] = {
    "default": DEFAULT_NOTIFICATION_POLICY,
    "low": LOW_NOTIFICATION_POLICY,
    "medium": MEDIUM_NOTIFICATION_POLICY,
    "high": HIGH_NOTIFICATION_POLICY,
    "critical": CRITICAL_NOTIFICATION_POLICY,
}


def resolve_notification_policy(
    metadata: dict[str, Any] | None = None,
    default_policy: str = "default",
) -> NotificationPolicy:
    """Resolve notification policy from requirement metadata.

    Controls reminder frequency, NOT legal applicability.
    """
    if not metadata:
        return NAMED_POLICIES.get(default_policy, DEFAULT_NOTIFICATION_POLICY)

    policy_key = (
        metadata.get("notification_policy")
        or metadata.get("notification_priority")
        or metadata.get("priority")
        or default_policy
    )
    clean_key = str(policy_key).strip().lower()
    return NAMED_POLICIES.get(clean_key, DEFAULT_NOTIFICATION_POLICY)
