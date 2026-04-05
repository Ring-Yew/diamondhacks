from fastapi import APIRouter, HTTPException
from app.schemas.schemas import ProhibitedItemsRequest, ProhibitedItemsResponse
from app.agents.base import get_anthropic_client, CLAUDE_MODEL
import json

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


@router.post("/prohibited", response_model=ProhibitedItemsResponse)
async def get_prohibited_items(body: ProhibitedItemsRequest):
    """
    Stage 6 — Returns prohibited items for each destination and transport mode.
    Uses Claude to pull from current knowledge of regulations.
    """
    client = get_anthropic_client()

    prompt = f"""You are a travel compliance expert. List prohibited items for each destination and transport mode.

Destinations: {", ".join(body.cities)}
Transport modes: {", ".join(body.transport_modes)}

For each location/transport, list specific prohibited items based on:
- Local laws and customs regulations
- Cultural norms and sensitivities
- Transport carrier policies (e.g., TSA rules for flights)

Return a JSON object where keys are city/transport names and values are arrays of prohibited item strings.
Example:
{{
  "Tokyo": ["Certain prescription medications without documentation", "Cannabis products"],
  "Flight (General)": ["Liquids over 100ml in carry-on", "Sharp objects in carry-on"]
}}

Return ONLY the JSON object."""

    try:
        message = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        items = json.loads(raw)
        return ProhibitedItemsResponse(items=items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
