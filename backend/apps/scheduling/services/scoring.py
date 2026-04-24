def _is_night_shift(shift_type) -> bool:
    if getattr(shift_type, "is_night", False):
        return True
    if getattr(shift_type, "is_night_shift", False):
        return True
    name = (getattr(shift_type, "name", "") or "").lower()
    return "night" in name or "nobet" in name or "gece" in name


def calculate_staff_score(stats, shift_type, options=None):
    options = options or {}
    score = 1000.0

    score -= float(stats.get("total_hours", 0)) * 2.0
    score -= int(stats.get("recent_assignments", 0)) * 8

    if options.get("balance_night_shifts", True) and _is_night_shift(shift_type):
        score -= int(stats.get("night_count", 0)) * 18

    if options.get("balance_weekends", True):
        score -= int(stats.get("weekend_count", 0)) * 10

    score -= int(stats.get("consecutive_days", 0)) * 12
    score += float(stats.get("rest_hours_bonus", 0))

    if stats.get("department_match", True):
        score += 10

    return float(score)
