"""
Stage 5 — Platform Trust & Fraud Detection
Evaluates booking platforms and maintains a persistent flagged list.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import PlatformTrust
import uuid

# Seed list of known trusted platforms with baseline trust scores
KNOWN_PLATFORMS: dict[str, dict] = {
    "booking.com": {"name": "Booking.com", "trust_score": 95},
    "expedia.com": {"name": "Expedia", "trust_score": 93},
    "kayak.com": {"name": "Kayak", "trust_score": 90},
    "hotels.com": {"name": "Hotels.com", "trust_score": 91},
    "airbnb.com": {"name": "Airbnb", "trust_score": 88},
    "skyscanner.com": {"name": "Skyscanner", "trust_score": 89},
    "google.com": {"name": "Google Flights", "trust_score": 97},
    "tripadvisor.com": {"name": "TripAdvisor", "trust_score": 86},
    "agoda.com": {"name": "Agoda", "trust_score": 82},
    "priceline.com": {"name": "Priceline", "trust_score": 84},
}

# Known fraudulent domains — persisted to DB on startup
FLAGGED_DOMAINS: dict[str, str] = {
    "cheapfakeflights.net": "Reported for fake ticket fraud",
    "bookingscam.com": "Known phishing site mimicking Booking.com",
    "hoteldeals247.xyz": "No valid business registration; numerous chargebacks reported",
}


async def seed_platform_trust(db: AsyncSession) -> None:
    """Seed trusted and flagged platforms into DB if not already present."""
    for domain, data in KNOWN_PLATFORMS.items():
        existing = await db.execute(
            select(PlatformTrust).where(PlatformTrust.domain == domain)
        )
        if not existing.scalar_one_or_none():
            db.add(
                PlatformTrust(
                    id=str(uuid.uuid4()),
                    domain=domain,
                    name=data["name"],
                    trust_score=data["trust_score"],
                    is_flagged=False,
                )
            )

    for domain, reason in FLAGGED_DOMAINS.items():
        existing = await db.execute(
            select(PlatformTrust).where(PlatformTrust.domain == domain)
        )
        if not existing.scalar_one_or_none():
            db.add(
                PlatformTrust(
                    id=str(uuid.uuid4()),
                    domain=domain,
                    name=domain,
                    trust_score=0,
                    is_flagged=True,
                    flag_reason=reason,
                )
            )

    await db.commit()


async def get_trusted_platforms(db: AsyncSession) -> list[PlatformTrust]:
    result = await db.execute(
        select(PlatformTrust).where(PlatformTrust.is_flagged == False)  # noqa: E712
    )
    return list(result.scalars().all())


async def flag_platform(
    db: AsyncSession, domain: str, reason: str
) -> PlatformTrust:
    """Flag a platform as fraudulent and persist across sessions."""
    existing = await db.execute(
        select(PlatformTrust).where(PlatformTrust.domain == domain)
    )
    platform = existing.scalar_one_or_none()

    if platform:
        platform.is_flagged = True
        platform.trust_score = 0
        platform.flag_reason = reason
    else:
        platform = PlatformTrust(
            id=str(uuid.uuid4()),
            domain=domain,
            name=domain,
            trust_score=0,
            is_flagged=True,
            flag_reason=reason,
        )
        db.add(platform)

    await db.commit()
    await db.refresh(platform)
    return platform


def filter_trusted_booking_url(url: str, flagged_domains: set[str]) -> bool:
    """Return True if the URL's domain is not flagged."""
    from urllib.parse import urlparse
    try:
        domain = urlparse(url).netloc.lstrip("www.")
        return domain not in flagged_domains
    except Exception:
        return True
