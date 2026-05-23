def filter_hospitals(hospitals_df, city, speciality):

    # normalize inputs ONLY (not dataframe)
    city = city.strip().lower()
    speciality = speciality.strip().lower()

    filtered = hospitals_df[
        (hospitals_df["city"] == city) &
        (hospitals_df["speciality"] == speciality)
    ]

    return filtered