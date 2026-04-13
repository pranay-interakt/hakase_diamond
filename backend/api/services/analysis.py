import math
import statistics
from typing import Any

def compute_trial_similarity(base: dict, candidate: dict) -> float:
    score = 0.0
    total_weight = 0.0

    def jaccard(a: list, b: list) -> float:
        sa, sb = set(str(x).lower() for x in a), set(str(x).lower() for x in b)
        if not sa and not sb:
            return 0.0
        return len(sa & sb) / len(sa | sb)

    weights = {
        "conditions": 35,
        "phase": 20,
        "interventionType": 15,
        "studyType": 10,
        "allocation": 10,
        "masking": 5,
        "countries": 5,
    }

    cond_sim = jaccard(
        base.get("conditions", []),
        candidate.get("conditions", [])
    )
    score += weights["conditions"] * cond_sim
    total_weight += weights["conditions"]

    b_phases = set(base.get("phase", []))
    c_phases = set(candidate.get("phase", []))
    phase_sim = 1.0 if b_phases & c_phases else 0.5 if abs(
        _phase_num(b_phases) - _phase_num(c_phases)
    ) == 1 else 0.0
    score += weights["phase"] * phase_sim
    total_weight += weights["phase"]

    b_types = {i.get("type", "").lower() for i in base.get("interventions", [])}
    c_types = {i.get("type", "").lower() for i in candidate.get("interventions", [])}
    intr_sim = 1.0 if b_types & c_types else 0.0
    score += weights["interventionType"] * intr_sim
    total_weight += weights["interventionType"]

    for field, w in [("studyType", 10), ("allocation", 10), ("masking", 5)]:
        if base.get(field) and candidate.get(field):
            score += w * (1.0 if base[field] == candidate[field] else 0.0)
        total_weight += w

    country_sim = jaccard(base.get("countries", []), candidate.get("countries", []))
    score += weights["countries"] * country_sim
    total_weight += weights["countries"]

    return round((score / total_weight) * 100, 1) if total_weight else 0.0


def _phase_num(phases: set) -> int:
    mapping = {"EARLY_PHASE1": 0, "PHASE1": 1, "PHASE2": 2, "PHASE3": 3, "PHASE4": 4}
    nums = [mapping.get(p, -1) for p in phases if p in mapping]
    return max(nums) if nums else -1


def compute_enrollment_stats(similar_trials: list[dict]) -> dict:
    counts = [
        t.get("enrollmentCount") for t in similar_trials
        if t.get("enrollmentCount") and t["enrollmentCount"] > 0
    ]
    if not counts:
        return {}

    return {
        "median": statistics.median(counts),
        "mean": round(statistics.mean(counts), 0),
        "min": min(counts),
        "max": max(counts),
        "p25": _percentile(counts, 25),
        "p75": _percentile(counts, 75),
        "stdev": round(statistics.stdev(counts), 0) if len(counts) > 1 else 0,
        "sampleSize": len(counts),
    }


def _percentile(data: list, p: int) -> float:
    sorted_data = sorted(data)
    n = len(sorted_data)
    idx = (p / 100) * (n - 1)
    lower = int(idx)
    upper = min(lower + 1, n - 1)
    return round(sorted_data[lower] + (idx - lower) * (sorted_data[upper] - sorted_data[lower]), 0)


def compute_success_probability(trial: dict, similar_trials: list[dict]) -> dict:
    factors: list[dict] = []
    total_score = 0.0
    max_score = 0.0

    phase = trial.get("phase", [])
    phase_success_rates = {
        "EARLY_PHASE1": 0.70,
        "PHASE1": 0.65,
        "PHASE2": 0.45,
        "PHASE3": 0.65,
        "PHASE4": 0.80,
        "NA": 0.50,
    }
    base_rate = 0.50
    for p in phase:
        if p in phase_success_rates:
            base_rate = phase_success_rates[p]
            break

    factors.append({
        "factor": "Phase-based historical success",
        "weight": 30,
        "score": base_rate * 30,
        "description": f"{int(base_rate * 100)}% historical success rate for {'/'.join(phase) if phase else 'N/A'} trials",
    })
    total_score += base_rate * 30
    max_score += 30

    completed = sum(1 for t in similar_trials if t.get("status") == "COMPLETED")
    terminated = sum(1 for t in similar_trials if t.get("status") in ["TERMINATED", "WITHDRAWN"])
    total_similar = completed + terminated
    if total_similar > 0:
        completion_rate = completed / total_similar
        factors.append({
            "factor": "Similar trial completion rate",
            "weight": 25,
            "score": completion_rate * 25,
            "description": f"{completed}/{total_similar} similar trials completed ({int(completion_rate * 100)}%)",
        })
        total_score += completion_rate * 25
        max_score += 25
    else:
        max_score += 25

    n_outcomes = len(trial.get("primaryOutcomes", []))
    if n_outcomes == 1:
        endpoint_score = 1.0
        ep_desc = "Single well-defined primary endpoint"
    elif n_outcomes <= 3:
        endpoint_score = 0.75
        ep_desc = f"{n_outcomes} primary endpoints — multiplicity adjustment may be needed"
    else:
        endpoint_score = 0.4
        ep_desc = f"{n_outcomes} primary endpoints — high multiplicity risk"

    factors.append({
        "factor": "Endpoint design quality",
        "weight": 20,
        "score": endpoint_score * 20,
        "description": ep_desc,
    })
    total_score += endpoint_score * 20
    max_score += 20

    sponsor_class = trial.get("sponsorClass", "OTHER")
    sponsor_score = {"INDUSTRY": 0.8, "NIH": 0.75, "FED": 0.75, "OTHER": 0.55}.get(sponsor_class, 0.55)
    factors.append({
        "factor": "Sponsor experience",
        "weight": 15,
        "score": sponsor_score * 15,
        "description": f"{sponsor_class} sponsor — {'strong' if sponsor_score >= 0.75 else 'moderate'} execution capacity",
    })
    total_score += sponsor_score * 15
    max_score += 15

    allocation = trial.get("allocation", "")
    masking = trial.get("masking", "")
    design_score = 0.5
    if allocation == "RANDOMIZED" and "DOUBLE" in (masking or "").upper():
        design_score = 1.0
    elif allocation == "RANDOMIZED":
        design_score = 0.8
    elif allocation:
        design_score = 0.6

    factors.append({
        "factor": "Study design rigor",
        "weight": 10,
        "score": design_score * 10,
        "description": f"{'Randomized' if allocation == 'RANDOMIZED' else 'Non-randomized'} / {masking or 'unspecified masking'}",
    })
    total_score += design_score * 10
    max_score += 10

    probability = round((total_score / max_score) * 100, 1) if max_score else 50.0
    probability = min(95.0, max(5.0, probability))

    return {
        "probability": probability,
        "rating": "High" if probability >= 70 else "Moderate" if probability >= 45 else "Low",
        "factors": factors,
        "maxScore": max_score,
        "totalScore": round(total_score, 1),
    }


