"""
SerpApi integration for Google Flights and Google Hotels.
Docs: https://serpapi.com/google-flights-api
      https://serpapi.com/google-hotels-api
"""
import httpx
from app.core.config import get_settings
from app.services.iata_lookup import city_to_iata
import uuid

settings = get_settings()
SERPAPI_BASE = "https://serpapi.com/search"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_configured() -> bool:
    return bool(settings.serpapi_key and settings.serpapi_key != "your-serpapi-key")


# ── Flights ───────────────────────────────────────────────────────────────────

async def search_flights(
    from_city: str,
    to_city: str,
    departure_date: str,          # YYYY-MM-DD
    return_date: str | None = None,
    num_checked_bags: int = 1,
    transport_priority: str = "no_preference",
) -> list[dict]:
    """
    Search Google Flights via SerpApi.
    Falls back to mock data when SERPAPI_KEY is not set.
    """
    if not _is_configured():
        return _mock_flights(from_city, to_city, departure_date)

    params: dict = {
        "engine": "google_flights",
        "departure_id": city_to_iata(from_city),
        "arrival_id": city_to_iata(to_city),
        "outbound_date": departure_date,
        "currency": "USD",
        "hl": "en",
        "api_key": settings.serpapi_key,
    }
    if return_date:
        params["return_date"] = return_date
    if transport_priority == "cheapest":
        params["sort_by"] = "1"   # sort by price
    elif transport_priority == "fastest":
        params["sort_by"] = "2"   # sort by duration

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(SERPAPI_BASE, params=params)
        resp.raise_for_status()
        data = resp.json()

    flights = []
    best_flights = data.get("best_flights", []) + data.get("other_flights", [])

    for item in best_flights[:6]:  # cap at 6 results
        for flight in item.get("flights", []):
            baggage = item.get("extensions", [])
            policy = _parse_baggage(baggage, num_checked_bags)
            flights.append({
                "id": str(uuid.uuid4()),
                "airline": flight.get("airline", "Unknown"),
                "flight_number": flight.get("flight_number", ""),
                "aircraft_type": flight.get("airplane", "Unknown aircraft"),
                "from_city": from_city,
                "to_city": to_city,
                "departure": flight.get("departure_airport", {}).get("time", departure_date + "T00:00:00"),
                "arrival": flight.get("arrival_airport", {}).get("time", departure_date + "T08:00:00"),
                "duration_minutes": item.get("total_duration", 0),
                "layovers": max(0, len(item.get("flights", [])) - 1),
                "price_usd": item.get("price", 0),
                "baggage_policy": policy,
                "booking_url": f"https://www.google.com/flights#flt={from_city}.{to_city}.{departure_date}",
                "platform": "Google Flights",
            })
        if flights:
            break  # one item can have multiple legs; take first complete result

    # If parsing yielded nothing, try flat structure
    if not flights:
        for item in best_flights[:3]:
            price = item.get("price", 0)
            if not price:
                continue
            baggage = item.get("extensions", [])
            policy = _parse_baggage(baggage, num_checked_bags)
            airline = ""
            aircraft = ""
            for leg in item.get("flights", []):
                airline = leg.get("airline", "Unknown")
                aircraft = leg.get("airplane", "Unknown aircraft")
                break
            flights.append({
                "id": str(uuid.uuid4()),
                "airline": airline,
                "flight_number": item.get("flights", [{}])[0].get("flight_number", ""),
                "aircraft_type": aircraft,
                "from_city": from_city,
                "to_city": to_city,
                "departure": departure_date + "T00:00:00",
                "arrival": departure_date + "T10:00:00",
                "duration_minutes": item.get("total_duration", 0),
                "layovers": max(0, len(item.get("flights", [])) - 1),
                "price_usd": price,
                "baggage_policy": policy,
                "booking_url": f"https://www.google.com/flights#flt={from_city}.{to_city}.{departure_date}",
                "platform": "Google Flights",
            })

    return flights or _mock_flights(from_city, to_city, departure_date)


def _parse_baggage(extensions: list[str], num_checked_bags: int) -> dict:
    text = " ".join(extensions).lower()
    free_checked = 0
    carry_on = True
    extra_fee = None

    if "1 carry-on" in text or "carry-on included" in text:
        carry_on = True
    if "1 checked bag" in text:
        free_checked = 1
    if "2 checked bags" in text:
        free_checked = 2
    if "no checked bags" in text or "checked bag fee" in text:
        free_checked = 0
        extra_fee = 35

    # Warn if user needs more bags than included
    return {
        "free_checked_bags": free_checked,
        "carry_on_included": carry_on,
        "extra_bag_fee_usd": extra_fee,
        "meets_baggage_requirement": free_checked >= num_checked_bags,
    }


