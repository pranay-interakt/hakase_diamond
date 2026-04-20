"""
trial_hub.py — Clinical Trial Hub Simulation Engine

Simulates the complete lifecycle of a clinical trial across 7 stages:
  Stage 1: Discovery & Feasibility
  Stage 2: Protocol Design
  Stage 3: Site Selection & Activation
  Stage 4: Regulatory & IND/CTA Submission
  Stage 5: Enrollment & Recruitment
  Stage 6: Trial Execution & Monitoring
  Stage 7: Outcomes & Data Analysis

All simulations backed by live APIs: ClinicalTrials.gov, OpenFDA FAERS, PubMed.
Machine learning: GradientBoosting, TF-IDF similarity, Monte Carlo, safety signal scoring.
"""
from __future__ import annotations
import asyncio
import math
import statistics
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..services import ctgov, analysis
from ..services.deep_learning import (
    compute_similarity_matrix,
    predict_success_gb,
    score_safety_signal,
    score_literature_maturity,
    simulate_enrollment as dl_simulate_enrollment,
    build_trial_fingerprint,
)
from ..services.trial_hub_engine import (
    fetch_large_corpus,
    compute_prr_signals,
    predict_outcome_ensemble,
    simulate_enrollment_advanced,
    estimate_screen_failure_ratio,
    compute_geographic_diversity,
    derive_enrollment_rates,
    compute_trial_similarity,
)
from ..services.data_hub import fetch_all as fetch_all_data
from ..services.dynamic_reasoner import analyze_layer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trial-hub", tags=["trial-hub"])


# ─────────────────────────────────────────────────────────
# Input Models
# ─────────────────────────────────────────────────────────

class Stage1Input(BaseModel):
    condition: str = Field(..., description="Disease / condition being studied")
    intervention: Optional[str] = Field(None, description="Drug / device name")
    phase: Optional[str] = Field(None, description="PHASE1 | PHASE2 | PHASE3 | PHASE4")
    indication_rare: bool = Field(False, description="Is this a rare disease / orphan drug?")
    sponsor_type: Optional[str] = Field("INDUSTRY", description="INDUSTRY | NIH | FED | OTHER")


class Stage2Input(BaseModel):
    condition: str
    phase: str = "PHASE2"
    enrollment_target: int = Field(200, ge=10, le=50000)
    primary_endpoint: str = Field("", description="Primary efficacy endpoint")
    duration_months: int = Field(24, ge=1, le=120)
    masking: str = Field("DOUBLE", description="NONE | SINGLE | DOUBLE | TRIPLE")
    allocation: str = Field("RANDOMIZED", description="RANDOMIZED | NON_RANDOMIZED")
    n_arms: int = Field(2, ge=1, le=6)
    inclusion_criteria: Optional[str] = None
    exclusion_criteria: Optional[str] = None


class Stage3Input(BaseModel):
    condition: str
    phase: str = "PHASE2"
    enrollment_target: int = 200
    preferred_countries: list[str] = Field(default_factory=list)
    n_sites_requested: int = Field(10, ge=1, le=200)
    site_experience_min: Optional[int] = Field(None, description="Min prior trials per site")


class Stage4Input(BaseModel):
    condition: str
    intervention: Optional[str] = None
    phase: str = "PHASE2"
    indication_rare: bool = False
    sponsor_type: str = "INDUSTRY"
    has_prior_ind: bool = False


class Stage5Input(BaseModel):
    condition: str
    phase: str = "PHASE2"
    enrollment_target: int = 200
    n_sites: int = 10
    dropout_rate: float = Field(0.08, ge=0.0, le=0.5)
    n_simulations: int = Field(1000, ge=100, le=3000)


class Stage6Input(BaseModel):
    condition: str
    phase: str = "PHASE2"
    enrollment_target: int = 200
    duration_months: int = 24
    n_sites: int = 10
    n_patients: int = 200


class Stage7Input(BaseModel):
    condition: str
    intervention: Optional[str] = None
    phase: str = "PHASE2"
    enrollment_target: int = 200
    primary_endpoint: str = ""
    masking: str = "DOUBLE"
    allocation: str = "RANDOMIZED"
    sponsor_type: str = "INDUSTRY"


class FullSimInput(BaseModel):
    stage1: Stage1Input
    stage2: Stage2Input
    stage3: Stage3Input
    stage4: Stage4Input
    stage5: Stage5Input
    stage6: Stage6Input
    stage7: Stage7Input


# ─────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────

async def _fetch_similar(condition: str, phase: Optional[str], status: Optional[list[str]] = None, n: int = 50) -> list[dict]:
    try:
        phase_list = [phase] if phase else None
        raw = await ctgov.search_studies(
            condition=condition,
            phase=phase_list,
            status=status,
            page_size=n,
        )
        return [ctgov.extract_core(s) for s in raw.get("studies", [])]
    except Exception as e:
        logger.warning(f"[TrialHub] CTGov fetch failed: {e}")
        return []


async def _fetch_faers(drug: str) -> dict:
    """
    Robust FAERS fetch — tries multiple search strategies:
    1. medicinalproduct exact match
    2. openfda.generic_name
    3. openfda.brand_name
    Also fetches drug recall/enforcement data from OpenFDA.
    """
    import httpx
    strategies = [
        f'patient.drug.medicinalproduct:"{drug}"',
        f'patient.drug.openfda.generic_name:"{drug}"',
        f'patient.drug.openfda.brand_name:"{drug}"',
    ]
    async with httpx.AsyncClient(timeout=20) as client:
        # Try FAERS adverse event count
        best = {}
        for search_expr in strategies:
            try:
                params = {
                    "search": search_expr,
                    "limit": 1,
                    "count": "patient.reaction.reactionmeddrapt.exact",
                }
                r = await client.get("https://api.fda.gov/drug/event.json", params=params)
                if r.status_code == 200:
                    data = r.json()
                    results = data.get("results", [])
                    total = data.get("meta", {}).get("results", {}).get("total", 0)
                    if total > 0:
                        best = {
                            "topReactions": [
                                {"reaction": item.get("term", ""), "count": item.get("count", 0)}
                                for item in results[:10]
                            ],
                            "totalReports": total,
                            "searchStrategy": search_expr,
                            "proofLink": f"https://api.fda.gov/drug/event.json?search={search_expr}&count=patient.reaction.reactionmeddrapt.exact",
                            "source": "OpenFDA FAERS",
                        }
                        break
            except Exception as e:
                logger.debug(f"[FAERS] strategy failed: {e}")

        # Fetch recall/enforcement data
        try:
            recall_params = {
                "search": f'product_description:"{drug}"',
                "limit": 5,
            }
            rr = await client.get("https://api.fda.gov/drug/enforcement.json", params=recall_params)
            if rr.status_code == 200:
                recall_data = rr.json()
                recall_results = recall_data.get("results", [])
                best["recallCount"] = recall_data.get("meta", {}).get("results", {}).get("total", 0)
                best["recentRecalls"] = [
                    {
                        "reason": r.get("reason_for_recall", "")[:100],
                        "classification": r.get("classification", ""),
                        "status": r.get("status", ""),
                        "date": r.get("recall_initiation_date", ""),
                    }
                    for r in recall_results[:3]
                ]
        except Exception as e:
            logger.debug(f"[FAERS] Recall fetch failed: {e}")

    return best if best else {"totalReports": 0, "topReactions": [], "source": "OpenFDA FAERS (no matches)"}


