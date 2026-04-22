from __future__ import annotations
import logging
import re
import difflib
from typing import List, Dict, Optional, Any, Union

logger = logging.getLogger(__name__)

# ── Section taxonomy & Synonyms ───────────────────────────────────────────────
SECTION_ANCHORS: Dict[str, List[str]] = {
    "synopsis":       ["synopsis", "study summary", "protocol summary", "abstract", "executive summary"],
    "objectives":     ["objective", "primary objective", "secondary objective", "study goal", "purpose"],
    "endpoints":      ["endpoint", "outcome measure", "efficacy variable", "primary endpoint", "estimand"],
    "design":         ["study design", "trial design", "methodology", "randomisation", "randomization", "blinding", "open-label", "study plan"],
    "eligibility":    ["inclusion criteria", "exclusion criteria", "eligibility", "selection of subjects", "patient population", "criteria for evaluation"],
    "dosing":         ["dose", "dosage", "administration", "posology", "treatment schedule", "study drug preparation"],
    "schedule":       ["schedule of events", "assessment schedule", "visit schedule", "flowchart", "study calendar", "time and events"],
    "adverse_events": ["adverse event", "adr", "safety monitoring", "toxicity", "tolerability", "serious adverse"],
    "stopping_rules": ["stopping rule", "discontinuation", "withdrawal criteria", "early termination", "subject withdrawal"],
    "statistics":     ["statistical analysis", "sample size", "power calculation", "efficacy analysis", "biostatistics", "statistical methods"],
    "ethics":         ["ethics committee", "irb", "institutional review", "informed consent", "gcp", "good clinical practice"],
    "regulatory":     ["regulatory", "ema", "fda", "ich", "competent authority", "marketing authorisation"],
    "investigators":  ["investigator", "principal investigator", "coordinating investigator"],
    "sites":          ["study site", "clinical site", "site selection", "participating centre", "study location"],
}

SYNONYMS = {
    "drug": ["medication", "treatment", "intervention", "therapy", "agent", "product"],
    "disease": ["condition", "indication", "disorder", "illness", "syndrome"],
    "patient": ["subject", "participant", "volunteer"],
    "safety": ["adverse", "toxicity", "tolerability", "risk", "hazard"],
    "efficacy": ["effectiveness", "benefit", "outcome", "response"]
}

class PageIndex:
    def __init__(self):
        self.pages: List[Dict] = []          
        self.index: Dict[str, List[int]] = {}  
        self.toc: List[Dict] = []            
        self.tree: Dict[str, Any] = {}       

    def build(self, pages: List[Dict], toc: Optional[List[Dict]] = None):
        self.pages = pages
        if toc:
            self.toc = toc
            self._index_from_toc(toc)
        self._index_from_content()

    def _index_from_toc(self, toc: List[Dict]):
        current_hier = []
        for entry in toc:
            level = entry.get("level", 1)
            title = entry.get("title", "").strip()
            page_num = entry.get("page_num", 0)
            
            while len(current_hier) >= level:
                current_hier.pop()
            current_hier.append(title)
            
            title_lower = title.lower()
            
            for section, anchors in SECTION_ANCHORS.items():
                if any(a in title_lower for a in anchors):
                    self.index.setdefault(section, [])
                    if page_num not in self.index[section]:
                        self.index[section].append(page_num)
                    self.tree[section] = {
                        "hierarchy_path": list(current_hier),
                        "pages": self.index[section]
                    }

    def _index_from_content(self):
        # Precompile regex for speed
        section_regexes = {}
        for section, anchors in SECTION_ANCHORS.items():
            pattern = "|".join([fr'\b{re.escape(a)}s?\b' for a in anchors])
            section_regexes[section] = re.compile(pattern)

        for p in self.pages:
            text_lower = p["text"].lower()
            headings_lower = [h.lower() for h in p.get("headings", [])]
            search_area = " ".join(headings_lower) + " " + text_lower[:1000]

            for section, pattern in section_regexes.items():
                if pattern.search(search_area):
                    self.index.setdefault(section, [])
                    pn = p["page_num"]
                    if pn not in self.index[section]:
                        self.index[section].append(pn)

    def get_pages_for_section(self, section: str, max_pages: int = 3) -> List[Dict]:
        page_nums = self.index.get(section, [])
        if not page_nums:
            page_nums = self._fallback_scan(section)
        
        results = []
        seen = set()
        for pn in page_nums[:max_pages]:
            if pn not in seen:
                page = next((p for p in self.pages if p["page_num"] == pn), None)
                if page:
                    results.append(page)
                    seen.add(pn)
        return results

    def query(self, query: str, top_k: int = 4) -> List[Dict]:
        query_lower = query.lower()
        query_tokens = set(re.findall(r'\b\w{4,}\b', query_lower))
        
        expanded_tokens = set(query_tokens)
        for token in query_tokens:
            for k, syns in SYNONYMS.items():
                if token == k or token in syns:
                    expanded_tokens.add(k)
                    expanded_tokens.update(syns)

        scores = []
        for p in self.pages:
            text_lower = p["text"].lower()
            page_tokens = set(re.findall(r'\b\w{4,}\b', text_lower))
            overlap = len(expanded_tokens & page_tokens)
            
            header_bonus = sum(
                len(expanded_tokens & set(re.findall(r'\b\w{4,}\b', h.lower()))) * 3
                for h in p.get("headings", [])
            )
                
            tables_text = " ".join(p.get("tables", [])).lower()
            table_tokens = set(re.findall(r'\b\w{4,}\b', tables_text))
            table_bonus = len(expanded_tokens & table_tokens) * 2

            total_score = overlap + header_bonus + table_bonus
            scores.append((p["page_num"], total_score, p))

        scores.sort(key=lambda x: x[1], reverse=True)
        return [s[2] for s in scores[:top_k] if s[1] > 0]

    def _fallback_scan(self, section: str) -> List[int]:
        keyword = section.replace("_", " ")
        results = []
        for p in self.pages:
            if keyword in p["text"].lower()[:1500] or keyword in " ".join(p.get("headings", [])).lower():
                results.append(p["page_num"])
        if not results and section == "synopsis":
            results = [p["page_num"] for p in self.pages[:3]]
        return results

    def get_overview_context(self, max_chars: int = 24000) -> str:
        priority = ["synopsis", "objectives", "endpoints", "design", "eligibility"]
        per_section_budget = max_chars // max(len(priority), 1)
        parts = ["=== PROTOCOL PAGEINDEX OVERVIEW ===\n"]
        seen_pages: set = set()

        for section in priority:
            pages = self.get_pages_for_section(section, max_pages=3)
            section_chars = 0
            for page in pages:
                pn = page["page_num"]
                if pn in seen_pages:
                    continue
                seen_pages.add(pn)
                tbl_txt = ("\n[TABLES]\n" + "\n".join(page.get("tables", []))) if page.get("tables") else ""
                raw = f"\n[SECTION: {section.upper()} PAGE {pn}]\n{page['text']}{tbl_txt}\n"
                
                allowed = per_section_budget - section_chars
                if allowed <= 0:
                    break
                snippet = raw[:allowed]
                parts.append(snippet)
                section_chars += len(snippet)

        result = "".join(parts)
        if len(result) < 400:
            fallback_pages = self.pages[:6]
            fallback = "\n".join(f"[PAGE {p['page_num']}]\n{p['text']}" for p in fallback_pages)
            result = f"=== FALLBACK: FIRST PAGES ===\n{fallback[:max_chars]}"
        return result

