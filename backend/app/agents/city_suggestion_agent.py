"""
Stage 2 — City Suggestion Engine
Suggests 1-2 additional intermediate cities based on user preferences and route.
"""
import json
from .base import get_anthropic_client, CLAUDE_MODEL


SYSTEM_PROMPT = """You are an expert travel planning assistant specialized in multi-city route optimization.

Given a user's trip details (origin, destinations, preferences), suggest 1-2 additional intermediate
cities that would enhance the trip. Your suggestions must be:
- Logistically compatible with the existing route (no major detours)
- Aligned with the user's stated attraction type preferences
- Realistic given the trip duration

Always respond with valid JSON only. No prose."""


async def suggest_cities(
    origin: str,
    destinations: list[str],
    attraction_types: list[str],
    duration_days: int,
    transport_priority: str,
) -> list[dict]:
    client = get_anthropic_client()

    user_message = f"""
Trip Details:
- Origin: {origin}
- Current destinations (in order): {", ".join(destinations)}
- Duration: {duration_days} days
- Preferred attraction types: {", ".join(attraction_types)}
- Transport priority: {transport_priority}

Suggest 1-2 additional intermediate cities. Return a JSON array with this exact schema:
[
  {{
    "city": "City Name",
    "country": "Country Name",
    "reason": "Brief reason why this city fits the route and preferences (1-2 sentences)",
    "insert_after": "Name of existing destination after which to insert this city"
  }}
]

Return ONLY the JSON array, no other text.
"""

    message = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)
