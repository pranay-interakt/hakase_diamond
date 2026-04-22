import { useState, useCallback } from "react";
import {
  Upload, FileText, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
  RefreshCw, Wand2, Plus, Trash2, MapPin, Users, BarChart3, FlaskConical,
  ExternalLink, Building2, BookOpen, Check, X, Database, Activity, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  analyzeProtocolUpload, analyzeProtocolText, checkCompliance,
  simulateProtocolImpact, recommendSites, findKOLs, getProtocolStrategies,
} from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const TABS = [
  { id: "analysis", label: "Analysis", icon: <FlaskConical className="h-3.5 w-3.5" /> },
  { id: "amendments", label: "Amendments", icon: <Wand2 className="h-3.5 w-3.5" /> },
  { id: "strategies", label: "Strategies", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: "sites", label: "Sites", icon: <MapPin className="h-3.5 w-3.5" /> },
  { id: "kols", label: "KOLs", icon: <Users className="h-3.5 w-3.5" /> },
] as const;

type TabId = typeof TABS[number]["id"];

const AMENDABLE_FIELDS = [
  { key: "title", label: "Title", type: "text" },
  { key: "phase", label: "Phase", type: "phase" },
  { key: "enrollmentCount", label: "Target Enrollment", type: "number" },
  { key: "allocation", label: "Allocation", type: "allocation" },
  { key: "masking", label: "Masking", type: "masking" },
  { key: "primaryOutcomes", label: "Primary Endpoints", type: "multiline" },
  { key: "eligibilityCriteria", label: "Eligibility Criteria", type: "multiline" },
] as const;

interface Amendment {
  id: string;
  name: string;
  rationale: string;
  field: string;
  newValue: any;
  impact?: any;
}

const severityColor: Record<string, string> = {
  critical: "text-red-600 bg-red-50 border-red-200",
  major: "text-orange-600 bg-orange-50 border-orange-200",
  minor: "text-amber-600 bg-amber-50 border-amber-200",
  info: "text-blue-600 bg-blue-50 border-blue-200",
};

const SAMPLE_PROTOCOL = `PROTOCOL TITLE: A Phase 2 Randomized Controlled Trial of Pembrolizumab Plus Chemotherapy in Advanced Non-Small Cell Lung Cancer (NSCLC)

PROTOCOL NUMBER: HKS-2025-001
NCT ID: NCT02578680
PHASE: Phase 2
SPONSOR: Hakase Therapeutics, Inc.

STUDY OBJECTIVES:
Primary Objective: To evaluate progression-free survival (PFS) of pembrolizumab plus carboplatin/pemetrexed versus placebo plus chemotherapy.
Secondary Objectives: Overall survival (OS), objective response rate (ORR), duration of response (DoR), safety and tolerability.

STUDY DESIGN:
This is a randomized, double-blind, placebo-controlled, multicenter Phase 2 study. Approximately 150 patients will be enrolled. Randomization will be 2:1 (pembrolizumab: placebo). Treatment will continue until disease progression, unacceptable toxicity, or 35 cycles.

ELIGIBILITY CRITERIA:
Inclusion:
- Histologically or cytologically confirmed Stage IIIB/IV NSCLC
- No prior systemic treatment for advanced disease
- ECOG Performance Status 0 or 1
- Adequate organ function (hepatic, renal, hematologic)
- Age ≥ 18 years

Exclusion:
- Active autoimmune disease requiring systemic treatment
- Prior checkpoint inhibitor therapy
- Active CNS metastases
- Pregnancy or breastfeeding

ENDPOINTS:
Primary endpoint: Progression-free survival (PFS) per RECIST v1.1 by blinded independent central review
Secondary endpoints: Overall survival (OS), ORR, DoR, safety (CTCAE v5.0)

TARGET ENROLLMENT: 150 patients across 25 sites in the United States and Europe
ESTIMATED DURATION: 36 months (12 months accrual, 24 months follow-up)`;