async def _fetch_pubmed_count(condition: str, intervention: Optional[str] = None) -> dict:
    """
    Fetch PubMed article count + top article IDs + summaries for the condition/drug.
    Uses NCBI E-utilities (esearch + esummary).
    """
    import httpx
    query = condition
    if intervention:
        query += f" AND {intervention}"
    ct_query = query + " AND (clinical trial[pt])"
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            # Get count of all CT articles
            r = await client.get(f"{base}/esearch.fcgi", params={
                "db": "pubmed", "term": ct_query, "rettype": "count", "retmode": "json"
            })
            ct_count = 0
            all_count = 0
            ids = []
            if r.status_code == 200:
                ct_count = int(r.json().get("esearchresult", {}).get("count", 0))

            # Get top 5 most recent articles (any pub type) for titles
            r2 = await client.get(f"{base}/esearch.fcgi", params={
                "db": "pubmed", "term": query, "retmax": 5, "sort": "relevance", "retmode": "json"
            })
            if r2.status_code == 200:
                result_data = r2.json().get("esearchresult", {})
                all_count = int(result_data.get("count", 0))
                ids = result_data.get("idlist", [])

            top_articles = []
            if ids:
                r3 = await client.get(f"{base}/esummary.fcgi", params={
                    "db": "pubmed", "id": ",".join(ids), "retmode": "json"
                })
                if r3.status_code == 200:
                    summaries = r3.json().get("result", {})
                    for pmid in ids:
                        art = summaries.get(pmid, {})
                        if art and art.get("title"):
                            top_articles.append({
                                "pmid": pmid,
                                "title": art.get("title", "")[:120],
                                "journal": art.get("fulljournalname", ""),
                                "year": art.get("pubdate", "")[:4],
                                "link": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                            })

            return {
                "articleCount": all_count,
                "clinicalTrialPubCount": ct_count,
                "topArticles": top_articles,
                "proofLink": f"https://pubmed.ncbi.nlm.nih.gov/?term={query}",
                "source": "PubMed (NCBI E-utilities)",
            }
    except Exception as e:
        logger.warning(f"[TrialHub] PubMed fetch failed: {e}")
    return {"articleCount": 0, "clinicalTrialPubCount": 0, "topArticles": []}


def _derive_rates(trials: list[dict]) -> tuple[float, str]:
    """Derive median monthly enrollment rate from completed trials."""
    rates = []
    for t in trials:
        enroll = t.get("enrollmentCount") or 0
        start = t.get("startDate", "")
        end = t.get("completionDate", "")
        n_locs = max(1, t.get("locationCount") or 1)
        if enroll > 0 and start and end:
            try:
                from datetime import datetime
                s = datetime.strptime(start[:10], "%Y-%m-%d")
                e = datetime.strptime(end[:10], "%Y-%m-%d")
                months = max(1, (e - s).days / 30.44)
                rate = enroll / months / n_locs
                if 0.05 < rate < 15:
                    rates.append(rate)
            except Exception:
                pass
    if rates:
        return round(statistics.median(rates), 2), f"Median from {len(rates)} CTGov completed trials"
    return 1.5, "Default estimate (no completed trials in corpus)"


# ─────────────────────────────────────────────────────────
# Stage 1: Discovery & Feasibility
# ─────────────────────────────────────────────────────────

