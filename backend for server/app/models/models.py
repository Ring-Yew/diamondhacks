from datetime import datetime
from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, Text, JSON,
    ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    preferences: Mapped["UserPreference | None"] = relationship(back_populates="user", uselist=False)
    trips: Mapped[list["Trip"]] = relationship(back_populates="user")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    attraction_types: Mapped[list] = mapped_column(JSON, default=list)
    transport_priority: Mapped[str] = mapped_column(String(20), default="no_preference")
    budget_min: Mapped[float | None] = mapped_column(Float)
    budget_max: Mapped[float | None] = mapped_column(Float)
    avoided_platforms: Mapped[list] = mapped_column(JSON, default=list)
    interaction_history: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="preferences")


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    origin: Mapped[str] = mapped_column(String(255))
    destinations: Mapped[list] = mapped_column(JSON)
    start_date: Mapped[str] = mapped_column(String(20))
    end_date: Mapped[str] = mapped_column(String(20))
    duration_days: Mapped[int] = mapped_column(Integer)
    attraction_types: Mapped[list] = mapped_column(JSON, default=list)
    specific_places: Mapped[list] = mapped_column(JSON, default=list)
    baggage: Mapped[dict] = mapped_column(JSON, default=dict)
    transport_priority: Mapped[str] = mapped_column(String(20), default="no_preference")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="trips")
    plans: Mapped[list["ItineraryPlan"]] = relationship(back_populates="trip")
    packing_lists: Mapped[list["PackingList"]] = relationship(back_populates="trip")


class ItineraryPlan(Base):
    __tablename__ = "itinerary_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id"))
    name: Mapped[str] = mapped_column(String(255))
    days: Mapped[list] = mapped_column(JSON, default=list)
    flights: Mapped[list] = mapped_column(JSON, default=list)
    cost_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    trip: Mapped["Trip"] = relationship(back_populates="plans")


class PlatformTrust(Base):
    __tablename__ = "platform_trust"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    domain: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    trust_score: Mapped[int] = mapped_column(Integer, default=80)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_reason: Mapped[str | None] = mapped_column(Text)
    last_verified_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    route: Mapped[str] = mapped_column(String(255))
    travel_date: Mapped[str] = mapped_column(String(20))
    price: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class PackingList(Base):
    __tablename__ = "packing_lists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id"))
    user_id: Mapped[str] = mapped_column(String(36))
    items: Mapped[list] = mapped_column(JSON, default=list)
    generated_by_george: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    trip: Mapped["Trip"] = relationship(back_populates="packing_lists")


class CitySafety(Base):
    __tablename__ = "city_safety"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    city: Mapped[str] = mapped_column(String(255))
    country: Mapped[str] = mapped_column(String(255))
    safety_zones: Mapped[list] = mapped_column(JSON, default=list)
    last_updated: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
