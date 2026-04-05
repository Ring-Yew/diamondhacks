from fastapi import APIRouter, Query
from app.schemas.schemas import SafetyResponse
import uuid

router = APIRouter(prefix="/api/safety", tags=["safety"])


@router.get("/city", response_model=SafetyResponse)
async def get_city_safety(city: str = Query(...)):
    """
    Returns color-coded safety zones for a city.
    In production: aggregated from crime APIs, State Dept advisories, OSM data.
    Returns mock GeoJSON zones for development.
    """
    mock_zones = _generate_mock_safety_zones(city)
    return SafetyResponse(zones=mock_zones)


def _generate_mock_safety_zones(city: str) -> list[dict]:
    """Generate mock safety zones with GeoJSON polygons centered on city."""
    # City center coordinates (simplified)
    city_coords: dict[str, tuple[float, float]] = {
        "paris": (2.3522, 48.8566),
        "london": (-0.1276, 51.5074),
        "new york": (-74.0060, 40.7128),
        "tokyo": (139.6917, 35.6895),
        "rome": (12.4964, 41.9028),
        "barcelona": (2.1734, 41.3851),
    }

    lng, lat = city_coords.get(city.lower(), (2.3522, 48.8566))
    delta = 0.02

    return [
        {
            "neighborhood": "City Center",
            "level": "low",
            "geojson": {
                "type": "Feature",
                "properties": {"name": "City Center", "safety": "low"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lng - delta * 0.5, lat - delta * 0.5],
                        [lng + delta * 0.5, lat - delta * 0.5],
                        [lng + delta * 0.5, lat + delta * 0.5],
                        [lng - delta * 0.5, lat + delta * 0.5],
                        [lng - delta * 0.5, lat - delta * 0.5],
                    ]],
                },
            },
        },
        {
            "neighborhood": "East District",
            "level": "moderate",
            "geojson": {
                "type": "Feature",
                "properties": {"name": "East District", "safety": "moderate"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lng + delta * 0.5, lat - delta * 0.5],
                        [lng + delta * 1.5, lat - delta * 0.5],
                        [lng + delta * 1.5, lat + delta * 0.5],
                        [lng + delta * 0.5, lat + delta * 0.5],
                        [lng + delta * 0.5, lat - delta * 0.5],
                    ]],
                },
            },
        },
        {
            "neighborhood": "Outer Ring",
            "level": "elevated",
            "geojson": {
                "type": "Feature",
                "properties": {"name": "Outer Ring", "safety": "elevated"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lng - delta * 1.5, lat - delta * 1.5],
                        [lng - delta * 0.5, lat - delta * 1.5],
                        [lng - delta * 0.5, lat + delta * 1.5],
                        [lng - delta * 1.5, lat + delta * 1.5],
                        [lng - delta * 1.5, lat - delta * 1.5],
                    ]],
                },
            },
        },
    ]
