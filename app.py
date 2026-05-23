import streamlit as st
from modules.loader import load_data
from modules.mapper import map_query_to_condition
from modules.location import resolve_location
from modules.hospital_filter import filter_hospitals
from modules.cost_engine import estimate_cost
from modules.doctor_mapper import get_doctors
from modules.ranking import rank_hospitals
from modules.confidence import calculate_confidence
from modules.embedding_mapper import build_index, find_best_match
from modules.llm_explainer import stream_explanation
from modules.review_utils import get_review_score
import pandas as pd

@st.cache_data
def load_all():
    return load_data()


# Load data
hospitals, doctors, reviews, clinical, diag_cost, proc_cost, cost_config = load_data()


# 🔥 Hospital index
hospital_index = {}

for _, row in hospitals.iterrows():
    key = (row["city"], row["speciality"])
    hospital_index.setdefault(key, []).append(row)

# 🔥 Doctor index
doctor_index = {}

for _, row in doctors.iterrows():
    doctor_index.setdefault(row["hospital_id"], []).append(row)


review_index = {}

for _, row in reviews.iterrows():
    review_index.setdefault(row["hospital_id"], []).append(row)


pincode_map = dict(zip(hospitals["pincode"].astype(str), hospitals["city"]))


symptoms_list, symptom_embeddings = build_index(clinical)
st.set_page_config(page_title="AI Healthcare Navigator", layout="wide")
# UI Title
st.title("🏥 AI Healthcare Navigator & Cost Estimator")
st.caption("Find the right hospital, estimate costs, and understand treatment pathways")

# Inputs
col1, col2 = st.columns(2)
with col1:
  query = st.text_input("Enter your symptoms / condition")
with col2:
  location = st.text_input("Enter city or pincode")
age = st.number_input("Age", min_value=0, max_value=100, value=0)
comorb = st.text_input("Comorbidities (optional)")
budget = st.number_input("Budget (₹)", min_value=0, value=0)

# Button
if st.button("Search"):

    # Step 1: Mapping
    mapping, match_score = find_best_match(query, symptoms_list, symptom_embeddings, clinical)
    confidence=match_score
    if isinstance(mapping["diagnostics"], str):
       mapping["diagnostics"] = [d.strip().lower() for d in mapping["diagnostics"].split(",")]
    st.write(f"🧠 Match Confidence: {round(match_score, 2)}")
    if not mapping:
        st.error("❌ Could not understand your condition")
    else:
        st.subheader("🧠 Clinical Insight")

        col1, col2, col3 = st.columns(3)

        col1.metric("Condition", mapping["condition"])
        col2.metric("Procedure", mapping["procedure"])
        col3.metric("Speciality", mapping["speciality"])

        st.subheader("🧪 Recommended Diagnostics")
        for d in mapping["diagnostics"]:
          st.write(f"- {d}".upper())

        # Step 2: Location
        city = resolve_location(location, pincode_map)

        if not city:
            st.error("❌ Invalid location")
        else:
            st.write(f"📍 Location: {city}".upper())

            city = city.lower()
            mapping["speciality"] = mapping["speciality"].lower()

            # Step 3: Filter hospitals
            filtered = hospital_index.get((city, mapping["speciality"]), [])
            filtered = pd.DataFrame(filtered)

            if filtered.empty:
                st.warning("No hospitals found")
            else:
                # Step 4: Ranking
                ranked = rank_hospitals(filtered, budget, review_index)
                ranked = ranked.head(5)
                hospital_options = {
                  row["hospital_name"]: (row["latitude"], row["longitude"])
                  for _, row in ranked.iterrows()
                }

                st.subheader("🧭 Choose Hospital for Navigation")


                selected_hospital = st.selectbox(
                "Select a hospital",
                list(hospital_options.keys())
                 )

                if selected_hospital:
                  latitude, longitude = hospital_options[selected_hospital]

                  maps_url = f"https://www.google.com/maps/dir/?api=1&destination={latitude},{longitude}"

                  st.markdown(
                  f"""
                    <a href="{maps_url}" target="_blank">
                     <button style="
                background-color:#4CAF50;
                color:white;
                padding:10px 20px;
                border:none;
                border-radius:8px;
                cursor:pointer;
                font-size:16px;">
                🚗 Navigate to Hospital
            </button>
        </a>
        """,
        unsafe_allow_html=True
    )
                st.info("Select a hospital and click navigate to open directions in Google Maps")
                st.subheader("🏥 Recommended Hospitals")

                st.subheader("🗺️ Hospital Locations")

                map_data = ranked[["latitude", "longitude"]]

                st.map(map_data)

                for i, (_, row) in enumerate(ranked.iterrows()):
                    docs = doctor_index.get(row["hospital_id"], [])
                    docs = pd.DataFrame(docs)
                    doctor_exp = docs["experience_years"].max() if not docs.empty else 0
                    cost = estimate_cost(
                        mapping,
                        diag_cost,
                        proc_cost,
                        cost_config,
                        row["type"],
                        age,
                        comorb,
                        docs=docs
                    )

                    with st.container():
                        st.markdown(f"### 🏥 {row['hospital_name']}")

                        col1, col2, col3 = st.columns(3)

                        col1.metric("⭐ Rating", row["rating"])
                        col2.metric("💰 Cost Range", f"₹{int(cost['total'][0])} - ₹{int(cost['total'][1])}")
                        col3.metric("📊 Confidence", round(confidence, 2))

                        st.write(f"📍 City: {row['city'].title()} | 🏷 Type: {row['type']}")

                        if row.get("nabh_accredited", False):
                          st.success("✅ NABH Accredited")

                        st.divider()

                        st.write("👨‍⚕️ Top Doctors:")

                        for _, d in docs.head(3).iterrows():
                         st.write(f"- **{d['doctor_name']}** ({d['experience_years']} yrs exp)")

                        with st.expander("💰 Cost Breakdown"):
                          for k, v in cost["breakdown"].items():
                            st.write(f"**{k.capitalize()}**: ₹{v}")

                        review_score = get_review_score(row["hospital_id"], review_index)

                        st.progress(min(review_score / 5, 1.0))
                        st.caption(f"🗣 Review Score: {round(review_score,2)} / 5")

                        # Explanation
                        if i < 3:
                            st.write("💡 Why recommended:")

                            placeholder = st.empty()
                            full_text = ""

                            try:
                              for chunk in stream_explanation(
                                  mapping,row,cost,budget,doctor_exp,comorb,confidence
                                  ):
                                  full_text += chunk
                                  placeholder.markdown(full_text)

                            except Exception as e:
                                 placeholder.markdown(
                                 "This hospital is a good match based on specialization and rating."
                                )

                        else:
                           st.write(
                          f"✔ Suitable for {mapping['condition']} • "
                          f"Rating: {row['rating']} ⭐ • "
                           f"Affordable category: {row['type']}"
                             )
        # Disclaimer
        st.warning("⚠️ This is a decision-support tool. Not a medical diagnosis.")