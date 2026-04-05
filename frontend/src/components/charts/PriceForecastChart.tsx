"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import type { PriceDataPoint } from "@/types";
import { format } from "date-fns";

interface Props {
  data: PriceDataPoint[];
  route: string;
}

export function PriceForecastChart({ data, route }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const chartData = data.map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    price: d.is_forecast ? null : d.price,
    forecast: d.is_forecast ? d.price : null,
    low: d.confidence_low,
    high: d.confidence_high,
    rawDate: d.date,
  }));

  const minPrice = Math.min(...data.map((d) => d.confidence_low ?? d.price));
  const maxPrice = Math.max(...data.map((d) => d.confidence_high ?? d.price));

  const latestActual = data.filter((d) => !d.is_forecast).at(-1);
  const nearestForecast = data.filter((d) => d.is_forecast)[0];
  const trend =
    latestActual && nearestForecast
      ? nearestForecast.price > latestActual.price
        ? "up"
        : "down"
      : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{route}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Price history & 7-day forecast</p>
        </div>
        {trend && (
          <div
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              trend === "up"
                ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400"
                : "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
            }`}
          >
            {trend === "up" ? "▲ Prices rising" : "▼ Prices falling"} — book{" "}
            {trend === "up" ? "now" : "later"}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis
            domain={[minPrice * 0.9, maxPrice * 1.1]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(value, name) => [
              `$${value}`,
              name === "price" ? "Actual" : "Forecast",
            ]}
          />
          <ReferenceLine
            x={format(new Date(today), "MMM d")}
            stroke="#94a3b8"
            strokeDasharray="4 2"
            label={{ value: "Today", fill: "#94a3b8", fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorPrice)"
            connectNulls={false}
            dot={false}
            name="price"
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="url(#colorForecast)"
            connectNulls={false}
            dot={false}
            name="forecast"
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Forecast generated via stochastic simulation · Confidence range shown as shaded area
      </p>
    </div>
  );
}
