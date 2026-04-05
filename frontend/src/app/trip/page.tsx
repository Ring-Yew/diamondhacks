"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TripInputForm } from "@/components/trip/TripInputForm";
import { CitySuggestionStep } from "@/components/trip/CitySuggestionStep";
import { ItineraryResults } from "@/components/trip/ItineraryResults";
import { useTripStore } from "@/store/tripStore";
import { tripApi } from "@/lib/api";
import type { TripInput } from "@/types";
import { Plane, ChevronRight, Check } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { label: "Plan Details", icon: "📋" },
  { label: "City Suggestions", icon: "🗺️" },
  { label: "Your Itineraries", icon: "✈️" },
];

export default function TripPage() {
  const [step, setStep] = useState(0);
  const {
    tripInput, setTripInput,
    citySuggestions, setCitySuggestions,
    acceptedSuggestions,
    itineraryPlans, setItineraryPlans,
    isGenerating, setIsGenerating,
  } = useTripStore();

  const handleTripInputSubmit = async (input: TripInput) => {
    setTripInput(input);
    setIsGenerating(true);
    try {
      const suggestions = await tripApi.getCitySuggestions(input);
      setCitySuggestions(suggestions);
      setStep(1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateItineraries = async () => {
    setIsGenerating(true);
    try {
      const plans = await tripApi.generateItineraries(tripInput as TripInput, acceptedSuggestions);
      setItineraryPlans(plans);
      setStep(2);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "white" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10rem", left: "-10rem", width: 500, height: 500, borderRadius: "50%", background: "rgba(59,130,246,0.1)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: "-5rem", right: "-5rem", width: 400, height: 400, borderRadius: "50%", background: "rgba(139,92,246,0.08)", filter: "blur(100px)" }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plane size={13} color="white" />
          </div>
          <span style={{ fontWeight: 800, color: "white", fontSize: "1rem" }}>TripMind</span>
        </Link>
        <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
        <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>Plan a Trip</span>
      </nav>

      {/* Step indicator */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: "44rem", margin: "0 auto", padding: "2rem 1.5rem 0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {STEPS.map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34,
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                  ...(i < step ? {
                    background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                    boxShadow: "0 2px 8px rgba(59,130,246,0.4)",
                    color: "white",
                  } : i === step ? {
                    background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                    boxShadow: "0 0 0 4px rgba(59,130,246,0.18), 0 4px 14px rgba(59,130,246,0.4)",
                    color: "white",
                  } : {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.25)",
                  }),
                }}>
                  {i < step ? <Check size={14} /> : <span>{i + 1}</span>}
                </div>
                <span style={{
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  display: "none",
                  transition: "color 0.2s",
                  color: i === step ? "white" : i < step ? "#93c5fd" : "rgba(255,255,255,0.3)",
                  ...(typeof window !== "undefined" && window.innerWidth >= 480 ? { display: "block" } : {}),
                }}
                  className="hidden sm:block"
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 1, margin: "0 12px",
                  background: i < step
                    ? "linear-gradient(90deg,rgba(59,130,246,0.4),rgba(6,182,212,0.2))"
                    : "rgba(255,255,255,0.06)",
                  transition: "background 0.3s ease",
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: "44rem", margin: "0 auto", padding: "0 1.5rem 6rem" }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <TripInputForm defaultValues={tripInput} onSubmit={handleTripInputSubmit} isLoading={isGenerating} />
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <CitySuggestionStep suggestions={citySuggestions} onBack={() => setStep(0)} onContinue={handleGenerateItineraries} isLoading={isGenerating} />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <ItineraryResults plans={itineraryPlans} onBack={() => setStep(1)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
