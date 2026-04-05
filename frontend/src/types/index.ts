// ─── Trip Input ───────────────────────────────────────────────────────────────
export type TransportPriority = "cheapest" | "fastest" | "no_preference";

export type AttractionType =
  | "natural_landscapes"
  | "historical_monuments"
  | "modern_architecture"
  | "cultural_sites"
  | "food_and_cuisine"
  | "adventure_activities"
  | "other";

export interface BaggageInfo {
  num_bags: number;
  weight_per_bag_kg: number;
  dimensions_cm: { l: number; w: number; h: number };
}

export interface TripInput {
  origin: string;
  destinations: string[];
  start_date: string; // ISO date
  end_date: string;
  duration_days: number;
  attraction_types: AttractionType[];
  specific_places: string[];
  baggage: BaggageInfo;
  transport_priority: TransportPriority;
  num_flights: number;
}

// ─── City Suggestion ──────────────────────────────────────────────────────────
export interface CitySuggestion {
  city: string;
  country: string;
  reason: string;
  insert_after: string; // city name to insert after
}

// ─── Flight ───────────────────────────────────────────────────────────────────
export interface BaggagePolicy {
  free_checked_bags: number;
  carry_on_included: boolean;
  extra_bag_fee_usd?: number;
}

export interface Flight {
  id: string;
  airline: string;
  flight_number: string;
  aircraft_type: string;
  from_city: string;
  to_city: string;
  departure: string; // ISO datetime
  arrival: string;
  duration_minutes: number;
  layovers: number;
  price_usd: number;
  baggage_policy: BaggagePolicy;
  booking_url: string;
  platform: string;
}

// ─── Hotel ────────────────────────────────────────────────────────────────────
export interface Hotel {
  id: string;
  name: string;
  city: string;
  stars: number;
  nightly_rate_usd: number;
  total_cost_usd: number;
  distance_to_center_km: number;
  booking_url: string;
  platform: string;
  lat: number;
  lng: number;
  image_url?: string;
}

// ─── Attraction ───────────────────────────────────────────────────────────────
export interface Attraction {
  id: string;
  name: string;
  city: string;
  category: AttractionType;
  entry_cost_usd: number;
  hours: string;
  booking_url?: string;
  lat: number;
  lng: number;
  user_specified: boolean;
  description?: string;
}

// ─── Price Forecast ───────────────────────────────────────────────────────────
export interface PriceDataPoint {
  date: string;
  price: number;
  is_forecast: boolean;
  confidence_low?: number;
  confidence_high?: number;
}

// ─── Itinerary ────────────────────────────────────────────────────────────────
export interface DayPlan {
  day: number;
  date: string;
  city: string;
  attractions: Attraction[];
  hotel: Hotel;
  notes?: string;
}

export interface CostBreakdown {
  flights_usd: number;
  accommodation_usd: number;
  ground_transport_usd: number;
  attractions_usd: number;
  meals_buffer_usd: number;
  total_usd: number;
}

export interface ItineraryPlan {
  id: string;
  name: string;
  days: DayPlan[];
  flights: Flight[][];
  cost_breakdown: CostBreakdown;
  created_at: string;
}

// ─── Safety Map ───────────────────────────────────────────────────────────────
export type SafetyLevel = "low" | "moderate" | "elevated";

export interface SafetyZone {
  neighborhood: string;
  level: SafetyLevel;
  geojson: GeoJSON.Feature;
}

// ─── User & Preferences ───────────────────────────────────────────────────────
export interface UserPreferences {
  attraction_types: AttractionType[];
  transport_priority: TransportPriority;
  budget_range?: { min: number; max: number };
  avoided_platforms: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  preferences: UserPreferences;
}

// ─── George Chat ──────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ─── Platform Trust ───────────────────────────────────────────────────────────
export interface PlatformTrust {
  domain: string;
  name: string;
  trust_score: number; // 0–100
  is_flagged: boolean;
  flag_reason?: string;
}
