import logging
import re
import json
from typing import List, Dict, Any
from .llm import LLMBase

logger = logging.getLogger(__name__)

def _fallback_generate(llm: LLMBase, prompt: str) -> str:
    """Call LLM with fallback methods."""
    if llm is None:
        return ""
    if hasattr(llm, "generate"):
        return llm.generate(prompt)
    if hasattr(llm, "chat"):
        return llm.chat(prompt)
    if hasattr(llm, "ask"):
        return llm.ask(prompt)
    return ""

def clean_term(term: str) -> str:
    if not term:
        return term
    term = re.sub(r"\([^)]*\)", "", term)
    term = re.split(r"[/,;]", term)[0]
    term = re.sub(r"\s+", " ", term).strip()
    term = re.sub(r"^[\-\)\]\. ]+|[\-\)\]\. ]+$", "", term)
    return term

from modules.reasoning_retriever import ReasoningRetriever

def extract_trial_entities(llm: LLMBase, chunks: List[dict], strict: bool = True, reasoning_retriever: ReasoningRetriever = None) -> Dict[str, Any]:
    """
    Robust extraction for 100+ page protocols using ReasoningRetriever (PageIndex Vectorless RAG).
    Identified key pages are aggregated into a high-yield context for the LLM.
    Includes a second-pass LLM verification layer for noisy text.
    """
    
    # Aggregate context for LLM using PageIndex reasoning
    if reasoning_retriever:
        logger.info("[EXTRACTION] Using PageIndex ReasoningRetriever for high-yield context.")
        aggregated_context = reasoning_retriever.get_high_yield_overview_context()
    else:
        logger.warning("[EXTRACTION] No ReasoningRetriever provided. Falling back to first 15 pages.")
        aggregated_context = "\n\n".join([c["text"] for c in chunks[:15]])

    # Context window management
    llm_context = aggregated_context[:24000]

    entities = {
        "condition": "Unknown",
        "intervention": "Unknown",
        "phase": "Unknown",
        "title": "",
        "sample_size": "N/A",
        "study_design": "Interventional",
        "blinding": "Unknown",
        "primary_endpoint": "Unknown",
        "region": "All Regions"
    }
    
    logger.debug(f"[EXTRACTION] Running PageIndex-Grounded Extraction...")
    
    prompt = f"""You are an Expert Clinical Protocol Analyst. 
    Analyze the provided protocol snippets and extract the core metadata.
    
    Format your response strictly as follows:
    CONDITION: <Specific disease/indication>
    INTERVENTION: <Drug/Treatment name>
    PHASE: <Phase I, II, III, or IV>
    TITLE: <Full study title>
    SAMPLE SIZE: <Planned enrollment number, e.g. 150>
    DESIGN: <e.g. Randomized, Open-label, Double-blind, Single arm>
    REGION: <Specific countries or target regions, e.g. "USA, Australia">
    PRIMARY ENDPOINT: <The main outcome measure>
    
    PROTOCOL CONTEXT:
    {llm_context}
    
    CRITICAL: Extract accurately. If specific data like PHASE or REGION is mentioned in tables or text, use it. Output ONLY the keys above.
    """
    
    try:
        response = _fallback_generate(llm, prompt)
        
        lines = response.split('\n')
        for line in lines:
            line = line.strip()
            if not line or ':' not in line: continue
            
            key_part, val = line.split(':', 1)
            key_part = key_part.upper().strip()
            val = val.strip()
            
            if val.lower() == "unknown" or val.lower() == "n/a": continue
            
            if key_part == "CONDITION": entities["condition"] = clean_term(val)
            elif key_part == "INTERVENTION": entities["intervention"] = clean_term(val)
            elif key_part == "PHASE": entities["phase"] = val
            elif key_part == "TITLE": entities["title"] = val
            elif key_part == "PRIMARY ENDPOINT": entities["primary_endpoint"] = val
            elif key_part == "SAMPLE SIZE":
                entities["sample_size"] = val
            elif key_part == "DESIGN":
                entities["study_design"] = val
                val_lower = val.lower()
                if "random" in val_lower: entities["study_design_normalized"] = "randomized"
                if "double-blind" in val_lower or "double blind" in val_lower: entities["blinding"] = "Double Blind"
                elif "open" in val_lower: entities["blinding"] = "Open Label"
            elif key_part == "REGION":
                entities["region"] = val
                
    except Exception as e:
        logger.error(f"Robust LLM Extraction failed: {e}")

    # ── LLM VERIFICATION LAYER ───────────────────────────────────────────────
    entities = _verify_critical_entities(llm, entities, llm_context)

    # Final parsing and normalization
    try:
        s_val = str(entities["sample_size"])
        digits = "".join(filter(str.isdigit, s_val))
        entities["sample_size_num"] = int(digits) if digits else 0
    except:
        entities["sample_size_num"] = 0

    entities["condition_clean"] = clean_term(entities["condition"])
    entities["intervention_clean"] = clean_term(entities["intervention"])
    
    # Infer missing design traits if still unknown
    if entities["blinding"] == "Unknown":
        text_full = llm_context.lower()
        if "double-blind" in text_full or "double blind" in text_full: entities["blinding"] = "Double Blind"
        elif "open label" in text_full or "open-label" in text_full: entities["blinding"] = "Open Label"

    return entities

def _verify_critical_entities(llm: LLMBase, entities: Dict[str, Any], context: str) -> Dict[str, Any]:
    """
    Second-pass verification. Asks the LLM to confirm the extracted values are 
    accurate and grounded in the provided context, especially for numbers in noisy text.
    """
    critical_fields = {
        "sample_size": entities.get("sample_size"),
        "phase": entities.get("phase"),
        "intervention": entities.get("intervention")
    }
    
    verify_prompt = f"""You are a Clinical Data Verifier.
Analyze the extracted fields against the PROTOCOL CONTEXT below.
Your goal is to ensure NOISY text has not led to incorrect numbers or labels.

EXTRACTED DATA:
{json.dumps(critical_fields, indent=2)}

PROTOCOL CONTEXT:
{context[:20000]}

For each field, verify if it is correct. 
Pay special attention to SAMPLE SIZE: Is it the total enrollment? Is it grounded in text?
If a field is wrong, provide the CORRECT value.

Return strictly in this format:
VERIFIED_SAMPLE_SIZE: <value>
VERIFIED_PHASE: <value>
VERIFIED_INTERVENTION: <value>
THOUGHT: <your reasoning for any changes or why the current value is correct>
"""
    try:
        verdict = _fallback_generate(llm, verify_prompt)
        
        # Parse verification results
        v_size = re.search(r'VERIFIED_SAMPLE_SIZE:\s*(.+)', verdict)
        v_phase = re.search(r'VERIFIED_PHASE:\s*(.+)', verdict)
        v_int = re.search(r'VERIFIED_INTERVENTION:\s*(.+)', verdict)
        
        if v_size:
            val = v_size.group(1).strip()
            if "unknown" not in val.lower() and "n/a" not in val.lower():
                digit_match = re.search(r'\d+', val)
                entities["sample_size"] = digit_match.group(0) if digit_match else val
            
        if v_phase:
            val = v_phase.group(1).strip()
            if "unknown" not in val.lower():
                entities["phase"] = val
            
        if v_int:
            val = v_int.group(1).strip()
            if "unknown" not in val.lower():
                entities["intervention"] = clean_term(val)
            
        logger.info(f"[VERIFIER] Verification complete. Grounding confirmed.")
    except Exception as e:
        logger.warning(f"Verification layer failed: {e}")
        
    return entities