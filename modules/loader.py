import os
import pandas as pd
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

def load_data():
    hospitals = pd.read_csv(os.path.join(DATA_DIR, "hospitals.csv"))
    doctors = pd.read_csv(os.path.join(DATA_DIR, "doctors.csv"))
    reviews = pd.read_csv(os.path.join(DATA_DIR, "reviews.csv"))
    clinical = pd.read_csv(os.path.join(DATA_DIR, "clinical_mapping.csv"))
    clinical.columns = clinical.columns.str.lower().str.strip()
    clinical["symptom"] = clinical["symptom"].str.lower().str.strip()
    clinical["speciality"] = clinical["speciality"].str.lower().str.strip()
    hospitals.columns = hospitals.columns.str.lower().str.strip()
    doctors.columns = doctors.columns.str.lower().str.strip()

    hospitals["city"] = hospitals["city"].str.lower().str.strip()
    hospitals["speciality"] = hospitals["speciality"].str.lower().str.strip()

    doctors["speciality"] = doctors["speciality"].str.lower().str.strip()

    with open(os.path.join(DATA_DIR, "diagnostic_costs.json")) as f:
        diag_cost = json.load(f)

    with open(os.path.join(DATA_DIR, "procedure_costs.json")) as f:
        proc_cost = json.load(f)

    with open(os.path.join(DATA_DIR, "cost_config.json")) as f:
        config = json.load(f)

    diag_cost = {k.lower(): v for k, v in diag_cost.items()}
    proc_cost = {k.lower(): v for k, v in proc_cost.items()}

    return hospitals, doctors, reviews, clinical, diag_cost, proc_cost, config