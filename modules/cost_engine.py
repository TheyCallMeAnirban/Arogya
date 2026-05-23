def estimate_cost(mapping, diag_cost, proc_cost, cost_config, hospital_type, age=None, comorb=None, docs=None):

    # 1. Procedure cost
    proc_key = mapping["procedure"].strip().lower()
    proc_min, proc_max = proc_cost.get(proc_key, (50000, 150000))

    # 2. Diagnostics cost
    diag_min, diag_max = 0, 0
    for d in mapping["diagnostics"]:
       key = d.strip().lower()

       if key in diag_cost:
         d_min, d_max = diag_cost[key]
       else:
        # fallback cost (important for robustness)
         d_min, d_max = (500, 2000)
       diag_min += d_min
       diag_max += d_max

    # 3. Room cost (based on hospital type)
    room_min, room_max = cost_config[hospital_type]["per_day"]
    stay_days = 3

    stay_min = room_min * stay_days
    stay_max = room_max * stay_days

    # 4. Other components
    if docs is not None and not docs.empty:
      doctor_fee = docs["doctor_fees"].mean()
    else:
      doctor_fee = proc_min * cost_config[hospital_type]["doctor_fee_factor"]
    medicine = proc_min * cost_config[hospital_type]["medicine_factor"]
    contingency = proc_min * cost_config[hospital_type]["contingency_factor"]

    # 5. Total cost
    total_min = proc_min + diag_min + stay_min + doctor_fee + medicine + contingency
    total_max = proc_max + diag_max + stay_max + doctor_fee + medicine + contingency

    # 6. Risk adjustments
    if age and age > 60:
        total_min += 15000
        total_max += 30000

    if comorb and "diabetes" in comorb.lower():
        total_min += 20000
        total_max += 40000

    return {
        "total": (int(total_min), int(total_max)),
        "breakdown": {
            "procedure": (proc_min, proc_max),
            "diagnostics": (diag_min, diag_max),
            "stay": (stay_min, stay_max),
            "doctor_fee": int(doctor_fee),
            "medicine": int(medicine),
            "contingency": int(contingency)
        }
    }