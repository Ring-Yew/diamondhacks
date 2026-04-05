"use client";
import { useEffect, useRef, useState } from "react";
import type { SafetyZone, SafetyLevel } from "@/types";
import { safetyApi } from "@/lib/api";

const SAFETY_COLORS: Record<SafetyLevel, string> = {
  low: "#22c55e",
  moderate: "#eab308",
  elevated: "#ef4444",
};

interface Props {
  city: string;
  lat: number;
  lng: number;
}

export function SafetyMap({ city, lat, lng }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [zones, setZones] = useState<SafetyZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    safetyApi.getCitySafety(city).then((z) => {
      setZones(z);
      setLoading(false);
    });
  }, [city]);

  useEffect(() => {
    if (!mapContainerRef.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    import("mapbox-gl").then((mapboxgl) => {
      (mapboxgl as { default: typeof import("mapbox-gl") }).default.accessToken =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

      const map = new (mapboxgl as { default: typeof import("mapbox-gl") }).default.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: [lng, lat],
        zoom: 12,
      });

      map.on("load", () => {
        mapRef.current = map;
        setMapLoaded(true);
      });

      return () => map.remove();
    });
  }, [lat, lng]);

  // Add safety zone layers once both map and zones are ready
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || zones.length === 0) return;

    const map = mapRef.current as import("mapbox-gl").Map;

    zones.forEach((zone, i) => {
      const sourceId = `safety-zone-${i}`;
      const layerId = `safety-layer-${i}`;

      if (map.getSource(sourceId)) return;

      map.addSource(sourceId, {
        type: "geojson",
        data: zone.geojson as GeoJSON.Feature,
      });

      map.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": SAFETY_COLORS[zone.level],
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: `${layerId}-outline`,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": SAFETY_COLORS[zone.level],
          "line-width": 1.5,
          "line-opacity": 0.7,
        },
      });
    });
  }, [mapLoaded, zones]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Safety Map — {city}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Neighborhood safety levels</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {(["low", "moderate", "elevated"] as SafetyLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: SAFETY_COLORS[level] }}
              />
              <span className="capitalize text-slate-500 dark:text-slate-400">{level}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        ref={mapContainerRef}
        style={{ height: "350px" }}
        className="relative"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 z-10">
            <div className="text-sm text-slate-500">Loading safety data…</div>
          </div>
        )}
        {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 z-10">
            <div className="text-sm text-slate-500 text-center px-4">
              Add NEXT_PUBLIC_MAPBOX_TOKEN to enable maps
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
