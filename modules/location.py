def resolve_location(user_input, pincode_map):
    user_input = str(user_input)

    if user_input.isdigit():
        return pincode_map.get(user_input, None)

    return user_input