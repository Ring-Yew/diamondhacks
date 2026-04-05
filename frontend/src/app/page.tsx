"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plane, MapPin, ArrowRight, CheckCircle } from "lucide-react";
import styles from "./home.module.css";

const features = [
  { emoji: "✈️", title: "Smart Flight Search", desc: "Real-time prices, baggage policies, and aircraft types via Browser Use AI.", color: "#3b82f6" },
  { emoji: "🗺️", title: "Multi-City Routes", desc: "AI-optimized routes across multiple destinations with full day-by-day breakdowns.", color: "#8b5cf6" },
  { emoji: "⭐", title: "Personalized Picks", desc: "Recommendations that learn from your choices and keep improving over time.", color: "#f59e0b" },
  { emoji: "🍄", title: "George AI Assistant", desc: "Always-on travel companion for packing lists, visa tips, and anything trip-related.", color: "#14b8a6" },
];

const destinations = ["Paris", "Tokyo", "New York", "Bali", "Rome", "Bangkok", "Dubai", "Sydney"];

const perks = [
  "Real flight prices via Browser Use AI",
  "No hidden fees or platform bias",
  "Fraud-checked booking links only",
];

export default function HomePage() {
  return (
    <main style={{ background: "#0a0f1e", minHeight: "100vh", color: "white", overflowX: "hidden" }}>
      {/* Background blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10rem", left: "-10rem", width: 700, height: 700, borderRadius: "50%", background: "rgba(59,130,246,0.15)", filter: "blur(140px)" }} />
        <div style={{ position: "absolute", top: "35%", right: "-8rem", width: 600, height: 600, borderRadius: "50%", background: "rgba(139,92,246,0.1)", filter: "blur(140px)" }} />
        <div style={{ position: "absolute", bottom: "-5rem", left: "25%", width: 500, height: 500, borderRadius: "50%", background: "rgba(6,182,212,0.08)", filter: "blur(120px)" }} />
      </div>

      {/* Dot grid */}
      <div className="dot-bg" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.4 }} />

      {/* Nav */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(59,130,246,0.4)" }}>
            <Plane size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em" }}>TripMind</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/trip" className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", padding: "9px 20px", fontSize: "0.85rem" }}>
            Plan a Trip <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero} style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: "easeOut" }} style={{ maxWidth: "56rem", width: "100%" }}>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.4 }}>
            <div className={styles.badge}>
              <div className={styles.badgePulse} />
              Powered by Claude AI + Browser Use
            </div>
          </motion.div>

          <h1 className={styles.heroTitle}>
            Your AI travel planner{" "}
            <span className={styles.heroGradient}>that actually works</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Real flight prices, multi-city itineraries, safety maps, and George — your personal AI travel companion.
          </p>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
            <Link href="/trip" className={styles.ctaPrimary} style={{ display: "inline-flex", textDecoration: "none" }}>
              Plan a Trip <ArrowRight size={16} />
            </Link>
          </div>

          {/* Perks */}
          <div className={styles.perksRow}>
            {perks.map((p) => (
              <div key={p} className={styles.perk}>
                <CheckCircle size={12} color="#4ade80" /> {p}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Destination pills */}
        <motion.div
          className={styles.destinationPills}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {destinations.map((d, i) => (
            <motion.div key={d} className={styles.destinationPill} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 + i * 0.06 }}>
              <MapPin size={11} color="#60a5fa" /> {d}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className={styles.featuresSection}>
        <motion.div className={styles.sectionHeader} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className={styles.sectionTitle}>
            Everything you need to{" "}
            <span className={styles.heroGradient}>travel better</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            One platform that handles every part of your trip — from first search to final packing.
          </p>
        </motion.div>

        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4 }}
            >
              <div className={styles.featureIcon} style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                {f.emoji}
              </div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        style={{ position: "relative", zIndex: 10, padding: "2rem 2rem", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: "4rem", flexWrap: "wrap" }}>
          {[
            { val: "50+", label: "Countries covered" },
            { val: "Real-time", label: "Flight prices" },
            { val: "Claude AI", label: "Powered by" },
            { val: "Free", label: "No credit card needed" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.val}</div>
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* CTA section */}
      <section className={styles.ctaSection}>
        <motion.div className={styles.ctaBox} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className={styles.ctaBoxTitle}>Ready to plan your dream trip?</h2>
          <p className={styles.ctaBoxSubtitle}>Join travelers who plan smarter with TripMind.</p>
          <Link href="/trip" className={styles.ctaPrimary} style={{ display: "inline-flex", textDecoration: "none" }}>
            Start for Free <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Plane size={13} /> TripMind © 2026
        </div>
        <span>Built with Claude AI at DiamondHacks</span>
      </footer>
    </main>
  );
}