export default function ProtocolStudio() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "text">("upload");
  const [textInput, setTextInput] = useState("");
  const [tab, setTab] = useState<TabId>("analysis");
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedData, setSimulatedData] = useState<any>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [suggestedAmendments, setSuggestedAmendments] = useState<any[]>([]);

  // amendments
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [addingAmendment, setAddingAmendment] = useState(false);
  const [newAmendment, setNewAmendment] = useState({ name: "", rationale: "", field: "primaryOutcomes", newValue: "" });
  const [amendLoading, setAmendLoading] = useState(false);
  const [amendResult, setAmendResult] = useState<any>(null);

  // strategies
  const [strategiesData, setStrategiesData] = useState<any>(null);
  const [strategiesLoading, setStrategiesLoading] = useState(false);

  // sites
  const [sitesData, setSitesData] = useState<any>(null);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());

  // kols
  const [kolsData, setKolsData] = useState<any>(null);
  const [kolsLoading, setKolsLoading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const data = await analyzeProtocolUpload(file);
      setResult(data);
      setSimulatedData(data.parsed);
      setTab("analysis");
      if (data.compliance?.issues) {
        setSuggestedAmendments(data.compliance.issues.map((iss: any) => ({
          id: iss.id,
          title: `Fix: ${iss.rule}`,
          rationale: iss.recommendation,
          impact: "+5% Compliance",
          auto: true
        })));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleTextAnalyze = async () => {
    if (!textInput.trim()) return;
    setUploading(true);
    setError("");
    try {
      const data = await analyzeProtocolText({ text: textInput.trim() });
      setResult(data);
      setSimulatedData(data.parsed);
      setTab("analysis");
      if (data.compliance?.issues) {
        setSuggestedAmendments(data.compliance.issues.map((iss: any) => ({
          id: iss.id,
          title: `Fix: ${iss.rule}`,
          rationale: iss.recommendation,
          impact: "+5% Compliance",
          auto: true
        })));
      }
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const loadStrategies = async () => {
    const condition = result?.parsed?.conditions?.[0];
    if (!condition || strategiesData) return;
    setStrategiesLoading(true);
    try {
      const phase = result?.parsed?.phase?.[0] || "";
      const data = await getProtocolStrategies(condition, phase);
      setStrategiesData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStrategiesLoading(false);
    }
  };

  const loadSites = async (country?: string) => {
    const condition = result?.parsed?.conditions?.[0];
    if (!condition) return;
    setSitesLoading(true);
    try {
      const phase = result?.parsed?.phase?.[0] || "";
      const data = await recommendSites(condition, phase, country && country !== "all" ? country : undefined, 40);
      setSitesData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSitesLoading(false);
    }
  };

  const loadKOLs = async () => {
    const condition = result?.parsed?.conditions?.[0];
    if (!condition || kolsData) return;
    setKolsLoading(true);
    try {
      const intervention = result?.parsed?.interventions?.[0]?.name || "";
      const data = await findKOLs(condition, intervention, 20);
      setKolsData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setKolsLoading(false);
    }
  };

  const switchTab = (t: TabId) => {
    setTab(t);
    if (t === "strategies" && !strategiesData) loadStrategies();
    if (t === "sites" && !sitesData) loadSites();
    if (t === "kols" && !kolsData) loadKOLs();
  };

  const applyAmendments = async () => {
    if (!amendments.length) return;
    setAmendLoading(true);
    try {
      const editedProtocol = { ...(result?.parsed || {}) };
      for (const a of amendments) {
        let val = a.newValue;
        if (a.field === "primaryOutcomes" || a.field === "eligibilityCriteria") {
          val = typeof val === "string" ? val.split("\n").filter(Boolean) : val;
        }
        if (a.field === "enrollmentCount") val = Number(val);
        if (a.field === "phase") val = [val];
        editedProtocol[a.field] = val;
      }

      const [compliance, impact] = await Promise.all([
        checkCompliance(editedProtocol),
        simulateProtocolImpact({
          originalProtocol: result?.parsed,
          amendments: amendments.map(a => ({ field: a.field, value: a.newValue, name: a.name })),
        }),
      ]);

      setAmendResult({ compliance, impact });
      setResult((prev: any) => ({ ...prev, compliance }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAmendLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!simulatedData || !result?.parsed) return;
    setSimulationLoading(true);
    setError("");
    try {
      const edited = {
        ...result.parsed,
        ...simulatedData,
        enrollmentCount: simulatedData.enrollmentCount
          ? Number(simulatedData.enrollmentCount)
          : result.parsed.enrollmentCount,
        phase: simulatedData.phase
          ? [simulatedData.phase]
          : result.parsed.phase,
      };

      const delta = Object.keys(simulatedData)
        .filter(k => String(simulatedData[k]) !== String((result.parsed as any)[k]))
        .map(k => ({ field: k, value: simulatedData[k], name: `Simulated: ${k}` }));

      const [newCompliance, newImpact] = await Promise.all([
        checkCompliance(edited),
        delta.length > 0
          ? simulateProtocolImpact({ originalProtocol: result.parsed, amendments: delta })
          : Promise.resolve(null),
      ]);

      setSimulationResult({ compliance: newCompliance, impact: newImpact });
      setResult((prev: any) => ({ ...prev, compliance: newCompliance }));
    } catch (e: any) {
      setError(e.message || "Simulation failed");
    } finally {
      setSimulationLoading(false);
    }
  };

  const addAmendment = () => {
    if (!newAmendment.name.trim()) return;
    const a: Amendment = {
      id: Date.now().toString(),
      name: newAmendment.name,
      rationale: newAmendment.rationale,
      field: newAmendment.field,
      newValue: newAmendment.newValue,
    };
    setAmendments(prev => [...prev, a]);
    setNewAmendment({ name: "", rationale: "", field: "primaryOutcomes", newValue: "" });
    setAddingAmendment(false);
  };

  const parsed = result?.parsed || {};
  const compliance = result?.compliance || {};
  const issues = compliance.issues || [];
  const score = compliance.score || {};

  if (!result) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Protocol Studio</h2>
          <p className="text-sm text-slate-500">
            Analyze any clinical protocol — upload a PDF or paste the text. Get compliance scoring, outcome strategies, site recommendations, KOL discovery, and live amendment simulation.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {[
            { id: "upload", label: "Upload PDF", icon: <Upload className="h-3.5 w-3.5" /> },
            { id: "text", label: "Paste Text", icon: <FileText className="h-3.5 w-3.5" /> },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setInputMode(m.id as "upload" | "text")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${inputMode === m.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              {m.icon}{m.label}
            </button>
          ))}
        </div>

        {/* Upload mode */}
        {inputMode === "upload" && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-2xl p-14 text-center transition-all cursor-pointer ${dragging ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"}`}
          >
            <label className="cursor-pointer block">
              <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin" />
                  <p className="text-sm text-blue-600 font-medium">Analyzing protocol…</p>
                  <p className="text-xs text-slate-400">Extracting entities · Checking compliance · Finding similar trials</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-10 w-10 mx-auto text-slate-300" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Drop protocol PDF here or click to upload</p>
                    <p className="text-xs text-slate-400 mt-1">PDF only · Max 50 MB</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={e => e.preventDefault()}>Browse Files</Button>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Text paste mode */}
        {inputMode === "text" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Paste your protocol text below, or try the sample NSCLC Phase 2 protocol.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTextInput(SAMPLE_PROTOCOL)}
                className="text-xs h-7"
              >
                <Sparkles className="h-3 w-3 mr-1.5" />Try Sample Protocol
              </Button>
            </div>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-4 text-sm font-mono text-slate-700 bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={14}
              placeholder="Paste your clinical protocol text here…

PROTOCOL TITLE: ...
PHASE: ...
ELIGIBILITY CRITERIA: ...
PRIMARY ENDPOINTS: ..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleTextAnalyze}
              disabled={uploading || !textInput.trim()}
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing protocol…</>
              ) : (
                <><Database className="h-4 w-4 mr-2" />Analyze Protocol</>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3 border border-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Feature chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {["Compliance Scoring", "ICH E6/E9 Validation", "ClinicalTrials.gov Benchmarks", "Site Recommendations", "KOL Discovery", "Amendment Simulation"].map(f => (
            <span key={f} className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">{f}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Protocol Studio</h2>
          {parsed.title && !parsed.title.includes("===") && <p className="text-sm text-slate-500 mt-0.5 max-w-xl truncate" title={parsed.title}>{parsed.title}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => { setResult(null); setAmendments([]); setAmendResult(null); setStrategiesData(null); setSitesData(null); setKolsData(null); }}>
          Upload New
        </Button>
      </div>


      {/* Score metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {/* Compliance */}
        {(() => {
          const s = score.score ?? null;
          const good = s !== null && s >= 75;
          const ok = s !== null && s >= 55;
          return (
            <div style={{ borderRadius: 14, border: `1px solid ${good ? "#a7f3d0" : ok ? "#fde68a" : "#fca5a5"}`, background: good ? "#f0fdf4" : ok ? "#fffbeb" : "#fef2f2", padding: "16px 14px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Compliance</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: good ? "#059669" : ok ? "#d97706" : "#dc2626", lineHeight: 1 }}>{s ?? "—"}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: good ? "#065f46" : ok ? "#92400e" : "#991b1b", marginTop: 4 }}>Grade {score.grade ?? "—"}</p>
            </div>
          );
        })()}
        {/* Success Probability */}
        <div style={{ borderRadius: 14, border: "1px solid #bfdbfe", background: "#eff6ff", padding: "16px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Success Prob.</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#1d4ed8", lineHeight: 1 }}>{result.successProbability?.probability != null ? `${result.successProbability.probability}%` : "—"}</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", marginTop: 4 }}>{result.successProbability?.rating ?? "ML Model"}</p>
        </div>
        {/* FAERS Safety */}
        {(() => {
          const risk = result.safetyIntelligence?.riskLevel;
          const color = risk === "LOW" ? { bg: "#f0fdf4", border: "#a7f3d0", val: "#059669", label: "#065f46" } : risk === "HIGH" ? { bg: "#fef2f2", border: "#fca5a5", val: "#dc2626", label: "#991b1b" } : { bg: "#fffbeb", border: "#fde68a", val: "#d97706", label: "#92400e" };
          return (
            <div style={{ borderRadius: 14, border: `1px solid ${color.border}`, background: color.bg, padding: "16px 14px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>FAERS Safety</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: color.val, lineHeight: 1 }}>{result.safetyIntelligence?.safetyScore ?? "—"}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: color.label, marginTop: 4 }}>{risk ?? "No data"}</p>
            </div>
          );
        })()}
        {/* Literature */}
        <div style={{ borderRadius: 14, border: "1px solid #ddd6fe", background: "#faf5ff", padding: "16px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Literature</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#7c3aed", lineHeight: 1 }}>{result.literatureMaturity?.maturityScore ?? "—"}</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#5b21b6", marginTop: 4 }}>{result.literatureMaturity?.tier ?? "—"}</p>
        </div>
        {/* Issues */}
        <div style={{ borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", padding: "16px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Issues</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{issues.length}</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: (score.critical ?? 0) > 0 ? "#dc2626" : "#94a3b8", marginTop: 4 }}>
            {(score.critical ?? 0) > 0 ? `${score.critical} critical` : "None critical"}
          </p>
        </div>
      </div>


      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-2 rounded-lg transition-all ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {tab === "analysis" && (
        <AnalysisTab 
          issues={issues} 
          score={score} 
          parsed={parsed} 
          result={result} 
          expandedIssue={expandedIssue} 
          setExpandedIssue={setExpandedIssue}
          isSimulating={isSimulating}
          setIsSimulating={setIsSimulating}
          simulatedData={simulatedData}
          setSimulatedData={setSimulatedData}
          suggestedAmendments={suggestedAmendments}
          runSimulation={runSimulation}
          simulationLoading={simulationLoading}
          simulationResult={simulationResult}
        />
      )}
      {tab === "amendments" && (
        <AmendmentsTab
          amendments={amendments}
          setAmendments={setAmendments}
          addingAmendment={addingAmendment}
          setAddingAmendment={setAddingAmendment}
          newAmendment={newAmendment}
          setNewAmendment={setNewAmendment}
          addAmendment={addAmendment}
          applyAmendments={applyAmendments}
          amendLoading={amendLoading}
          amendResult={amendResult}
          parsed={parsed}
        />
      )}
      {tab === "strategies" && (
        <StrategiesTab data={strategiesData} loading={strategiesLoading} condition={parsed.conditions?.[0] || ""} />
      )}
      {tab === "sites" && (
        <SitesTab
          data={sitesData}
          loading={sitesLoading}
          selectedCountry={selectedCountry}
          setSelectedCountry={(c: string) => { setSelectedCountry(c); loadSites(c); }}
          selectedSites={selectedSites}
          setSelectedSites={setSelectedSites}
          condition={parsed.conditions?.[0] || ""}
        />
      )}
      {tab === "kols" && (
        <KOLsTab data={kolsData} loading={kolsLoading} condition={parsed.conditions?.[0] || ""} />
      )}
    </div>
  );
}

function AnalysisTab({
  issues,
  score,
  parsed,
  result,
  expandedIssue,
  setExpandedIssue,
  isSimulating,
  setIsSimulating,
  simulatedData,
  setSimulatedData,
  suggestedAmendments,
  runSimulation,
  simulationLoading,
  simulationResult,
}: any) {
  const [showAmends, setShowAmends] = useState(true);

  const successProb = result?.successProbability;
  const safety = result?.safetyIntelligence;
  const literature = result?.literatureMaturity;
  const provenance = result?.dataProvenance;

  return (
    <div className="space-y-5">
      {/* Simulation Active Banner */}
      {isSimulating && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BarChart3 className="h-4 w-4" style={{ color: "#d97706" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Simulation Mode Active</p>
              <p style={{ fontSize: 11, color: "#b45309" }}>Edit any parameter below, then run to see the compliance delta.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setIsSimulating(false); setSimulatedData(parsed); }}
            style={{ borderColor: "#fde68a", background: "#fff", color: "#b45309", fontSize: 12, fontWeight: 600 }}>
            Reset
          </Button>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Protocol Parameters */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                <Database className="h-4 w-4" style={{ color: "#3b82f6" }} />
                Protocol Parameters
              </h3>
              {!isSimulating && (
                <Button size="sm" variant="ghost" onClick={() => setIsSimulating(true)}
                  style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600, height: 28 }}>
                  <Wand2 className="h-3.5 w-3.5 mr-1" /> Edit & Simulate
                </Button>
              )}
            </div>
            <div style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px 24px" }}>
              {[
                { label: "Phase", key: "phase" },
                { label: "Enrollment", key: "enrollmentCount" },
                { label: "Allocation", key: "allocation" },
                { label: "Masking", key: "masking" },
                { label: "Sponsor", key: "sponsorName" },
                { label: "Study Type", key: "studyType" },
              ].map(f => (
                <div key={f.key}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>{f.label}</p>
                  {isSimulating ? (
                    <Input
                      style={{ fontSize: 13, fontWeight: 600, borderColor: "#fde68a", background: "rgba(253,230,138,0.15)", height: 34 }}
                      value={simulatedData[f.key] || ""}
                      onChange={e => setSimulatedData((v: any) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{String(parsed[f.key] || "—")}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Endpoints & Eligibility */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Endpoints & Eligibility</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Primary Endpoints</p>
                {(parsed.primaryOutcomes || []).length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(parsed.primaryOutcomes || []).map((ep: string, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#10b981", marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.55 }}>{ep}</span>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>Not specified</p>}
              </div>
              {parsed.eligibilityCriteria && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Eligibility</p>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {String(parsed.eligibilityCriteria)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Simulation Run Button + Result */}
          {isSimulating && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Button
                className="w-full"
                style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)", color: "#fff", fontWeight: 700, height: 44, fontSize: 14, boxShadow: "0 4px 14px rgba(245,158,11,0.3)" }}
                onClick={runSimulation}
                disabled={simulationLoading}
              >
                {simulationLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Running Simulation…</>
                  : <><BarChart3 className="h-4 w-4 mr-2" />Run Simulation with New Parameters →</>
                }
              </Button>
              {simulationResult?.impact && (
                <div style={{
                  borderRadius: 14, border: `1px solid ${(simulationResult.impact?.delta?.scoreChange ?? 0) >= 0 ? "#a7f3d0" : "#fca5a5"}`,
                  background: (simulationResult.impact?.delta?.scoreChange ?? 0) >= 0 ? "#f0fdf4" : "#fef2f2",
                  padding: "16px 20px"
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    {(simulationResult.impact?.delta?.scoreChange ?? 0) >= 0
                      ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
                      : <AlertCircle className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />
                    }
                    Simulation Delta
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                    {[
                      { label: "Score Change", val: `${(simulationResult.impact?.delta?.scoreChange ?? 0) > 0 ? "+" : ""}${simulationResult.impact?.delta?.scoreChange ?? 0}`, color: (simulationResult.impact?.delta?.scoreChange ?? 0) >= 0 ? "#10b981" : "#ef4444" },
                      { label: "Issues Resolved", val: simulationResult.impact?.delta?.resolvedIssues?.length ?? 0, color: "#10b981" },
                      { label: "New Issues", val: simulationResult.impact?.delta?.newIssues?.length ?? 0, color: "#ef4444" },
                    ].map(d => (
                      <div key={d.label}>
                        <p style={{ fontSize: 10, color: "#64748b" }}>{d.label}</p>
                        <p style={{ fontSize: 28, fontWeight: 800, color: d.color, lineHeight: 1.1 }}>{d.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Optimization Tasks (Issues) */}
          {issues.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Optimization Tasks</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {score.critical > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                      {score.critical} critical
                    </span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "#f1f5f9", color: "#64748b" }}>
                    {issues.length} total
                  </span>
                </div>
              </div>
              <div>
                {issues.map((issue: any, idx: number) => (
                  <div key={issue.id} style={{ borderBottom: idx < issues.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <button
                      style={{ width: "100%", padding: "13px 20px", display: "flex", alignItems: "center", gap: 12, textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                      onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: issue.severity === "critical" ? "#ef4444" : issue.severity === "major" ? "#f97316" : "#f59e0b"
                      }} />
                      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{issue.rule}</p>
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "2px 8px", borderRadius: 99,
                        background: issue.severity === "critical" ? "#fef2f2" : issue.severity === "major" ? "#fff7ed" : "#fffbeb",
                        color: issue.severity === "critical" ? "#dc2626" : issue.severity === "major" ? "#ea580c" : "#d97706",
                      }}>{issue.severity}</span>
                      {expandedIssue === issue.id
                        ? <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: "#94a3b8" }} />
                        : <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: "#94a3b8" }} />
                      }
                    </button>
                    {expandedIssue === issue.id && (
                      <div style={{ padding: "4px 20px 16px 40px", background: "#fafafa" }}>
                        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, marginBottom: 10 }}>{issue.description}</p>
                        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "12px 14px" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                            <CheckCircle2 className="h-3 w-3" /> Resolution
                          </p>
                          <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{issue.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* AI Amendment Suggestions */}
          {suggestedAmendments.length > 0 && showAmends && (
            <div style={{ background: "linear-gradient(135deg,#eef2ff,#f5f3ff)", border: "1px solid #c7d2fe", borderRadius: 14, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 10, right: 10 }}>
                <button onClick={() => setShowAmends(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a5b4fc", padding: 2 }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "#4338ca", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Wand2 className="h-3.5 w-3.5" /> AI Suggestions
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {suggestedAmendments.slice(0, 3).map((amend: any) => (
                  <div key={amend.id} style={{ background: "rgba(255,255,255,0.75)", borderRadius: 10, padding: "10px 12px", border: "1px solid #e0e7ff" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#3730a3", lineHeight: 1.35 }}>{amend.title}</p>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: "#d1fae5", color: "#065f46", flexShrink: 0 }}>{amend.impact}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#6366f1", lineHeight: 1.5 }}>{amend.rationale?.slice(0, 90)}{amend.rationale?.length > 90 ? "…" : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Probability Factors */}
          {successProb?.factors?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                <Activity className="h-4 w-4" style={{ color: "#3b82f6" }} />
                Success Factors
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {successProb.factors.map((f: any, i: number) => (
                  <div key={i}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#334155", lineHeight: 1.3, flex: 1, paddingRight: 8 }}>{f.factor}</p>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>{Math.round(f.score)}/{f.weight}</span>
                    </div>
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: f.score / f.weight >= 0.7 ? "#10b981" : f.score / f.weight >= 0.4 ? "#3b82f6" : "#f59e0b", borderRadius: 99, width: `${(f.score / f.weight) * 100}%`, transition: "width 0.5s" }} />
                    </div>
                    <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 3, lineHeight: 1.4 }}>{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAERS Safety Signal */}
          {safety && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                <Activity className="h-4 w-4" style={{ color: "#ef4444" }} />
                FAERS Safety Signal
              </h3>
              {safety.reasoning && (
                <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 10 }}>{safety.reasoning}</p>
              )}
              {(safety.topReactions || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                  {safety.topReactions.map((r: string, i: number) => (
                    <span key={i} style={{
                      fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
                      background: (safety.seriousReactions || []).some((s: string) => r.toLowerCase().includes(s)) ? "#fef2f2" : "#f8fafc",
                      color: (safety.seriousReactions || []).some((s: string) => r.toLowerCase().includes(s)) ? "#dc2626" : "#475569",
                    }}>{r}</span>
                  ))}
                </div>
              )}
              {safety.proofLink && (
                <a href={safety.proofLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#3b82f6", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                  <ExternalLink className="h-3 w-3" /> OpenFDA FAERS
                </a>
              )}
            </div>
          )}

          {/* PubMed Evidence */}
          {literature && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                <BookOpen className="h-4 w-4" style={{ color: "#8b5cf6" }} />
                PubMed Evidence
              </h3>
              {literature.reasoning && (
                <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 10 }}>{literature.reasoning}</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(literature.topReferences || []).slice(0, 3).map((ref: any) => (
                  <a key={ref.pmid} href={ref.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", background: "#faf5ff", borderRadius: 10, padding: "8px 10px", border: "1px solid #ede9fe", textDecoration: "none" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ref.title}</p>
                    <p style={{ fontSize: 10, color: "#8b5cf6", marginTop: 3 }}>PMID {ref.pmid} · {ref.year}</p>
                  </a>
                ))}
              </div>
              {literature.proofLink && (
                <a href={literature.proofLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#3b82f6", display: "flex", alignItems: "center", gap: 4, marginTop: 10, textDecoration: "none" }}>
                  <ExternalLink className="h-3 w-3" /> PubMed Query
                </a>
              )}
            </div>
          )}

          {/* Data Sources */}
          {provenance?.sources && (
            <div style={{ background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0", padding: "14px 18px" }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Database className="h-3.5 w-3.5" /> Live Data Sources
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {Object.entries(provenance.sources).map(([key, source]: [string, any]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{source}</p>
                    </div>
                    {provenance.proofLinks?.[key] && (
                      <a href={provenance.proofLinks[key]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#3b82f6", textDecoration: "none", flexShrink: 0 }}>↗</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AmendmentsTab({ amendments, setAmendments, addingAmendment, setAddingAmendment, newAmendment, setNewAmendment, addAmendment, applyAmendments, amendLoading, amendResult, parsed }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Protocol Amendments</h3>
          <p className="text-xs text-slate-500 mt-0.5">Name each change, then apply all to see combined compliance impact</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAddingAmendment(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Add Amendment
        </Button>
      </div>

      {addingAmendment && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-900">New Amendment</p>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Amendment Name <span className="text-red-500">*</span></label>
            <Input
              placeholder="e.g. A1: Change primary endpoint to Overall Survival"
              value={newAmendment.name}
              onChange={e => setNewAmendment((v: any) => ({ ...v, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Field to Change</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={newAmendment.field}
                onChange={e => setNewAmendment((v: any) => ({ ...v, field: e.target.value, newValue: "" }))}
              >
                {AMENDABLE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                New Value{" "}
                <span className="text-slate-400">(current: {
                  (() => {
                    const cur = parsed[newAmendment.field];
                    if (Array.isArray(cur)) return cur[0] || "—";
                    return cur || "—";
                  })()
                })</span>
              </label>
              {newAmendment.field === "phase" ? (
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={newAmendment.newValue}
                  onChange={e => setNewAmendment((v: any) => ({ ...v, newValue: e.target.value }))}
                >
                  <option value="">Select phase</option>
                  {["EARLY_PHASE1","PHASE1","PHASE2","PHASE3","PHASE4"].map(p => <option key={p} value={p}>{p.replace("_"," ")}</option>)}
                </select>
              ) : newAmendment.field === "allocation" ? (
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={newAmendment.newValue}
                  onChange={e => setNewAmendment((v: any) => ({ ...v, newValue: e.target.value }))}
                >
                  <option value="">Select</option>
                  <option value="RANDOMIZED">Randomized</option>
                  <option value="NON_RANDOMIZED">Non-Randomized</option>
                </select>
              ) : newAmendment.field === "masking" ? (
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={newAmendment.newValue}
                  onChange={e => setNewAmendment((v: any) => ({ ...v, newValue: e.target.value }))}
                >
                  <option value="">Select</option>
                  <option value="DOUBLE">Double-Blind</option>
                  <option value="SINGLE">Single-Blind</option>
                  <option value="NONE">Open-Label</option>
                </select>
              ) : (newAmendment.field === "primaryOutcomes" || newAmendment.field === "eligibilityCriteria") ? (
                <Textarea
                  rows={3}
                  placeholder="One per line for endpoints"
                  value={newAmendment.newValue}
                  onChange={e => setNewAmendment((v: any) => ({ ...v, newValue: e.target.value }))}
                />
              ) : (
                <Input
                  type={newAmendment.field === "enrollmentCount" ? "number" : "text"}
                  value={newAmendment.newValue}
                  onChange={e => setNewAmendment((v: any) => ({ ...v, newValue: e.target.value }))}
                />
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Rationale / Justification</label>
            <Input
              placeholder="Brief explanation of why this change is needed"
              value={newAmendment.rationale}
              onChange={e => setNewAmendment((v: any) => ({ ...v, rationale: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addAmendment} disabled={!newAmendment.name.trim()}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAddingAmendment(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {amendments.length === 0 && !addingAmendment ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
          <Wand2 className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500 font-medium">No amendments added yet</p>
          <p className="text-xs text-slate-400 mt-1">Add named amendments to track protocol changes and assess their compliance impact</p>
        </div>
      ) : (
        <div className="space-y-2">
          {amendments.map((a: Amendment, i: number) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                    <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{AMENDABLE_FIELDS.find(f => f.key === a.field)?.label}</Badge>
                    <span className="text-xs text-slate-400">→</span>
                    <span className="text-xs text-slate-600 truncate max-w-xs">
                      {Array.isArray(a.newValue) ? a.newValue.join(", ") : String(a.newValue).slice(0, 60)}
                    </span>
                  </div>
                  {a.rationale && <p className="text-xs text-slate-400 mt-1 italic">{a.rationale}</p>}
                </div>
                <button onClick={() => setAmendments((prev: Amendment[]) => prev.filter(x => x.id !== a.id))} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {amendments.length > 0 && (
            <Button onClick={applyAmendments} disabled={amendLoading} className="w-full mt-2">
              {amendLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Assessing…</> : <><RefreshCw className="h-4 w-4 mr-2" />Apply All Amendments & Re-assess Compliance</>}
            </Button>
          )}
        </div>
      )}

      {amendResult && (
        <div className="space-y-3">
          <div className={`rounded-xl border p-4 ${amendResult.impact?.delta?.scoreChange >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              {amendResult.impact?.delta?.scoreChange >= 0
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                : <AlertCircle className="h-4 w-4 text-red-600" />
              }
              Amendment Impact Summary
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-slate-500">Score Change</p>
                <p className={`text-2xl font-bold ${(amendResult.impact?.delta?.scoreChange || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {(amendResult.impact?.delta?.scoreChange || 0) > 0 ? "+" : ""}{amendResult.impact?.delta?.scoreChange ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Issues Resolved</p>
                <p className="text-2xl font-bold text-emerald-600">{amendResult.impact?.delta?.resolvedIssues?.length ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">New Issues</p>
                <p className="text-2xl font-bold text-red-600">{amendResult.impact?.delta?.newIssues?.length ?? 0}</p>
              </div>
            </div>
            {amendResult.impact?.enrollmentImpact?.factors?.length > 0 && (
              <div className="mt-3 border-t border-black/10 pt-3 space-y-1">
                <p className="text-xs font-semibold text-slate-700">Enrollment Impact</p>
                {amendResult.impact.enrollmentImpact.factors.map((f: any, i: number) => (
                  <p key={i} className="text-xs text-slate-600">
                    {f.impact > 0 ? "▲" : "▼"} {f.description}
                  </p>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Updated Compliance Score</p>
            <p className="text-3xl font-bold text-slate-900">{amendResult.compliance?.score?.score ?? "—"}</p>
            <p className="text-xs text-slate-400">Grade {amendResult.compliance?.score?.grade ?? "—"} · {amendResult.compliance?.issues?.length ?? 0} issues remaining</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StrategiesTab({ data, loading, condition }: any) {
  if (loading) return <LoadingPlaceholder label={`Loading outcome strategies for "${condition}"…`} />;
  if (!data) return null;

  const topEPs = data.topPrimaryEndpoints || [];
  const maskingDist = data.maskingDistribution || [];
  const allocDist = data.allocationDistribution || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Real-World Outcome Strategies</h3>
          <p className="text-xs text-slate-500 mt-0.5">Based on {data.totalTrials} completed/active ClinicalTrials.gov trials for <em>{condition}</em></p>
        </div>
      </div>

      {topEPs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Top Primary Endpoints Used in Similar Trials</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topEPs.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="endpoint" width={180} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {topEPs.slice(0, 8).map((_: any, i: number) => (
                  <Cell key={i} fill={i === 0 ? "#2563eb" : i === 1 ? "#3b82f6" : i === 2 ? "#60a5fa" : "#93c5fd"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {maskingDist.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Masking Distribution</h4>
            <div className="space-y-2">
              {maskingDist.map((d: any) => {
                const pct = Math.round((d.count / data.totalTrials) * 100);
                return (
                  <div key={d.masking}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{d.masking || "Not Specified"}</span>
                      <span className="text-slate-500 font-medium">{d.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {allocDist.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Allocation Distribution</h4>
            <div className="space-y-2">
              {allocDist.map((d: any) => {
                const pct = Math.round((d.count / data.totalTrials) * 100);
                return (
                  <div key={d.allocation}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{d.allocation || "Not Specified"}</span>
                      <span className="text-slate-500 font-medium">{d.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {data.strategies?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Similar Trial Designs</h4>
          </div>
          <div className="divide-y divide-slate-100">
            {data.strategies.slice(0, 10).map((s: any) => (
              <div key={s.nctId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{s.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">{s.nctId}</span>
                      {s.phase?.length > 0 && <Badge variant="outline" className="text-xs px-1.5 py-0">{s.phase.join("/")}</Badge>}
                      {s.allocation && <span className="text-xs text-slate-500">{s.allocation}</span>}
                      {s.masking && <span className="text-xs text-slate-500">{s.masking}</span>}
                      {s.enrollment && <span className="text-xs text-slate-500">n={s.enrollment}</span>}
                    </div>
                    {s.primaryOutcomes?.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">Primary: {s.primaryOutcomes[0]}</p>
                    )}
                  </div>
                  <a href={`https://clinicaltrials.gov/study/${s.nctId}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 flex-shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SitesTab({ data, loading, selectedCountry, setSelectedCountry, selectedSites, setSelectedSites, condition }: any) {
  if (loading) return <LoadingPlaceholder label={`Finding sites for "${condition}"…`} />;
  if (!data) return null;

  const countries = [{ country: "all", siteCount: data.total || 0 }, ...(data.countrySummary || [])];
  const filtered = selectedCountry === "all" ? (data.sites || []) : (data.sites || []).filter((s: any) => s.country === selectedCountry);

  const toggleSite = (key: string) => {
    setSelectedSites((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Recommended Sites</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.total} sites from real ClinicalTrials.gov trials for <em>{condition}</em>
            {selectedSites.size > 0 && <span className="ml-2 text-blue-600 font-medium">{selectedSites.size} selected</span>}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {countries.slice(0, 12).map((c: any) => (
          <button
            key={c.country}
            onClick={() => setSelectedCountry(c.country)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              selectedCountry === c.country
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
            }`}
          >
            {c.country === "all" ? "All Regions" : c.country} <span className="opacity-70">({c.siteCount})</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <div className="w-5" />
          <div>Site / Location</div>
          <div className="text-right px-3">Score</div>
          <div className="text-right px-3">Rate</div>
          <div className="text-right px-3">Startup</div>
          <div className="text-right px-3">Trials</div>
        </div>
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {filtered.slice(0, 30).map((site: any, idx: number) => {
            const key = `${site.facility}|${site.city}|${site.country}`;
            const selected = selectedSites.has(key);
            return (
              <div
                key={idx}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 items-center px-4 py-3 cursor-pointer transition-colors ${selected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                onClick={() => toggleSite(key)}
              >
                <div className="w-5 h-5 rounded flex items-center justify-center border mr-2 flex-shrink-0" style={{ borderColor: selected ? "#3b82f6" : "#d1d5db", backgroundColor: selected ? "#3b82f6" : "transparent" }}>
                  {selected && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{site.facility}</p>
                  <p className="text-xs text-slate-400">{[site.city, site.state, site.country].filter(Boolean).join(", ")}</p>
                </div>
                <div className="text-right px-3">
                  <span className={`text-sm font-bold ${site.score >= 70 ? "text-emerald-600" : site.score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                    {site.score}
                  </span>
                </div>
                <div className="text-right px-3 text-xs text-slate-600">{site.enrollmentRate}/mo</div>
                <div className="text-right px-3 text-xs text-slate-600">{site.startupWeeks}w</div>
                <div className="text-right px-3 text-xs text-slate-600">{site.trialCount}</div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">No sites found for this region</div>
          )}
        </div>
      </div>
      {selectedSites.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 font-medium">
          {selectedSites.size} site{selectedSites.size > 1 ? "s" : ""} selected for your protocol
        </div>
      )}
    </div>
  );
}

function KOLsTab({ data, loading, condition }: any) {
  if (loading) return <LoadingPlaceholder label={`Mining PubMed for KOLs in "${condition}"…`} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Key Opinion Leaders</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Top {data.kols?.length} investigators from {data.articlesAnalyzed} PubMed articles on <em>{condition}</em>
          </p>
        </div>
      </div>
      {data.kols?.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No KOLs found. Try a broader condition term in the extracted data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.kols?.map((kol: any, idx: number) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-3 hover:border-blue-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx < 3 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{kol.name}</p>
                    <a href={kol.pubmedUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 ml-2 flex-shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  {kol.affiliations?.[0] && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-slate-500 truncate">{kol.affiliations[0].split(",")[0].trim().slice(0, 55)}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-slate-400" />
                      <span className="text-xs font-medium text-slate-700">{kol.publications}</span>
                      <span className="text-xs text-slate-400">pubs</span>
                    </div>
                    {kol.firstAuthor > 0 && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{kol.firstAuthor}× first</span>}
                    {kol.lastAuthor > 0 && <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{kol.lastAuthor}× senior</span>}
                  </div>
                  {kol.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {kol.keywords.slice(0, 4).map((kw: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs px-1.5 py-0 text-slate-500">{kw.slice(0, 22)}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingPlaceholder({ label }: { label: string }) {
  return (
    <div className="py-16 text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400 mb-3" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
