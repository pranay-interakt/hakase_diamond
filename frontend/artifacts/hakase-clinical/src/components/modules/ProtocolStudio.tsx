import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Edit3, RefreshCw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { analyzeProtocolUpload, analyzeProtocolText, checkCompliance, simulateProtocolImpact } from "@/lib/api";

const severityIcon: Record<string, string> = { critical: "🔴", major: "🟠", minor: "🟡", info: "🔵" };

export default function ProtocolStudio() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [edited, setEdited] = useState<Record<string, any>>({});
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [impactResult, setImpactResult] = useState<any>(null);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true); setError("");
    try {
      const data = await analyzeProtocolUpload(file);
      setResult(data);
      setEdited(data.parsed || {});
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const recheckCompliance = async () => {
    setRecheckLoading(true);
    try {
      const protocol = {
        ...edited,
        primaryOutcomes: typeof edited.primaryOutcomes === "string"
          ? edited.primaryOutcomes.split("\n").filter(Boolean)
          : edited.primaryOutcomes || [],
        secondaryOutcomes: typeof edited.secondaryOutcomes === "string"
          ? edited.secondaryOutcomes.split("\n").filter(Boolean)
          : edited.secondaryOutcomes || [],
        phase: typeof edited.phase === "string"
          ? [edited.phase]
          : edited.phase || [],
        enrollmentCount: edited.enrollmentCount ? Number(edited.enrollmentCount) : null,
      };

      const [compliance, impact] = await Promise.all([
        checkCompliance(protocol),
        result?.parsed ? simulateProtocolImpact({
          originalProtocol: result.parsed,
          amendments: Object.entries(edited)
            .filter(([k, v]) => v !== result.parsed?.[k])
            .map(([field, value]) => ({ field, value })),
        }) : Promise.resolve(null),
      ]);

      setResult((prev: any) => ({ ...prev, compliance }));
      if (impact) setImpactResult(impact);
    } catch (e: any) { setError(e.message); }
    finally { setRecheckLoading(false); }
  };

  const parsed = result?.parsed || {};
  const compliance = result?.compliance || {};
  const issues = compliance.issues || [];
  const score = compliance.score || {};
  const prob = result?.successProbability || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Protocol Studio</h2>
        <p className="text-sm text-slate-500">Upload your protocol PDF for instant AI-powered compliance checking, success probability, and live amendment impact analysis</p>
      </div>

      {!result && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragging ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50"}`}
        >
          <label className="cursor-pointer block">
            <input type="file" accept=".pdf" className="hidden" onChange={onInputChange} />
            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin" />
                <p className="text-sm text-blue-600 font-medium">Analyzing protocol…</p>
                <p className="text-xs text-slate-400">Extracting entities, checking compliance, finding similar trials</p>
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

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-xl border p-4 text-center ${score.score >= 75 ? "bg-emerald-50 border-emerald-200" : score.score >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-xs text-slate-500 mb-1">Compliance Score</p>
              <p className={`text-4xl font-bold ${score.score >= 75 ? "text-emerald-600" : score.score >= 60 ? "text-amber-600" : "text-red-600"}`}>{score.score}</p>
              <p className="text-sm text-slate-500">Grade {score.grade}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Success Probability</p>
              <p className="text-4xl font-bold text-blue-600">{prob.probability}%</p>
              <p className="text-sm text-slate-500">{prob.rating}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Issues Found</p>
              <p className="text-4xl font-bold text-slate-900">{issues.length}</p>
              <p className="text-sm text-slate-500">{score.critical} critical</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(e => !e)}
              className="flex items-center gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {editMode ? "Hide Editor" : "Edit Protocol Fields"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setResult(null); setEdited({}); setImpactResult(null); }}
            >
              Upload New
            </Button>
          </div>

          {editMode && (
            <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Wand2 className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-slate-900">Live Protocol Editor</h3>
                <p className="text-xs text-slate-400 ml-auto">Changes trigger automatic compliance re-check</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Title</label>
                  <Input value={edited.title || ""} onChange={e => setEdited(v => ({...v, title: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Phase</label>
                  <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={(edited.phase || [])[0] || ""} onChange={e => setEdited(v => ({...v, phase: [e.target.value]}))}>
                    <option value="">Unknown</option>
                    {["EARLY_PHASE1","PHASE1","PHASE2","PHASE3","PHASE4"].map(p => <option key={p} value={p}>{p.replace("_"," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Target Enrollment</label>
                  <Input type="number" value={edited.enrollmentCount || ""} onChange={e => setEdited(v => ({...v, enrollmentCount: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Allocation</label>
                  <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={edited.allocation || ""} onChange={e => setEdited(v => ({...v, allocation: e.target.value}))}>
                    <option value="">Unknown</option>
                    <option value="RANDOMIZED">Randomized</option>
                    <option value="NON_RANDOMIZED">Non-Randomized</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Masking</label>
                  <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={edited.masking || ""} onChange={e => setEdited(v => ({...v, masking: e.target.value}))}>
                    <option value="">Unknown</option>
                    <option value="DOUBLE">Double-Blind</option>
                    <option value="SINGLE">Single-Blind</option>
                    <option value="NONE">Open-Label</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Primary Endpoints (one per line)</label>
                  <Textarea rows={2} value={Array.isArray(edited.primaryOutcomes) ? edited.primaryOutcomes.join("\n") : (edited.primaryOutcomes || "")} onChange={e => setEdited(v => ({...v, primaryOutcomes: e.target.value}))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Eligibility Criteria</label>
                  <Textarea rows={3} value={edited.eligibilityCriteria || ""} onChange={e => setEdited(v => ({...v, eligibilityCriteria: e.target.value}))} />
                </div>
              </div>
              <Button onClick={recheckCompliance} disabled={recheckLoading} className="w-full">
                {recheckLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Re-check Compliance with Changes
              </Button>
            </div>
          )}

          {impactResult && (
            <div className={`rounded-xl border p-4 ${impactResult.delta.scoreChange >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <h3 className="text-sm font-semibold mb-2">Amendment Impact</h3>
              <div className="flex items-center gap-4 text-sm">
                <span>Score change: <strong className={impactResult.delta.scoreChange >= 0 ? "text-emerald-600" : "text-red-600"}>{impactResult.delta.scoreChange > 0 ? "+" : ""}{impactResult.delta.scoreChange}</strong></span>
                {impactResult.delta.resolvedIssues.length > 0 && <span className="text-emerald-600">✓ {impactResult.delta.resolvedIssues.length} resolved</span>}
                {impactResult.delta.newIssues.length > 0 && <span className="text-red-600">⚠ {impactResult.delta.newIssues.length} new</span>}
              </div>
              {impactResult.enrollmentImpact?.factors?.length > 0 && (
                <div className="mt-2 text-xs text-slate-600">
                  {impactResult.enrollmentImpact.factors.map((f: any, i: number) => (
                    <p key={i}>{f.impact > 0 ? "▲" : "▼"} {f.description}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {issues.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Compliance Issues</h3>
              {issues.map((issue: any) => (
                <div
                  key={issue.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <button
                    className="w-full p-3 flex items-center gap-3 text-left"
                    onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                  >
                    <span className="text-base">{severityIcon[issue.severity]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{issue.rule}</p>
                      <p className="text-xs text-slate-500 truncate">{issue.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">{issue.severity}</Badge>
                      {expandedIssue === issue.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>
                  {expandedIssue === issue.id && (
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2 text-xs">
                      <p className="text-slate-600">{issue.description}</p>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="font-medium text-blue-800 mb-0.5">Recommendation</p>
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
                    <p className="text-slate-400">{k}</p>
                    <p className="font-medium text-slate-800 truncate">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
