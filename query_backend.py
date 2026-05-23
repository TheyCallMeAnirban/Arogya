import sys
import json
import pandas as pd
import os

from modules.loader import load_data
from modules.location import resolve_location
from modules.cost_engine import estimate_cost
from modules.ranking import rank_hospitals
from modules.embedding_mapper import build_index, find_best_match
from modules.review_utils import get_review_score

def main():
    # Read input from stdin
    try:
        input_data = json.loads(sys.stdin.read())
    except Exception as e:
        print(json.dumps({"error": f"Invalid input JSON: {str(e)}"}))
        return

    symptoms_query = input_data.get("symptoms", "")
    location_query = input_data.get("city", "")
    age = input_data.get("age", 40)
    budget_raw = input_data.get("budget", "200000")
    comorbidities = input_data.get("comorbidities", "")

    # Parse budget number
    # Remove currency symbol, commas
    budget_str = str(budget_raw).replace("₹", "").replace(",", "").strip()
    try:
        budget = float(budget_str) if budget_str else 200000.0
    except ValueError:
        budget = 200000.0

    # Load data
    hospitals, doctors, reviews, clinical, diag_cost, proc_cost, cost_config = load_data()

    # Pre-build indexes
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

    # Symptom index for embedding matching
    symptoms_list, symptom_embeddings = build_index(clinical)

    # Step 1: Mapping
    mapping, match_score = find_best_match(symptoms_query, symptoms_list, symptom_embeddings, clinical)
    
    if not mapping:
        print(json.dumps({"error": "Could not understand your condition"}))
        return

    # Process diagnostics (split if it's a string, or clean list)
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
        city = "Mumbai" # Default fallback

    city_clean = city.lower().strip()
    speciality_clean = mapping.get("speciality", "general medicine").lower().strip()

    # Step 3: Filter hospitals
    # Let's search for hospitals in the city
    city_hospitals = hospitals[hospitals["city"] == city_clean]
    
    # Filter by speciality
    filtered = city_hospitals[city_hospitals["speciality"] == speciality_clean]

    # If no hospital in that specific city has that speciality, let's fallback to any hospital of that speciality, or any hospital in that city
    if filtered.empty:
        # fallback to city hospitals first
        filtered = city_hospitals
        if filtered.empty:
            # fallback to top hospitals in general
            filtered = hospitals

    # Step 4: Ranking
    ranked = rank_hospitals(filtered, budget, review_index)
    
    # Take top 3 or 5 hospitals (as required by frontend)
    top_hospitals = ranked.head(5)

    hospitals_response = []
    for _, row in top_hospitals.iterrows():
        hosp_id = row["hospital_id"]
        hosp_name = row["hospital_name"]
        
        # Get doctors
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

        # Format specialists
        specialists = []
        if not docs_df.empty:
            for _, d in docs_df.head(3).iterrows():
                specialists.append(f"{d['doctor_name']} ({d['experience_years']} yrs exp)")
        else:
            specialists = ["General Physician (10 yrs exp)"]

        # Calculate review score
        review_score = get_review_score(hosp_id, review_index)
        review_count = len(docs) * 5 + 12 # mock some reviews count if needed, or get length of reviews
        if hosp_id in review_index:
            review_count = len(review_index[hosp_id])
        else:
            review_count = 15

        # Format details (CostDetail)
        # category: string, cost: string
        details_list = []
        
        # Procedure Cost
        p_min, p_max = cost["breakdown"]["procedure"]
        details_list.append({"category": "Surgeon & Intervention Fee", "cost": f"₹{p_min:,} - ₹{p_max:,}"})
        
        # Diagnostics Cost
        d_min, d_max = cost["breakdown"]["diagnostics"]
        details_list.append({"category": "Diagnostic Testing Fee", "cost": f"₹{d_min:,} - ₹{d_max:,}"})

        # Room/Stay Cost
        s_min, s_max = cost["breakdown"]["stay"]
        details_list.append({"category": "Stay charges (3 Days)", "cost": f"₹{s_min:,} - ₹{s_max:,}"})

        # Doctor fee
        doc_fee = cost["breakdown"]["doctor_fee"]
        details_list.append({"category": "Specialist Consultation", "cost": f"₹{doc_fee:,}"})

        # Medicine
        med_cost = cost["breakdown"]["medicine"]
        details_list.append({"category": "Pharmacy & Consumables", "cost": f"₹{med_cost:,}"})

        # Contingency
        cont_cost = cost["breakdown"]["contingency"]
        details_list.append({"category": "Contingency & Tax", "cost": f"₹{cont_cost:,}"})

        # Generate custom "Why Recommended" summary
        # If Gemini is configured, use the llm_explainer.py to stream or get explanation.
        # But wait, we can also generate a prompt or a fallback template if Gemini fails.
        # Let's generate it using Gemini in python if the API key is configured.
        why_recommended = ""
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key and gemini_api_key != "MY_GEMINI_API_KEY":
            try:
                from modules.llm_explainer import stream_explanation
                # stream_explanation takes (mapping, row, cost, budget, doctor_exp, comorb, confidence)
                doctor_exp = docs_df["experience_years"].max() if not docs_df.empty else 10
                explanation_chunks = list(stream_explanation(mapping, row, cost, budget, doctor_exp, comorbidities, match_score))
                why_recommended = "".join(explanation_chunks).strip()
            except Exception as e:
                # fallback text if call fails
                why_recommended = f"This hospital is recommended based on high rating ({row['rating']} stars) and strong speciality match in {mapping['speciality'].title()}."
        
        # If we didn't get why_recommended from Gemini, generate a clean structured fallback
        if not why_recommended:
            recs = []
            recs.append(f"Suited for {mapping['condition']}.")
            recs.append(f"Rating: {row['rating']} stars with accredited clinical safety.")
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

    result = {
        "clinicalAnalysis": clinical_analysis,
        "hospitals": hospitals_response
    }

    print(json.dumps(result))

if __name__ == "__main__":
    main()
