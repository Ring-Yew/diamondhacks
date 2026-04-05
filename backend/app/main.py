from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.db.database import init_db
from app.api.routes import trips, flights, hotels, george, safety, compliance, auth

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown (clean up resources if needed)


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI-powered multi-city travel planning API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(flights.router)
app.include_router(hotels.router)
app.include_router(george.router)
app.include_router(safety.router)
app.include_router(compliance.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.app_name}
