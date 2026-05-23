/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ClinicalAnalysis {
  condition: string;
  procedure: string;
  speciality: string;
  confidence: number;
  requiredTests: string[];
}

export interface CostDetail {
  category: string;
  cost: string;
}

export interface Hospital {
  name: string;
  accreditation: string;
  type: string;
  rating: number;
  reviews: number;
  minVal: number;
  maxVal: number;
  specialists: string[];
  whyRecommended: string;
  locationDesc: string;
  lat: number;
  lng: number;
  details: CostDetail[];
  estimatedCost: string;
}

export interface SearchResult {
  clinicalAnalysis: ClinicalAnalysis;
  hospitals: Hospital[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}
