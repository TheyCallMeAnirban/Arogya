def get_doctors(doctors_df, hospital_id, speciality):

    filtered = doctors_df[
        (doctors_df["hospital_id"] == hospital_id) &
        (doctors_df["speciality"].str.lower() == speciality.lower())
    ]

    return filtered