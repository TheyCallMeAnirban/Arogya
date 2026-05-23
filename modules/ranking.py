from modules.review_utils import get_review_score

def rank_hospitals(df, budget=None, review_index=None):

    df = df.copy()

    df["rating_score"] = df["rating"] / 5
    df["affordability_score"] = 1 / df["cost_index"]

    # 👉 NEW: review score
    if review_index:
        df["review_score"] = df["hospital_id"].apply(
            lambda x: get_review_score(x, review_index)
        ) / 5
    else:
        df["review_score"] = 0.5

    df["final_score"] = (
        0.3 * df["rating_score"] +
        0.25 * df["affordability_score"] +
        0.25 * df["review_score"] +
        0.2 * 0.5
    )

    return df.sort_values(by="final_score", ascending=False)