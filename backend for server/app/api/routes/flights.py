from fastapi import APIRouter, Query, HTTPException
from app.schemas.schemas import FlightSearchResponse, PriceForecastResponse
from app.services.price_forecast import build_forecast_response, generate_mock_price_history
from app.services.browser_use_service import scrape_flights, _is_configured as browser_use_configured
from app.services.serpapi_service import search_flights as serpapi_flights

router = APIRouter(prefix="/api/flights", tags=["flights"])


@router.get("/search", response_model=FlightSearchResponse)
async def search_flights_endpoint(
    from_city: str = Query(..., alias="from"),
    to_city: str = Query(..., alias="to"),
    date: str = Query(...),
    return_date: str | None = Query(None),
    num_bags: int = Query(1),
    transport_priority: str = Query("no_preference"),
):
    try:
        # Priority: Browser Use → SerpApi → mock
        if browser_use_configured():
            flights = await scrape_flights(
                from_city=from_city,
                to_city=to_city,
                departure_date=date,
                num_bags=num_bags,
                transport_priority=transport_priority,
            )
        else:
            flights = await serpapi_flights(
                from_city=from_city,
                to_city=to_city,
                departure_date=date,
                return_date=return_date,
                num_checked_bags=num_bags,
                transport_priority=transport_priority,
            )
        return FlightSearchResponse(flights=flights)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/price-forecast", response_model=PriceForecastResponse)
async def get_price_forecast(
    route: str = Query(...),
    travel_date: str = Query(...),
):
    history_raw = generate_mock_price_history(route, base_price=500.0, days=30)
    all_points = build_forecast_response(route, history_raw, days_ahead=7)

    history = [p for p in all_points if not p["is_forecast"]]
    forecast = [p for p in all_points if p["is_forecast"]]

    return PriceForecastResponse(history=history, forecast=forecast)