@router.post("/stage1/discovery")
async def stage1_discovery(body: Stage1Input):
    """
    Feasibility analysis using LARGE corpus (200+ trials), PRR/ROR safety
    signals from FAERS, PubMed literature maturity, and Shannon geographic diversity.
    """
    # Parallel data fetch — PAGINATED for meaningful corpus
    completed_task = fetch_large_corpus(body.condition, body.phase, status=["COMPLETED"], target_n=200)
    active_task = fetch_large_corpus(body.condition, body.phase, status=["RECRUITING", "ACTIVE_NOT_RECRUITING"], target_n=100)
    pubmed_task = _fetch_pubmed_count(body.condition, body.intervention)
    # PRR/ROR pharmacovigilance instead of naive log-penalty
    safety_task = compute_prr_signals(body.intervention or body.condition)

    completed_trials, active_trials, pubmed_data, safety_data = await asyncio.gather(
        completed_task, active_task, pubmed_task, safety_task
    )
    
    # Enable Data Sharing logic for cross-layer reasoning using the full ecosystem hub
    shared_data = await fetch_all_data(body.condition, body.intervention, [body.phase] if body.phase else None)

    all_trials = completed_trials + active_trials

    # Phase distribution from real data
    phase_dist: dict[str, int] = {}
    for t in all_trials:
        for p in (t.get("phase") or []):
            phase_dist[p] = phase_dist.get(p, 0) + 1

    # Completion rate — real ratio from completed vs terminated (not active)
    n_completed = sum(1 for t in all_trials if t.get("status") == "COMPLETED")
    n_terminated = sum(1 for t in all_trials if t.get("status") in ("TERMINATED", "WITHDRAWN"))
    n_active = sum(1 for t in all_trials if t.get("status") in ("RECRUITING", "ACTIVE_NOT_RECRUITING"))
    resolved_total = n_completed + n_terminated
    completion_rate = round(n_completed / max(1, resolved_total) * 100, 1)

    # Literature maturity
    lit_score = score_literature_maturity(pubmed_data)

    # Geographic diversity with Shannon index
    country_counts: dict[str, int] = {}
    for t in all_trials:
        for c in (t.get("countries") or []):
            country_counts[c] = country_counts.get(c, 0) + 1
    geo_diversity = compute_geographic_diversity(country_counts)

    # Unmet need: composite of competitive density + literature + rare
    competitive_density = n_active
    lit_norm = min(1.0, (lit_score.get("maturityScore", 50) or 50) / 100)
    density_norm = min(1.0, math.log1p(competitive_density) / math.log1p(200))
    rare_boost = 1.5 if body.indication_rare else 1.0
    unmet_need_score = max(10, min(95, round(
        (0.5 * (1 - density_norm) + 0.3 * (1 - lit_norm) + 0.2 * rare_boost) * 95
    ))) 

    # Design recommendation based on real data from corpus
    rec_phase = body.phase or "PHASE2"
    # Check most common design in corpus
    masking_counts: dict[str, int] = {}
    for t in completed_trials:
        m = t.get("masking") or "NONE"
        masking_counts[m] = masking_counts.get(m, 0) + 1
    most_common_masking = max(masking_counts, key=masking_counts.get) if masking_counts else "DOUBLE"

    if body.indication_rare:
        rec_design = "Single-arm open-label (Accelerated Approval pathway eligible)"
        design_rationale = "Rare disease indication → FDA allows single-arm with surrogate endpoint under 21 CFR 314.510"
    elif rec_phase in ("PHASE3",):
        rec_design = "Double-blind RCT with 2:1 active:placebo allocation"
        design_rationale = "Phase 3 pivotal trials require gold-standard double-blind RCT for regulatory acceptance"
    else:
        rec_design = f"Randomized {most_common_masking.lower()}-blind placebo-controlled"
        design_rationale = f"Most common design in {n_completed} completed similar trials on CTGov is {most_common_masking}"

    # Enrollment stats
    enroll_stats = analysis.compute_enrollment_stats(all_trials) if all_trials else {}

    # Enrollment rate provenance
    rate_data = derive_enrollment_rates([t for t in completed_trials if t.get("status") == "COMPLETED"])

    # Sponsor breakdown from completed trials
    sponsor_breakdown: dict[str, int] = {}
    for t in completed_trials:
        sc = t.get("sponsorClass") or "OTHER"
        sponsor_breakdown[sc] = sponsor_breakdown.get(sc, 0) + 1

    # Optimizations
    optimizations = []
    if competitive_density > 20:
        optimizations.append({
            "type": "differentiation",
            "priority": "HIGH",
            "recommendation": f"High competitive density ({competitive_density} active trials). Consider biomarker-driven patient selection or combination therapy to differentiate.",
            "impact": "Reduces competition risk, improves enrollment targeting",
        })
    if lit_score.get("maturityScore", 50) < 55:
        optimizations.append({
            "type": "evidence_gap",
            "priority": "MEDIUM",
            "recommendation": "Limited published evidence. Strengthening pre-clinical dossier and publishing Phase 1/2 data will de-risk regulatory review.",
            "impact": "Increases regulatory confidence and investor appetite",
        })
    if safety_data.get("riskLevel") == "HIGH":
        optimizations.append({
            "type": "safety_monitoring",
            "priority": "HIGH",
            "recommendation": f"FAERS analysis found {safety_data.get('nSignals', 0)} disproportionate safety signals (PRR>2, χ²>4). Plan robust DSMB charter and consider rolling safety reports.",
            "impact": "Essential for IND/CTA approval and trial continuation",
        })
    if body.indication_rare:
        optimizations.append({
            "type": "regulatory_path",
            "priority": "HIGH",
            "recommendation": "Apply for FDA Orphan Drug Designation and Breakthrough Therapy Designation for expedited review timeline.",
            "impact": "7-year market exclusivity, reduced pivotal trial requirements, priority review voucher",
        })
    if geo_diversity.get("riskLevel") == "HIGH":
        optimizations.append({
            "type": "geographic_risk",
            "priority": "MEDIUM",
            "recommendation": f"High geographic concentration (Shannon H'={geo_diversity.get('shannonIndex', 0)}). {geo_diversity.get('topCountry', 'Unknown')} hosts {geo_diversity.get('topCountryShare', 0)}% of trials. Diversify across ≥5 countries.",
            "impact": "Reduces supply chain and regulatory concentration risk",
        })

    base_result = {
        "stage": 1,
        "stageName": "Discovery & Feasibility",
        "condition": body.condition,
        "intervention": body.intervention,
        "phase": body.phase,
        "landscape": {
            "totalTrials": len(all_trials),
            "completedTrials": n_completed,
            "terminatedTrials": n_terminated,
            "activeTrials": n_active,
            "completionRate": completion_rate,
            "completionRateNote": f"Completion ratio: {n_completed}/{resolved_total} resolved trials (COMPLETED vs TERMINATED/WITHDRAWN)",
            "phaseDistribution": phase_dist,
            "sponsorBreakdown": sponsor_breakdown,
            "competitiveDensity": competitive_density,
        },
        "literatureMaturity": lit_score,
        "safetyBaseline": {
            "safetyScore": safety_data.get("safetyScore", 0),
            "riskLevel": safety_data.get("riskLevel", "UNKNOWN"),
            "totalFaersReports": safety_data.get("totalDrugReports", 0),
            "nSignals": safety_data.get("nSignals", 0),
            "nSeriousReactions": safety_data.get("nSeriousReactions", 0),
            "topSignals": [s["reaction"] for s in (safety_data.get("signals") or [])[:5]],
            "method": safety_data.get("method"),
            "reasoning": safety_data.get("reasoning"),
            "seriousReactions": [s["reaction"] for s in (safety_data.get("signals") or []) if s.get("isSerious")],
        },
        "geographicDiversity": geo_diversity,
        "enrollmentBenchmarks": enroll_stats,
        "enrollmentRates": rate_data,
        "unmetNeedScore": round(unmet_need_score, 1),
        "recommendedDesign": rec_design,
        "designRationale": design_rationale,
        "optimizations": optimizations,
        "topCompetitorTrials": [
            {
                "nctId": t.get("nctId"),
                "title": t.get("title", "")[:80],
                "status": t.get("status"),
                "phase": t.get("phase"),
                "sponsor": t.get("sponsorName", ""),
                "enrollment": t.get("enrollmentCount"),
            }
            for t in active_trials[:8]
        ],
        "corpusSize": len(all_trials),
        "dataSources": {
            "clinicalTrials": f"https://clinicaltrials.gov/search?cond={body.condition}",
            "pubmed": pubmed_data.get("proofLink", "https://pubmed.ncbi.nlm.nih.gov"),
            "faers": safety_data.get("proofLink", "https://open.fda.gov/apis/drug/event/"),
            "methodology": f"Paginated CTGov fetch ({len(all_trials)} trials) + PRR/ROR pharmacovigilance + Shannon diversity",
        },
    }
    
    # Execute actual reasoning logic over shared data
    dynamic_insights = analyze_layer(1, "Discovery & Feasibility", shared_data, dict(body))
    base_result["dynamicInsights"] = dynamic_insights
    if dynamic_insights.get("dynamic_optimizations"):
        base_result["optimizations"].extend(dynamic_insights["dynamic_optimizations"])
        
    return base_result


# ─────────────────────────────────────────────────────────
# Stage 2: Protocol Design
# ─────────────────────────────────────────────────────────

