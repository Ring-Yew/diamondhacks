"""
Browser Use Cloud API integration.
Used as a fallback when SerpApi key is unavailable,
and for scraping attractions, safety data, and prohibited items.

API docs: https://docs.browser-use.com/cloud/api-reference
"""
import asyncio
import httpx
import json
from app.core.config import get_settings
from app.services.iata_lookup import city_to_iata

settings = get_settings()

BASE_URL = "https://api.browser-use.com/api/v3"
POLL_INTERVAL = 5   # seconds between status checks
MAX_WAIT = 600      # seconds before timeout


def _is_configured() -> bool:
    return bool(
        settings.browser_use_api_key
        and settings.browser_use_api_key != "your-browser-use-key"
    )


def _headers() -> dict:
    return {"X-Browser-Use-API-Key": settings.browser_use_api_key}


async def _run_task(task: str, timeout: int = MAX_WAIT) -> str:
    """
    Submit a task to Browser Use Cloud API and poll until complete.
    Returns the task output as a string.
    """
    # Use a single client for both submission and polling
    async with httpx.AsyncClient(timeout=60) as client:
        # Submit task
        resp = await client.post(
            f"{BASE_URL}/sessions",
            headers=_headers(),
            json={"task": task},
        )
        print("BROWSER USE SUBMIT STATUS:", resp.status_code, resp.text[:300])
        resp.raise_for_status()
        data = resp.json()
        print("BROWSER USE TASK SUBMITTED:", data)
        task_id = data.get("id")
        if not task_id:
            raise ValueError(f"No task ID returned: {data}")

        # Poll for completion inside the same client context
        elapsed = 0
        while elapsed < timeout:
            await asyncio.sleep(POLL_INTERVAL)
            elapsed += POLL_INTERVAL

            status_resp = await client.get(
                f"{BASE_URL}/sessions/{task_id}",
                headers=_headers(),
            )
            status_resp.raise_for_status()
            status_data = status_resp.json()
            state = status_data.get("status", "")
            print(f"BROWSER USE POLL [{elapsed}s]: status={state} | keys={list(status_data.keys())}")

            # Browser Use uses "stopped" for successful completion
            # Always check isTaskSuccessful to determine real outcome
            is_done = state in ("finished", "completed", "done", "success", "stopped")
            if is_done:
                output = status_data.get("output") or status_data.get("result") or ""
                # Only raise if task failed AND there is no usable output
                if status_data.get("isTaskSuccessful") == False and not output:
                    raise RuntimeError(f"Browser Use task failed with no output")
                print("BROWSER USE OUTPUT:", str(output)[:300])
                return output
            if state in ("failed", "error", "cancelled"):
                raise RuntimeError(f"Browser Use task failed: {status_data.get('output')}")

    raise TimeoutError(f"Browser Use task timed out after {timeout}s")


# ── Flights ───────────────────────────────────────────────────────────────────

async def scrape_flights(
    from_city: str,
    to_city: str,
    departure_date: str,
    num_bags: int = 1,
    transport_priority: str = "no_preference",
    num_flights: int = 1,
) -> list[dict]:
    """
    Use Browser Use to scrape Google Flights for real prices.
    Returns parsed flight list.
    """
    from_code = city_to_iata(from_city)
    to_code = city_to_iata(to_city)
    kayak_url = f"https://www.kayak.com/flights/{from_code}-{to_code}/{departure_date}"

    sort_instruction = ""
    if transport_priority == "cheapest":
        sort_instruction = "If there is a sort option, sort by cheapest price first."
    elif transport_priority == "fastest":
        sort_instruction = "If there is a sort option, sort by shortest duration first."

    task = f"""
Go to {kayak_url}
{sort_instruction}

Wait for the flight results to load. Extract the top {num_flights} flight result(s). Return a JSON array with exactly {num_flights} object(s) with:
- airline (string)
- flight_number (string)
- aircraft_type (string, if visible)
- departure_time (string, e.g. "08:00 AM")
- arrival_time (string)
- duration_minutes (integer)
- layovers (integer, 0 for nonstop)
- price_usd (number)
- free_checked_bags (integer, 0 if not included)
- carry_on_included (boolean)

Return ONLY a JSON array of these objects, nothing else.
"""

    raw = await _run_task(task)
    print("BROWSER USE FLIGHTS RAW OUTPUT:", raw[:500] if raw else "EMPTY")
    result = _parse_flights_output(raw, from_city, to_city, departure_date)
    print("PARSED FLIGHTS COUNT:", len(result))
    return result


