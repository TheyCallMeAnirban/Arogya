import React, { useState } from "react";
import { X, Calendar, User, Phone, CheckCircle, Ticket, Printer, Clock } from "lucide-react";
import { Hospital } from "../types";

interface BookingModalProps {
  hospital: Hospital;
  onClose: () => void;
}

export default function BookingModal({ hospital, onClose }: BookingModalProps) {
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSpecialist, setSelectedSpecialist] = useState(
    hospital.specialists[0] || "General Consultant Physician"
  );
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM - 11:30 AM");
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [bookingRef, setBookingRef] = useState("");
  const [isBooked, setIsBooked] = useState(false);

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === "AROGYA2026" || code === "AROGYA10") {
      setDiscountPercent(10);
    } else {
      alert("Invalid promotional code.");
    }
  };

  // Calculations
  const averageCost = Math.round((hospital.minVal + hospital.maxVal) / 2);
  const discountAmount = Math.round(averageCost * (discountPercent / 100));
  const gstTax = Math.round((averageCost - discountAmount) * 0.05); // 5% specialized health levy
  const grandTotal = averageCost - discountAmount + gstTax;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !phoneNumber || !selectedDate) {
      alert("Please complete all patient input fields.");
      return;
    }

    // Generate random reference token
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    setBookingRef(`ARG-${randomSuffix}-B`);
    setIsBooked(true);
  };

  return (
    <div className="fixed inset-0 bg-[#0d2e27]/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-250/90 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] fade-in">
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200/80 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-brand-green font-extrabold font-mono uppercase tracking-wider block">
              Facility Booking Portal
            </span>
            <h3 className="text-base font-extrabold text-brand-green">{hospital.name}</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-500 hover:text-brand-green p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isBooked ? (
            <form onSubmit={handleBookingSubmit} className="space-y-5">
              {/* Patient details section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-brand-saffron-dark uppercase tracking-wider">
                  Patient Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 font-bold">Patient Full Name</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                      <User className="w-4 h-4 text-brand-green" />
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="John Doe"
                        className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-brand-green font-semibold w-full p-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 font-bold">Contact Number</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                      <Phone className="w-4 h-4 text-brand-green" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 9876543210"
                        className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-brand-green font-semibold w-full p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-brand-saffron-dark uppercase tracking-wider">
                  Consult & Roster Matching
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 font-bold">Target Consultant</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 text-brand-green font-semibold rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-green cursor-pointer"
                      value={selectedSpecialist}
                      onChange={(e) => setSelectedSpecialist(e.target.value)}
                    >
                      {hospital.specialists.map((s) => (
                        <option key={s} value={s} className="bg-white text-brand-green">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 font-bold">Preferred Date</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <Calendar className="w-4 h-4 text-brand-green" />
                      <input
                        type="date"
                        required
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-brand-green font-semibold w-full p-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-600 font-bold font-sans">Preferred Clinic Slot</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "09:00 AM - 10:30 AM",
                      "10:45 AM - 12:15 PM",
                      "02:00 PM - 03:30 PM",
                      "04:00 PM - 05:30 PM"
                    ].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedSlot === slot
                            ? "bg-brand-green/10 border-brand-green text-brand-green"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive voucher code section */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                    Sponsor / Voucher Code
                  </label>
                  <span className="text-[9px] text-brand-green font-bold font-mono">CODE: AROGYA2026 (10% Off)</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <Ticket className="w-4 h-4 text-brand-saffron-dark" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="ENTER PROMO"
                      className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-brand-green font-bold uppercase w-full p-0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyPromo}
                    className="bg-brand-saffron hover:bg-brand-saffron/90 text-brand-green font-extrabold px-4 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Price outline matrix */}
              <div className="bg-brand-green/5 p-4 rounded-xl border border-brand-green/10 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Base Package Care Standard:</span>
                  <span className="font-bold">₹{averageCost.toLocaleString("en-IN")}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-brand-saffron-dark font-bold font-semibold">
                    <span>Discount Reduction ({discountPercent}%):</span>
                    <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST & Medical Trust Care Levy (5%):</span>
                  <span className="font-bold">+ ₹{gstTax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-brand-green font-sans font-bold border-t border-slate-200/80 pt-2 text-sm">
                  <span className="text-[#0D2E27] font-sans font-bold">Total Estimated Package:</span>
                  <span className="text-brand-green font-extrabold font-mono">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* CTA Schedule */}
              <button
                type="submit"
                className="w-full bg-brand-green hover:bg-brand-green-light active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                Confirm Booking Appointment
              </button>
            </form>
          ) : (
            /* Success screen state */
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/30 text-brand-green animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-brand-green tracking-tight">Appointment Secured Successfully</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Your care pathway schedule is confirmed at <strong className="text-[#0D2E27] font-extrabold">{hospital.name}</strong>.
                </p>
              </div>

              {/* PDF style invoice summary */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-3.5 max-w-sm mx-auto font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Booking Ref:</span>
                  <span className="text-brand-saffron-dark font-extrabold text-[12px]">{bookingRef}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Patient:</span>
                    <span className="text-slate-700 font-bold">{patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Specialist:</span>
                    <span className="text-slate-700 font-bold text-right max-w-[200px] truncate">{selectedSpecialist}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Date:</span>
                    <span className="text-slate-700 font-bold">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Time Slot:</span>
                    <span className="text-slate-700 font-bold">{selectedSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Consult Room:</span>
                    <span className="text-brand-green font-extrabold">CATH-OPD Block 12A</span>
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-sans font-bold text-[12px]">
                  <span className="text-slate-600 font-extrabold font-sans">Net Hospital Payable:</span>
                  <span className="text-brand-green font-extrabold font-mono">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-center max-w-sm mx-auto pt-4">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Details</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-brand-saffron hover:bg-brand-saffron/90 text-brand-green font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center cursor-pointer shadow-sm"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
