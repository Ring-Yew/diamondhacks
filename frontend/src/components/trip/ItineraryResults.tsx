"use client";
import { useState } from "react";
import type { ItineraryPlan } from "@/types";
import { useTripStore } from "@/store/tripStore";
import { ArrowLeft, Plane, Hotel, MapPin, DollarSign, Calendar, ExternalLink, Clock, Luggage, ChevronRight } from "lucide-react";

interface Props {
  plans: ItineraryPlan[];
  onBack: () => void;
}

export function ItineraryResults({ plans, onBack }: Props) {
  const { selectedPlanId, setSelectedPlanId } = useTripStore();
  const [activeTab, setActiveTab] = useState<"overview" | "day-by-day" | "flights" | "costs">("overview");

  if (!plans.length) {
    return (
      <div style={{ marginTop: "2rem", textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✈️</div>
        <p style={{ color: "rgba(255,255,255,0.3)", marginBottom: "1rem" }}>No itineraries generated.</p>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#60a5fa", fontSize: "0.9rem" }}>
          ← Go back
        </button>
      </div>
    );
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? plans[0];

  return (
    <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Plan selector */}
      {plans.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {plans.map((plan) => {
            const active = selectedPlan.id === plan.id;
            return (
              <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: 12,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: active ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  background: active ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                  color: active ? "#93c5fd" : "rgba(255,255,255,0.5)",
                }}
              >
                {plan.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: "flex",
        gap: 2,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: 4,
      }}>
        {(["overview", "day-by-day", "flights", "costs"] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "9px 4px",
                borderRadius: 12,
                fontSize: "0.82rem",
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                border: "none",
                transition: "all 0.2s ease",
                background: active ? "rgba(255,255,255,0.09)" : "transparent",
                color: active ? "white" : "rgba(255,255,255,0.38)",
                textTransform: "capitalize",
              }}
            >
              {tab.replace("-", " ")}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && <PlanOverview plan={selectedPlan} />}
      {activeTab === "day-by-day" && <DayByDay plan={selectedPlan} />}
      {activeTab === "flights" && <FlightsTab plan={selectedPlan} />}
      {activeTab === "costs" && <CostsTab plan={selectedPlan} />}

      <button onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.3)", fontSize: "0.85rem",
          paddingTop: 8,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
      >
        <ArrowLeft size={14} /> Back to suggestions
      </button>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14,
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 600, color: "white", fontSize: "0.95rem" }}>{value}</div>
      </div>
    </div>
  );
}