@router.post("/stage2/protocol-design")
async def stage2_protocol_design(body: Stage2Input):
    """
    Protocol design optimization with ENSEMBLE ML (GB+RF, cross-validated),
    statistical power, screen failure model, and cost estimates.
    """
    # Paginated fetch for meaningful ML training
    similar = await fetch_large_corpus(body.condition, body.phase, target_n=200)

    # Ensemble ML prediction (GB+RF with cross-validated AUC)
    design_trial = {
        "phase": [body.phase],
        "masking": body.masking,
        "allocation": body.allocation,
        "enrollmentCount": body.enrollment_target,
        "primaryOutcomes": [body.primary_endpoint] if body.primary_endpoint else [],
        "conditions": [body.condition],
        "sponsorClass": "INDUSTRY",
        "countries": [],
        "eligibilityCriteria": body.inclusion_criteria or "",
        "startDate": "",
        "completionDate": "",
    }
    success_pred = predict_outcome_ensemble(design_trial, similar)

    # Statistical power estimation (Cohen's d assumptions)
    n_per_arm = body.enrollment_target // body.n_arms
    z_alpha, z_beta = 1.96, 0.84
    if n_per_arm > 0:
        detectable_d = round((z_alpha + z_beta) * math.sqrt(2 / n_per_arm), 3)
        power_adequate = detectable_d < 0.5
    else:
        detectable_d = None
        power_adequate = False

    # Benchmark enrollment targets
    enroll_stats = analysis.compute_enrollment_stats(similar)
    benchmark_median = enroll_stats.get("median", 200)
    is_underpowered = body.enrollment_target < benchmark_median * 0.5
    is_overpowered = body.enrollment_target > benchmark_median * 3

    # Duration analysis — from derived rates
    rate_data = derive_enrollment_rates([t for t in similar if t.get("status") == "COMPLETED"])
    rate = rate_data.get("median", 1.5)
    projected_months = round(body.enrollment_target / max(0.01, rate * 10), 1)

    # Screen failure model — eligibility complexity
    screen_model = estimate_screen_failure_ratio(
        body.inclusion_criteria or "", n_arms=body.n_arms
    )

    # Amendment risk
    amendment_risks = []
    if body.n_arms > 3:
        amendment_risks.append("Multiple arms increase operational complexity (>25% amendment probability — Getz 2011)")
    if body.duration_months > 48:
        amendment_risks.append("Long duration (>48 months) predicts ≥1 major protocol amendment (92% of trials — Tufts CSDD)")
    if not body.inclusion_criteria:
        amendment_risks.append("Undefined eligibility criteria — primary source of Phase 2 protocol amendments")
    if body.primary_endpoint and len(body.primary_endpoint) < 20:
        amendment_risks.append("Vaguely specified primary endpoint raises FDA Complete Response Letter risk")
    if body.n_arms > 2:
        amendment_risks.append(f"{body.n_arms}-arm design requires multiplicity correction — plan FWER control in SAP")

    # Cost estimate (industry benchmarks: Sertkaya 2016, Battelle 2023)
    cost_per_patient = {
        "PHASE1": 65000, "EARLY_PHASE1": 45000,
        "PHASE2": 110000, "PHASE3": 250000, "PHASE4": 80000,
    }.get(body.phase, 110000)
    n_sites_est = max(1, body.enrollment_target // 20)
    site_startup_cost = n_sites_est * 85000
    cro_overhead = 0.25
    total_cost = round((body.enrollment_target * cost_per_patient + site_startup_cost) * (1 + cro_overhead))

    # Optimizations
    optimizations = []
    if is_underpowered:
        optimizations.append({
            "type": "enrollment",
            "priority": "HIGH",
            "recommendation": f"Enrollment target ({body.enrollment_target}) is below median ({int(benchmark_median)}) for similar trials. Increase to ≥{int(benchmark_median)} or add adaptive design element.",
            "cost_impact": f"+${int((benchmark_median - body.enrollment_target) * cost_per_patient):,} est.",
        })
    if body.masking == "NONE":
        optimizations.append({
            "type": "design",
            "priority": "HIGH",
            "recommendation": "Open-label design significantly reduces FDA approval probability for efficacy claims. Consider blinded design.",
            "cost_impact": "Blinding adds ~$5K/patient but increases approval probability by ~15-20%",
        })
    if body.n_arms > 2:
        optimizations.append({
            "type": "statistical",
            "priority": "MEDIUM",
            "recommendation": f"{body.n_arms}-arm design requires multiplicity correction (Bonferroni/Hochberg). Pre-specify FWER control in SAP.",
            "cost_impact": "No additional cost — statistical planning only",
        })
    if screen_model.get("complexity") in ("COMPLEX", "VERY_COMPLEX"):
        optimizations.append({
            "type": "screen_failure",
            "priority": "HIGH",
            "recommendation": f"Eligibility criteria complexity is {screen_model.get('complexity')} (screen ratio: {screen_model.get('screenToEnrollRatio')}:1). Simplify inclusion/exclusion to reduce screen failure rate and accelerate enrollment.",
            "cost_impact": f"Reducing ratio to 4:1 saves ~${int((screen_model.get('screenToEnrollRatio', 4.5) - 4) * body.enrollment_target * 800):,} in screening costs",
        })

    return {
        "stage": 2,
        "stageName": "Protocol Design",
        "designQuality": {
            "successProbability": success_pred.get("probability"),
            "method": success_pred.get("method"),
            "reasoning": success_pred.get("reasoning"),
            "featureImportances": success_pred.get("featureImportances"),
            "crossValidation": success_pred.get("crossValidation"),
            "trainingSamples": success_pred.get("trainingSamples"),
            "classBalance": success_pred.get("classBalance"),
            "individualModels": success_pred.get("individualModels"),
        },
        "statisticalPower": {
            "detectableEffectSize": detectable_d,
            "nPerArm": n_per_arm,
            "powerAdequate": power_adequate,
            "recommendation": "80% power at alpha=0.05 (two-sided)" if power_adequate else f"Consider increasing enrollment — detectable d={detectable_d} requires large effect",
        },
        "enrollmentBenchmarks": {
            **enroll_stats,
            "yourTarget": body.enrollment_target,
            "isUnderpowered": is_underpowered,
            "isOverpowered": is_overpowered,
            "ratePerSitePerMonth": rate,
            "rateSource": rate_data.get("source", "unknown"),
            "rateSampleNctIds": rate_data.get("sampleNctIds", []),
        },
        "screenFailureModel": screen_model,
        "durationAnalysis": {
            "requestedMonths": body.duration_months,
            "projectedEnrollmentMonths": projected_months,
            "feasible": projected_months <= body.duration_months,
        },
        "amendmentRisks": amendment_risks,
        "costEstimate": {
            "totalUSD": total_cost,
            "perPatientUSD": cost_per_patient,
            "siteStartupUSD": site_startup_cost,
            "currency": "USD",
            "note": "Industry benchmark estimate (Sertkaya 2016, Battelle 2023 Biopharmaceutical Industry Profile)",
        },
        "optimizations": optimizations,
        "corpusSize": len(similar),
        "dataSources": {
            "clinicalTrials": f"https://clinicaltrials.gov/search?cond={body.condition}",
            "methodology": success_pred.get("method", "Ensemble GB+RF") + " + Cohen's d power calculation",
        },
    }


# ─────────────────────────────────────────────────────────
# Stage 3: Site Selection & Activation
# ─────────────────────────────────────────────────────────

@router.post("/stage3/site-selection")
async def stage3_site_selection(body: Stage3Input):
    """
    Site selection with paginated corpus, Shannon diversity index,
    and data-derived enrollment rates per country.
    """
    similar = await fetch_large_corpus(body.condition, body.phase, target_n=200)

    # Extract and flatten all locations
    raw_locs = []
    for trial in similar:
        loc_count = trial.get("locationCount", 0)
        if loc_count > 0:
            countries = trial.get("countries", [])
            for c in countries:
                raw_locs.append({
                    "facility": f"Site in {c}",
                    "country": c,
                    "city": "",
                    "status": trial.get("status", ""),
                    "trialCount": loc_count,
                    "completedTrials": 1 if trial.get("status") == "COMPLETED" else 0,
                    "activeTrials": 1 if trial.get("status") in ("RECRUITING", "ACTIVE_NOT_RECRUITING") else 0,
                    "enrollmentCount": trial.get("enrollmentCount"),
                    "startDate": trial.get("startDate", ""),
                    "completionDate": trial.get("completionDate", ""),
                    "locationCount": max(1, loc_count),
                })

    # Country aggregation for top sites
    country_agg: dict[str, dict] = {}
    for loc in raw_locs:
        c = loc["country"]
        if c not in country_agg:
            country_agg[c] = {
                "facility": f"Sites in {c}",
                "country": c,
                "city": "",
                "status": "RECRUITING",
                "trialCount": 0,
                "completedTrials": 0,
                "activeTrials": 0,
            }
        country_agg[c]["trialCount"] += loc.get("trialCount", 1)
        country_agg[c]["completedTrials"] += loc.get("completedTrials", 0)
        country_agg[c]["activeTrials"] += loc.get("activeTrials", 0)
        if loc.get("enrollmentCount"):
            country_agg[c]["enrollmentCount"] = loc.get("enrollmentCount")
        if loc.get("startDate"):
            country_agg[c]["startDate"] = loc.get("startDate")
        if loc.get("completionDate"):
            country_agg[c]["completionDate"] = loc.get("completionDate")
        if loc.get("locationCount"):
            country_agg[c]["locationCount"] = loc.get("locationCount")

    aggregated_locs = list(country_agg.values())
    user_loc = body.preferred_countries[0] if body.preferred_countries else None
    ranked_sites = analysis.estimate_site_performance(aggregated_locs, user_location=user_loc)

    # Shannon diversity index for geographic risk
    country_trial_counts = {c: v["trialCount"] for c, v in country_agg.items()}
    geo_diversity = compute_geographic_diversity(country_trial_counts)

    # Site activation timeline (industry benchmarks: IQVIA, Medidata)
    activation_months = {
        "US": {"siv": 1, "contracting": 2, "irb": 2, "total": 5},
        "EU": {"siv": 1, "contracting": 3, "ethics": 3, "total": 7},
        "APAC": {"siv": 2, "contracting": 3, "local_reg": 4, "total": 9},
    }

    # Rate analysis with provenance
    rate_data = derive_enrollment_rates([t for t in similar if t.get("status") == "COMPLETED"])
    rate = rate_data.get("median", 1.5)

    # n sites to meet enrollment target
    if rate > 0:
        sites_needed_base = math.ceil(body.enrollment_target / (rate * 18))
        sites_needed_optimistic = math.ceil(body.enrollment_target / (rate * 1.3 * 18))
        sites_needed_conservative = math.ceil(body.enrollment_target / (rate * 0.7 * 18))
    else:
        sites_needed_base = body.n_sites_requested
        sites_needed_optimistic = max(1, body.n_sites_requested - 2)
        sites_needed_conservative = body.n_sites_requested + 5

    top_countries = [s["country"] for s in ranked_sites[:3]]

    optimizations = []
    if body.n_sites_requested < sites_needed_conservative:
        optimizations.append({
            "type": "site_count",
            "priority": "HIGH",
            "recommendation": f"Requested {body.n_sites_requested} sites may be insufficient. Conservative model needs {sites_needed_conservative} sites. Add buffer sites to compensate for 15-25% site underperformance.",
        })
    if geo_diversity.get("riskLevel") == "HIGH":
        optimizations.append({
            "type": "geographic_diversity",
            "priority": "MEDIUM",
            "recommendation": f"Shannon diversity H'={geo_diversity.get('shannonIndex', 0)} — high concentration risk. {geo_diversity.get('topCountry', '')} hosts {geo_diversity.get('topCountryShare', 0)}% of trials. Diversify across ≥5 countries.",
        })
    if user_loc and user_loc not in [s["country"] for s in ranked_sites[:10]]:
        optimizations.append({
            "type": "preferred_country",
            "priority": "LOW",
            "recommendation": f"Your preferred country ({user_loc}) is not in the top 10 ranked sites for this indication. Consider supplementing with high-performing countries from the ranking.",
        })

    return {
        "stage": 3,
        "stageName": "Site Selection & Activation",
        "rankedSites": ranked_sites[:15],
        "siteRequirements": {
            "requested": body.n_sites_requested,
            "neededBase": sites_needed_base,
            "neededOptimistic": sites_needed_optimistic,
            "neededConservative": sites_needed_conservative,
            "ratePerSitePerMonth": rate,
            "rateSource": rate_data.get("source"),
            "rateSampleNctIds": rate_data.get("sampleNctIds", []),
        },
        "activationTimelines": activation_months,
        "geographicDiversity": geo_diversity,
        "topCountries": top_countries,
        "optimizations": optimizations,
        "corpusSize": len(similar),
        "dataSources": {
            "clinicalTrials": f"https://clinicaltrials.gov/search?cond={body.condition}",
            "methodology": f"PyTrial-inspired ranking on {len(similar)}-trial corpus + Shannon diversity index",
        },
    }


# ─────────────────────────────────────────────────────────
# Stage 4: Regulatory & IND/CTA Submission
# ─────────────────────────────────────────────────────────

@router.post("/stage4/regulatory")
async def stage4_regulatory(body: Stage4Input):
    """
    Regulatory pathway analysis: IND timeline, key milestones, checklist,
    and designation opportunities (Orphan, BTD, Fast Track).
    """
    similar_completed = await _fetch_similar(body.condition, body.phase, status=["COMPLETED"], n=30)
    faers_data = await _fetch_faers(body.intervention or body.condition)
    pubmed_data = await _fetch_pubmed_count(body.condition, body.intervention)

    safety = score_safety_signal(faers_data)
    lit = score_literature_maturity(pubmed_data)

    # Timelines (FDA regulatory milestones, industry benchmarks)
    base_timelines = {
        "pre_ind_meeting": "1-3 months request + review",
        "ind_preparation": "3-6 months",
        "fda_ind_review": "30 calendar days (21 CFR 312.40)",
        "irb_approval": "1-3 months",
        "site_activation_after_ind": "2-4 months",
    }

    # Phase-specific path
    phase_path = {
        "PHASE1": {
            "expected_months_to_fda_approval": 6,
            "key_documents": ["Pre-IND meeting briefing package", "IND (Sections 1-16)", "Investigator Brochure", "Protocol", "Consent form"],
            "primary_risk": "Safety signal / stopping rules",
        },
        "PHASE2": {
            "expected_months_to_fda_approval": 8,
            "key_documents": ["IND amendment", "SPA request (if Phase 3 planned)", "DSMB charter", "SAP", "CRF specification"],
            "primary_risk": "Endpoint operationalization",
        },
        "PHASE3": {
            "expected_months_to_fda_approval": 10,
            "key_documents": ["SPA agreement", "IND amendment", "Risk management plan", "Interim analysis plan", "DSMB charter"],
            "primary_risk": "Protocol complexity and multiplicity",
        },
    }.get(body.phase, {
        "expected_months_to_fda_approval": 8,
        "key_documents": ["IND", "Protocol", "Consent form"],
        "primary_risk": "Phase-specific review",
    })

    # Designations
    designations = []
    if body.indication_rare:
        designations.append({
            "name": "Orphan Drug Designation (ODD)",
            "benefit": "7-year market exclusivity, 50% tax credit on clinical trial costs, waived FDA fees",
            "eligibility": "Disease affecting <200,000 in US",
            "timeline": "90 days from FDA ODD application",
            "url": "https://www.fda.gov/patients/rare-diseases-fda/orphan-drug-designation",
        })
    if safety.get("riskLevel") in ("LOW", "MODERATE") and lit.get("articleCount", 0) > 20:
        designations.append({
            "name": "Breakthrough Therapy Designation (BTD)",
            "benefit": "Intensive FDA guidance, cross-disciplinary reviews, rolling review",
            "eligibility": "Preliminary clinical evidence of substantial improvement over available therapy",
            "timeline": "60 days from receipt",
            "url": "https://www.fda.gov/patients/fast-track-breakthrough-therapy-accelerated-approval-priority-review/breakthrough-therapy",
        })
    if body.phase in ("PHASE1", "PHASE2"):
        designations.append({
            "name": "Fast Track Designation",
            "benefit": "More frequent meetings with FDA, rolling review",
            "eligibility": "Treats serious condition with unmet medical need",
            "timeline": "60 days from receipt",
            "url": "https://www.fda.gov/patients/fast-track-breakthrough-therapy-accelerated-approval-priority-review/fast-track",
        })

    # Checklist
    checklist = [
        {"item": "Pre-IND meeting briefing package", "due": "Month 1-2", "status": "pending"},
        {"item": "Investigator Brochure (IB)", "due": "Month 2-4", "status": "pending"},
        {"item": "Protocol v1.0", "due": "Month 3-5", "status": "pending"},
        {"item": "IND submission", "due": f"Month {5 if body.phase == 'PHASE1' else 6}", "status": "pending"},
        {"item": "FDA 30-day IND review", "due": "After IND submission", "status": "pending"},
        {"item": "IRB/IEC approval", "due": "Month 6-8 (parallel)", "status": "pending"},
        {"item": "Site qualification visits (SQVs)", "due": "Month 6-8", "status": "pending"},
        {"item": "CTA filing (EU, if applicable)", "due": "Month 5-7", "status": "pending"},
        {"item": "Data Privacy Agreement (GDPR, if EU)", "due": "Month 4-6", "status": "pending"},
    ]

    # Safety-driven risk
    if safety.get("riskLevel") == "HIGH":
        checklist.insert(3, {
            "item": "Enhanced safety monitoring plan (REMS consideration)",
            "due": "Month 2-3",
            "status": "URGENT",
        })

    optimizations = []
    if not body.has_prior_ind:
        optimizations.append({
            "type": "expedite",
            "priority": "HIGH",
            "recommendation": "Request Type B Pre-IND meeting with FDA to align on primary endpoint and clinical hold risk before full IND submission. Saves 3-6 months if feedback incorporated.",
            "timeline_impact": "Save 3-6 months",
        })
    if body.indication_rare and "Orphan Drug Designation (ODD)" in [d["name"] for d in designations]:
        optimizations.append({
            "type": "designation",
            "priority": "HIGH",
            "recommendation": "File ODD application in parallel with Pre-IND. Average 90-day FDA review vs 30-month for standard path. Critical for cost recovery.",
            "timeline_impact": "Parallel processing saves 0 additional months but unlocks 50% tax credit",
        })

    total_months_to_first_patient = phase_path.get("expected_months_to_fda_approval", 8) + 2  # +2 for site activation
    
    return {
        "stage": 4,
        "stageName": "Regulatory & IND/CTA Submission",
        "regulatoryPath": {
            "phase": body.phase,
            "country": "United States (FDA)",
            "expectedMonthsToFPI": total_months_to_first_patient,
            "keyDocuments": phase_path.get("key_documents", []),
            "primaryRisk": phase_path.get("primary_risk", ""),
        },
        "timelines": base_timelines,
        "designations": designations,
        "checklist": checklist,
        "safetyProfile": safety,
        "evidenceBase": lit,
        "optimizations": optimizations,
        "dataSources": {
            "faers": "https://open.fda.gov/apis/drug/event/",
            "fda_guidance": "https://www.fda.gov/science-research/clinical-trials-and-human-subject-protection/clinical-trials-guidance-documents",
        },
    }


# ─────────────────────────────────────────────────────────
# Stage 5: Enrollment & Recruitment Simulation
# ─────────────────────────────────────────────────────────

@router.post("/stage5/enrollment")
async def stage5_enrollment(body: Stage5Input):
    """
    Staggered Monte Carlo enrollment simulation with eligibility-driven
    screen failure model, data-derived rates, and scenario analysis.
    """
    similar = await fetch_large_corpus(body.condition, body.phase, status=["COMPLETED"], target_n=200)

    # Derive enrollment rate from real completed trials
    rate_data = derive_enrollment_rates(similar)
    rate = rate_data.get("median", 1.5)
    if rate <= 0:
        rate = 0.5

    # Estimate screen failure ratio from eligibility complexity of similar trials
    # Use average eligibility text from corpus
    elig_texts = [t.get("eligibilityCriteria", "") for t in similar if t.get("eligibilityCriteria")]
    avg_elig = elig_texts[0] if elig_texts else ""
    screen_model = estimate_screen_failure_ratio(avg_elig)
    screen_ratio = screen_model.get("screenToEnrollRatio", 4.5)

    # Run STAGGERED Monte Carlo simulation
    sim = simulate_enrollment_advanced(
        target=body.enrollment_target,
        n_sites=body.n_sites,
        rate_per_site=rate,
        dropout_rate=body.dropout_rate,
        n_simulations=body.n_simulations,
        site_activation_months=3,
        screen_to_enroll=screen_ratio,
    )

    # Scenario analysis
    scenarios = {}
    for scenario_name, multiplier in [("optimistic", 1.3), ("base", 1.0), ("conservative", 0.7)]:
        r = rate * multiplier
        months = round(body.enrollment_target / max(0.01, body.n_sites * r * (1 - body.dropout_rate)), 1)
        scenarios[scenario_name] = {
            "rateMultiplier": multiplier,
            "monthlyRatePerSite": round(r, 2),
            "estimatedMonths": min(120, months),
            "totalEnrolled": body.enrollment_target,
        }

    # Cost model
    screen_cost_per = 800
    enrolled_cost_per = 3500
    total_screening_cost = round(body.enrollment_target * screen_ratio * screen_cost_per)
    total_enrollment_cost = round(body.enrollment_target * enrolled_cost_per)
    expected_completers = round(body.enrollment_target * (1 - body.dropout_rate))

    # Delay risk factors
    delay_risks = []
    if body.n_sites < 5:
        delay_risks.append({
            "risk": "Insufficient site diversity",
            "probability": "HIGH",
            "impact": "Site underperformance can halt enrollment with no backup",
        })
    if body.dropout_rate > 0.15:
        delay_risks.append({
            "risk": "High dropout rate assumption",
            "probability": "HIGH",
            "impact": f"{int(body.dropout_rate*100)}% dropout → need {round(body.enrollment_target/(1-body.dropout_rate))} to enroll to achieve {body.enrollment_target} completers",
        })
    if screen_ratio > 6:
        delay_risks.append({
            "risk": "High screen failure rate",
            "probability": "MEDIUM",
            "impact": f"Screen-to-enroll ratio of {screen_ratio}:1 means {round(body.enrollment_target * screen_ratio)} screenings needed. Consider simplifying eligibility.",
        })

    optimizations = [
        {
            "type": "enrollment_strategy",
            "priority": "HIGH",
            "recommendation": "Implement eConsent + digital pre-screening (RAVE/Veeva) to reduce screen failure rate by 15-25%",
            "time_saving": f"~{round(scenarios['base']['estimatedMonths'] * 0.15, 1)} months",
            "cost_saving": f"${round(total_screening_cost * 0.2):,}",
        },
        {
            "type": "site_performance",
            "priority": "MEDIUM",
            "recommendation": "Trigger underperformance alert at Month 3 for sites enrolling <50% of target rate. Add replacement sites with 60-day notice.",
            "time_saving": "Prevents 2-4 month tail delays",
            "cost_saving": "Avoids full site restart costs (~$85K/site)",
        },
        {
            "type": "patient_retention",
            "priority": "MEDIUM",
            "recommendation": "Deploy patient engagement platform (text reminders, transport reimbursement, PRO app). Reduces dropout by 20-30%.",
            "time_saving": f"Saves {round(expected_completers * 0.25 * 2000 / 30):,} months of retrieval",
            "cost_saving": f"${round(expected_completers * 0.25 * enrolled_cost_per):,} in replacement enrollment",
        },
    ]

    return {
        "stage": 5,
        "stageName": "Enrollment & Recruitment Simulation",
        "simulation": {
            **sim,
            "nSimulations": body.n_simulations,
        },
        "scenarios": scenarios,
        "rateAnalysis": {
            "derivedRatePerSitePerMonth": rate,
            "rateSource": rate_data.get("source"),
            "rateSampleNctIds": rate_data.get("sampleNctIds", []),
            "corpusSize": len(similar),
        },
        "screenFailureModel": screen_model,
        "costModel": {
            "screenToEnrollRatio": screen_ratio,
            "screeningCostUSD": total_screening_cost,
            "enrollmentCostUSD": total_enrollment_cost,
            "totalRecruitmentCostUSD": total_screening_cost + total_enrollment_cost,
            "expectedCompleters": expected_completers,
        },
        "delayRisks": delay_risks,
        "optimizations": optimizations,
        "dataSources": {
            "clinicalTrials": f"https://clinicaltrials.gov/search?cond={body.condition}&status=COMPLETED",
            "methodology": sim.get("methodology", "Staggered Monte Carlo + Poisson"),
        },
    }


# ─────────────────────────────────────────────────────────
# Stage 6: Trial Execution & Monitoring
# ─────────────────────────────────────────────────────────

@router.post("/stage6/execution")
async def stage6_execution(body: Stage6Input):
    """
    Execution monitoring: protocol deviation risk, data quality projections,
    site monitoring plan, and operational efficiency scoring.
    """
    similar_all = await _fetch_similar(body.condition, body.phase, n=40)

    # Site monitoring model
    n_monitoring_visits = round(body.duration_months / 3)  # quarterly SDV
    monitoring_cost_per_visit = 4500  # USD per site monitoring visit
    total_monitoring_cost = round(body.n_sites * n_monitoring_visits * monitoring_cost_per_visit)

    # Risk-based monitoring (RBM) reduction
    rbm_savings = round(total_monitoring_cost * 0.35)  # RBM saves 35% per Medidata analysis

    # Protocol deviation risk
    deviation_rate_per_patient_per_month = 0.12  # industry average
    expected_deviations = round(body.n_patients * body.duration_months * deviation_rate_per_patient_per_month)
    major_deviation_rate = 0.08
    expected_major_deviations = round(expected_deviations * major_deviation_rate)

    # Data quality metrics
    missing_data_rate = 0.03  # 3% industry median
    expected_missing_datapoints = round(body.n_patients * 12 * missing_data_rate)  # assuming 12 CRF fields

    # Operational efficiency score
    eff_factors = []
    eff_score = 70.0  # base

    # Phase bonus
    if body.phase in ("PHASE1", "PHASE2"):
        eff_score += 5
        eff_factors.append("Phase 1/2: smaller teams, faster decision cycles (+5)")
    
    # Site count impact
    if body.n_sites > 50:
        eff_score -= 10
        eff_factors.append("Large site network (>50 sites) increases coordination complexity (-10)")
    elif body.n_sites <= 15:
        eff_score += 8
        eff_factors.append("Focused site network (≤15 sites): tighter oversight (+8)")

    # Duration impact
    if body.duration_months > 36:
        eff_score -= 8
        eff_factors.append("Long duration (>36 months): higher amendment/staff turnover risk (-8)")

    # Database lock timeline
    db_lock_months = max(2, round(body.n_patients * 0.02))  # ~0.02 months per patient for cleaning
    total_study_months = body.duration_months + db_lock_months + 6  # +6 for analysis/reporting

    # DSMB / safety monitoring
    dsmb_meetings = max(2, body.duration_months // 6)

    # KPIs
    kpis = [
        {"metric": "Site Initiation", "target": "≥80% sites activated within 60 days of FPI", "monitoring": "Weekly"},
        {"metric": "Enrollment Rate", "target": f"≥{round(body.n_patients / body.duration_months, 1)} patients/month", "monitoring": "Weekly"},
        {"metric": "Protocol Deviations", "target": "<5% major deviations", "monitoring": "Monthly"},
        {"metric": "Data Entry Lag", "target": "<7 days from visit to entry", "monitoring": "Bi-weekly"},
        {"metric": "Screen Failure Rate", "target": "<60%", "monitoring": "Monthly"},
        {"metric": "Dropout Rate", "target": "<10%", "monitoring": "Monthly"},
        {"metric": "SAE Reporting", "target": "100% within 24h to FDA", "monitoring": "Continuous"},
    ]

    optimizations = [
        {
            "type": "monitoring",
            "recommendation": "Implement Risk-Based Monitoring (RBM/SDR) per FDA guidance (Aug 2023). Centralized monitoring + targeted on-site visits saves 35% vs traditional SDV-only.",
            "cost_saving": f"${rbm_savings:,}",
        },
        {
            "type": "data_quality",
            "recommendation": "Deploy eCOA/ePRO for patient-reported outcomes (Medidata Rave, Veeva Vault). Reduces transcription errors and missing data by 40-60%.",
            "cost_saving": f"${round(expected_missing_datapoints * 200):,} in data query resolution",
        },
        {
            "type": "centralized_review",
            "recommendation": f"Schedule {dsmb_meetings} DSMB reviews. Use adaptive design provisions if interim results at 50% enrollment justify futility or efficacy conclusion.",
            "timeline_impact": "Early futility stop saves 40-60% remaining trial cost",
        },
    ]

    return {
        "stage": 6,
        "stageName": "Trial Execution & Monitoring",
        "operationalMetrics": {
            "nPatients": body.n_patients,
            "durationMonths": body.duration_months,
            "nSites": body.n_sites,
            "totalStudyMonths": total_study_months,
            "dbLockMonths": db_lock_months,
        },
        "monitoringPlan": {
            "nMonitoringVisits": n_monitoring_visits,
            "monitoringCostUSD": total_monitoring_cost,
            "rbmSavingsUSD": rbm_savings,
            "dsmbMeetings": dsmb_meetings,
        },
        "deviationRisk": {
            "expectedDeviations": expected_deviations,
            "expectedMajorDeviations": expected_major_deviations,
            "missingDatapointsEstimated": expected_missing_datapoints,
        },
        "efficiencyScore": {
            "score": round(min(100, eff_score), 1),
            "factors": eff_factors,
        },
        "kpis": kpis,
        "optimizations": optimizations,
        "dataSources": {
            "methodology": "Industry benchmark model: Medidata Insights 2023, Tufts CSDD, ICH E6(R3) guidelines",
        },
    }


# ─────────────────────────────────────────────────────────
# Stage 7: Outcomes & Data Analysis
# ─────────────────────────────────────────────────────────

@router.post("/stage7/outcomes")
async def stage7_outcomes(body: Stage7Input):
    """
    Outcome prediction with ensemble ML (GB+RF, cross-validated), PRR/ROR
    safety outcomes, TF-IDF trial similarity benchmark, and GO/NO-GO framework.
    """
    # Paginated corpus + PRR safety + PubMed — all concurrent
    corpus_task = fetch_large_corpus(body.condition, body.phase, target_n=200)
    safety_task = compute_prr_signals(body.intervention or body.condition)
    pubmed_task = _fetch_pubmed_count(body.condition, body.intervention)

    similar_all, safety_data, pubmed_data = await asyncio.gather(
        corpus_task, safety_task, pubmed_task
    )

    base_trial = {
        "phase": [body.phase],
        "masking": body.masking,
        "allocation": body.allocation,
        "enrollmentCount": body.enrollment_target,
        "primaryOutcomes": [body.primary_endpoint] if body.primary_endpoint else [],
        "conditions": [body.condition],
        "interventions": [{"name": body.intervention or body.condition, "type": "DRUG"}],
        "sponsorClass": body.sponsor_type,
        "countries": [],
        "eligibilityCriteria": "",
        "startDate": "",
        "completionDate": "",
    }

    # Ensemble ML prediction (GB+RF, cross-validated)
    ml_pred = predict_outcome_ensemble(base_trial, similar_all)

    # Full analysis (empirical completion ratio from corpus)
    completed_n = sum(1 for t in similar_all if t.get("status") == "COMPLETED")
    terminated_n = sum(1 for t in similar_all if t.get("status") in ("TERMINATED", "WITHDRAWN"))
    resolved_n = completed_n + terminated_n
    empirical_rate = round(completed_n / max(1, resolved_n) * 100, 1)

    # Composite probability: 40% ML + 20% empirical + 20% safety + 20% design
    ml_prob = ml_pred.get("probability", 50)
    safety_score = safety_data.get("safetyScore", 70)
    lit_score = score_literature_maturity(pubmed_data)
    design_bonus = 10 if body.masking == "DOUBLE" else 5 if body.masking == "SINGLE" else 0
    composite_prob = round(
        0.4 * ml_prob +
        0.2 * empirical_rate +
        0.2 * safety_score +
        0.2 * (50 + design_bonus),
        1
    )

    full_pred = {
        "probability": composite_prob,
        "rating": "HIGH" if composite_prob >= 65 else "MODERATE" if composite_prob >= 45 else "LOW",
        "factors": [
            {"factor": "ML Ensemble Prediction", "score": round(ml_prob * 0.4, 1), "weight": 40, "description": ml_pred.get("method")},
            {"factor": "Empirical Completion Rate", "score": round(empirical_rate * 0.2, 1), "weight": 20, "description": f"{completed_n}/{resolved_n} resolved trials completed"},
            {"factor": "Safety Profile (PRR/ROR)", "score": round(safety_score * 0.2, 1), "weight": 20, "description": safety_data.get("reasoning", "")},
            {"factor": "Design Rigor", "score": round((50 + design_bonus) * 0.2, 1), "weight": 20, "description": f"{body.masking} masking, {body.allocation} allocation"},
        ],
    }

    # TF-IDF similar trial ranking
    similar_ranked = compute_trial_similarity(base_trial, similar_all[:50], top_k=10)

    # Regulatory submission timeline (after DBL)
    submission_timelines = {
        "PHASE1": {
            "nda_bla_filing_months": None,
            "note": "Phase 1 results → Phase 2 design; no NDA/BLA at this stage",
        },
        "PHASE2": {
            "nda_bla_filing_months": None,
            "note": "Phase 2 results → Phase 3 go/no-go; End-of-Phase-2 (EOP2) meeting with FDA within 6 months of last patient",
        },
        "PHASE3": {
            "nda_bla_filing_months": 12,
            "fda_review_months": 12,
            "priority_review_months": 6,
            "total_to_approval_months": 24,
            "note": "Standard NDA review 10-12 months; Priority Review 6 months if BTD/ODD/Fast Track",
        },
    }

    # GO/NO-GO decision framework
    go_probability = composite_prob
    no_go_threshold = 40
    go_decision = "GO" if go_probability >= 60 else "CONDITIONAL GO" if go_probability >= no_go_threshold else "NO-GO"

    # Next phase recommendations
    next_phase_recs = []
    if body.phase == "PHASE2" and go_probability >= 60:
        next_phase_recs.append(f"Proceed to Phase 3 with {round(body.enrollment_target * 5)} patients in 3:1 active:placebo design")
        next_phase_recs.append("Request End-of-Phase-2 meeting with FDA within 3 months of last patient out")
    elif body.phase == "PHASE3" and go_probability >= 60:
        next_phase_recs.append("Prepare NDA/BLA filing package. Expect FDA review in 10-12 months (Priority: 6 months if designated)")
        next_phase_recs.append("Begin Phase 4 post-marketing commitment planning now")
    elif go_probability < no_go_threshold:
        next_phase_recs.append("Consider pivoting: adaptive design, biomarker-enriched population, or combination therapy")
        next_phase_recs.append("Re-assess safety signals and refine eligibility criteria before re-running simulation")

    # NPV (placeholder — user should provide market size)
    market_size_estimate = 500e6
    npv_go = round(market_size_estimate * (go_probability / 100) * 0.15 - 50e6)

    optimizations = [
        {
            "type": "analysis",
            "priority": "HIGH",
            "recommendation": "Pre-register SAP (Statistical Analysis Plan) on clinicaltrials.gov before database lock. Required for top-tier journal publication and prevents selective reporting allegations.",
        },
        {
            "type": "regulatory",
            "priority": "HIGH",
            "recommendation": "Submit Clinical Study Report (CSR) to FDA within 12 months of study completion per ICH E3 guideline. Delayed CSR is a major FDA inspection finding.",
        },
        {
            "type": "publication",
            "priority": "MEDIUM",
            "recommendation": "Plan primary outcome publication within 24 months. FDAAA 801 mandates results posting on ClinicalTrials.gov within 12 months of completion.",
        },
    ]

    return {
        "stage": 7,
        "stageName": "Outcomes & Data Analysis",
        "outcomePrediction": {
            "goProbability": round(go_probability, 1),
            "goDecision": go_decision,
            "successProbabilityML": ml_pred.get("probability"),
            "mlMethod": ml_pred.get("method"),
            "crossValidation": ml_pred.get("crossValidation"),
            "trainingSamples": ml_pred.get("trainingSamples"),
            "classBalance": ml_pred.get("classBalance"),
            "individualModels": ml_pred.get("individualModels"),
            "fullAnalysis": full_pred,
        },
        "similarTrialsBenchmark": {
            "topSimilar": similar_ranked[:8],
            "corpusSize": len(similar_all),
        },
        "safetyOutcomes": {
            "safetyScore": safety_data.get("safetyScore"),
            "riskLevel": safety_data.get("riskLevel"),
            "nSignals": safety_data.get("nSignals"),
            "nSeriousReactions": safety_data.get("nSeriousReactions"),
            "method": safety_data.get("method"),
            "reasoning": safety_data.get("reasoning"),
            "topSignals": (safety_data.get("signals") or [])[:5],
        },
        "literatureContext": lit_score,
        "regulatoryTimeline": submission_timelines.get(body.phase, {}),
        "goNoGoFramework": {
            "decision": go_decision,
            "probability": round(go_probability, 1),
            "threshold": no_go_threshold,
            "npvEstimateUSD": npv_go,
            "nextPhaseRecommendations": next_phase_recs,
        },
        "optimizations": optimizations,
        "dataSources": {
            "clinicalTrials": f"https://clinicaltrials.gov/search?cond={body.condition}",
            "faers": safety_data.get("proofLink", "https://open.fda.gov/apis/drug/event/"),
            "pubmed": pubmed_data.get("proofLink", "https://pubmed.ncbi.nlm.nih.gov"),
            "methodology": f"Ensemble ML (GB+RF) on {len(similar_all)}-trial corpus + PRR/ROR pharmacovigilance + TF-IDF similarity",
        },
    }


# ─────────────────────────────────────────────────────────
# Full Pipeline (all 7 stages in parallel)
# ─────────────────────────────────────────────────────────

@router.post("/simulate-full")
async def simulate_full(body: FullSimInput):
    """Run all 7 stages concurrently and return unified pipeline results."""
    results = await asyncio.gather(
        stage1_discovery(body.stage1),
        stage2_protocol_design(body.stage2),
        stage3_site_selection(body.stage3),
        stage4_regulatory(body.stage4),
        stage5_enrollment(body.stage5),
        stage6_execution(body.stage6),
        stage7_outcomes(body.stage7),
        return_exceptions=True,
    )

    output = {}
    stage_names = ["discovery", "protocolDesign", "siteSelection", "regulatory", "enrollment", "execution", "outcomes"]
    for i, (name, result) in enumerate(zip(stage_names, results)):
        if isinstance(result, Exception):
            output[name] = {"error": str(result), "stage": i + 1}
        else:
            output[name] = result

    return {"pipeline": output, "totalStages": 7}
