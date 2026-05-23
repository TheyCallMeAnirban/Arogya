from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("all-MiniLM-L6-v2")

# Precompute embeddings once
def build_index(clinical_df):
    symptoms = clinical_df["symptom"].tolist()
    embeddings = model.encode(symptoms, convert_to_tensor=True)
    return symptoms, embeddings

def find_best_match(query, symptoms, embeddings, clinical_df):

    query_emb = model.encode(query, convert_to_tensor=True)
    scores = util.cos_sim(query_emb, embeddings)[0]

    best_idx = scores.argmax().item()

    matched_row = clinical_df.iloc[best_idx]

    return matched_row.to_dict(), float(scores[best_idx])