function PlanOverview({ plan }: { plan: ItineraryPlan }) {
  const cities = [...new Set(plan.days.map((d) => d.city))];
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h3 style={{ fontWeight: 800, color: "white", fontSize: "1.3rem", marginBottom: "0.75rem" }}>{plan.name}</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {cities.map((city) => (
            <span key={city} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.2)",
              color: "#93c5fd",
              fontSize: "0.75rem",
              fontWeight: 500,
              padding: "4px 10px",
              borderRadius: 99,
            }}>
              <MapPin size={9} /> {city}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatCard
          icon={<Calendar size={16} color="#60a5fa" />}
          iconBg="rgba(59,130,246,0.12)"
          label="Duration"
          value={`${plan.days.length} days`}
        />
        <StatCard
          icon={<DollarSign size={16} color="#4ade80" />}
          iconBg="rgba(34,197,94,0.12)"
          label="Est. Total"
          value={`$${plan.cost_breakdown.total_usd.toLocaleString()}`}
        />
      </div>

      {/* Route timeline */}
      <div>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontWeight: 500, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Route</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {cities.map((city, i) => (
            <div key={city} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                padding: "6px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 500,
              }}>
                {city}
              </div>
              {i < cities.length - 1 && <ChevronRight size={14} color="rgba(255,255,255,0.2)" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayByDay({ plan }: { plan: ItineraryPlan }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {plan.days.map((day) => (
        <div key={day.day} style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          overflow: "hidden",
        }}>
          {/* Day header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.01)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(6,182,212,0.25))",
                border: "1px solid rgba(59,130,246,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#60a5fa" }}>{day.day}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>{day.city}</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{day.date}</div>
              </div>
            </div>
            {day.hotel && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "5px 10px",
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.4)",
              }}>
                <Hotel size={10} /> {day.hotel.name}
              </div>
            )}
          </div>

          {/* Attractions */}
          <div style={{ padding: "10px 18px 14px" }}>
            {day.attractions.map((a, i) => (
              <div key={a.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: i < day.attractions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(96,165,250,0.5)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)" }}>{a.name}</span>
                </div>
                {a.entry_cost_usd > 0 && (
                  <span style={{
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.3)",
                    background: "rgba(255,255,255,0.04)",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}>
                    ${a.entry_cost_usd}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FlightsTab({ plan }: { plan: ItineraryPlan }) {
  if (!plan.flights?.length || plan.flights.every((leg) => !leg?.length)) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 18,
        padding: "3rem",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✈️</div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>No flight data available for this itinerary.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {plan.flights.map((legFlights, i) => (
        legFlights?.length > 0 && (
          <div key={i}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 10,
            }}>
              <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Leg {i + 1} · {legFlights[0].from_city} → {legFlights[0].to_city}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {legFlights.map((f) => (
                <div key={f.id} style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  padding: "16px",
                  transition: "all 0.2s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    {/* Left: airline info */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 44, height: 44,
                        borderRadius: 12,
                        background: "rgba(59,130,246,0.1)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Plane size={18} color="#60a5fa" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>{f.airline}</div>
                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                          {f.flight_number}{f.aircraft_type ? ` · ${f.aircraft_type}` : ""}
                        </div>
                        {/* Tags row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "3px 8px" }}>
                            <Clock size={10} />
                            {Math.floor(f.duration_minutes / 60)}h {f.duration_minutes % 60}m
                          </span>
                          <span style={{ fontSize: "0.72rem", color: f.layovers === 0 ? "#4ade80" : "rgba(255,255,255,0.35)", background: f.layovers === 0 ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${f.layovers === 0 ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 6, padding: "3px 8px" }}>
                            {f.layovers === 0 ? "Nonstop" : `${f.layovers} stop${f.layovers > 1 ? "s" : ""}`}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "3px 8px" }}>
                            <Luggage size={10} />
                            {f.baggage_policy.free_checked_bags} checked bag{f.baggage_policy.free_checked_bags !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: price + book */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
                        ${f.price_usd}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>per person</div>
                      <a
                        href={f.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 8,
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "rgba(59,130,246,0.15)",
                          border: "1px solid rgba(59,130,246,0.25)",
                          color: "#93c5fd",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "background 0.15s",
                        }}
                      >
                        Book <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

function CostsTab({ plan }: { plan: ItineraryPlan }) {
  const c = plan.cost_breakdown;
  const rows = [
    { label: "Flights", value: c.flights_usd, color: "#3b82f6", pct: c.flights_usd / c.total_usd },
    { label: "Accommodation", value: c.accommodation_usd, color: "#8b5cf6", pct: c.accommodation_usd / c.total_usd },
    { label: "Ground Transport", value: c.ground_transport_usd, color: "#06b6d4", pct: c.ground_transport_usd / c.total_usd },
    { label: "Attractions", value: c.attractions_usd, color: "#f59e0b", pct: c.attractions_usd / c.total_usd },
    { label: "Meals & Incidentals", value: c.meals_buffer_usd, color: "#22c55e", pct: c.meals_buffer_usd / c.total_usd },
  ];

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
    }}>
      <h3 style={{ fontWeight: 700, color: "white", fontSize: "1.1rem" }}>Cost Breakdown</h3>

      {/* Stacked bar */}
      <div style={{ height: 10, borderRadius: 99, overflow: "hidden", display: "flex", gap: 2 }}>
        {rows.map((r) => (
          <div key={r.label} style={{
            width: `${r.pct * 100}%`,
            background: r.color,
            borderRadius: 99,
            minWidth: r.value > 0 ? 3 : 0,
            transition: "width 0.5s ease",
          }} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "white" }}>${r.value.toLocaleString()}</span>
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", width: 36, textAlign: "right" }}>
              {(r.pct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        paddingTop: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontWeight: 700, color: "white", fontSize: "1rem" }}>Total Estimate</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>All costs combined</div>
        </div>
        <div style={{
          fontSize: "1.8rem",
          fontWeight: 800,
          background: "linear-gradient(135deg,#60a5fa,#a78bfa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          ${c.total_usd.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
