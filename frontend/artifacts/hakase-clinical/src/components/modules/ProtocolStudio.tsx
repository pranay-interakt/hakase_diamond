import { useState, useCallback } from "react";
import {
  Upload, FileText, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
  RefreshCw, Wand2, Plus, Trash2, MapPin, Users, BarChart3, FlaskConical,
  ExternalLink, Building2, BookOpen, Check, X
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

export default function ProtocolStudio() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("analysis");
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

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
      setTab("analysis");
    } catch (e: any) {
      setError(e.message);
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
            Upload your protocol PDF for compliance checking, real-world outcome strategies, site recommendations, KOL discovery, and live amendment impact analysis — all powered by live public data.
          </p>
        </div>
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
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3 border border-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Protocol Studio</h2>
          {parsed.title && <p className="text-sm text-slate-500 mt-0.5 max-w-xl truncate" title={parsed.title}>{parsed.title}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => { setResult(null); setAmendments([]); setAmendResult(null); setStrategiesData(null); setSitesData(null); setKolsData(null); }}>
          Upload New
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl border p-4 text-center ${score.score >= 75 ? "bg-emerald-50 border-emerald-200" : score.score >= 55 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
          <p className="text-xs text-slate-500 mb-1">Compliance Score</p>
          <p className={`text-4xl font-bold ${score.score >= 75 ? "text-emerald-600" : score.score >= 55 ? "text-amber-600" : "text-red-600"}`}>{score.score ?? "—"}</p>
          <p className="text-sm text-slate-500">Grade {score.grade ?? "—"}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Success Probability</p>
          <p className="text-4xl font-bold text-blue-600">{result.successProbability?.probability ?? "—"}%</p>
          <p className="text-sm text-slate-500">{result.successProbability?.rating ?? ""}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Issues Found</p>
          <p className="text-4xl font-bold text-slate-900">{issues.length}</p>
          <p className="text-sm text-slate-500">{score.critical ?? 0} critical</p>
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
        <AnalysisTab issues={issues} score={score} parsed={parsed} result={result} expandedIssue={expandedIssue} setExpandedIssue={setExpandedIssue} />
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
          setSelectedCountry={(c) => { setSelectedCountry(c); loadSites(c); }}
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

function AnalysisTab({ issues, score, parsed, result, expandedIssue, setExpandedIssue }: any) {
  return (
    <div className="space-y-4">
      {result.successProbability?.factors?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Success Probability Factors</h3>
          <div className="space-y-2">
            {result.successProbability.factors.map((f: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-medium text-slate-700">{f.factor}</p>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{Math.round(f.score)}/{f.weight}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(f.score / f.weight) * 100}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {issues.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Compliance Issues ({issues.length})</h3>
          {issues.map((issue: any) => (
            <div key={issue.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                className="w-full p-3 flex items-center gap-3 text-left"
                onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
              >
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${severityColor[issue.severity] || "text-slate-600 bg-slate-50 border-slate-200"}`}>
                  {issue.severity.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{issue.rule}</p>
                  <p className="text-xs text-slate-500 truncate">{issue.description}</p>
                </div>
                {expandedIssue === issue.id ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
              </button>
              {expandedIssue === issue.id && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2 text-xs">
                  <p className="text-slate-600">{issue.description}</p>
                  <div className="bg-blue-50 rounded-lg p-2.5">
                    <p className="font-semibold text-blue-800 mb-0.5">Recommendation</p>
                    <p className="text-blue-700">{issue.recommendation}</p>
                  </div>
                  <p className="text-slate-400">Reference: {issue.reference}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {parsed.conditions?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Extracted Protocol Data</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ["Conditions", parsed.conditions?.join(", ")],
              ["Phase", parsed.phase?.join(", ")],
              ["Enrollment", parsed.enrollmentCount],
              ["Allocation", parsed.allocation],
              ["Masking", parsed.masking],
              ["Study Type", parsed.studyType],
              ["Sponsor", parsed.sponsorName],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={String(k)}>
                <p className="text-slate-400 mb-0.5">{k}</p>
                <p className="font-medium text-slate-800">{String(v)}</p>
              </div>
            ))}
          </div>
          {parsed.primaryOutcomes?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-1.5">Primary Endpoints</p>
              {parsed.primaryOutcomes.map((ep: string, i: number) => (
                <p key={i} className="text-xs text-slate-700 mb-0.5">• {ep}</p>
              ))}
            </div>
          )}
        </div>
      )}
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
