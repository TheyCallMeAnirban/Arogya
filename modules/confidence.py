def calculate_confidence(mapping, hospitals_found):

    score = 0

    # mapping confidence
    if mapping:
        score += 0.4

    # hospital availability
    if hospitals_found > 0:
        score += 0.3

    # data completeness
    if mapping and "diagnostics" in mapping:
        score += 0.3

    return round(score, 2)