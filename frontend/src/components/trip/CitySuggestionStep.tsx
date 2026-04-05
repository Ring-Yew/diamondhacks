"use client";
import { motion } from "framer-motion";
import type { CitySuggestion } from "@/types";
import { useTripStore } from "@/store/tripStore";
import { MapPin, Plus, Check, Loader2, ArrowLeft, Sparkles } from "lucide-react";

interface Props {
  suggestions: CitySuggestion[];
  onBack: () => void;
  onContinue: () => void;
  isLoading: boolean;
}

export function CitySuggestionStep({ suggestions, onBack, onContinue, isLoading }: Props) {
  const { acceptedSuggestions, toggleSuggestion } = useTripStore();

  return (
    <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Info banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))",
        border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: 16,
        padding: "1rem 1.25rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Sparkles size={15} color="#60a5fa" />
          <span style={{ fontWeight: 600, color: "white", fontSize: "0.9rem" }}>AI City Suggestions</span>
        </div>
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
          Based on your route and preferences, we think you'd love these stops. They're optional — add any that interest you.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🗺️</div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>No additional suggestions for your route.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {suggestions.map((s, i) => {
            const accepted = acceptedSuggestions.includes(s.city);
            return (
              <motion.div
                key={s.city}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: accepted ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.025)",
                  border: accepted ? "1px solid rgba(59,130,246,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  padding: "1.1rem 1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  transition: "all 0.2s ease",
                  cursor: "default",
                }}
              >
                <div style={{ display: "flex", gap: 12, flex: 1 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: accepted ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
                    border: accepted ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <MapPin size={14} color={accepted ? "#60a5fa" : "rgba(255,255,255,0.4)"} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>
                      {s.city}, <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>{s.country}</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", marginTop: 4, lineHeight: 1.55 }}>
                      {s.reason}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                      Insert after {s.insert_after}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleSuggestion(s.city)}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 10,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    border: accepted ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.12)",
                    background: accepted ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
                    color: accepted ? "#93c5fd" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {accepted ? <Check size={12} /> : <Plus size={12} />}
                  {accepted ? "Added" : "Add"}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
        <button onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 20px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <button onClick={onContinue} disabled={isLoading}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "11px 20px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.6 : 1,
            boxShadow: "0 6px 20px rgba(59,130,246,0.3)",
            transition: "all 0.2s ease",
          }}
        >
          {isLoading ? (
            <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Generating itineraries…</>
          ) : (
            "Generate Itineraries →"
          )}
        </button>
        {isLoading && (
          <div style={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
            ⏱ Approximate loading time: 3–5 minutes while we search for real flights
          </div>
        )}
      </div>
    </div>
  );
}