def _parse_flights_output(raw, from_city: str, to_city: str, date: str) -> list[dict]:
    import uuid
    try:
        # Browser Use sometimes returns an already-parsed list
        if isinstance(raw, list):
            items = raw
        else:
            # Strip markdown fences if present
            text = raw.strip()
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            text = text.strip()

            # Browser Use may return multiple JSON arrays — extract only the first
            decoder = json.JSONDecoder()
            items, _ = decoder.raw_decode(text)
        flights = []
        for item in items:
            flights.append({
                "id": str(uuid.uuid4()),
                "airline": item.get("airline", "Unknown"),
                "flight_number": item.get("flight_number", ""),
                "aircraft_type": item.get("aircraft_type", "Unknown aircraft"),
                "from_city": from_city,
                "to_city": to_city,
                "departure": f"{date}T{item.get('departure_time', '00:00')}",
                "arrival": f"{date}T{item.get('arrival_time', '08:00')}",
                "duration_minutes": int(item.get("duration_minutes", 0)),
                "layovers": int(item.get("layovers", 0)),
                "price_usd": float(item.get("price_usd", 0)),
                "baggage_policy": {
                    "free_checked_bags": int(item.get("free_checked_bags", 0)),
                    "carry_on_included": bool(item.get("carry_on_included", True)),
                    "extra_bag_fee_usd": None,
                    "meets_baggage_requirement": True,
                },
                "booking_url": f"https://www.kayak.com/flights/{city_to_iata(from_city)}-{city_to_iata(to_city)}/{date}",
                "platform": "Kayak",
            })
        return flights
    except Exception as e:
        print("FLIGHT PARSE ERROR:", e, "| RAW:", raw[:300] if raw else "EMPTY")
        return []


# ── Hotels ────────────────────────────────────────────────────────────────────

async def scrape_hotels(
    city: str,
    check_in: str,
    check_out: str,
    num_nights: int,
) -> list[dict]:
    """
    Use Browser Use to scrape Google Hotels for real prices.
    """
    task = f"""
Go to https://www.google.com/travel/hotels and search for hotels:
- City: {city}
- Check-in: {check_in}
- Check-out: {check_out}

Extract the top 4 hotel results. For each hotel return a JSON object with:
- name (string)
- stars (number, 1-5)
- nightly_rate_usd (number)
- total_cost_usd (number for {num_nights} nights)
- distance_to_center_km (number, if visible, else 1.0)
- booking_url (string, the hotel's Google Travel link)
- latitude (number, if visible)
- longitude (number, if visible)

Return ONLY a JSON array of these objects, nothing else.
"""

    raw = await _run_task(task)
    print("BROWSER USE HOTELS RAW OUTPUT:", raw[:500] if raw else "EMPTY")
    result = _parse_hotels_output(raw, city, num_nights)
    print("PARSED HOTELS COUNT:", len(result))
    return result


def _parse_hotels_output(raw: str, city: str, num_nights: int) -> list[dict]:
    import uuid
    try:
        text = raw.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()

        items = json.loads(text)
        hotels = []
        for item in items:
            nightly = float(item.get("nightly_rate_usd", 100))
            hotels.append({
                "id": str(uuid.uuid4()),
                "name": item.get("name", "Unknown Hotel"),
                "city": city,
                "stars": float(item.get("stars", 3)),
                "nightly_rate_usd": nightly,
                "total_cost_usd": float(item.get("total_cost_usd", nightly * num_nights)),
                "distance_to_center_km": float(item.get("distance_to_center_km", 1.0)),
                "booking_url": item.get("booking_url", "https://www.google.com/travel/hotels"),
                "platform": "Google Hotels",
                "lat": float(item.get("latitude", 0)),
                "lng": float(item.get("longitude", 0)),
                "image_url": None,
            })
        return hotels
    except Exception:
        return []
