import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { George } from "@/components/george/George";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TripMind — AI Travel Planner",
  description: "Plan perfect multi-city trips with AI-powered itineraries, real-time prices, and personalized recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <George />
      </body>
    </html>
  );
}
