/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SymptomPreset {
  label: string;
  symptoms: string;
  city: string;
  age: number;
  budget: string;
  comorbidities: string;
  condition: string;
}

export const SYMPTOM_PRESETS: SymptomPreset[] = [
  {
    label: "Cardio: Stairs Chest Pain",
    symptoms: "Chest pain and mild breathlessness while climbing stairs, radiating to shoulder.",
    city: "Mumbai, Maharashtra",
    age: 52,
    budget: "₹2,00,000",
    comorbidities: "Hypertension",
    condition: "Coronary Artery Disease"
  },
  {
    label: "Ortho: Severe Knee Pain",
    symptoms: "Severe pain in bilateral knees, joint cracking sounds, unable to walk long distances.",
    city: "Chennai, Tamil Nadu",
    age: 64,
    budget: "₹2,50,000",
    comorbidities: "Type-2 Diabetes",
    condition: "Severe Knee Osteoarthosis"
  },
  {
    label: "Gastro: Sharp Stomach Spasms",
    symptoms: "Sharp localized pain in lower right quadrant of abdomen, occasional vomiting.",
    city: "Mumbai, Maharashtra",
    age: 28,
    budget: "₹1,20,000",
    comorbidities: "None",
    condition: "Acute Appendicitis"
  },
  {
    label: "Vascular: High BP Headaches",
    symptoms: "Throbbing temporal headaches, neck stiffness, dizziness over last 3 days.",
    city: "Delhi, NCR",
    age: 45,
    budget: "₹80,000",
    comorbidities: "Obesity",
    condition: "Primary Hypertension"
  }
];

export const CITIES_LIST = [
  "Ahmedabad",
  "Amritsar",
  "Aurangabad",
  "Bangalore",
  "Bhopal",
  "Bhubaneswar",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Dehradun",
  "Delhi",
  "Guwahati",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Jodhpur",
  "Kochi",
  "Kolkata",
  "Lucknow",
  "Mumbai",
  "Mysore",
  "Nagpur",
  "Pune",
  "Ranchi",
  "Siliguri",
  "Surat",
  "Tirupati",
  "Udaipur",
  "Varanasi",
  "Visakhapatnam"
];
