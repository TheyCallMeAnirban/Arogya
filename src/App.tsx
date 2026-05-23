import React, { useState, useEffect } from "react";
import {
  Search,
  Stethoscope,
  Heart,
  User,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  BrainCircuit,
  MapPin,
  CalendarCheck,
  Activity,
  Award,
  Sparkles,
  Layers,
  Flame,
  HelpCircle
} from "lucide-react";
import { Hospital, ClinicalAnalysis, SearchResult } from "./types";
import { SYMPTOM_PRESETS, CITIES_LIST, SymptomPreset } from "./data";
import MedicalMap from "./components/MedicalMap";
import AIAdvisor from "./components/AIAdvisor";
import FacilityCard from "./components/FacilityCard";
import BookingModal from "./components/BookingModal";

export default function App() {
  // Input form state fields
  const [symptoms, setSymptoms] = useState(
    "Chest pain and mild breathlessness while climbing stairs, radiating to shoulder."
  );
  const [city, setCity] = useState("Mumbai, Maharashtra");
  const [age, setAge] = useState<number | "">(52);
  const [budget, setBudget] = useState("₹2,00,000");
  const [comorbidities, setComorbidities] = useState("Hypertension");

  // App logical flow state fields
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [selectedHospitalForMap, setSelectedHospitalForMap] = useState<Hospital | null>(null);
  const [hospitalForBooking, setHospitalForBooking] = useState<Hospital | null>(null);
  const [errorText, setErrorText] = useState("");

  // Auto trigger an initial high-fidelity clinical search on load for premier UX matching visual mockup
  useEffect(() => {
    executeClinicalSearch(true);
  }, []);

  const executeClinicalSearch = async (isInitial = false) => {
    setIsLoading(true);
    setErrorText("");
    setSearchResult(null);

    try {
      const response = await fetch("/api/find-care", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: symptoms || "General medical consultation",
          city: city || "Mumbai",
          age: age || 40,
          budget: budget || "₹2,00,000",
          comorbidities: comorbidities || "None"
        })
      });

      if (!response.ok) {
        throw new Error("Hospital search service is currently calibrating. Please verify clinical connection.");
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setSearchResult(resJson.data);
        if (resJson.data.hospitals && resJson.data.hospitals.length > 0) {
          setSelectedHospitalForMap(resJson.data.hospitals[0]);
        }
      } else {
        throw new Error("Invalid format returned by server.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Unable to retrieve clinical recommendations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (preset: SymptomPreset) => {
    setSymptoms(preset.symptoms);
    setCity(preset.city);
    setAge(preset.age);
    setBudget(preset.budget);
    setComorbidities(preset.comorbidities);
  };

  return (
    <div className="relative min-h-screen bg-[#FDFDFB] text-[#0D2E27] overflow-x-hidden pb-12 flex flex-col">
      {/* Visual lighting blobs in background */}
      <div className="mesh-blooms" />

      {/* Modern High-contrast Header Navigation Menu */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-250/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-green/10 flex items-center justify-center border-2 border-brand-green text-brand-green shadow-sm">
              <Stethoscope className="w-4.5 h-4.5" />
            </div>
            <span className="text-lg font-black tracking-tight text-brand-green flex items-center gap-1.5 font-sans">
              Arogya <span className="text-xs px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/30 font-bold uppercase font-sans">AI Navigator</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
            <a
              href="#"
              className="text-brand-green font-extrabold border-b-2 border-brand-green py-5 transition-colors duration-200 tracking-wide"
            >
              Search Dashboard
            </a>
            <a
              href="#insights"
              className="text-slate-600 hover:text-brand-green py-5 transition-colors duration-200 tracking-wide font-bold"
            >
              Pathways Insights
            </a>
            <a
              href="#hospitals"
              className="text-slate-600 hover:text-brand-green py-5 transition-colors duration-200 tracking-wide font-bold"
            >
              Approved Hospitals
            </a>
            <a
              href="#pricing"
              className="text-slate-600 hover:text-brand-green py-5 transition-colors duration-200 tracking-wide font-bold"
            >
              Value Plans Overview
            </a>
          </nav>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-brand-green font-mono tracking-wider bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 rounded-xl uppercase">
              Arogya 2026
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-12">
        
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/30 text-xs font-bold text-brand-green mb-2 shadow-sm animate-pulse">
            <BrainCircuit className="w-3.5 h-3.5 text-brand-green" />
            <span>Advanced Clinical Navigation for India</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-brand-green leading-[1.12]">
            Find the Right Care. <br />
            <span className="text-brand-saffron-dark underline decoration-brand-saffron decoration-4">Know the Real Cost.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-700 font-semibold leading-relaxed max-w-xl mx-auto">
            AI-powered hospital finder for India — symptoms to care pathways mapped dynamically in seconds.
          </p>
        </section>

        {/* Quick Symptom Trial presets */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-550 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4 text-brand-green" /> Quick Assist & Clinical Presets
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SYMPTOM_PRESETS.map((p) => {
              // Color tags based on specialty/department prefix
              let badgeColor = "bg-brand-green/10 border-brand-green/30 text-brand-green";
              let hoverColor = "hover:border-brand-green/50";
              if (p.label.startsWith("Cardio")) {
                badgeColor = "bg-orange-500/10 border-orange-500/20 text-orange-700";
                hoverColor = "hover:border-orange-500/50 hover:bg-orange-50/20";
              } else if (p.label.startsWith("Ortho")) {
                badgeColor = "bg-blue-500/10 border-blue-500/20 text-blue-700";
                hoverColor = "hover:border-blue-500/50 hover:bg-blue-50/20";
              } else if (p.label.startsWith("Gastro")) {
                badgeColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-700";
                hoverColor = "hover:border-emerald-500/50 hover:bg-emerald-50/20";
              } else if (p.label.startsWith("Vascular")) {
                badgeColor = "bg-purple-500/10 border-purple-500/20 text-purple-700";
                hoverColor = "hover:border-purple-500/50 hover:bg-purple-50/20";
              }

              return (
                <button
                  key={p.label}
                  onClick={() => handleApplyPreset(p)}
                  type="button"
                  className={`glass-panel p-4.5 text-left rounded-2xl transition-all hover:scale-[1.01] ${hoverColor} cursor-pointer block border border-slate-200/90 shadow-sm`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                      {p.label.split(":")[0]}
                    </span>
                    <Activity className="w-3.5 h-3.5 text-brand-green/80" />
                  </div>
                  <h5 className="font-extrabold text-[12px] text-[#0D2E27] tracking-tight mt-2.5 leading-snug">
                    {p.label.split(": ")[1]}
                  </h5>
                  <p className="text-slate-600 font-semibold text-[10px] line-clamp-2 mt-1.5 leading-relaxed">
                    {p.symptoms}
                  </p>
                  <div className="flex items-center justify-between text-[8px] font-mono font-bold text-slate-500 border-t border-slate-100 pt-2 mt-3 uppercase tracking-wider">
                    <span>{p.city.split(",")[0]}</span>
                    <span>Age {p.age}</span>
                    <span className="text-brand-green">{p.budget}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search Intake Panel Form */}
        <section className="glass-panel rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-md relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full" />
          
          <div className="space-y-6">
            <div className="border-b border-slate-150 pb-4">
              <h3 className="text-sm font-extrabold text-brand-green tracking-tight uppercase">
                1. Clinical Profiling & Symptoms
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                Describe patient symptoms and conditions for AI clinical mapping.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Symptoms Input */}
              <div className="space-y-2 lg:col-span-2">
                <label className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
                  Patient Symptoms or Clinical Signs
                </label>
                <div className="flex bg-slate-50/70 border border-slate-200/80 focus-within:border-brand-green focus-within:bg-white rounded-xl px-3.5 py-3 transition-all h-[48px] items-center shadow-inner">
                  <Stethoscope className="w-4 h-4 text-brand-green shrink-0 mr-2.5" />
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe what the patient is feeling (e.g. Chest pain climbing stairs)"
                    className="bg-transparent border-none text-brand-green font-bold text-xs w-full focus:outline-none focus:ring-0 p-0"
                  />
                </div>
              </div>

              {/* Age Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
                  Patient Age (Years)
                </label>
                <div className="flex bg-slate-50/70 border border-slate-200/80 focus-within:border-brand-green focus-within:bg-white rounded-xl px-3.5 py-3 transition-all h-[48px] items-center shadow-inner">
                  <User className="w-4 h-4 text-brand-green shrink-0 mr-2" />
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 52"
                    className="bg-transparent border-none text-brand-green font-bold text-xs w-full focus:outline-none focus:ring-0 p-0"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-slate-150 pt-2 pb-4">
              <h3 className="text-sm font-extrabold text-brand-green tracking-tight uppercase">
                2. Parameters, Budget & Constraints
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                Set location, financial range, and chronic physiological conditions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* City Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
                  City / Care Region
                </label>
                <div className="relative h-[48px]">
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200/80 text-brand-green font-bold rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-brand-green focus:bg-white cursor-pointer h-[48px] appearance-none"
                  >
                    {CITIES_LIST.map((c) => (
                      <option key={c} value={c} className="bg-white text-brand-green">
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-brand-green">
                    <MapPin className="w-4 h-4 text-brand-green" />
                  </div>
                </div>
              </div>

              {/* Target Budget */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
                  Target Budget (INR)
                </label>
                <div className="flex bg-slate-50/70 border border-slate-200/80 focus-within:border-brand-green focus-within:bg-white rounded-xl px-3.5 py-3 transition-all h-[48px] items-center shadow-inner">
                  <IndianRupee className="w-4 h-4 text-brand-green shrink-0 mr-1.5" />
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. ₹2,00,000"
                    className="bg-transparent border-none text-brand-green font-bold text-xs w-full focus:outline-none focus:ring-0 p-0"
                  />
                </div>
              </div>

              {/* Comorbidities */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
                  Comorbidities / Medical History
                </label>
                <div className="flex bg-slate-50/70 border border-slate-200/80 focus-within:border-brand-green focus-within:bg-white rounded-xl px-3.5 py-3 transition-all h-[48px] items-center shadow-inner">
                  <ShieldCheck className="w-4 h-4 text-brand-green mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={comorbidities}
                    onChange={(e) => setComorbidities(e.target.value)}
                    placeholder="Hypertension, Diabetes, or None"
                    className="bg-transparent border-none text-brand-green font-bold text-xs w-full focus:outline-none focus:ring-0 p-0"
                  />
                </div>
              </div>

            </div>

          </div>

          <div className="mt-8 pt-2">
            <button
              onClick={() => executeClinicalSearch(false)}
              disabled={isLoading}
              className="w-full bg-brand-green hover:bg-brand-green-light active:scale-[0.99] hover:shadow-md text-white font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer outline-none border-none uppercase tracking-wider"
            >
              <Search className="w-4.5 h-4.5" />
              <span>{isLoading ? "Querying Clinical Database..." : "Find My Care →"}</span>
            </button>
          </div>
        </section>

        {/* Global Loading screen */}
        {isLoading && (
          <div className="glass-panel p-8 rounded-2xl border border-slate-200/80 shadow-md max-w-xl mx-auto flex flex-col items-center justify-center py-12 space-y-6 fade-in">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-slate-200 border-t-brand-green rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <BrainCircuit className="w-5 h-5 text-brand-green" />
              </div>
            </div>
            
            <div className="text-center space-y-3 w-full">
              <p className="text-xs text-brand-green font-mono uppercase tracking-widest font-black">
                Arogya AI Clinical Analyzer
              </p>
              <div className="space-y-2 text-left max-w-xs mx-auto bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 font-mono text-[9px] text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-ping" />
                  <span>Mapping symptoms to conditions...</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>Computing package cost ranges...</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>Ranking regional accredited facilities...</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-bold italic animate-pulse">
                Analyzing clinical dataset...
              </p>
            </div>
          </div>
        )}

        {/* Display Error Warning */}
        {errorText && !isLoading && (
          <div className="glass-panel p-4 rounded-xl border-orange-500/30 bg-orange-50 flex items-center gap-3 text-orange-800 text-xs max-w-2xl mx-auto">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-orange-600" />
            <div>
              <span className="font-extrabold uppercase tracking-wider block text-[10px]">Service Calibration Warning</span>
              {errorText}
            </div>
          </div>
        )}

        {/* Dynamic Mapping Results section */}
        {searchResult && !isLoading && (
          <div className="space-y-8 fade-in">
            
            {/* Split layout: Clinical analysis & interactive vector Map */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Clinical Analysis metrics card */}
              <div className="flex-1 space-y-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg md:text-xl font-black text-brand-green tracking-tight flex items-center gap-2">
                      Clinical Mapping Outcomes
                    </h2>
                    <span className="px-2.5 py-1 bg-brand-green/10 border border-brand-green/35 text-brand-green text-[10px] font-bold rounded-full pulse-badge uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      Match Confidence: {searchResult.clinicalAnalysis.confidence}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans font-semibold">
                    Analysis based on symptoms intake, configured comorbidities profiles, and age thresholds. Refer to advisor chat for full diagnostic questions.
                  </p>
                </div>

                {/* 3 Categories block */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glass-panel p-4.5 rounded-xl border border-slate-200 flex flex-col justify-between h-[105px] shadow-sm bg-white">
                    <span className="text-[9px] uppercase tracking-wider text-slate-550 font-bold">Matched Condition</span>
                    <p className="text-sm font-black text-brand-green tracking-tight line-clamp-2 leading-snug">
                      {searchResult.clinicalAnalysis.condition}
                    </p>
                  </div>

                  <div className="glass-panel p-4.5 rounded-xl border border-slate-200 flex flex-col justify-between h-[105px] shadow-sm bg-white">
                    <span className="text-[9px] uppercase tracking-wider text-slate-550 font-bold">Standard Intervention</span>
                    <p className="text-sm font-black text-[#0D2E27] tracking-tight line-clamp-2 leading-snug">
                      {searchResult.clinicalAnalysis.procedure}
                    </p>
                  </div>

                  <div className="glass-panel p-4.5 rounded-xl border border-slate-200 flex flex-col justify-between h-[105px] shadow-sm bg-white">
                    <span className="text-[9px] uppercase tracking-wider text-slate-550 font-bold">Clinic Department</span>
                    <p className="text-sm font-extrabold text-brand-green tracking-tight line-clamp-2 leading-snug uppercase">
                      {searchResult.clinicalAnalysis.speciality}
                    </p>
                  </div>
                </div>

                {/* Tests suggestions chip row */}
                <div className="space-y-2.5 pt-2">
                  <p className="text-[9px] uppercase tracking-widest text-slate-505 font-bold">
                    Primary Diagnostic Profile Recommended
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchResult.clinicalAnalysis.requiredTests.map((t) => (
                      <span
                        key={t}
                        className="px-3.5 py-1.5 bg-brand-green/10 border border-brand-green/20 text-brand-green rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tactical digital Map */}
              <div className="w-full lg:w-[350px] shrink-0">
                <MedicalMap
                  hospitals={searchResult.hospitals}
                  selectedHospital={selectedHospitalForMap}
                  onSelectHospital={(h) => setSelectedHospitalForMap(h)}
                  city={city}
                />
              </div>

            </div>

            {/* Recommended facilities grid list */}
            <div className="space-y-5 border-t border-slate-200 pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base md:text-lg font-black tracking-tight text-brand-green flex items-center gap-1.5 font-sans">
                    Recommended Accredited Facilities in <span className="text-brand-saffron-dark">{city.split(",")[0]}</span>
                  </h3>
                  <p className="text-[11px] text-slate-550 font-semibold mt-0.5">
                    Hospitals matching standard clinical efficacy scores, pricing transparency guidelines, and specialties audits.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {searchResult.hospitals.map((h) => (
                  <FacilityCard
                    key={h.name}
                    hospital={h}
                    isSelectedInMap={selectedHospitalForMap?.name === h.name}
                    onSelect={(target) => setHospitalForBooking(target)}
                  />
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Floating AI Companion Consult Panel */}
      <AIAdvisor />

      {/* Booking popup scheduler */}
      {hospitalForBooking && (
        <BookingModal
          hospital={hospitalForBooking}
          onClose={() => setHospitalForBooking(null)}
        />
      )}

      {/* Footer credits and system metadata disclaimer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50/90">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-green/15 flex items-center justify-center text-brand-green text-xs font-bold font-mono">
              A
            </div>
            <span className="text-sm font-black text-brand-green tracking-tight">Arogya Healthcare Navigator</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600 font-bold">
            <a href="#" className="hover:text-brand-green transition-colors">Team Credentials</a>
            <a href="#" className="hover:text-brand-green transition-colors">Event Badge</a>
            <a href="#" className="hover:text-brand-green transition-colors">Privacy Principles</a>
            <a href="#" className="hover:text-brand-green transition-colors">Contact Support</a>
          </div>

          <div className="max-w-2xl text-center space-y-3">
            <p className="text-[11px] text-slate-500 italic leading-relaxed font-medium">
              ⚠️ Medical Disclaimer: All clinical matching, diagnostic schedules, and price package estimates are powered by artificial intelligence and tailored historical database parameters. These summaries are solely for decision-support and patient navigation contexts. Arogya does not formulate custom clinical diagnoses.
            </p>
            
            <div className="flex justify-center flex-wrap gap-x-5 gap-y-1.5 text-[10px] text-[#164E42] font-semibold font-mono">
              <span>Calibrated by Anshuman Kumar Singh</span>
              <span className="text-slate-350">•</span>
              <span>Anirban Goswami</span>
              <span className="text-slate-350">•</span>
              <span>Shumaque Raza</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest mt-2">
            © 2026 Arogya Systems. All rights reserved. Registered Indian Care Network.
          </p>
        </div>
      </footer>
    </div>
  );
}
