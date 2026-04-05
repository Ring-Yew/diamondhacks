"""
Stage 8 — Learning & Personalization Layer
Records user choices and builds a persistent preference profile.
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import UserPreference
import uuid


async def get_or_create_preferences(
    db: AsyncSession, user_id: str
) -> UserPreference:
    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = UserPreference(
            id=str(uuid.uuid4()),
            user_id=user_id,
            attraction_types=[],
            transport_priority="no_preference",
            avoided_platforms=[],
            interaction_history={},
        )
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    return prefs


async def record_interaction(
    db: AsyncSession,
    user_id: str,
    event_type: str,
    event_data: dict,
) -> None:
    """
    Record a user interaction event for learning.
    event_type: 'destination_selected', 'attraction_chosen', 'hotel_booked',
                'city_skipped', 'transport_mode_chosen', 'platform_avoided'
    """
    prefs = await get_or_create_preferences(db, user_id)

    history = prefs.interaction_history or {}
    if event_type not in history:
        history[event_type] = []
    history[event_type].append(event_data)

    # Cap history per event type to last 100 entries
    if len(history[event_type]) > 100:
        history[event_type] = history[event_type][-100:]

    # Update aggregated preferences from interactions
    if event_type == "attraction_chosen":
        category = event_data.get("category")
        if category and category not in prefs.attraction_types:
            prefs.attraction_types = [*prefs.attraction_types, category]

    if event_type == "transport_mode_chosen":
        mode = event_data.get("priority")
        if mode in ("cheapest", "fastest"):
            prefs.transport_priority = mode

    if event_type == "platform_avoided":
        domain = event_data.get("domain")
        if domain and domain not in prefs.avoided_platforms:
            prefs.avoided_platforms = [*prefs.avoided_platforms, domain]

    prefs.interaction_history = history
    await db.commit()


def build_preference_context(prefs: UserPreference) -> dict:
    """Build a context dict to pass to AI agents for personalized suggestions."""
    history = prefs.interaction_history or {}

    # Derive most-visited cities
    destinations = history.get("destination_selected", [])
    city_counts: dict[str, int] = {}
    for d in destinations:
        city = d.get("city", "")
        if city:
            city_counts[city] = city_counts.get(city, 0) + 1
    top_cities = sorted(city_counts, key=lambda c: city_counts[c], reverse=True)[:5]

    # Derive most-chosen attraction types
    attractions = history.get("attraction_chosen", [])
    type_counts: dict[str, int] = {}
    for a in attractions:
        t = a.get("category", "")
        if t:
            type_counts[t] = type_counts.get(t, 0) + 1
    top_types = sorted(type_counts, key=lambda t: type_counts[t], reverse=True)[:3]

    return {
        "preferred_attraction_types": prefs.attraction_types or top_types,
        "transport_priority": prefs.transport_priority,
        "top_visited_cities": top_cities,
        "avoided_platforms": prefs.avoided_platforms,
    }
