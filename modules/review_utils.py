def get_review_score(hospital_id, review_index):

    revs = review_index.get(hospital_id, [])

    if not revs:
        return 0.5

    ratings = [r["rating"] for r in revs]

    return sum(ratings) / len(ratings)