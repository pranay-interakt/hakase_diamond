from __future__ import annotations
import json
import logging
from typing import Dict, Any
from .llm import build_llm
import yaml
from pathlib import Path

logger = logging.getLogger(__name__)

# Global shared LLM instance for reasoning
_llm_instance = None

def get_llm():
    global _llm_instance
    if _llm_instance is None:
        try:
            config_path = Path(__file__).parent.parent.parent / "config.yaml"
            with open(config_path, "r") as f:
                config = yaml.safe_load(f)
            _llm_instance = build_llm(config)
        except Exception as e:
            logger.warning(f"Failed to initialize LLM: {e}")
    return _llm_instance

def analyze_layer(layer_index: int, layer_name: str, shared_data: Dict[str, Any], user_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Reasoning logic that uses shared data (from actual APIs) to estimate and simulate
    dynamic parameters for each clinical trial layer.
    """
    llm = get_llm()
    if not llm:
        return {"reasoning_dynamic": False, "note": "LLM reasoning offline", "dynamic_optimizations": []}
    
    # Extract concise shared data for the LLM to avoid context window explosion
    ctgov = shared_data.get("ctgov", {}).get("data", [])
    faers_reports = shared_data.get("faers", {}).get("totalReports", 0)
    pubmed_count = shared_data.get("pubmed", {}).get("articleCount", 0)
    
    n_completed = sum(1 for t in ctgov if t.get("status") == "COMPLETED")
    n_active = sum(1 for t in ctgov if t.get("status") in ("RECRUITING", "ACTIVE_NOT_RECRUITING"))
    
    prompt = f"""
    You are Hakase AI, a clinical trial simulation engine.
    Analyze Stage {layer_index}: {layer_name}.
    We fetched REAL API data for the indication: {user_params.get('condition', 'Unknown')}.
    Data sharing context:
    - {len(ctgov)} total similar trials ({n_completed} completed, {n_active} active).
    - OpenFDA FAERS adverse event reports: {faers_reports}.
    - PubMed articles matching condition: {pubmed_count}.
    
    User Parameters for this layer:
    {json.dumps(user_params, indent=2)}

    Task:
    Provide an estimation of trial risks, execution bottlenecks, and 3 specific actionable optimizations (cost/timeline impacts) for this layer.
    Output MUST be strictly valid JSON format with keys:
    "estimated_risks" (list of strings),
    "dynamic_optimizations" (list of dicts with 'type', 'priority' (HIGH/MEDIUM/LOW), 'recommendation', 'impact_metric'),
    "layer_reasoning_summary" (string).
    """

    try:
        response = llm.generate(prompt)
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        return json.loads(response)
    except Exception as e:
        logger.error(f"Reasoning logic parsing failed for Stage {layer_index}: {e}")
        return {
            "estimated_risks": ["Risk analysis defaulted (LLM parse error)"],
            "dynamic_optimizations": [],
            "layer_reasoning_summary": "Failed to parse dynamic reasoning from shared trial API data."
        }
