# TripMind — AI-Powered Multi-City Travel Planner

TripMind is a full-stack travel planning application that uses Claude AI to generate personalized multi-city itineraries, search real flights via Browser Use (Kayak), and provide an AI travel assistant named George.

---

## Features

- **City Suggestions** — Claude AI suggests additional destinations based on your interests and travel style
- **Itinerary Generation** — Generates day-by-day plans including attractions, hotels, and cost breakdowns
- **Real Flight Search** — Uses Browser Use Cloud API to scrape live flight prices from Kayak
- **George AI Chat** — An in-app travel assistant powered by Claude that answers questions about your trip
- **Packing List** — Automatically generates a packing list based on your destinations and trip type
- **Safety Map** — Displays neighborhood safety zones on a Mapbox map (requires Mapbox token)
- **Compliance Check** — Lists prohibited items for your destinations and transport modes
- **Cost Breakdown** — Estimates total trip cost split by flights, accommodation, transport, attractions, and meals

---

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- React Hook Form + Zod (form validation)
- Framer Motion (animations)
- Mapbox GL JS (safety maps)
- Recharts (price forecast charts)
- Axios

### Backend
- FastAPI (Python)
- SQLAlchemy + aiosqlite (SQLite by default, PostgreSQL supported)
- Anthropic Claude API (`claude-sonnet-4-6`)
- Browser Use Cloud API (flight scraping)
- SerpAPI (flight search fallback)
- Redis (optional caching)
- JWT authentication

---

## Project Structure

```
DiamondHacks/
├── frontend/                  # Next.js app
│   └── src/
│       ├── app/               # Pages (/, /trip)
│       ├── components/
│       │   ├── trip/          # TripInputForm, CitySuggestionStep, ItineraryResults
│       │   ├── george/        # George AI chat panel
│       │   ├── map/           # SafetyMap (Mapbox)
│       │   └── charts/        # PriceForecastChart
│       ├── store/             # Zustand store (tripStore.ts)
│       ├── lib/               # API client (api.ts)
│       └── types/             # Shared TypeScript types
│
└── backend/                   # FastAPI app
    └── app/
        ├── agents/            # Claude AI agents
        │   ├── base.py        # Shared client setup + model constant
        │   ├── city_suggestion_agent.py   # Suggests additional cities
        │   ├── itinerary_agent.py         # Generates day-by-day plans
        │   └── george_agent.py            # Powers George chat
        ├── api/routes/        # API endpoints
        │   ├── trips.py       # /api/trips/suggest-cities, /api/trips/generate
        │   ├── flights.py     # /api/flights/search
        │   ├── hotels.py      # /api/hotels/search
        │   ├── george.py      # /api/george/chat, /api/george/packing-list
        │   ├── safety.py      # /api/safety/city
        │   ├── compliance.py  # /api/compliance/prohibited
        │   └── auth.py        # /api/auth/signup, /api/auth/signin
        ├── services/
        │   ├── browser_use_service.py     # Kayak flight scraping via Browser Use
        │   └── serpapi_service.py         # SerpAPI flight fallback
        ├── models/            # SQLAlchemy models
        ├── schemas/           # Pydantic request/response schemas
        └── core/config.py     # Settings loaded from .env
```

---

## How It Works

1. User fills in origin, destinations, dates, attraction types, and baggage info
2. Claude suggests additional cities to consider based on interests
3. User accepts or skips suggestions
4. Claude generates 1–3 itinerary options with day-by-day plans and hotels
5. Browser Use scrapes Kayak for real flight prices for each leg in parallel
6. Results are shown with flights, cost breakdown, and day-by-day schedule
7. George AI chat is available throughout for questions about the trip

---

## Prerequisites

- Node.js 18 or 20
- Python 3.12
- An Anthropic API key (console.anthropic.com)
- A Browser Use Cloud API key (browser-use.com) — required for flight search
- Optional: SerpAPI key, Mapbox token

---

## Environment Variables

### Backend (`backend/.env`)

```env
ANTHROPIC_API_KEY=sk-ant-...
BROWSER_USE_API_KEY=your-browser-use-key
SERPAPI_KEY=your-serpapi-key          # optional fallback
GOOGLE_PLACES_API_KEY=                # optional
MAPBOX_TOKEN=                         # optional
DATABASE_URL=sqlite+aiosqlite:///./tripmind.db
REDIS_URL=redis://localhost:6379
SECRET_KEY=change-me-in-production
ALLOWED_ORIGINS=["http://localhost:3000"]
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token    # optional
```

---

## Running on Windows

### 1. Install dependencies

- Download and install [Node.js 20](https://nodejs.org)
- Download and install [Python 3.12](https://www.python.org/downloads/)
- Open Command Prompt or PowerShell

### 2. Backend

```cmd
cd DiamondHacks\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend\.env` with your API keys (see above), then:

```cmd
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend

Open a second terminal:

```cmd
cd DiamondHacks\frontend
npm install
```

Create `frontend\.env.local` with your variables, then:

```cmd
npm run dev
```

App runs at **http://localhost:3000**

---

## Running on Linux

### 1. Install dependencies

```bash
sudo apt update
sudo apt install -y nodejs npm python3.12 python3.12-venv git
```

If `python3.12` is not available:

```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev
```

For Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Backend

```bash
cd DiamondHacks/backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` with your API keys (see above), then:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend

Open a second terminal:

```bash
cd DiamondHacks/frontend
npm install
npm run build
npm start
```

App runs at **http://localhost:3000** (or `http://YOUR_SERVER_IP:3000` for remote servers)

---

## Production Notes

- Open ports 3000 (frontend) and 8000 (backend) in your firewall or security group
- The Anthropic API key must be used from a non-restricted IP. University and some cloud provider IPs may be blocked by Anthropic
- SQLite is used by default. For production, set `DATABASE_URL` to a PostgreSQL connection string
- Redis is optional — the app works without it
- Browser Use flight searches take 3–5 minutes per request (this is expected)

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/trips/suggest-cities` | Get AI city suggestions |
| POST | `/api/trips/generate` | Generate full itineraries with flights |
| GET | `/api/flights/search` | Search flights between two cities |
| GET | `/api/hotels/search` | Search hotels in a city |
| POST | `/api/george/chat` | Chat with George AI assistant |
| POST | `/api/george/packing-list` | Generate a packing list |
| GET | `/api/safety/city` | Get safety zones for a city |
| POST | `/api/compliance/prohibited` | Get prohibited items for destinations |
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/signin` | Sign in and get JWT token |
| GET | `/health` | Health check |
