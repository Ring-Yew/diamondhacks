from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from app.services.browser_use_service import scrape_hotels, _is_configured as browser_use_configured
from app.services.serpapi_service import search_hotels as serpapi_hotels

router = APIRouter(prefix="/api/hotels", tags=["hotels"])


class HotelSearchResponse(BaseModel):
    hotels: list[dict]


@router.get("/search", response_model=HotelSearchResponse)
async def search_hotels_endpoint(
    city: str = Query(...),
    check_in: str = Query(...),
    check_out: str = Query(...),
    num_nights: int = Query(1),
):
    try:
        # Priority: Browser Use → SerpApi → mock
        if browser_use_configured():
            hotels = await scrape_hotels(
                city=city,
                check_in=check_in,
                check_out=check_out,
                num_nights=num_nights,
            )
        else:
            hotels = await serpapi_hotels(
                city=city,
                check_in=check_in,
                check_out=check_out,
                num_nights=num_nights,
            )
        return HotelSearchResponse(hotels=hotels)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
