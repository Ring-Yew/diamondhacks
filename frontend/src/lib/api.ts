import axios from "axios";
import type {
  TripInput,
  CitySuggestion,
  ItineraryPlan,
  Flight,
  PriceDataPoint,
  SafetyZone,
  ChatMessage,
} from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach auth token if present
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Trip ─────────────────────────────────────────────────────────────────────
export const tripApi = {
  getCitySuggestions: (input: Partial<TripInput>) =>
    api
      .post<{ suggestions: CitySuggestion[] }>("/api/trips/suggest-cities", input)
      .then((r) => r.data.suggestions),

  generateItineraries: (input: TripInput, acceptedCities: string[]) =>
    api
      .post<{ plans: ItineraryPlan[] }>("/api/trips/generate", {
        ...input,
        accepted_city_suggestions: acceptedCities,
      })
      .then((r) => r.data.plans),

  getItinerary: (id: string) =>
    api.get<ItineraryPlan>(`/api/trips/${id}`).then((r) => r.data),
};

// ─── Hotels ───────────────────────────────────────────────────────────────────
export const hotelApi = {
  search: (city: string, checkIn: string, checkOut: string, numNights: number) =>
    api
      .get<{ hotels: Hotel[] }>("/api/hotels/search", {
        params: { city, check_in: checkIn, check_out: checkOut, num_nights: numNights },
      })
      .then((r) => r.data.hotels),
};

// ─── Flights ──────────────────────────────────────────────────────────────────
export const flightApi = {
  search: (from: string, to: string, date: string, returnDate?: string) =>
    api
      .get<{ flights: Flight[] }>("/api/flights/search", {
        params: { from, to, date, return_date: returnDate },
      })
      .then((r) => r.data.flights),

  getPriceForecast: (route: string, travelDate: string) =>
    api
      .get<{ history: PriceDataPoint[]; forecast: PriceDataPoint[] }>(
        "/api/flights/price-forecast",
        { params: { route, travel_date: travelDate } }
      )
      .then((r) => r.data),
};

// ─── Safety ───────────────────────────────────────────────────────────────────
export const safetyApi = {
  getCitySafety: (city: string) =>
    api
      .get<{ zones: SafetyZone[] }>("/api/safety/city", { params: { city } })
      .then((r) => r.data.zones),
};

// ─── Compliance ───────────────────────────────────────────────────────────────
export const complianceApi = {
  getProhibitedItems: (cities: string[], transportModes: string[]) =>
    api
      .post<{ items: Record<string, string[]> }>("/api/compliance/prohibited", {
        cities,
        transport_modes: transportModes,
      })
      .then((r) => r.data.items),
};

// ─── George ───────────────────────────────────────────────────────────────────
export const georgeApi = {
  chat: (messages: ChatMessage[], tripContext?: Partial<TripInput>) =>
    api
      .post<{ message: ChatMessage }>("/api/george/chat", {
        messages,
        trip_context: tripContext,
      })
      .then((r) => r.data.message),

  generatePackingList: (tripId: string) =>
    api
      .post<{ items: string[] }>("/api/george/packing-list", { trip_id: tripId })
      .then((r) => r.data.items),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signUp: (email: string, password: string, name: string) =>
    api
      .post<{ token: string; user: unknown }>("/api/auth/signup", { email, password, name })
      .then((r) => r.data),

  signIn: (email: string, password: string) =>
    api
      .post<{ token: string; user: unknown }>("/api/auth/signin", { email, password })
      .then((r) => r.data),
};

export default api;