def monte_carlo_enrollment(
    target: int,
    n_sites: int,
    monthly_rate_per_site: float,
    dropout_rate: float,
    n_simulations: int = 1000,
) -> dict:
    import random
    random.seed(42)

    completion_months = []
    for _ in range(n_simulations):
        enrolled = 0
        month = 0
        while enrolled < target and month < 120:
            month += 1
            for _ in range(n_sites):
                rate_variation = random.gauss(monthly_rate_per_site, monthly_rate_per_site * 0.3)
                new_patients = max(0, random.poisson_approx(max(0, rate_variation)))
                dropouts = max(0, int(enrolled * dropout_rate / 12))
                enrolled += new_patients - dropouts
                enrolled = max(0, enrolled)
            if enrolled >= target:
                break
        completion_months.append(month)

    sorted_months = sorted(completion_months)
    n = len(sorted_months)
    return {
        "p10": sorted_months[int(n * 0.10)],
        "p25": sorted_months[int(n * 0.25)],
        "p50": sorted_months[int(n * 0.50)],
        "p75": sorted_months[int(n * 0.75)],
        "p90": sorted_months[int(n * 0.90)],
        "mean": round(sum(sorted_months) / n, 1),
        "nSimulations": n_simulations,
        "histogram": _histogram(sorted_months, bins=20),
    }


def _histogram(data: list[int], bins: int) -> list[dict]:
    if not data:
        return []
    mn, mx = min(data), max(data)
    if mn == mx:
        return [{"bin": mn, "count": len(data)}]
    width = (mx - mn) / bins
    counts: list[int] = [0] * bins
    for v in data:
        idx = min(int((v - mn) / width), bins - 1)
        counts[idx] += 1
    return [
        {"bin": round(mn + (i + 0.5) * width, 1), "count": counts[i]}
        for i in range(bins)
        if counts[i] > 0
    ]


class _PoissonHelper:
    @staticmethod
    def approx(lam: float) -> int:
        import math
        import random
        if lam <= 0:
            return 0
        L = math.exp(-lam)
        k, p = 0, 1.0
        while p > L:
            k += 1
            p *= random.random()
        return k - 1


import random as _random
_random.poisson_approx = _PoissonHelper.approx


def estimate_site_performance(ctgov_locations: list[dict]) -> list[dict]:
    country_capacity: dict[str, dict] = {
        "United States": {"avg_rate": 2.5, "startup_weeks": 12, "iec_weeks": 6},
        "United Kingdom": {"avg_rate": 2.0, "startup_weeks": 14, "iec_weeks": 8},
        "Germany": {"avg_rate": 1.8, "startup_weeks": 16, "iec_weeks": 10},
        "France": {"avg_rate": 1.5, "startup_weeks": 18, "iec_weeks": 12},
        "India": {"avg_rate": 3.5, "startup_weeks": 10, "iec_weeks": 6},
        "China": {"avg_rate": 4.0, "startup_weeks": 20, "iec_weeks": 14},
        "Brazil": {"avg_rate": 2.8, "startup_weeks": 22, "iec_weeks": 16},
        "Australia": {"avg_rate": 2.2, "startup_weeks": 8, "iec_weeks": 4},
        "Canada": {"avg_rate": 1.8, "startup_weeks": 10, "iec_weeks": 8},
        "Japan": {"avg_rate": 1.5, "startup_weeks": 24, "iec_weeks": 16},
    }
    default = {"avg_rate": 1.5, "startup_weeks": 16, "iec_weeks": 10}

    results = []
    for loc in ctgov_locations:
        country = loc.get("country", "Unknown")
        caps = country_capacity.get(country, default)
        status = loc.get("status", "")
        score = 60
        if status == "RECRUITING":
            score += 20
        elif status == "COMPLETED":
            score += 15
        score += min(20, caps["avg_rate"] * 5)
        score -= min(20, caps["startup_weeks"] / 2)
        results.append({
            "facility": loc.get("facility", "Unknown Facility"),
            "city": loc.get("city", ""),
            "country": country,
            "status": status,
            "enrollmentRate": caps["avg_rate"],
            "startupWeeks": caps["startup_weeks"],
            "iecWeeks": caps["iec_weeks"],
            "score": min(100, max(0, round(score, 0))),
        })

    return sorted(results, key=lambda x: x["score"], reverse=True)
