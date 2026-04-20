from __future__ import annotations
from dataclasses import dataclass, field
from typing import Literal

Severity = Literal["critical", "major", "minor", "info"]
Category = Literal[
    "ICH_E6", "ICH_E8", "ICH_E9", "ICH_E10",
    "FDA_21CFR312", "FDA_21CFR50", "FDA_21CFR56",
    "CONSORT", "WHO_ICTRP"
]


@dataclass
class ComplianceIssue:
    id: str
    category: Category
    severity: Severity
    rule: str
    description: str
    recommendation: str
    section: str
    reference: str


def check_protocol_compliance(protocol: dict) -> list[ComplianceIssue]:
    issues: list[ComplianceIssue] = []

    title = protocol.get("title", "")
    phase = protocol.get("phase", [])
    primary_outcomes = protocol.get("primaryOutcomes", [])
    secondary_outcomes = protocol.get("secondaryOutcomes", [])
    eligibility = protocol.get("eligibilityCriteria", "")
    enrollment = protocol.get("enrollmentCount")
    design = protocol.get("interventionModel", "")
    masking = protocol.get("masking", "")
    allocation = protocol.get("allocation", "")
    start_date = protocol.get("startDate", "")
    completion_date = protocol.get("completionDate", "")
    sponsor = protocol.get("sponsorName", "")
    countries = protocol.get("countries", [])
    study_type = protocol.get("studyType", "")

    if not primary_outcomes:
        issues.append(ComplianceIssue(
            id="E9_001", category="ICH_E9", severity="critical",
            rule="Primary Endpoint Required",
            description="No primary efficacy endpoint defined in the protocol.",
            recommendation="Define at least one primary endpoint with a clear, pre-specified, measurable outcome.",
            section="Objectives & Endpoints",
            reference="ICH E9 §2.2.1"
        ))
    elif len(primary_outcomes) > 3:
        issues.append(ComplianceIssue(
            id="E9_002", category="ICH_E9", severity="major",
            rule="Multiple Primary Endpoints",
            description=f"{len(primary_outcomes)} primary endpoints defined. Multiple primary endpoints require multiplicity correction.",
            recommendation="Apply a pre-specified multiplicity adjustment procedure (e.g., Bonferroni, hierarchical testing) or reduce to a single primary endpoint.",
            section="Objectives & Endpoints",
            reference="ICH E9 §2.2.2 / ICH E9(R1)"
        ))

    if not eligibility:
        issues.append(ComplianceIssue(
            id="E6_001", category="ICH_E6", severity="critical",
            rule="Eligibility Criteria Missing",
            description="No inclusion/exclusion criteria specified.",
            recommendation="Define clear, objective inclusion and exclusion criteria including age, sex, diagnosis, prior therapy, and contraindications.",
            section="Eligibility Criteria",
            reference="ICH E6(R2) §6.5"
        ))
    else:
        elig_lower = eligibility.lower()
        if "pregnancy" not in elig_lower and "pregnant" not in elig_lower:
            if "oncology" not in title.lower() and "cancer" not in title.lower():
                issues.append(ComplianceIssue(
                    id="E6_002", category="ICH_E6", severity="major",
                    rule="Pregnancy Status Not Addressed",
                    description="Eligibility criteria do not appear to address pregnancy status for participants of childbearing potential.",
                    recommendation="Explicitly state requirements for pregnancy testing, contraception, and handling of participants who become pregnant during the trial.",
                    section="Eligibility Criteria",
                    reference="ICH E6(R2) §6.5.2 / FDA 21 CFR 312.32"
                ))

        if "informed consent" not in elig_lower and "consent" not in elig_lower:
            issues.append(ComplianceIssue(
                id="CFR50_001", category="FDA_21CFR50", severity="critical",
                rule="Informed Consent Not Referenced",
                description="Eligibility criteria do not reference informed consent requirements.",
                recommendation="Add explicit requirement that participants must provide written informed consent prior to any study-related procedures.",
                section="Eligibility Criteria",
                reference="FDA 21 CFR Part 50 / ICH E6(R2) §4.8"
            ))

    if not enrollment or enrollment < 10:
        if phase and any(p in ["PHASE3", "PHASE4"] for p in phase):
            issues.append(ComplianceIssue(
                id="E9_003", category="ICH_E9", severity="major",
                rule="Sample Size Inadequate for Phase",
                description=f"Enrollment count ({enrollment}) appears insufficient for a Phase 3/4 study.",
                recommendation="Perform formal sample size calculation with specified power (≥80%), significance level (α=0.05), and expected effect size. Document assumptions.",
                section="Sample Size",
                reference="ICH E9 §3.5 / FDA Guidance on Adaptive Designs"
            ))

    if allocation == "RANDOMIZED" and not masking:
        issues.append(ComplianceIssue(
            id="E10_001", category="ICH_E10", severity="major",
            rule="Blinding Not Specified for Randomized Trial",
            description="Study is randomized but masking/blinding strategy is not clearly defined.",
            recommendation="Specify blinding level (open-label, single-blind, double-blind) and justify choice. If open-label, provide rationale.",
            section="Study Design",
            reference="ICH E10 / CONSORT 2010 Item 11a"
        ))

    if allocation == "RANDOMIZED" and "random" not in (eligibility or "").lower():
        issues.append(ComplianceIssue(
            id="E6_003", category="ICH_E6", severity="minor",
            rule="Randomization Procedure Not Detailed",
            description="Randomization method not specified in protocol.",
            recommendation="Detail the randomization method (e.g., central randomization, block randomization, stratified randomization), allocation ratio, and concealment procedures.",
            section="Study Design",
            reference="ICH E6(R2) §6.7 / CONSORT Item 8a"
        ))

    if not start_date:
        issues.append(ComplianceIssue(
            id="CFR312_001", category="FDA_21CFR312", severity="minor",
            rule="Study Timeline Not Specified",
            description="Start date or estimated timeline not provided.",
            recommendation="Provide estimated start date, enrollment duration, treatment period, and follow-up period with justification.",
            section="Study Timeline",
            reference="FDA 21 CFR 312.23(a)(7)"
        ))

    if not sponsor:
        issues.append(ComplianceIssue(
            id="CFR312_002", category="FDA_21CFR312", severity="major",
            rule="Sponsor Information Missing",
            description="Sponsor/investigator information not specified.",
            recommendation="Identify the trial sponsor, principal investigator, and IRB/IEC responsible for oversight.",
            section="Administrative",
            reference="FDA 21 CFR 312.23(a)(2)"
        ))

    if len(countries) > 5 and study_type == "INTERVENTIONAL":
        issues.append(ComplianceIssue(
            id="E6_004", category="ICH_E6", severity="info",
            rule="Multi-Regional Considerations",
            description=f"Trial spans {len(countries)} countries. Additional regulatory requirements may apply.",
            recommendation="Ensure regional regulatory submissions (EMA, PMDA, etc.) are planned. Consider MRCT framework per FDA/ICH E17 guidance.",
            section="Administrative",
            reference="ICH E17 / FDA MRCT Guidance (2019)"
        ))

    if study_type == "INTERVENTIONAL" and not secondary_outcomes:
        issues.append(ComplianceIssue(
            id="CONSORT_001", category="CONSORT", severity="minor",
            rule="Secondary Endpoints Not Defined",
            description="No secondary endpoints specified for this interventional trial.",
            recommendation="Pre-specify secondary endpoints with clear hierarchy to support benefit-risk assessment.",
            section="Objectives & Endpoints",
            reference="CONSORT 2010 Item 6a"
        ))

    if not any(p in (phase or []) for p in ["PHASE1", "EARLY_PHASE1"]) and study_type == "INTERVENTIONAL":
        if not (eligibility and "monitor" in eligibility.lower()):
            issues.append(ComplianceIssue(
                id="E6_005", category="ICH_E6", severity="info",
                rule="Safety Monitoring Plan",
                description="Independent safety monitoring committee (DSMB/IDMC) not mentioned.",
                recommendation="For Phase 2/3 interventional trials, consider establishing a Data Safety Monitoring Board (DSMB) per ICH E6 §5.5 and describe interim analysis stopping rules.",
                section="Safety Monitoring",
                reference="ICH E6(R2) §5.5.2 / FDA DSMB Guidance"
            ))

    if phase and "PHASE3" in phase:
        issues.append(ComplianceIssue(
            id="ICTRP_001", category="WHO_ICTRP",
            severity="info",
            rule="Registry Compliance Required",
            description="Phase 3 trials must be registered in WHO ICTRP-recognized registry before first patient enrollment.",
            recommendation="Ensure registration in ClinicalTrials.gov, EU CTR, or other ICTRP-recognized registry. Verify Trial Registration Number is included in publications.",
            section="Registration",
            reference="WHO ICTRP / ICMJE Requirements"
        ))

    return issues


def calculate_compliance_score(issues: list[ComplianceIssue]) -> dict:
    weights = {"critical": 25, "major": 10, "minor": 5, "info": 0}
    penalty = sum(weights[i.severity] for i in issues)
    score = max(0, 100 - penalty)

    by_category: dict[str, int] = {}
    for issue in issues:
        by_category[issue.category] = by_category.get(issue.category, 0) + 1

    return {
        "score": score,
        "grade": "A" if score >= 90 else "B" if score >= 75 else "C" if score >= 60 else "D",
        "totalIssues": len(issues),
        "critical": sum(1 for i in issues if i.severity == "critical"),
        "major": sum(1 for i in issues if i.severity == "major"),
        "minor": sum(1 for i in issues if i.severity == "minor"),
        "info": sum(1 for i in issues if i.severity == "info"),
        "byCategory": by_category,
    }
