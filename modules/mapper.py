def map_query_to_condition(query, clinical_data):
    query = query.lower()

    for symptom in clinical_data:
        if symptom in query:
            return clinical_data[symptom]

    return None