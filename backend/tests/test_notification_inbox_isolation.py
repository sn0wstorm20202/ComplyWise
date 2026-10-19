from datetime import date
import pytest
from apps.businesses.models import BusinessMembership
from apps.calendar.models import DeadlineNotificationDelivery

pytestmark = pytest.mark.django_db


def test_new_account_has_no_alerts_and_cannot_read_existing_business(api_client, make_user, make_business):
    owner = make_user(email="old@example.test")
    member = make_user(email="new@example.test")
    old_business = make_business(owner)
    fresh_business = make_business(member)
    record = DeadlineNotificationDelivery.objects.create(user=owner, business=old_business,
        requirement_id="SYNTHETIC", deadline_date=date(2026, 12, 1), offset_days=7,
        channel="IN_APP", status="DELIVERED")
    api_client.force_authenticate(user=member)
    base = f"/api/v1/businesses/{fresh_business.id}/calendar/notifications"
    assert api_client.get(base).json()["data"]["notifications"] == []
    assert api_client.get(base + "/summary").json()["data"]["unread_count"] == 0
    old_base = f"/api/v1/businesses/{old_business.id}/calendar/notifications"
    assert api_client.get(old_base).status_code == 404
    # Even authorized colleagues must not read or mutate another recipient's inbox.
    BusinessMembership.objects.create(business=old_business, user=member)
    assert api_client.get(old_base).json()["data"]["notifications"] == []
    assert api_client.patch(old_base + f"/{record.id}/read").status_code == 404
    assert api_client.post(old_base + "/read-all").json()["data"]["updated_count"] == 0
    record.refresh_from_db()
    assert not record.is_read


def test_bell_counts_delivered_in_app_only(auth_client, user, business):
    for channel, status in [("IN_APP", "DELIVERED"), ("EMAIL", "DELIVERED"), ("IN_APP", "FAILED")]:
        DeadlineNotificationDelivery.objects.create(user=user, business=business,
            requirement_id=f"SYNTHETIC-{channel}-{status}", deadline_date=date(2026, 12, 1),
            offset_days=7, channel=channel, status=status)
    data = auth_client.get(f"/api/v1/businesses/{business.id}/calendar/notifications/summary").json()["data"]
    assert data["unread_count"] == 3
    assert data["in_app_unread_count"] == 1
