"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TripInput, AttractionType, TransportPriority } from "@/types";
import { Plus, Trash2, Loader2, MapPin, Calendar, Briefcase, Zap, ArrowRight } from "lucide-react";

const ATTRACTION_OPTIONS: { value: AttractionType; label: string; emoji: string }[] = [
  { value: "natural_landscapes", label: "Nature", emoji: "🏔️" },
  { value: "historical_monuments", label: "History", emoji: "🏛️" },
  { value: "modern_architecture", label: "Architecture", emoji: "🏙️" },
  { value: "cultural_sites", label: "Culture", emoji: "🎭" },
  { value: "food_and_cuisine", label: "Food", emoji: "🍜" },
  { value: "adventure_activities", label: "Adventure", emoji: "🧗" },
  { value: "other", label: "Other", emoji: "✨" },
];

const TRANSPORT_OPTIONS = [
  { value: "cheapest", label: "Cheapest", emoji: "💰", desc: "Best price" },
  { value: "fastest", label: "Fastest", emoji: "⚡", desc: "Less travel time" },
  { value: "no_preference", label: "Balanced", emoji: "⚖️", desc: "Either works" },
] as const;

const schema = z.object({
  origin: z.string().min(2, "Enter a departure city"),
  destinations: z.array(z.object({ value: z.string().min(2, "Enter a destination") })).min(1),
  start_date: z.string().min(1, "Select start date"),
  end_date: z.string().min(1, "Select end date"),
  attraction_types: z.array(z.string()).min(1, "Select at least one"),
  specific_places: z.array(z.object({ value: z.string() })),
  baggage_num_bags: z.coerce.number().min(0).max(10),
  baggage_weight_kg: z.coerce.number().min(0).max(100),
  transport_priority: z.enum(["cheapest", "fastest", "no_preference"]),
  num_flights: z.number().min(1).max(3),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<TripInput>;
  onSubmit: (data: TripInput) => void;
  isLoading: boolean;
}

function SectionCard({ icon, iconColor, title, children }: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "1.5rem",
      transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${iconColor}18`,
          border: `1px solid ${iconColor}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "white" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function FieldInput({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.45)", marginBottom: 6, letterSpacing: "0.01em" }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: "0.875rem",
  color: "white",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

export function TripInputForm({ defaultValues, onSubmit, isLoading }: Props) {
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      origin: defaultValues?.origin || "",
      destinations: defaultValues?.destinations?.map((v) => ({ value: v })) || [{ value: "" }],
      start_date: defaultValues?.start_date || "",
      end_date: defaultValues?.end_date || "",
      attraction_types: defaultValues?.attraction_types || [],
      specific_places: defaultValues?.specific_places?.map((v) => ({ value: v })) || [],
      baggage_num_bags: defaultValues?.baggage?.num_bags || 1,
      baggage_weight_kg: defaultValues?.baggage?.weight_per_bag_kg || 23,
      transport_priority: defaultValues?.transport_priority || "no_preference",
      num_flights: defaultValues?.num_flights || 1,
    },
  });

  const { fields: destFields, append: addDest, remove: removeDest } = useFieldArray({ control, name: "destinations" });
  const { fields: placeFields, append: addPlace, remove: removePlace } = useFieldArray({ control, name: "specific_places" });
  const selectedAttractions = watch("attraction_types");
  const transportPriority = watch("transport_priority");
  const numFlights = watch("num_flights");

  const toggleAttraction = (val: string) => {
    const current = selectedAttractions || [];
    setValue("attraction_types", current.includes(val) ? current.filter((v) => v !== val) : [...current, val]);
  };

  const submit = (data: FormValues) => {
    const duration_days = Math.max(1, Math.round(
      (new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / (1000 * 60 * 60 * 24)
    ));
    onSubmit({
      origin: data.origin,
      destinations: data.destinations.map((d) => d.value),
      start_date: data.start_date,
      end_date: data.end_date,
      duration_days,
      attraction_types: data.attraction_types as AttractionType[],
      specific_places: data.specific_places.map((p) => p.value).filter(Boolean),
      baggage: { num_bags: data.baggage_num_bags, weight_per_bag_kg: data.baggage_weight_kg, dimensions_cm: { l: 70, w: 50, h: 30 } },
      transport_priority: data.transport_priority as TransportPriority,
      num_flights: data.num_flights,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Where */}
      <SectionCard icon={<MapPin size={16} color="#60a5fa" />} iconColor="#3b82f6" title="Where are you going?">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <FieldInput label="Departure City" error={errors.origin?.message}>
            <input
              {...register("origin")}
              placeholder="e.g. New York"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
            />
          </FieldInput>

          <FieldInput label="Destinations">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {destFields.map((field, i) => (
                <div key={field.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "rgba(59,130,246,0.15)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#60a5fa" }}>{i + 1}</span>
                  </div>
                  <input
                    {...register(`destinations.${i}.value`)}
                    placeholder={`City ${i + 1}`}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                  />
                  {destFields.length > 1 && (
                    <button type="button" onClick={() => removeDest(i)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: 4 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addDest({ value: "" })}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#60a5fa", fontSize: "0.85rem", padding: "4px 0", fontWeight: 500 }}
              >
                <Plus size={14} /> Add destination
              </button>
            </div>
          </FieldInput>
        </div>
      </SectionCard>

      {/* When */}
      <SectionCard icon={<Calendar size={16} color="#a78bfa" />} iconColor="#8b5cf6" title="When are you traveling?">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FieldInput label="Start Date" error={errors.start_date?.message}>
              <input
                type="date"
                {...register("start_date")}
                style={{ ...inputStyle, colorScheme: "dark" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
            </FieldInput>
            <FieldInput label="End Date" error={errors.end_date?.message}>
              <input
                type="date"
                {...register("end_date")}
                style={{ ...inputStyle, colorScheme: "dark" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
            </FieldInput>
          </div>
        </div>
      </SectionCard>

      {/* Interests */}
      <SectionCard icon={<span style={{ fontSize: "1rem" }}>✨</span>} iconColor="#f59e0b" title="What do you enjoy?">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ATTRACTION_OPTIONS.map((opt) => {
            const active = selectedAttractions?.includes(opt.value);
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => toggleAttraction(opt.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px",
                  borderRadius: 12,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: active ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.09)",
                  background: active ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                  color: active ? "#93c5fd" : "rgba(255,255,255,0.5)",
                  boxShadow: active ? "0 0 0 1px rgba(59,130,246,0.2)" : "none",
                }}
              >
                <span>{opt.emoji}</span> {opt.label}
              </button>
            );
          })}
        </div>
        {errors.attraction_types && (
          <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: 8 }}>{errors.attraction_types.message}</p>
        )}
      </SectionCard>

      {/* Must-visit places */}
      <SectionCard icon={<MapPin size={16} color="#22c55e" />} iconColor="#22c55e" title="Must-visit places">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Optional — add specific spots you don't want to miss</p>
          {placeFields.map((field, i) => (
            <div key={field.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                {...register(`specific_places.${i}.value`)}
                placeholder="e.g. Eiffel Tower"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => removePlace(i)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: 4 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addPlace({ value: "" })}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#60a5fa", fontSize: "0.85rem", padding: "4px 0", fontWeight: 500 }}
          >
            <Plus size={14} /> Add place
          </button>
        </div>
      </SectionCard>

      {/* Baggage & Transport */}
      <SectionCard icon={<Briefcase size={16} color="#f59e0b" />} iconColor="#f59e0b" title="Baggage & Transport">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FieldInput label="Number of bags">
              <input
                type="number"
                {...register("baggage_num_bags")}
                min={0} max={10}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
            </FieldInput>
            <FieldInput label="Weight per bag (kg)">
              <input
                type="number"
                {...register("baggage_weight_kg")}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
            </FieldInput>
          </div>

          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>Transport Priority</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {TRANSPORT_OPTIONS.map((opt) => {
                const active = transportPriority === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setValue("transport_priority", opt.value)}
                    style={{
                      padding: "12px 8px",
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s ease",
                      border: active ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.09)",
                      background: active ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{opt.emoji}</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: active ? "#93c5fd" : "rgba(255,255,255,0.6)" }}>{opt.label}</div>
                    <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>Flights per Leg</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[1, 2, 3].map((n) => {
                const active = numFlights === n;
                return (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setValue("num_flights", n)}
                    style={{
                      padding: "12px 8px",
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s ease",
                      border: active ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.09)",
                      background: active ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>✈️</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: active ? "#93c5fd" : "rgba(255,255,255,0.6)" }}>{n} {n === 1 ? "Flight" : "Flights"}</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </SectionCard>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: "100%",
          padding: "1rem",
          borderRadius: 16,
          background: isLoading ? "rgba(59,130,246,0.5)" : "linear-gradient(135deg, #3b82f6, #06b6d4)",
          color: "white",
          fontWeight: 700,
          fontSize: "1rem",
          border: "none",
          cursor: isLoading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: isLoading ? "none" : "0 8px 24px rgba(59,130,246,0.35)",
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Analyzing your route…</>
        ) : (
          <><Zap size={18} /> Continue to City Suggestions <ArrowRight size={16} /></>
        )}
      </button>
    </form>
  );
}
