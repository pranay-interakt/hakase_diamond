import { useState } from "react";
import { Shield, CheckCircle2, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, Loader2, Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { checkTrialCompliance, checkCompliance, getRegulations } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const severityConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  critical: { icon: <XCircle className="h-4 w-4" />, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  major: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  minor: { icon: <Info className="h-4 w-4" />, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  info: { icon: <Info className="h-4 w-4" />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
};

const gradeColor: Record<string, string> = {
  A: "text-emerald-600", B: "text-blue-600", C: "text-amber-600", D: "text-red-600",
};

export default function ComplianceChecker() {
  const [mode, setMode] = useState<"nct" | "manual">("nct");
  const [nctId, setNctId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const [manual, setManual] = useState({
    title: "", eligibilityCriteria: "", enrollmentCount: "",
    allocation: "", masking: "", studyType: "INTERVENTIONAL",
    primaryOutcomes: "", secondaryOutcomes: "", phase: "",
  });

  const { data: regsData } = useQuery({ queryKey: ["regulations"], queryFn: getRegulations });

  const checkNct = async () => {
    setLoading(true); setError("");
    try {
      setResult(await checkTrialCompliance(nctId.trim().toUpperCase()));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const checkManual = async () => {
    setLoading(true); setError("");
    try {
      const protocol: Record<string, any> = {
        title: manual.title,
        eligibilityCriteria: manual.eligibilityCriteria,
        allocation: manual.allocation,
        masking: manual.masking,
        studyType: manual.studyType,
        enrollmentCount: manual.enrollmentCount ? Number(manual.enrollmentCount) : null,
        primaryOutcomes: manual.primaryOutcomes ? manual.primaryOutcomes.split("\n").filter(Boolean) : [],
        secondaryOutcomes: manual.secondaryOutcomes ? manual.secondaryOutcomes.split("\n").filter(Boolean) : [],
        phase: manual.phase ? [manual.phase] : [],
      };
      setResult(await checkCompliance(protocol));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const issues = result?.issues || [];
  const score = result?.score || {};

  const grouped = issues.reduce((acc: Record<string, any[]>, issue: any) => {
    if (!acc[issue.severity]) acc[issue.severity] = [];
    acc[issue.severity].push(issue);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Regulatory Compliance Checker</h2>
        <p className="text-sm text-slate-500">Validate your protocol against ICH E6/E8/E9, FDA 21 CFR, CONSORT, and WHO ICTRP requirements</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-1">
        <button onClick={() => setMode("nct")} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${mode === "nct" ? "bg-white border border-slate-200 border-b-white text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>
          Check by NCT ID
        </button>
        <button onClick={() => setMode("manual")} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${mode === "manual" ? "bg-white border border-slate-200 border-b-white text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>
          Manual Protocol Input
        </button>
      </div>

      {mode === "nct" ? (
        <div className="flex gap-2">
          <Input
            className="font-mono"
            placeholder="NCT ID (e.g. NCT04000001)"
            value={nctId}
            onChange={e => setNctId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && checkNct()}
          />
          <Button onClick={checkNct} disabled={loading || !nctId.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" />Check</>}
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">Protocol Title</label>
              <Input placeholder="Full protocol title" value={manual.title} onChange={e => setManual(m => ({...m, title: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Phase</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={manual.phase} onChange={e => setManual(m => ({...m, phase: e.target.value}))}>
                <option value="">Select phase</option>
                {["PHASE1","PHASE2","PHASE3","PHASE4","EARLY_PHASE1"].map(p => <option key={p} value={p}>{p.replace("_"," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Enrollment Target</label>
              <Input type="number" placeholder="Number of participants" value={manual.enrollmentCount} onChange={e => setManual(m => ({...m, enrollmentCount: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Allocation</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={manual.allocation} onChange={e => setManual(m => ({...m, allocation: e.target.value}))}>
                <option value="">Select allocation</option>
                <option value="RANDOMIZED">Randomized</option>
                <option value="NON_RANDOMIZED">Non-Randomized</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Masking</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={manual.masking} onChange={e => setManual(m => ({...m, masking: e.target.value}))}>
                <option value="">Select masking</option>
                <option value="DOUBLE">Double-Blind</option>
                <option value="SINGLE">Single-Blind</option>
                <option value="NONE">Open-Label</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">Primary Endpoints (one per line)</label>
              <Textarea rows={2} placeholder="e.g. Overall survival at 12 months&#10;Progression-free survival" value={manual.primaryOutcomes} onChange={e => setManual(m => ({...m, primaryOutcomes: e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">Eligibility Criteria Summary</label>
              <Textarea rows={3} placeholder="Include inclusion/exclusion criteria, age range, consent requirements, pregnancy policy..." value={manual.eligibilityCriteria} onChange={e => setManual(m => ({...m, eligibilityCriteria: e.target.value}))} />
            </div>
          </div>
          <Button onClick={checkManual} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
            Run Compliance Check
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Compliance Score</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold ${score.score >= 90 ? "text-emerald-600" : score.score >= 75 ? "text-blue-600" : score.score >= 60 ? "text-amber-600" : "text-red-600"}`}>
                    {score.score}
                  </span>
                  <span className="text-slate-400 text-lg">/100</span>
                  <span className={`text-2xl font-bold ml-1 ${gradeColor[score.grade] || "text-slate-900"}`}>
                    Grade {score.grade}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                {[["critical","bg-red-100 text-red-700"],["major","bg-orange-100 text-orange-700"],["minor","bg-amber-100 text-amber-700"],["info","bg-blue-100 text-blue-700"]].map(([sev, cls]) => (
                  <div key={sev} className={`rounded-lg px-3 py-1.5 ${cls}`}>
                    <p className="text-lg font-bold">{score[sev] || 0}</p>
                    <p className="text-xs capitalize">{sev}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${score.score >= 90 ? "bg-emerald-500" : score.score >= 75 ? "bg-blue-500" : score.score >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${score.score}%` }}
              />
            </div>
          </div>

          {["critical", "major", "minor", "info"].map(sev => {
            const sevIssues = grouped[sev] || [];
            if (!sevIssues.length) return null;
            const cfg = severityConfig[sev];
            return (
              <div key={sev}>
                <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${cfg.color}`}>
                  {cfg.icon}
                  {sev.charAt(0).toUpperCase() + sev.slice(1)} Issues ({sevIssues.length})
                </h3>
                <div className="space-y-2">
                  {sevIssues.map((issue: any) => (
                    <IssueCard key={issue.id} issue={issue} expanded={expanded === issue.id} onToggle={() => setExpanded(expanded === issue.id ? null : issue.id)} />
                  ))}
                </div>
              </div>
            );
          })}

          {issues.length === 0 && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">No compliance issues detected</p>
                <p className="text-xs text-emerald-600 mt-0.5">Protocol appears to meet all checked regulatory requirements</p>
              </div>
            </div>
          )}
        </div>
      )}

      {regsData && !result && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Regulations Checked
          </h3>
          <div className="grid gap-2">
            {(regsData.regulations || []).map((reg: any) => (
              <div key={reg.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-3">
                <Badge variant="outline" className="flex-shrink-0 font-mono text-xs">{reg.id}</Badge>
                <div>
                  <p className="text-sm font-medium text-slate-800">{reg.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{reg.description}</p>
                  <p className="text-xs text-blue-500 mt-1">{reg.applicability}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IssueCard({ issue, expanded, onToggle }: { issue: any; expanded: boolean; onToggle: () => void }) {
  const cfg = severityConfig[issue.severity] || severityConfig.info;
  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button className="w-full p-3 flex items-start gap-3 text-left" onClick={onToggle}>
        <span className={cfg.color}>{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-900">{issue.rule}</span>
            <Badge variant="outline" className="text-xs font-mono">{issue.id}</Badge>
            <Badge variant="outline" className="text-xs">{issue.category}</Badge>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{issue.description}</p>
        </div>
        <span className="flex-shrink-0 text-slate-400">{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-slate-100">
          <div>
            <p className="text-xs font-medium text-slate-700 mb-0.5">Issue</p>
            <p className="text-xs text-slate-600">{issue.description}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700 mb-0.5">Recommendation</p>
            <p className="text-xs text-slate-600">{issue.recommendation}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Section: {issue.section}</span>
            <span>Ref: {issue.reference}</span>
          </div>
        </div>
      )}
    </div>
  );
}
