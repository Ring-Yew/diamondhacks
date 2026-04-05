from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
import traceback

from app.db.database import get_db
from app.schemas.schemas import (
    TripInputRequest,
    CitySuggestionResponse,
    ItineraryResponse,
)
from app.agents.city_suggestion_agent import suggest_cities
from app.agents.itinerary_agent import generate_itineraries
from app.models.models import Trip
from app.services.browser_use_service import scrape_flights, _is_configured as browser_use_configured
from app.services.serpapi_service import search_flights as serpapi_flights

router = APIRouter(prefix="/api/trips", tags=["trips"])


async def _fetch_flights_for_leg(
    from_city: str,
    to_city: str,
    date: str,
    num_bags: int,
    transport_priority: str,
    num_flights: int = 1,
) -> list[dict]:
    """Fetch real flights for a single leg, with fallback."""
    try:
        if browser_use_configured():
            flights = await scrape_flights(
                from_city=from_city,
                to_city=to_city,
                departure_date=date,
                num_bags=num_bags,
                transport_priority=transport_priority,
                num_flights=num_flights,
            )
        else:
            flights = await serpapi_flights(
                from_city=from_city,
                to_city=to_city,
                departure_date=date,
                num_checked_bags=num_bags,
                transport_priority=transport_priority,
            )
        return flights
    except Exception as e:
        print(f"Flight search failed for {from_city}→{to_city}: {e}")
        import traceback; print(traceback.format_exc())
        return []


@router.post("/suggest-cities", response_model=CitySuggestionResponse)
async def get_city_suggestions(
    body: TripInputRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        suggestions = await suggest_cities(
            origin=body.origin,
            destinations=body.destinations,
            attraction_types=body.attraction_types,
            duration_days=body.duration_days,
            transport_priority=body.transport_priority,
        )
        return CitySuggestionResponse(suggestions=suggestions)
    except Exception as e:
        print("SUGGEST-CITIES ERROR:", e)
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate", response_model=ItineraryResponse)
async def generate_trip_itineraries(
    body: TripInputRequest,
    db: AsyncSession = Depends(get_db),
):
    all_destinations = list(body.destinations)
    for city in body.accepted_city_suggestions:
        if city not in all_destinations:
            all_destinations.append(city)

    try:
        # Step 1: Generate itinerary (days, hotels, attractions) via Claude
        plans = await generate_itineraries(
            origin=body.origin,
            destinations=all_destinations,
            start_date=body.start_date,
            duration_days=body.duration_days,
            attraction_types=body.attraction_types,
            specific_places=body.specific_places,
            baggage=body.baggage.model_dump(),
            transport_priority=body.transport_priority,
        )

        # Step 2: Build legs: origin→dest1, dest1→dest2, ..., lastDest→origin
        all_cities = [body.origin] + all_destinations + [body.origin]
        legs = [(all_cities[i], all_cities[i + 1]) for i in range(len(all_cities) - 1)]

        # Step 3: Fetch real flights for all legs in parallel
        flight_tasks = [
            _fetch_flights_for_leg(
                from_city=leg[0],
                to_city=leg[1],
                date=body.start_date,
                num_bags=body.baggage.num_bags,
                transport_priority=body.transport_priority,
                num_flights=body.num_flights,
            )
            for leg in legs
        ]
        real_flights = await asyncio.gather(*flight_tasks)

        # Step 4: Inject real flights into each plan and update cost breakdown
        for plan in plans:
            plan["flights"] = [list(leg_flights) for leg_flights in real_flights]

            # Recalculate flights cost from real prices (cheapest per leg)
            total_flight_cost = sum(
                min((f["price_usd"] for f in leg_flights), default=0)
                for leg_flights in real_flights
                if leg_flights
            )
            plan["cost_breakdown"]["flights_usd"] = total_flight_cost
            plan["cost_breakdown"]["total_usd"] = (
                total_flight_cost
                + plan["cost_breakdown"].get("accommodation_usd", 0)
                + plan["cost_breakdown"].get("ground_transport_usd", 0)
                + plan["cost_breakdown"].get("attractions_usd", 0)
                + plan["cost_breakdown"].get("meals_buffer_usd", 0)
            )

        return ItineraryResponse(plans=plans)

    except Exception as e:
        print("GENERATE ERROR:", e)
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{trip_id}")
async def get_trip(trip_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip
