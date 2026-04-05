"""
George — Ambient AI Assistant (Stage 7)
Handles general trip Q&A, packing list generation, and platform help.
"""
import json
from datetime import datetime
import uuid
from .base import get_anthropic_client, CLAUDE_MODEL


GEORGE_SYSTEM_PROMPT = """You are George, a friendly and knowledgeable AI travel assistant embedded in TripMind.

Your personality:
- Warm, helpful, and concise — like a well-traveled friend
- Never navigate users away from the current page
- Give actionable, specific answers
- When asked for a packing list, generate a detailed, context-aware list

You can help with:
- Answering questions about the trip plan
- Generating packing lists based on destinations, weather, activities
- Explaining flight/hotel/attraction details
- General travel advice
- Visa and document requirements
- Platform usage help

Keep responses conversational and under 150 words unless generating a packing list."""


async def chat(
    messages: list[dict],
    trip_context: dict | None = None,
) -> dict:
    client = get_anthropic_client()

    system = GEORGE_SYSTEM_PROMPT
    if trip_context:
        context_summary = []
        if trip_context.get("origin"):
            context_summary.append(f"Origin: {trip_context['origin']}")
        if trip_context.get("destinations"):
            context_summary.append(f"Destinations: {', '.join(trip_context['destinations'])}")
        if trip_context.get("start_date"):
            context_summary.append(f"Dates: {trip_context['start_date']} to {trip_context.get('end_date', '?')}")
        if context_summary:
            system += f"\n\nCurrent trip context:\n" + "\n".join(context_summary)

    anthropic_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in messages
        if m["role"] in ("user", "assistant")
    ]

    response = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=512,
        system=system,
        messages=anthropic_messages,
    )

    return {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": response.content[0].text,
        "timestamp": datetime.utcnow().isoformat(),
    }


async def generate_packing_list(
    destinations: list[str],
    start_date: str,
    end_date: str,
    duration_days: int,
    attraction_types: list[str],
    transport_modes: list[str],
    baggage: dict,
) -> list[str]:
    client = get_anthropic_client()

    user_message = f"""Generate a comprehensive packing list for this trip:

Destinations: {", ".join(destinations)}
Dates: {start_date} to {end_date} ({duration_days} days)
Activities: {", ".join(attraction_types)}
Transport: {", ".join(transport_modes)}
Baggage allowance: {baggage.get("num_bags", 1)} bag(s), {baggage.get("weight_per_bag_kg", 23)}kg each

Include:
1. Clothing (weather-appropriate, activity-specific)
2. Toiletries & medications
3. Electronics & accessories
4. Travel documents (passport, visas, insurance)
5. Trip-specific items (hiking gear, beach items, etc.)
6. Comfort items for long flights/trains

Return a JSON array of strings, each item being a packing list entry.
Example: ["Passport", "2x dress shirts", "Universal power adapter", ...]
Return ONLY the JSON array."""

    message = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1024,
        system=GEORGE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)
