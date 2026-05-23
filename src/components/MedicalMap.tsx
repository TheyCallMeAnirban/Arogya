import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Compass, ExternalLink } from "lucide-react";
import { Hospital } from "../types";

interface MedicalMapProps {
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  onSelectHospital: (hospital: Hospital) => void;
  city: string;
}

export default function MedicalMap({
  hospitals,
  selectedHospital,
  onSelectHospital,
  city,
}: MedicalMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });

  // Reset slight pan perturbation on city change
  useEffect(() => {
    setMapOffset({ x: 0, y: 0 });
  }, [city]);

  // Project map coordinates into nice relative SVG viewBox positions (400x300)
  // Let's create a bounding box based on hospitals to standard fitting
  const getProjectedCoords = (lat: number, lng: number) => {
    if (hospitals.length === 0) return { x: 200, y: 150 };

    // Get bounds
    const lats = hospitals.map((h) => h.lat);
    const lngs = hospitals.map((h) => h.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = maxLat - minLat === 0 ? 1 : maxLat - minLat;
    const lngSpan = maxLng - minLng === 0 ? 1 : maxLng - minLng;

    // Project with premium margins (10% to 90% space)
    const x = 50 + ((lng - minLng) / lngSpan) * 300;
    const y = 250 - ((lat - minLat) / latSpan) * 200; // Flip Y for standard orientation

    return { x, y };
  };

  const handleOpenGoogleMaps = () => {
    const target = selectedHospital || hospitals[0];
    if (target) {
      const query = encodeURIComponent(`${target.name} ${target.locationDesc}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    }
  };

  const isMumbai = city.toLowerCase().includes("mumbai");
  const isChennai = city.toLowerCase().includes("chennai");

  return (
    <div className="glass-panel rounded-2xl overflow-hidden min-h-[360px] flex flex-col relative group border border-slate-200">
      {/* Dynamic Styled Background Coastline / Grid lines using SVG */}
      <div className="absolute inset-0 bg-[#FDFDFB] overflow-hidden">
        <svg className="w-full h-full opacity-65" viewBox="0 0 400 300">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(13, 46, 39, 0.05)" strokeWidth="1" />
            </pattern>
            <radialGradient id="sky-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0D2E27" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#FDFDFB" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid Layer */}
          <rect width="100%" height="100%" fill="url(#grid)" />
          <circle cx="200" cy="150" r="120" fill="url(#sky-glow)" />

          {/* Drawing local mock peninsula coastline if Mumbai/Chennai */}
          {isMumbai && (
            <path
              d="M 50 0 Q 80 120 70 180 T 60 300 L 0 300 L 0 0 Z"
              fill="rgba(13, 46, 39, 0.015)"
              stroke="rgba(13, 46, 39, 0.06)"
              strokeWidth="1.5"
            />
          )}

          {isChennai && (
            <path
              d="M 330 0 Q 310 140 320 200 T 340 300 L 400 300 L 400 0 Z"
              fill="rgba(13, 46, 39, 0.015)"
              stroke="rgba(13, 46, 39, 0.06)"
              strokeWidth="1.5"
            />
          )}

          {/* Tactical cyber pathways / routes mapping */}
          <path
            d="M 100 50 Q 200 120 300 100 T 350 250"
            fill="none"
            stroke="rgba(13, 46, 39, 0.05)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path
            d="M 50 220 C 150 200 250 280 350 210"
            fill="none"
            stroke="rgba(13, 46, 39, 0.05)"
            strokeWidth="1.2"
          />

          {/* Connection vectors between active pins */}
          {hospitals.slice(0, -1).map((h, idx) => {
            const start = getProjectedCoords(h.lat, h.lng);
            const nextCoords = getProjectedCoords(hospitals[idx + 1].lat, hospitals[idx + 1].lng);
            return (
              <line
                key={`line-${idx}`}
                x1={start.x}
                y1={start.y}
                x2={nextCoords.x}
                y2={nextCoords.y}
                stroke="rgba(13, 46, 39, 0.12)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            );
          })}
        </svg>

        {/* Ambient indicator */}
        <div className="absolute top-3 left-3 bg-white px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1.5 shadow-sm">
          <Compass className="w-3.5 h-3.5 text-brand-green animate-spin-slow" />
          <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-brand-green/90">
            {city.split(",")[0] || "Regional Map"} INSIGHTS
          </span>
        </div>
      </div>

      {/* SVG Container for the Pins */}
      <div className="relative flex-1 z-10">
        {hospitals.map((h) => {
          const coords = getProjectedCoords(h.lat, h.lng);
          const isSelected = selectedHospital?.name === h.name;
          const isHovered = hoveredId === h.name;

          return (
            <div
              key={h.name}
              className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
              onClick={() => onSelectHospital(h)}
              onMouseEnter={() => setHoveredId(h.name)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Outer pulsing ring for selected/hovered state */}
              {(isSelected || isHovered) && (
                <span className="absolute -inset-4 rounded-full bg-brand-green/15 animate-ping opacity-60" />
              )}

              {/* Pin representation */}
              <div
                className={`p-1.5 rounded-full transition-all duration-200 shadow-md ${
                  isSelected
                    ? "bg-brand-green text-white scale-125 border-2 border-white"
                    : "bg-white text-brand-green border border-brand-green/30 hover:bg-brand-green hover:text-white hover:scale-110"
                }`}
              >
                <MapPin className="w-4 h-4" />
              </div>

              {/* Floating label above the pin on hover or active selection */}
              {(isHovered || isSelected) && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white/95 text-slate-800 border border-slate-200 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold tracking-wide whitespace-nowrap shadow-md z-50 pointer-events-none flex flex-col gap-0.5">
                  <span className="text-brand-green font-extrabold">{h.name.split(" Hospital")[0]}</span>
                  <span className="text-brand-saffron-dark font-bold font-mono">{h.estimatedCost}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Control panel at the bottom of the map card */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-2">
        <div className="relative">
          <select
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-brand-green font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-green tracking-wide appearance-none cursor-pointer shadow-sm"
            value={selectedHospital?.name || ""}
            onChange={(e) => {
              const matched = hospitals.find((h) => h.name === e.target.value);
              if (matched) onSelectHospital(matched);
            }}
          >
            <option value="" disabled className="text-slate-400">
              Navigate to Hospital...
            </option>
            {hospitals.map((h) => (
              <option key={h.name} value={h.name}>
                {h.name} ({h.estimatedCost.split(" - ")[0]})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-brand-green">
            <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        <button
          onClick={handleOpenGoogleMaps}
          type="button"
          className="bg-brand-green hover:bg-brand-green-light active:scale-[0.98] transition-all text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 outline-none cursor-pointer shadow-sm"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