class ReasoningRetriever:
    def __init__(self, pdf_bytes: bytes = None):
        self.pdf_bytes = pdf_bytes
        self.page_index = PageIndex()
        self._load_and_build()

    def _load_and_build(self):
        if not self.pdf_bytes:
            return
            
        pages = []
        toc = []

        try:
            import fitz
            # Open PDF from memory bytes
            doc = fitz.open(stream=self.pdf_bytes, filetype="pdf")
            
            raw_toc = doc.get_toc() 
            toc = [{"level": t[0], "title": t[1], "page_num": t[2]} for t in raw_toc]
            
            for i, page in enumerate(doc):
                text = page.get_text("text")
                # OCR fallback removed to maximize speed - structural/text block parsing is extremely fast
                
                font_sizes = []
                dict_blocks = page.get_text("dict", flags=11).get("blocks", [])
                for b in dict_blocks:
                    for l in b.get("lines", []):
                        for s in l.get("spans", []):
                            font_sizes.append(s["size"])
                
                from collections import Counter
                mode_size = Counter(font_sizes).most_common(1)[0][0] if font_sizes else 11

                headings = []
                for b in dict_blocks:
                    for l in b.get("lines", []):
                        for s in l.get("spans", []):
                            text_str = s["text"].strip()
                            if not text_str: continue
                            size = s["size"]
                            is_bold = "bold" in s["font"].lower()
                            
                            is_larger = (size > mode_size + 0.5) and len(text_str) < 100
                            is_bold_numbered = (abs(size - mode_size) <= 0.5) and is_bold and len(text_str) < 80 and (text_str.istitle() or re.match(r'^\d+(\.\d+)*\s+', text_str))
                            
                            if is_larger or is_bold_numbered:
                                headings.append(text_str)

                tables_text = []
                tabs = page.find_tables()
                if tabs and tabs.tables:
                    for tab in tabs.tables:
                        extracted = tab.extract() or []
                        for row in extracted:
                            if row:
                                tables_text.append(" | ".join([str(c) if c else "" for c in row]))

                pages.append({
                    "page_num": i + 1,
                    "text": text,
                    "headings": headings,
                    "tables": tables_text
                })
            doc.close()

        except Exception as e:
            logger.error(f"[ReasoningRetriever] Failed to load bytes: {e}")

        self.page_index.build(pages, toc or None)

    def get_high_yield_overview_context(self) -> str:
        return self.page_index.get_overview_context(max_chars=12000)