# ── Hotels ────────────────────────────────────────────────────────────────────

async def search_hotels(
    city: str,
    check_in: str,   # YYYY-MM-DD
    check_out: str,
    num_nights: int,
) -> list[dict]:
    """
    Search Google Hotels via SerpApi.
    Falls back to mock data when SERPAPI_KEY is not set.
    """
    if not _is_configured():
        return _mock_hotels(city, check_in, num_nights)

    params = {
        "engine": "google_hotels",
        "q": f"hotels in {city}",
        "check_in_date": check_in,
        "check_out_date": check_out,
        "currency": "USD",
        "hl": "en",
        "api_key": settings.serpapi_key,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(SERPAPI_BASE, params=params)
        resp.raise_for_status()
        data = resp.json()

    hotels = []
    for prop in data.get("properties", [])[:6]:
        nightly = prop.get("rate_per_night", {}).get("lowest", "0")
        nightly_usd = _parse_price(nightly)
        total = nightly_usd * num_nights

        hotels.append({
            "id": str(uuid.uuid4()),
            "name": prop.get("name", "Unknown Hotel"),
            "city": city,
            "stars": prop.get("overall_rating", 3.5),
            "nightly_rate_usd": nightly_usd,
            "total_cost_usd": total,
            "distance_to_center_km": 1.0,
            "booking_url": prop.get("link", f"https://www.google.com/travel/hotels/{city}"),
            "platform": "Google Hotels",
            "lat": prop.get("gps_coordinates", {}).get("latitude", 0),
            "lng": prop.get("gps_coordinates", {}).get("longitude", 0),
            "image_url": (prop.get("images") or [{}])[0].get("thumbnail"),
        })

    return hotels or _mock_hotels(city, check_in, num_nights)


def _parse_price(price_str: str) -> float:
    """Extract numeric value from price strings like '$120' or '$1,200'."""
    try:
        return float("".join(c for c in str(price_str) if c.isdigit() or c == "."))
    except (ValueError, TypeError):
        return 100.0


# ── Mock fallbacks ────────────────────────────────────────────────────────────

def _mock_flights(from_city: str, to_city: str, date: str) -> list[dict]:
    return [
        {
            "id": str(uuid.uuid4()),
            "airline": "Delta Air Lines",
            "flight_number": "DL401",
            "aircraft_type": "Boeing 767-300",
            "from_city": from_city,
            "to_city": to_city,
            "departure": f"{date}T08:00:00",
            "arrival": f"{date}T16:30:00",
            "duration_minutes": 510,
            "layovers": 0,
            "price_usd": 580,
            "baggage_policy": {"free_checked_bags": 1, "carry_on_included": True, "extra_bag_fee_usd": 65, "meets_baggage_requirement": True},
            "booking_url": "https://www.google.com/flights",
            "platform": "Google Flights (mock)",
        },
        {
            "id": str(uuid.uuid4()),
            "airline": "United Airlines",
            "flight_number": "UA892",
            "aircraft_type": "Airbus A330-200",
            "from_city": from_city,
            "to_city": to_city,
            "departure": f"{date}T12:00:00",
            "arrival": f"{date}T22:00:00",
            "duration_minutes": 600,
            "layovers": 1,
            "price_usd": 420,
            "baggage_policy": {"free_checked_bags": 0, "carry_on_included": True, "extra_bag_fee_usd": 45, "meets_baggage_requirement": False},
            "booking_url": "https://www.google.com/flights",
            "platform": "Google Flights (mock)",
        },
    ]


def _mock_hotels(city: str, check_in: str, num_nights: int) -> list[dict]:
    return [
        {
            "id": str(uuid.uuid4()),
            "name": f"Grand Hotel {city}",
            "city": city,
            "stars": 4,
            "nightly_rate_usd": 120,
            "total_cost_usd": 120 * num_nights,
            "distance_to_center_km": 0.5,
            "booking_url": f"https://www.google.com/travel/hotels",
            "platform": "Google Hotels (mock)",
            "lat": 0,
            "lng": 0,
            "image_url": None,
        },
        {
            "id": str(uuid.uuid4()),
            "name": f"{city} Central Inn",
            "city": city,
            "stars": 3,
            "nightly_rate_usd": 75,
            "total_cost_usd": 75 * num_nights,
            "distance_to_center_km": 1.2,
            "booking_url": f"https://www.google.com/travel/hotels",
            "platform": "Google Hotels (mock)",
            "lat": 0,
            "lng": 0,
            "image_url": None,
        },
    ]
