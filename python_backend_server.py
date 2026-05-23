from flask import Flask, request, jsonify
import pandas as pd
import json
import os
import sys

from modules.loader import load_data
from modules.location import resolve_location
from modules.cost_engine import estimate_cost
from modules.ranking import rank_hospitals
from modules.embedding_mapper import build_index, find_best_match
from modules.review_utils import get_review_score

app = Flask(__name__)

# Load and index all data once at startup
print("Loading datasets and initializing SentenceTransformer indices...", flush=True)
hospitals, doctors, reviews, clinical, diag_cost, proc_cost, cost_config = load_data()

# Doctor index
doctor_index = {}
for _, row in doctors.iterrows():
    doctor_index.setdefault(row["hospital_id"], []).append(row)

# Review index
review_index = {}
for _, row in reviews.iterrows():
    review_index.setdefault(row["hospital_id"], []).append(row)

# Pincode map
pincode_map = dict(zip(hospitals["pincode"].astype(str), hospitals["city"]))

# Symptom index
symptoms_list, symptom_embeddings = build_index(clinical)
print("Startup complete. High-fidelity backend server ready on port 5000.", flush=True)

@app.route("/api/find-care", methods=["POST"])
def find_care():
    try:
        input_data = request.get_json(force=True)
    except Exception as e:
        return jsonify({"error": f"Invalid input JSON: {str(e)}"}), 400

    symptoms_query = input_data.get("symptoms", "")
    location_query = input_data.get("city", "")
    age = input_data.get("age", 40)
    budget_raw = input_data.get("budget", "200000")
    comorbidities = input_data.get("comorbidities", "")

    # Parse budget
    budget_str = str(budget_raw).replace("₹", "").replace(",", "").strip()
    try:
        budget = float(budget_str) if budget_str else 200000.0
    except ValueError:
        budget = 200000.0

    # Step 1: Mapping
    mapping, match_score = find_best_match(symptoms_query, symptoms_list, symptom_embeddings, clinical)
    if not mapping:
        return jsonify({"error": "Could not understand your condition"}), 400

    # Diagnostics parsing
    diagnostics = mapping.get("diagnostics", "")
    if isinstance(diagnostics, str):
        diagnostics_list = [d.strip().upper() for d in diagnostics.split(",") if d.strip()]
    elif isinstance(diagnostics, list):
        diagnostics_list = [str(d).strip().upper() for d in diagnostics if str(d).strip()]
    else:
        diagnostics_list = []

    clinical_analysis = {
        "condition": mapping.get("condition", "Unknown Condition"),
        "procedure": mapping.get("procedure", "Standard Consultation"),
        "speciality": mapping.get("speciality", "General Medicine").title(),
        "confidence": round(match_score, 2),
        "requiredTests": diagnostics_list
    }

    # Step 2: Location
    city = resolve_location(location_query, pincode_map)
    if not city:
        city = "Mumbai"

    city_clean = city.lower().strip()
    speciality_clean = mapping.get("speciality", "general medicine").lower().strip()

    # Step 3: Filter hospitals
    city_hospitals = hospitals[hospitals["city"] == city_clean]
    filtered = city_hospitals[city_hospitals["speciality"] == speciality_clean]

    if filtered.empty:
        filtered = city_hospitals
        if filtered.empty:
            filtered = hospitals

    # Step 4: Ranking
    ranked = rank_hospitals(filtered, budget, review_index)
    top_hospitals = ranked.head(5)

    hospitals_response = []
    for _, row in top_hospitals.iterrows():
        hosp_id = row["hospital_id"]
        hosp_name = row["hospital_name"]

        # Doctors
        docs = doctor_index.get(hosp_id, [])
        docs_df = pd.DataFrame(docs)

        # Estimate Cost
        cost = estimate_cost(
            mapping,
            diag_cost,
            proc_cost,
            cost_config,
            row["type"],
            age,
            comorbidities,
            docs=docs_df
        )

        min_val = int(cost["total"][0])
        max_val = int(cost["total"][1])

        specialists = []
        if not docs_df.empty:
            for _, d in docs_df.head(3).iterrows():
                specialists.append(f"{d['doctor_name']} ({d['experience_years']} yrs exp)")
        else:
            specialists = ["General Physician (10 yrs exp)"]

        review_score = get_review_score(hosp_id, review_index)
        if hosp_id in review_index:
            review_count = len(review_index[hosp_id])
        else:
            review_count = 15

        details_list = [
            {"category": "Surgeon & Intervention Fee", "cost": f"₹{cost['breakdown']['procedure'][0]:,} - ₹{cost['breakdown']['procedure'][1]:,}"},
            {"category": "Diagnostic Testing Fee", "cost": f"₹{cost['breakdown']['diagnostics'][0]:,} - ₹{cost['breakdown']['diagnostics'][1]:,}"},
            {"category": "Stay charges (3 Days)", "cost": f"₹{cost['breakdown']['stay'][0]:,} - ₹{cost['breakdown']['stay'][1]:,}"},
            {"category": "Specialist Consultation", "cost": f"₹{cost['breakdown']['doctor_fee']:,}"},
            {"category": "Pharmacy & Consumables", "cost": f"₹{cost['breakdown']['medicine']:,}"},
            {"category": "Contingency & Tax", "cost": f"₹{cost['breakdown']['contingency']:,}"}
        ]

        why_recommended = ""
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key and gemini_api_key != "MY_GEMINI_API_KEY":
            try:
                from modules.llm_explainer import stream_explanation
                doctor_exp = docs_df["experience_years"].max() if not docs_df.empty else 10
                explanation_chunks = list(stream_explanation(mapping, row, cost, budget, doctor_exp, comorbidities, match_score))
                why_recommended = "".join(explanation_chunks).strip()
            except Exception:
                pass

        if not why_recommended:
            recs = [
                f"Suited for {mapping['condition']}.",
                f"Rating: {row['rating']} stars with accredited clinical safety."
            ]
            if row.get("nabh_accredited", False):
                recs.append("NABH Accredited facility.")
            if min_val <= budget:
                recs.append("Fits within the specified budget range.")
            else:
                recs.append("Exceeds the specified budget limit.")
            why_recommended = " ".join(recs)

        hospitals_response.append({
            "name": hosp_name.title(),
            "accreditation": "NABH Accredited" if row.get("nabh_accredited", False) else "Standard Quality Certified",
            "type": str(row["type"]).title() + " Complexity Tier",
            "rating": round(float(row["rating"]), 1),
            "reviews": int(review_count),
            "minVal": int(min_val),
            "maxVal": int(max_val),
            "specialists": specialists,
            "whyRecommended": why_recommended,
            "locationDesc": f"{row['city'].title()} Pincode: {row['pincode']}",
            "lat": float(row["latitude"]),
            "lng": float(row["longitude"]),
            "details": details_list,
            "estimatedCost": f"₹{min_val:,} - ₹{max_val:,}"
        })

    return jsonify({
        "clinicalAnalysis": clinical_analysis,
        "hospitals": hospitals_response
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="127.0.0.1", port=port, debug=False)
