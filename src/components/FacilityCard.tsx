import React, { useState } from "react";
import { Star, ShieldAlert, Award, FileText, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Hospital } from "../types";

interface FacilityCardProps {
  key?: string;
  hospital: Hospital;
  onSelect: (hospital: Hospital) => void;
  isSelectedInMap?: boolean;
}

export default function FacilityCard({ hospital, onSelect, isSelectedInMap = false }: FacilityCardProps) {
  const [showCostsBreakdown, setShowCostsBreakdown] = useState(false);

  // Render Star System based on ratings (e.g. 4.8 out of 5)
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-3.5 h-3.5 fill-brand-saffron text-brand-saffron" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        // Half filled / simple customized saffron visual
        stars.push(
          <div key={i} className="relative inline-block w-3.5 h-3.5">
            <Star className="absolute w-3.5 h-3.5 text-slate-700" />
            <div className="absolute overflow-hidden w-1/2">
              <Star className="w-3.5 h-3.5 fill-brand-saffron text-brand-saffron" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="w-3.5 h-3.5 text-slate-700" />);
      }
    }
    return stars;
  };

  // Convert raw value percentages for clinical efficacy score displays
  const scorePercent = hospital.rating >= 4.8 ? 96 : hospital.rating >= 4.6 ? 88 : 82;

  return (
    <div
      className={`glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-6 transition-all duration-300 relative group ${
        isSelectedInMap
          ? "border-brand-green bg-gradient-to-r from-brand-green/5 to-transparent"
          : "hover:border-brand-green/35"
      }`}
    >
      {/* Visual Badge Indicator for maps alignment selection */}
      {isSelectedInMap && (
        <span className="absolute -top-2.5 left-6 bg-brand-green text-brand-dark font-mono text-[9px] tracking-wider uppercase px-2.5 py-0.5 rounded-full font-bold border border-white">
          Focused Location Marker
        </span>
      )}

      {/* Specialty, Name and Basic Info Panel */}
      <div className="md:col-span-4 space-y-3.5 flex flex-col justify-between">
        <div>
          <h4 className="text-sm md:text-base font-extrabold text-brand-green tracking-tight leading-snug group-hover:text-brand-saffron-dark transition-colors duration-200">
            {hospital.name}
          </h4>
          <p className="text-[10px] text-slate-500 font-semibold font-mono mt-1 flex items-center gap-1">
            <span>{hospital.locationDesc}</span>
          </p>
        </div>

        {/* Accreditation and Complexity Type Tags */}
        <div className="flex flex-wrap gap-2 pt-1.5">
          <span className="bg-brand-green/10 text-brand-green border border-brand-green/35 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide">
            <Award className="w-3 h-3 text-brand-green" /> {hospital.accreditation || "NABH Accredited"}
          </span>
          <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
            {hospital.type}
          </span>
        </div>

        {/* Patient Reviews Roster */}
        <div className="flex items-center gap-2 pt-1 transition-all">
          <span className="text-brand-saffron-dark font-extrabold text-sm font-mono">{hospital.rating}</span>
          <div className="flex gap-0.5 items-center">{renderStars(hospital.rating)}</div>
          <span className="text-slate-500 text-[10px] font-bold tracking-wide">
            ({hospital.reviews.toLocaleString()} reviews)
          </span>
        </div>
      </div>

      {/* Cost Range Breakdown Container */}
      <div className="md:col-span-4 space-y-4 border-t md:border-t-0 md:border-x border-slate-200/60 pt-4 md:pt-0 md:px-5">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            Estimated Package Cost Range
          </p>
          <p className="text-lg md:text-xl font-black text-brand-green font-mono mt-1 tracking-tight text-glow-green">
            {hospital.estimatedCost}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Top Specialists Matched</p>
          <div className="flex flex-wrap gap-1.5">
            {hospital.specialists.map((spec) => (
              <span
                key={spec}
                className="text-[10px] font-bold text-brand-saffron-dark bg-brand-saffron/10 border border-brand-saffron/30 px-2 py-0.5 rounded"
              >
                {spec.split(" (")[0]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* "Why Recommended" and Call to Action Drawer */}
      <div className="md:col-span-4 space-y-4 pt-4 md:pt-0 flex flex-col justify-between">
        <div className="bg-brand-green/5 p-3 rounded-xl border border-brand-green/10 space-y-1">
          <p className="text-[9px] text-brand-green font-black tracking-widest uppercase flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-brand-green stroke-[3px]" /> Why Recommended
          </p>
          <p className="text-xs italic text-brand-green/95 leading-relaxed font-sans font-light">
            "{hospital.whyRecommended}"
          </p>
        </div>

        {/* Dynamic Quality Performance Scale block */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] tracking-wider uppercase text-slate-500 font-mono font-bold">
            <span>Specialty Quality Score:</span>
            <span className="text-brand-green font-bold">{scorePercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-green rounded-full transition-all duration-1000"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        {/* Collapsible cost detailed items */}
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <button
              onClick={() => setShowCostsBreakdown(!showCostsBreakdown)}
              type="button"
              className="text-brand-green/90 hover:text-brand-green font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer outline-none border-none py-1 block w-full text-left"
            >
              <span>{showCostsBreakdown ? "Hide Detailed Costs" : "Details & Cost Items"}</span>
              {showCostsBreakdown ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
            </button>

            {/* Simulated spring expansion list for high precision details */}
            {showCostsBreakdown && (
              <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2 font-mono fade-in">
                {hospital.details.map((item, id) => (
                  <div key={id} className="flex justify-between items-center border-b border-slate-100 last:border-b-0 pb-1.5 last:pb-0">
                    <span className="font-sans text-slate-600 font-medium">{item.category}</span>
                    <span className="text-brand-green font-extrabold">{item.cost}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onSelect(hospital)}
            type="button"
            className="w-full bg-brand-saffron hover:bg-brand-saffron/90 text-brand-green hover:scale-[1.01] active:scale-[0.98] transition-all font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider block text-center cursor-pointer shadow-sm"
          >
            Select Hospital
          </button>
        </div>
      </div>
    </div>
  );
}
