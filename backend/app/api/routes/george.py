from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.schemas import (
    GeorgeChatRequest,
    GeorgeChatResponse,
    PackingListRequest,
    PackingListResponse,
)
from app.agents.george_agent import chat, generate_packing_list
from app.models.models import Trip
from sqlalchemy import select

router = APIRouter(prefix="/api/george", tags=["george"])


@router.post("/chat", response_model=GeorgeChatResponse)
async def george_chat(body: GeorgeChatRequest):
    try:
        reply = await chat(
            messages=[m.model_dump() for m in body.messages],
            trip_context=body.trip_context,
        )
        return GeorgeChatResponse(message=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/packing-list", response_model=PackingListResponse)
async def get_packing_list(
    body: PackingListRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Trip).where(Trip.id == body.trip_id))
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    try:
        items = await generate_packing_list(
            destinations=trip.destinations,
            start_date=trip.start_date,
            end_date=trip.end_date,
            duration_days=trip.duration_days,
            attraction_types=trip.attraction_types,
            transport_modes=["flight"],  # TODO: pull from trip legs
            baggage=trip.baggage,
        )
        return PackingListResponse(items=items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
