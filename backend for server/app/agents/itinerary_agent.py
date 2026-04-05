"""
Stage 4 — Itinerary Generation Agent
Generates 2-3 complete travel plan options with flights, hotels, attractions.
"""
import json
import uuid
from datetime import date, timedelta
from .base import get_anthropic_client, CLAUDE_MODEL


SYSTEM_PROMPT = """You are a world-class AI travel planner. Generate complete, realistic multi-city
itineraries with day-by-day breakdowns. Include specific hotels, attractions with real entry prices,
and estimated costs.

Return ONLY valid JSON. Be specific — use real hotel names, real attraction names, realistic prices.
Do not make up booking URLs; use placeholder format: https://www.booking.com/hotel/{city}/{hotel-slug}.html"""


async def generate_itineraries(
    origin: str,
    destinations: list[str],
    start_date: str,
    duration_days: int,
    attraction_types: list[str],
    specific_places: list[str],
    baggage: dict,
    transport_priority: str,
    user_preferences: dict | None = None,
) -> list[dict]:
    client = get_anthropic_client()

    prefs_note = ""
    if user_preferences:
        prefs_note = f"\nUser historical preferences: {json.dumps(user_preferences)}"

    user_message = f"""
Generate 2 complete travel itinerary plans for this trip:

- Origin: {origin}
- Destinations (in order): {", ".join(destinations)}
- Start date: {start_date}
- Duration: {duration_days} days
- Preferred attractions: {", ".join(attraction_types)}
- Must-visit places: {", ".join(specific_places) if specific_places else "None specified"}
- Baggage: {baggage.get("num_bags", 1)} bags, {baggage.get("weight_per_bag_kg", 23)}kg each
- Transport priority: {transport_priority}{prefs_note}

Return a JSON array of 2 plan objects. For trips longer than 5 days, only include the first 5 days in detail. Do NOT include flights — they will be fetched separately. Use this exact schema:
[
  {{
    "id": "uuid-string",
    "name": "Plan name (e.g. 'Budget Explorer' or 'Comfort Seeker')",
    "days": [
      {{
        "day": 1,
        "date": "YYYY-MM-DD",
        "city": "City name",
        "hotel": {{
          "id": "uuid",
          "name": "Hotel name",
          "city": "City",
          "stars": 4,
          "nightly_rate_usd": 120,
          "total_cost_usd": 240,
          "distance_to_center_km": 0.8,
          "booking_url": "https://www.booking.com/...",
          "platform": "Booking.com",
          "lat": 48.8566,
          "lng": 2.3522
        }},
        "attractions": [
          {{
            "id": "uuid",
            "name": "Attraction name",
            "city": "City",
            "category": "historical_monuments",
            "entry_cost_usd": 15,
            "hours": "9:00 AM - 6:00 PM",
            "booking_url": null,
            "lat": 48.8584,
            "lng": 2.2945,
            "user_specified": false,
            "description": "Brief description"
          }}
        ]
      }}
    ],
    "cost_breakdown": {{
      "flights_usd": 0,
      "accommodation_usd": 960,
      "ground_transport_usd": 150,
      "attractions_usd": 200,
      "meals_buffer_usd": 500,
      "total_usd": 1810
    }},
    "created_at": "2024-01-01T00:00:00"
  }}
]

Return ONLY the JSON array. Be specific and realistic.
"""

    message = await client.chat.completions.create(
        model=CLAUDE_MODEL,
        max_tokens=16000,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    )

    raw = message.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    # If the response was truncated, attempt to recover by closing the JSON
    try:
        plans = json.loads(raw)
    except json.JSONDecodeError:
        # Try to salvage partial JSON by truncating to the last complete object
        last_brace = raw.rfind("},\n  {")
        if last_brace == -1:
            last_brace = raw.rfind("    }")
        if last_brace != -1:
            raw = raw[: last_brace + 5].rstrip(",") + "\n]"
        try:
            plans = json.loads(raw)
        except json.JSONDecodeError:
            # Last resort: ask for a shorter single-plan response
            fallback = await client.chat.completions.create(
                model=CLAUDE_MODEL,
                max_tokens=16000,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message + "\n\nIMPORTANT: Return only 1 plan (not 2) to keep the response short."},
                ],
            )
            raw2 = fallback.choices[0].message.content.strip()
            if raw2.startswith("```"):
                raw2 = raw2.split("```")[1]
                if raw2.startswith("json"):
                    raw2 = raw2[4:]
            plans = json.loads(raw2.strip())

    # Ensure all plans have proper UUIDs
    for plan in plans:
        if not plan.get("id"):
            plan["id"] = str(uuid.uuid4())
        for day in plan.get("days", []):
            if not day.get("hotel", {}).get("id"):
                day["hotel"]["id"] = str(uuid.uuid4())
            for attraction in day.get("attractions", []):
                if not attraction.get("id"):
                    attraction["id"] = str(uuid.uuid4())
        for leg in plan.get("flights", []):
            for flight in leg:
                if not flight.get("id"):
                    flight["id"] = str(uuid.uuid4())

    return plans
