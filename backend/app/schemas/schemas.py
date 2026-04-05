from pydantic import BaseModel, EmailStr
from typing import Any


# ─── Auth ─────────────────────────────────────────────────────────────────────
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict[str, Any]


# ─── Trip ─────────────────────────────────────────────────────────────────────
class BaggageInfo(BaseModel):
    num_bags: int = 1
    weight_per_bag_kg: float = 23.0
    dimensions_cm: dict[str, float] = {"l": 70, "w": 50, "h": 30}


class TripInputRequest(BaseModel):
    origin: str
    destinations: list[str]
    start_date: str
    end_date: str
    duration_days: int
    attraction_types: list[str]
    specific_places: list[str] = []
    baggage: BaggageInfo = BaggageInfo()
    transport_priority: str = "no_preference"
    num_flights: int = 1
    accepted_city_suggestions: list[str] = []


class CitySuggestionResponse(BaseModel):
    suggestions: list[dict[str, Any]]


class ItineraryResponse(BaseModel):
    plans: list[dict[str, Any]]


# ─── Flights ──────────────────────────────────────────────────────────────────
class FlightSearchResponse(BaseModel):
    flights: list[dict[str, Any]]


class PriceForecastResponse(BaseModel):
    history: list[dict[str, Any]]
    forecast: list[dict[str, Any]]


# ─── George ───────────────────────────────────────────────────────────────────
class ChatMessageSchema(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str


class GeorgeChatRequest(BaseModel):
    messages: list[ChatMessageSchema]
    trip_context: dict[str, Any] | None = None


class GeorgeChatResponse(BaseModel):
    message: dict[str, Any]


class PackingListRequest(BaseModel):
    trip_id: str


class PackingListResponse(BaseModel):
    items: list[str]


# ─── Safety ───────────────────────────────────────────────────────────────────
class SafetyResponse(BaseModel):
    zones: list[dict[str, Any]]


# ─── Compliance ───────────────────────────────────────────────────────────────
class ProhibitedItemsRequest(BaseModel):
    cities: list[str]
    transport_modes: list[str]


class ProhibitedItemsResponse(BaseModel):
    items: dict[str, list[str]]


# ─── Personalization ──────────────────────────────────────────────────────────
class RecordInteractionRequest(BaseModel):
    event_type: str
    event_data: dict[str, Any]
