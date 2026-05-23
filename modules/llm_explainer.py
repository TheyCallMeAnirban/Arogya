import os
from google import generativeai as genai
from dotenv import load_dotenv
load_dotenv()


genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

# Load prompt template
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))



def load_prompt():
    path = os.path.join(BASE_DIR, "prompt_structure.txt")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()



PROMPT_TEMPLATE = load_prompt()

def build_prompt(mapping, row, cost, budget, doctor_exp, comorb, confidence):

    return PROMPT_TEMPLATE.format(
        condition=mapping["condition"],
        procedure=mapping["procedure"],
        hospital=row["hospital_name"],
        rating=row["rating"],
        speciality=mapping["speciality"],
        cost_min=cost["total"][0],
        cost_max=cost["total"][1],
        budget=budget,
        doctor_exp=doctor_exp,
        comorb=comorb if comorb else "None",
        confidence=confidence
    )

def stream_explanation(mapping, row, cost, budget, doctor_exp, comorb, confidence):

    prompt = build_prompt(mapping, row, cost, budget, doctor_exp, comorb, confidence)

    try:
        response = model.generate_content(prompt, stream=True)

        for chunk in response:
            if chunk.text:
                yield chunk.text

    except Exception as e:
        print("Gemini Error:", e)
        raise e

