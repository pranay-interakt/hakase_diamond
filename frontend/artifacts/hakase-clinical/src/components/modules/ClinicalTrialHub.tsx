import { useState, useCallback } from "react";
import {
  FlaskConical, Search, MapPin, Shield, TrendingUp,
  CheckCircle2, BarChart3, ChevronRight, Loader2,
  AlertTriangle, Sparkles, Target, Clock, DollarSign,
  Activity, Zap, Globe, Users, FileText, Lock,
  ArrowRight, RefreshCw, ExternalLink,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

type Stage = 1 | 2 | 3 | 4 | 5 | 6;

interface StageConfig {
  id: Stage;
  label: string;
  short: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  description: string;
}

const STAGES: StageConfig[] = [
  { id: 1, label: "Discovery & Feasibility", short: "Discovery", icon: <Search className="h-4 w-4" />, color: "#6366f1", gradient: "from-indigo-500 to-purple-500", description: "Landscape analysis, unmet need, safety baseline from live APIs" },
  { id: 2, label: "Site Selection", short: "Sites", icon: <MapPin className="h-4 w-4" />, color: "#10b981", gradient: "from-emerald-500 to-teal-500", description: "Site ranking, activation timelines, geographic risk scoring" },
  { id: 3, label: "Regulatory & IND", short: "Regulatory", icon: <Lock className="h-4 w-4" />, color: "#f59e0b", gradient: "from-amber-500 to-orange-500", description: "IND/CTA timelines, designations, compliance checklist" },
  { id: 4, label: "Enrollment Simulation", short: "Enrollment", icon: <TrendingUp className="h-4 w-4" />, color: "#ec4899", gradient: "from-pink-500 to-rose-500", description: "Monte Carlo simulation, scenarios, recruitment cost" },
  { id: 5, label: "Execution", short: "Execution", icon: <Activity className="h-4 w-4" />, color: "#8b5cf6", gradient: "from-violet-500 to-purple-500", description: "Monitoring plan, deviation risk, KPIs, RBM savings" },
  { id: 6, label: "Outcomes & Analysis", short: "Outcomes", icon: <BarChart3 className="h-4 w-4" />, color: "#06b6d4", gradient: "from-cyan-500 to-blue-500", description: "ML success prediction, GO/NO-GO, regulatory filing" },
];

// ─── API Helper ───────────────────────────────────────────

const API = (import.meta.env.VITE_API_URL || "") + "/api";

const clr = (hex: string, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// ─── Shared UI Atoms ──────────────────────────────────────

const ScoreBar = ({ value, max = 100, color }: { value: number; max?: number; color: string }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-1.5 rounded-full overflow-hidden bg-black/[0.06]">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
    </div>
  );
};

const Chip = ({ label, color = "#6366f1" }: { label: string; color?: string }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
    style={{ background: clr(color, 0.1), color, border: `1px solid ${clr(color, 0.22)}` }}>
    {label}
  </span>
);

const StatCard = ({ label, value, unit, color = "#6366f1", sub }: { label: string; value: string | number; unit?: string; color?: string; sub?: string }) => (
  <div className="rounded-2xl p-4" style={{ background: clr(color, 0.06), border: `1px solid ${clr(color, 0.15)}` }}>
    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: clr(color, 0.65) }}>{label}</p>
    <p className="text-2xl font-black leading-none" style={{ color }}>{value}{unit && <span className="text-sm font-medium ml-0.5 opacity-70">{unit}</span>}</p>
    {sub && <p className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</p>}
  </div>
);

const OptCard = ({ opt, color }: { opt: any; color: string }) => (
  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(4px)" }}>
    <div className="flex items-start gap-3">
      <div className="p-1.5 rounded-lg flex-shrink-0 mt-0.5" style={{ background: clr(color, 0.1) }}>
        <Zap className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Chip label={opt.priority || opt.type || "tip"} color={opt.priority === "HIGH" ? "#ef4444" : opt.priority === "MEDIUM" ? "#f59e0b" : "#10b981"} />
        </div>
        <p className="text-[12px] text-slate-700 leading-relaxed">{opt.recommendation}</p>
        {(opt.impact || opt.cost_saving || opt.timeline_impact || opt.time_saving) && (
          <p className="text-[11px] font-semibold mt-2" style={{ color }}>
            → {opt.impact || opt.cost_saving || opt.timeline_impact || opt.time_saving}
          </p>
        )}
      </div>
    </div>
  </div>
);

const ProbabilityGauge = ({ value, label, color }: { value: number; label: string; color: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="relative w-28 h-14 overflow-hidden">
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" strokeLinecap="round" />
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 157} 157`} />
        <text x="60" y="55" textAnchor="middle" style={{ fontSize: "16px", fontWeight: "900", fill: color }}>{value}%</text>
      </svg>
    </div>
    <p className="text-[11px] font-semibold text-slate-500">{label}</p>
  </div>
);

// ─── Form Input Styles ────────────────────────────────────

const inp = "w-full text-[12px] px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/30 transition-all";
const lbl = "block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5";
const sel = "w-full text-[12px] px-3 py-2.5 rounded-xl border border-white/10 bg-[#0f172a] text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 transition-all appearance-none";

// ─── Main Component ───────────────────────────────────────

export default function ClinicalTrialHub() {
  const [activeStage, setActiveStage] = useState<Stage>(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<number, any>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  const [s1, setS1] = useState({ condition: "", intervention: "", phase: "PHASE2", indication_rare: false, sponsor_type: "INDUSTRY" });
  const [s2, setS2] = useState({ condition: "", phase: "PHASE2", enrollment_target: 200, preferred_countries: [] as string[], n_sites_requested: 10 });
  const [s3, setS3] = useState({ condition: "", intervention: "", phase: "PHASE2", indication_rare: false, sponsor_type: "INDUSTRY", has_prior_ind: false });
  const [s4, setS4] = useState({ condition: "", phase: "PHASE2", enrollment_target: 200, n_sites: 10, dropout_rate: 0.08, n_simulations: 1000 });
  const [s5, setS5] = useState({ condition: "", phase: "PHASE2", enrollment_target: 200, duration_months: 24, n_sites: 10, n_patients: 200 });
  const [s6, setS6] = useState({ condition: "", intervention: "", phase: "PHASE2", enrollment_target: 200, primary_endpoint: "", masking: "DOUBLE", allocation: "RANDOMIZED", sponsor_type: "INDUSTRY" });

  const runStage = useCallback(async (stage: Stage) => {
    setLoading(true);
    setErrors(prev => ({ ...prev, [stage]: "" }));
    try {
      const endpoints: Record<Stage, { url: string; body: any }> = {
        1: { url: `${API}/trial-hub/stage1/discovery`, body: s1 },
        2: { url: `${API}/trial-hub/stage3/site-selection`, body: s2 },
        3: { url: `${API}/trial-hub/stage4/regulatory`, body: s3 },
        4: { url: `${API}/trial-hub/stage5/enrollment`, body: s4 },
        5: { url: `${API}/trial-hub/stage6/execution`, body: s5 },
        6: { url: `${API}/trial-hub/stage7/outcomes`, body: s6 },
      };
      const { url, body } = endpoints[stage];
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResults(prev => ({ ...prev, [stage]: data }));
    } catch (e: any) {
      setErrors(prev => ({ ...prev, [stage]: e.message || "Unknown error" }));
    } finally {
      setLoading(false);
    }
  }, [s1, s2, s3, s4, s5, s6]);

  const stageConfig = STAGES[activeStage - 1];
  const result = results[activeStage];
  const error = errors[activeStage];
  const completedCount = Object.keys(results).length;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 80px)" }}>

      {/* ── Header ── */}
      <div className="rounded-2xl mb-5 overflow-hidden relative" style={{ background: "linear-gradient(135deg,#0b1120 0%,#1e1b4b 60%,#0b1120 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle,#6366f1,transparent)" }} />
          <div className="absolute -bottom-8 left-24 h-40 w-40 rounded-full opacity-15" style={{ background: "radial-gradient(circle,#3b82f6,transparent)" }} />
          <div className="absolute top-4 right-1/3 h-24 w-24 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#ec4899,transparent)" }} />
        </div>
        <div className="relative px-6 py-5 flex items-center gap-4">
          <div className="p-3 rounded-xl flex-shrink-0" style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", boxShadow: "0 0 24px rgba(99,102,241,0.45)" }}>
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Clinical Trial Hub</h1>
            <p className="text-[11px] text-indigo-300/80 mt-0.5">End-to-end trial simulation · 6 stages · Live APIs · ML reasoning</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {completedCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-300">{completedCount} of 6 complete</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-300">Live Engine</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-6 mb-5">
          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-5 left-5 right-5 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="absolute top-5 left-5 h-px transition-all duration-500"
              style={{ background: "linear-gradient(90deg,#6366f1,#06b6d4)", width: `${((activeStage - 1) / 5) * (100 - 0)}%`, right: "unset" }} />
            <div className="relative flex justify-between">
              {STAGES.map((s) => {
                const isActive = activeStage === s.id;
                const isDone = !!results[s.id];
                const isPast = s.id < activeStage;
                return (
                  <button key={s.id} onClick={() => setActiveStage(s.id)}
                    className="flex flex-col items-center gap-2 group focus:outline-none">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                      style={{
                        background: isDone ? s.color : isActive ? `${s.color}20` : "rgba(255,255,255,0.05)",
                        border: `2px solid ${isDone || isActive ? s.color : "rgba(255,255,255,0.1)"}`,
                        boxShadow: isActive ? `0 0 16px ${clr(s.color, 0.4)}` : "none",
                      }}>
                      <span className={isDone ? "text-white" : ""} style={{ color: isDone ? "white" : isActive ? s.color : "#475569" }}>
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.icon}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wide transition-colors"
                        style={{ color: isActive ? s.color : isPast || isDone ? "#94a3b8" : "#475569" }}>
                        {s.short}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Left: Input Panel */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <div className="rounded-2xl flex-1 flex flex-col overflow-hidden" style={{ background: "#0b1120", border: "1px solid rgba(255,255,255,0.07)" }}>
            {/* Stage header */}
            <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl" style={{ background: `linear-gradient(135deg,${stageConfig.color}25,${stageConfig.color}10)`, border: `1px solid ${clr(stageConfig.color, 0.25)}` }}>
                  <span style={{ color: stageConfig.color }}>{stageConfig.icon}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: stageConfig.color }}>Stage {activeStage}</p>
                  <p className="text-[13px] font-black text-white leading-tight">{stageConfig.label}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{stageConfig.description}</p>
            </div>

            {/* Dynamic form */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3" style={{ maxHeight: "calc(100vh - 460px)" }}>
              {activeStage === 1 && <Stage1Form v={s1} set={setS1} />}
              {activeStage === 2 && <Stage2Form v={s2} set={setS2} />}
              {activeStage === 3 && <Stage3Form v={s3} set={setS3} />}
              {activeStage === 4 && <Stage4Form v={s4} set={setS4} />}
              {activeStage === 5 && <Stage5Form v={s5} set={setS5} />}
              {activeStage === 6 && <Stage6Form v={s6} set={setS6} />}
            </div>

            {/* Actions */}
            <div className="p-5 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => runStage(activeStage)} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[13px] text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg,${stageConfig.color},${stageConfig.color}aa)`, boxShadow: `0 4px 20px ${clr(stageConfig.color, 0.3)}` }}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Simulating…</> : <><Sparkles className="h-4 w-4" /> Run Simulation</>}
              </button>
              {result && !loading && activeStage < 6 && (
                <button onClick={() => setActiveStage((activeStage + 1) as Stage)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.07)" }}>
                  Next Stage <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Data sources badge */}
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(8px)" }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Live Data Sources</p>
            <div className="space-y-1.5">
              {[
                { name: "ClinicalTrials.gov", dot: "#3b82f6" },
                { name: "FDA FAERS / OpenFDA", dot: "#f87171" },
                { name: "PubMed / NCBI", dot: "#34d399" },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: s.dot }} />
                  <span className="text-[10px] font-medium text-slate-500">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {!result && !loading && !error && <EmptyState stage={activeStage} config={stageConfig} />}
          {loading && <LoadingState color={stageConfig.color} />}
          {error && !loading && <ErrorState message={error} onRetry={() => runStage(activeStage)} />}
          {result && !loading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-0">
              {activeStage === 1 && <Stage1Results data={result} />}
              {activeStage === 2 && <Stage3Results data={result} />}
              {activeStage === 3 && <Stage4Results data={result} />}
              {activeStage === 4 && <Stage5Results data={result} />}
              {activeStage === 5 && <Stage6Results data={result} />}
              {activeStage === 6 && <Stage7Results data={result} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── States ───────────────────────────────────────────────

function EmptyState({ stage, config }: { stage: Stage; config: StageConfig }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-80 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.45)", border: `2px dashed ${clr(config.color, 0.2)}` }}>
      <div className="p-5 rounded-2xl mb-5" style={{ background: clr(config.color, 0.08), border: `1px solid ${clr(config.color, 0.15)}` }}>
        <span className="block" style={{ color: config.color, transform: "scale(1.5)" }}>{config.icon}</span>
      </div>
      <p className="text-[15px] font-black text-slate-700 mb-2">Stage {stage}: {config.label}</p>
      <p className="text-[12px] text-slate-400 text-center max-w-xs leading-relaxed">{config.description}</p>
      <p className="text-[11px] text-slate-400 mt-4">
        Fill in the parameters ← then click <strong style={{ color: config.color }}>Run Simulation</strong>
      </p>
    </div>
  );
}

function LoadingState({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-80 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${clr(color, 0.18)}` }}>
      <div className="relative mb-5">
        <div className="p-5 rounded-full" style={{ background: clr(color, 0.1) }}>
          <Loader2 className="h-9 w-9 animate-spin" style={{ color }} />
        </div>
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: color }} />
      </div>
      <p className="text-[14px] font-black text-slate-700 mb-2">Fetching live data…</p>
      <p className="text-[11px] text-slate-400 text-center max-w-xs">Calling ClinicalTrials.gov, PubMed &amp; FDA FAERS in real time</p>
      <div className="mt-5 flex gap-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-1.5 w-6 rounded-full"
            style={{ background: color, opacity: 0.5, animation: `pulse 1.4s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-80 rounded-2xl"
      style={{ background: "rgba(254,242,242,0.8)", border: "1px solid rgba(239,68,68,0.2)" }}>
      <div className="p-4 rounded-full bg-red-100 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <p className="text-[14px] font-black text-red-700 mb-2">Simulation Error</p>
      <p className="text-[12px] text-red-500 text-center max-w-xs mb-5 leading-relaxed">{message}</p>
      <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold text-white"
        style={{ background: "#ef4444" }}>
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}

// ─── Stage Forms ──────────────────────────────────────────

function Stage1Form({ v, set }: any) {
  return (
    <div className="space-y-3.5">
      <div>
        <label className={lbl}>Condition / Indication *</label>
        <input className={inp} placeholder="e.g. Non-small cell lung cancer" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Intervention / Drug</label>
        <input className={inp} placeholder="e.g. Pembrolizumab" value={v.intervention} onChange={e => set({ ...v, intervention: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Target Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
          <option value="PHASE4">Phase 4</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Sponsor Type</label>
        <select className={sel} value={v.sponsor_type} onChange={e => set({ ...v, sponsor_type: e.target.value })}>
          <option value="INDUSTRY">Industry / Pharma</option>
          <option value="NIH">NIH</option>
          <option value="FED">Federal Agency</option>
          <option value="OTHER">Other / Academic</option>
        </select>
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" id="rare1" checked={v.indication_rare} onChange={e => set({ ...v, indication_rare: e.target.checked })}
          className="h-4 w-4 rounded accent-indigo-500" />
        <span className="text-[11px] text-slate-400">Rare disease / Orphan indication</span>
      </label>
    </div>
  );
}

function Stage2Form({ v, set }: any) {
  const [countryInput, setCountryInput] = useState("");
  return (
    <div className="space-y-3.5">
      <div>
        <label className={lbl}>Condition *</label>
        <input className={inp} placeholder="e.g. Breast Cancer" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Enrollment Target</label>
        <input type="number" className={inp} min={10} value={v.enrollment_target} onChange={e => set({ ...v, enrollment_target: parseInt(e.target.value) || 200 })} />
      </div>
      <div>
        <label className={lbl}>Sites Requested</label>
        <input type="number" className={inp} min={1} max={200} value={v.n_sites_requested} onChange={e => set({ ...v, n_sites_requested: parseInt(e.target.value) || 10 })} />
      </div>
      <div>
        <label className={lbl}>Preferred Countries</label>
        <div className="flex gap-1.5">
          <input className={inp} placeholder="e.g. United States" value={countryInput} onChange={e => setCountryInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && countryInput.trim()) { set({ ...v, preferred_countries: [...v.preferred_countries, countryInput.trim()] }); setCountryInput(""); } }} />
          <button onClick={() => { if (countryInput.trim()) { set({ ...v, preferred_countries: [...v.preferred_countries, countryInput.trim()] }); setCountryInput(""); } }}
            className="px-3 rounded-xl text-white font-bold text-[12px] flex-shrink-0" style={{ background: "#6366f1" }}>+</button>
        </div>
        {v.preferred_countries.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {v.preferred_countries.map((c: string, i: number) => (
              <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-700/30">
                {c}
                <button onClick={() => set({ ...v, preferred_countries: v.preferred_countries.filter((_: any, j: number) => j !== i) })} className="text-emerald-500 hover:text-red-400">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stage3Form({ v, set }: any) {
  return (
    <div className="space-y-3.5">
      <div>
        <label className={lbl}>Condition *</label>
        <input className={inp} placeholder="e.g. NSCLC" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Intervention</label>
        <input className={inp} placeholder="e.g. Osimertinib" value={v.intervention} onChange={e => set({ ...v, intervention: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Sponsor Type</label>
        <select className={sel} value={v.sponsor_type} onChange={e => set({ ...v, sponsor_type: e.target.value })}>
          <option value="INDUSTRY">Industry</option>
          <option value="NIH">NIH</option>
          <option value="FED">Federal</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="space-y-2.5">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={v.indication_rare} onChange={e => set({ ...v, indication_rare: e.target.checked })} className="h-4 w-4 rounded accent-amber-500" />
          <span className="text-[11px] text-slate-400">Rare / Orphan Disease</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={v.has_prior_ind} onChange={e => set({ ...v, has_prior_ind: e.target.checked })} className="h-4 w-4 rounded accent-amber-500" />
          <span className="text-[11px] text-slate-400">Prior IND already active</span>
        </label>
      </div>
    </div>
  );
}

function Stage4Form({ v, set }: any) {
  return (
    <div className="space-y-3.5">
      <div>
        <label className={lbl}>Condition *</label>
        <input className={inp} placeholder="e.g. Rheumatoid Arthritis" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Enrollment Target</label>
        <input type="number" className={inp} min={10} value={v.enrollment_target} onChange={e => set({ ...v, enrollment_target: parseInt(e.target.value) || 200 })} />
      </div>
      <div>
        <label className={lbl}>Number of Sites</label>
        <input type="number" className={inp} min={1} max={200} value={v.n_sites} onChange={e => set({ ...v, n_sites: parseInt(e.target.value) || 10 })} />
      </div>
      <div>
        <label className={lbl}>Dropout Rate — {Math.round(v.dropout_rate * 100)}%</label>
        <input type="range" min={0} max={0.5} step={0.01} value={v.dropout_rate} onChange={e => set({ ...v, dropout_rate: parseFloat(e.target.value) })}
          className="w-full accent-pink-500" />
      </div>
      <div>
        <label className={lbl}>Simulations</label>
        <select className={sel} value={v.n_simulations} onChange={e => set({ ...v, n_simulations: parseInt(e.target.value) })}>
          <option value={500}>500 (fast)</option>
          <option value={1000}>1,000 (standard)</option>
          <option value={2000}>2,000 (high fidelity)</option>
        </select>
      </div>
    </div>
  );
}

function Stage5Form({ v, set }: any) {
  return (
    <div className="space-y-3.5">
      <div>
        <label className={lbl}>Condition *</label>
        <input className={inp} placeholder="e.g. Major Depressive Disorder" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Enrolled Patients</label>
        <input type="number" className={inp} min={10} value={v.n_patients} onChange={e => set({ ...v, n_patients: parseInt(e.target.value) || 200 })} />
      </div>
      <div>
        <label className={lbl}>Duration (months)</label>
        <input type="number" className={inp} min={1} max={120} value={v.duration_months} onChange={e => set({ ...v, duration_months: parseInt(e.target.value) || 24 })} />
      </div>
      <div>
        <label className={lbl}>Number of Sites</label>
        <input type="number" className={inp} min={1} max={200} value={v.n_sites} onChange={e => set({ ...v, n_sites: parseInt(e.target.value) || 10 })} />
      </div>
    </div>
  );
}

function Stage6Form({ v, set }: any) {
  return (
    <div className="space-y-3.5">
      <div>
        <label className={lbl}>Condition *</label>
        <input className={inp} placeholder="e.g. Alzheimer's Disease" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Intervention</label>
        <input className={inp} placeholder="e.g. Lecanemab" value={v.intervention} onChange={e => set({ ...v, intervention: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Enrollment Target</label>
        <input type="number" className={inp} min={10} value={v.enrollment_target} onChange={e => set({ ...v, enrollment_target: parseInt(e.target.value) || 200 })} />
      </div>
      <div>
        <label className={lbl}>Primary Endpoint</label>
        <input className={inp} placeholder="e.g. CDR-SB change at 18 months" value={v.primary_endpoint} onChange={e => set({ ...v, primary_endpoint: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Masking</label>
        <select className={sel} value={v.masking} onChange={e => set({ ...v, masking: e.target.value })}>
          <option value="NONE">None</option>
          <option value="SINGLE">Single</option>
          <option value="DOUBLE">Double Blind</option>
          <option value="TRIPLE">Triple Blind</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Sponsor Type</label>
        <select className={sel} value={v.sponsor_type} onChange={e => set({ ...v, sponsor_type: e.target.value })}>
          <option value="INDUSTRY">Industry</option>
          <option value="NIH">NIH</option>
          <option value="FED">Federal</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
    </div>
  );
}

// ─── Result Section Wrapper ───────────────────────────────

function ResultSection({ title, icon, color, children }: any) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: clr(color, 0.03) }}>
        <div className="p-1.5 rounded-lg" style={{ background: clr(color, 0.1) }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-[13px] font-black text-slate-800">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Stage Result Components ──────────────────────────────

function Stage1Results({ data }: { data: any }) {
  const color = "#6366f1";
  const l = data.landscape || {};
  const lit = data.literatureMaturity || {};
  const safety = data.safetyBaseline || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Trials" value={l.totalTrials ?? "—"} color={color} sub="In landscape" />
        <StatCard label="Active Trials" value={l.activeTrials ?? "—"} color="#3b82f6" sub="Competitors" />
        <StatCard label="Completion Rate" value={`${l.completionRate ?? "—"}`} unit="%" color="#10b981" sub="Historical" />
        <StatCard label="Unmet Need Score" value={Math.round(data.unmetNeedScore ?? 0)} color="#f59e0b" sub="/100" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ResultSection title="Scientific Evidence" icon={<FileText className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-semibold text-slate-600">{lit.tier ?? "—"}</span>
                <Chip label={`${lit.maturityScore ?? 0}/100`} color={color} />
              </div>
              <ScoreBar value={lit.maturityScore ?? 0} color={color} />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{lit.reasoning}</p>
            <div className="flex items-center justify-between rounded-xl p-3" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
              <span className="text-[11px] text-slate-600">PubMed Articles</span>
              <span className="text-[14px] font-black" style={{ color }}>{lit.articleCount?.toLocaleString() ?? "—"}</span>
            </div>
          </div>
        </ResultSection>

        <ResultSection title="Safety Profile (Pharmacovigilance)" icon={<Shield className="h-3.5 w-3.5" />} color="#ef4444">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ProbabilityGauge value={safety.safetyScore ?? 0} label="Safety Score"
                color={safety.riskLevel === "LOW" ? "#10b981" : safety.riskLevel === "MODERATE" ? "#f59e0b" : "#ef4444"} />
              <div>
                <Chip label={safety.riskLevel ?? "—"} color={safety.riskLevel === "LOW" ? "#10b981" : safety.riskLevel === "MODERATE" ? "#f59e0b" : "#ef4444"} />
                <p className="text-[11px] text-slate-500 mt-1.5">{safety.totalFaersReports?.toLocaleString() ?? 0} FAERS reports</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{safety.nSignals} PRR signals</p>
              </div>
            </div>
            {safety.topSignals?.length > 0 && (
              <div>
                {(safety.topSignals).slice(0, 3).map((r: string) => (
                  <div key={r} className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-1.5">
                    <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" /> {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ResultSection>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ResultSection title="Recommended Trial Design" icon={<Target className="h-3.5 w-3.5" />} color="#10b981">
          <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)" }}>
            <p className="text-[13px] font-bold text-emerald-800 mb-1.5">{data.recommendedDesign}</p>
            <p className="text-[11px] text-emerald-700 leading-relaxed">{data.designRationale}</p>
          </div>
        </ResultSection>

        <ResultSection title="Geographic Diversity" icon={<Globe className="h-3.5 w-3.5" />} color="#06b6d4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl flex flex-col items-center min-w-[88px]" style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.18)" }}>
              <span className="text-[20px] font-black" style={{ color: "#06b6d4" }}>{data.geographicDiversity?.shannonIndex}</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Shannon H'</span>
              <div className="mt-1"><Chip label={data.geographicDiversity?.riskLevel} color={data.geographicDiversity?.riskLevel === "LOW" ? "#10b981" : "#f59e0b"} /></div>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-slate-700 mb-1.5">{data.geographicDiversity?.topCountry}</p>
              <ScoreBar value={data.geographicDiversity?.topCountryShare || 0} color="#06b6d4" />
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{data.geographicDiversity?.concentrationNarrative}</p>
            </div>
          </div>
        </ResultSection>
      </div>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Strategic Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color="#f59e0b">
          <div className="space-y-3">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color="#f59e0b" />)}</div>
        </ResultSection>
      )}

      {data.topCompetitorTrials?.length > 0 && (
        <ResultSection title="Active Competitor Trials" icon={<Globe className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-2">
            {data.topCompetitorTrials.slice(0, 5).map((t: any) => (
              <div key={t.nctId} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.08)" }}>
                <div>
                  <a href={`https://clinicaltrials.gov/study/${t.nctId}`} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    {t.nctId} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  <p className="text-[11px] text-slate-600 mt-0.5">{t.title}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Chip label={t.status} color={t.status === "RECRUITING" ? "#10b981" : "#6366f1"} />
                    {(t.phase || []).map((p: string) => <Chip key={p} label={p} color="#3b82f6" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ResultSection>
      )}
    </div>
  );
}

function Stage3Results({ data }: { data: any }) {
  const color = "#10b981";
  const sites = data.rankedSites || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Sites Identified" value={sites.length} color={color} sub="Ranked by score" />
        <StatCard label="Top Score" value={sites[0]?.score ?? "—"} unit="/100" color="#6366f1" sub={sites[0]?.facility || ""} />
        <StatCard label="Countries" value={new Set(sites.map((s: any) => s.country)).size} color="#06b6d4" sub="Represented" />
      </div>

      <ResultSection title="Ranked Sites" icon={<MapPin className="h-3.5 w-3.5" />} color={color}>
        <div className="space-y-2">
          {sites.slice(0, 8).map((site: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: i === 0 ? clr(color, 0.06) : "rgba(0,0,0,0.02)", border: `1px solid ${i === 0 ? clr(color, 0.15) : "rgba(0,0,0,0.04)"}` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                style={{ background: i < 3 ? color : "#e2e8f0", color: i < 3 ? "white" : "#64748b" }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-800">{site.facility || site.country}</p>
                <p className="text-[10px] text-slate-500">{site.country} · {site.trialCount} trials</p>
              </div>
              <div className="w-24">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-slate-400">Score</span>
                  <span className="text-[11px] font-black" style={{ color }}>{site.score}</span>
                </div>
                <ScoreBar value={site.score} color={color} />
              </div>
            </div>
          ))}
        </div>
      </ResultSection>

      <div className="grid grid-cols-2 gap-4">
        <ResultSection title="Geographic Diversity & Risk" icon={<Globe className="h-3.5 w-3.5" />} color="#06b6d4">
          <div className="rounded-xl p-4" style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.15)" }}>
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-[12px] font-bold text-cyan-800">Shannon Index</p>
                <p className="text-[10px] text-cyan-600">Site distribution entropy</p>
              </div>
              <div className="text-right">
                <p className="text-[18px] font-black text-cyan-700">{data.geographicDiversity?.shannonIndex}</p>
                <Chip label={data.geographicDiversity?.riskLevel} color={data.geographicDiversity?.riskLevel === "LOW" ? "#10b981" : "#f59e0b"} />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{data.geographicDiversity?.concentrationNarrative}</p>
          </div>
        </ResultSection>

        <ResultSection title="Activation Timelines" icon={<Clock className="h-3.5 w-3.5" />} color="#f59e0b">
          <div className="space-y-2">
            {Object.entries(data.activationTimelines || {}).map(([region, timeline]: [string, any]) => (
              <div key={region} className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-black text-slate-800">{region}</p>
                  <span className="text-[13px] font-black text-amber-600">{timeline.total} mo</span>
                </div>
              </div>
            ))}
          </div>
        </ResultSection>
      </div>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color="#6366f1">
          <div className="space-y-3">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color="#6366f1" />)}</div>
        </ResultSection>
      )}
    </div>
  );
}

function Stage4Results({ data }: { data: any }) {
  const color = "#f59e0b";
  const rp = data.regulatoryPath || {};
  const safety = data.safetyProfile || {};
  const lit = data.evidenceBase || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Months to First Patient" value={rp.expectedMonthsToFPI ?? "—"} unit=" mo" color={color} sub="From IND preparation" />
        <StatCard label="Safety Score" value={safety.safetyScore ?? "—"} color={safety.riskLevel === "LOW" ? "#10b981" : "#ef4444"} sub={safety.riskLevel} />
        <StatCard label="Literature Score" value={lit.maturityScore ?? "—"} color="#6366f1" sub={lit.tier} />
      </div>

      <ResultSection title="Regulatory Designations Available" icon={<Sparkles className="h-3.5 w-3.5" />} color={color}>
        {data.designations?.length > 0
          ? <div className="space-y-3">{data.designations.map((d: any) => (
            <div key={d.name} className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.18)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-black text-slate-800">{d.name}</p>
                <Chip label={d.timeline} color={color} />
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mb-1.5">{d.benefit}</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">{d.eligibility}</p>
              <a href={d.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:underline mt-2">
                FDA guidance <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          ))}</div>
          : <p className="text-[12px] text-slate-500">No expedited pathways identified for this configuration</p>}
      </ResultSection>

      <ResultSection title="Submission Checklist" icon={<CheckCircle2 className="h-3.5 w-3.5" />} color="#10b981">
        <div className="space-y-2">
          {(data.checklist || []).map((item: any, i: number) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${item.status === "URGENT" ? "bg-red-50" : "bg-slate-50"}`}>
              <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 ${item.status === "URGENT" ? "border-red-400" : "border-slate-300"}`} />
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-slate-700">{item.item}</p>
                <p className="text-[10px] text-slate-400">{item.due}</p>
              </div>
              {item.status === "URGENT" && <Chip label="URGENT" color="#ef4444" />}
            </div>
          ))}
        </div>
      </ResultSection>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color="#6366f1">
          <div className="space-y-3">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color={color} />)}</div>
        </ResultSection>
      )}
    </div>
  );
}

function Stage5Results({ data }: { data: any }) {
  const color = "#ec4899";
  const sim = data.simulation || {};
  const scenarios = data.scenarios || {};
  const cost = data.costModel || {};
  const hist = sim.histogram || [];
  const maxCount = hist.reduce((m: number, h: any) => Math.max(m, h.count), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="P10 Best Case" value={sim.p10Months ?? sim.p10 ?? "—"} unit=" mo" color="#10b981" sub="10th percentile" />
        <StatCard label="P50 Median" value={sim.p50Months ?? sim.p50 ?? "—"} unit=" mo" color={color} sub="50th percentile" />
        <StatCard label="P90 Worst Case" value={sim.p90Months ?? sim.p90 ?? "—"} unit=" mo" color="#ef4444" sub="90th percentile" />
        <StatCard label="Screening Cost" value={`$${cost.screeningCostUSD ? Math.round(cost.screeningCostUSD / 1e3) : "—"}K`} color="#8b5cf6" sub="Estimated" />
      </div>

      <ResultSection title="Monte Carlo Distribution" icon={<BarChart3 className="h-3.5 w-3.5" />} color={color}>
        <p className="text-[10px] text-slate-400 mb-3">{sim.methodology || sim.rateSource}</p>
        {hist.length > 0 && (
          <div className="flex items-end gap-0.5 h-24 px-1">
            {hist.map((h: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${h.bin} mo: ${h.count} sims`}>
                <div className="w-full rounded-t transition-all" style={{ height: `${Math.max(3, (h.count / maxCount) * 96)}%`, background: `linear-gradient(180deg, ${color}, ${color}55)` }} />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
          <span>{hist[0]?.bin.toFixed(0)} mo</span>
          <span>← Enrollment Duration →</span>
          <span>{hist[hist.length - 1]?.bin.toFixed(0)} mo</span>
        </div>
      </ResultSection>

      <div className="grid grid-cols-2 gap-4">
        <ResultSection title="Scenario Analysis" icon={<TrendingUp className="h-3.5 w-3.5" />} color="#3b82f6">
          <div className="space-y-2">
            {Object.entries(scenarios).map(([name, s]: [string, any]) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: name === "optimistic" ? "rgba(16,185,129,0.06)" : name === "conservative" ? "rgba(239,68,68,0.06)" : "rgba(59,130,246,0.06)",
                  border: `1px solid ${name === "optimistic" ? "rgba(16,185,129,0.18)" : name === "conservative" ? "rgba(239,68,68,0.18)" : "rgba(59,130,246,0.18)"}`,
                }}>
                <p className="text-[12px] font-bold text-slate-700 capitalize">{name}</p>
                <p className="text-[18px] font-black" style={{ color: name === "optimistic" ? "#10b981" : name === "conservative" ? "#ef4444" : "#3b82f6" }}>
                  {s.estimatedMonths}<span className="text-[11px] font-medium"> mo</span>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>

        <ResultSection title="Recruitment Cost Model" icon={<DollarSign className="h-3.5 w-3.5" />} color="#8b5cf6">
          <div className="space-y-2">
            {[
              { label: "Screening Cost", val: `$${Math.round((cost.screeningCostUSD || 0) / 1e3)}K`, color: "#8b5cf6" },
              { label: "Enrollment Cost", val: `$${Math.round((cost.enrollmentCostUSD || 0) / 1e3)}K`, color: "#6366f1" },
              { label: "Total Recruitment", val: `$${Math.round((cost.totalRecruitmentCostUSD || 0) / 1e6)}M`, color: "#ec4899" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-[11px] text-slate-600">{item.label}</span>
                <span className="text-[14px] font-black" style={{ color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </ResultSection>
      </div>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-3">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color={color} />)}</div>
        </ResultSection>
      )}
    </div>
  );
}

function Stage6Results({ data }: { data: any }) {
  const color = "#8b5cf6";
  const ops = data.operationalMetrics || {};
  const mon = data.monitoringPlan || {};
  const dev = data.deviationRisk || {};
  const eff = data.efficiencyScore || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Study Duration" value={ops.totalStudyMonths ?? "—"} unit=" mo" color={color} />
        <StatCard label="Monitoring Cost" value={`$${Math.round((mon.monitoringCostUSD || 0) / 1e3)}K`} color="#ef4444" />
        <StatCard label="RBM Savings" value={`$${Math.round((mon.rbmSavingsUSD || 0) / 1e3)}K`} color="#10b981" sub="vs. traditional SDV" />
        <StatCard label="Efficiency Score" value={eff.score ?? "—"} unit="/100" color={color} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ResultSection title="Protocol Deviation Risk" icon={<AlertTriangle className="h-3.5 w-3.5" />} color="#ef4444">
          <div className="space-y-3">
            {[
              { label: "Expected Total Deviations", value: dev.expectedDeviations, color: "#f59e0b" },
              { label: "Expected Major Deviations", value: dev.expectedMajorDeviations, color: "#ef4444" },
              { label: "Missing Data Points", value: dev.missingDatapointsEstimated, color: "#8b5cf6" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-[11px] text-slate-600">{item.label}</span>
                <span className="text-[14px] font-black" style={{ color: item.color }}>{item.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </ResultSection>

        <ResultSection title="Operational Efficiency" icon={<Activity className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <ProbabilityGauge value={eff.score ?? 0} label="Efficiency Score" color={color} />
            </div>
            {(eff.factors || []).map((f: string, i: number) => (
              <p key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                <span className="font-bold" style={{ color }}>•</span> {f}
              </p>
            ))}
          </div>
        </ResultSection>
      </div>

      <ResultSection title="Trial KPIs" icon={<Target className="h-3.5 w-3.5" />} color={color}>
        <div className="space-y-2">
          {(data.kpis || []).map((kpi: any) => (
            <div key={kpi.metric} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[11px] font-bold text-slate-700 w-36">{kpi.metric}</span>
              <span className="text-[11px] text-slate-500 flex-1">{kpi.target}</span>
              <Chip label={kpi.monitoring} color={color} />
            </div>
          ))}
        </div>
      </ResultSection>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-3">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color={color} />)}</div>
        </ResultSection>
      )}
    </div>
  );
}

function Stage7Results({ data }: { data: any }) {
  const color = "#06b6d4";
  const pred = data.outcomePrediction || {};
  const gono = data.goNoGoFramework || {};
  const safety = data.safetyOutcomes || {};
  const lit = data.literatureContext || {};
  const similar = data.similarTrialsBenchmark || {};
  const goColor = gono.decision === "GO" ? "#10b981" : gono.decision === "NO-GO" ? "#ef4444" : "#f59e0b";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-6 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${goColor}12, ${goColor}06)`, border: `2px solid ${goColor}35` }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${goColor}15, transparent 70%)` }} />
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${goColor}99` }}>GO / NO-GO Decision</p>
        <p className="text-6xl font-black mb-3" style={{ color: goColor, textShadow: `0 0 40px ${goColor}44` }}>{gono.decision}</p>
        <p className="text-[15px] font-bold text-slate-700">{gono.probability}% success probability · Threshold: {gono.threshold}%</p>
        {gono.npvEstimateUSD && <p className="text-[12px] text-slate-500 mt-1">NPV estimate: ${Math.round(gono.npvEstimateUSD / 1e6)}M</p>}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="ML Success Prob" value={`${pred.successProbabilityML ?? "—"}`} unit="%" color={color} />
        <StatCard label="Full Analysis" value={`${pred.fullAnalysis?.probability ?? "—"}`} unit="%" color="#6366f1" sub={pred.fullAnalysis?.rating} />
        <StatCard label="Safety Score" value={safety.safetyScore ?? "—"} color={safety.riskLevel === "LOW" ? "#10b981" : "#ef4444"} sub={safety.riskLevel} />
        <StatCard label="Literature Score" value={lit.maturityScore ?? "—"} color="#f59e0b" sub={lit.tier} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ResultSection title="ML Outcome Breakdown" icon={<Sparkles className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-3">
            {(pred.fullAnalysis?.factors || []).slice(0, 5).map((f: any) => (
              <div key={f.factor} className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">{f.factor}</span>
                  <span className="font-black" style={{ color }}>{f.score?.toFixed(1)}/{f.weight}</span>
                </div>
                <ScoreBar value={(f.score / f.weight) * 100} color={color} />
              </div>
            ))}
          </div>
        </ResultSection>

        <div className="space-y-4">
          <ResultSection title="Safety Signals (PRR)" icon={<Shield className="h-3.5 w-3.5" />} color="#ef4444">
            <div className="flex items-center gap-3 mb-3">
              <ProbabilityGauge value={safety.safetyScore ?? 0} label="Safety"
                color={safety.riskLevel === "LOW" ? "#10b981" : safety.riskLevel === "MODERATE" ? "#f59e0b" : "#ef4444"} />
              <div>
                <Chip label={safety.riskLevel} color={safety.riskLevel === "LOW" ? "#10b981" : "#ef4444"} />
                <p className="text-[10px] text-slate-500 mt-1">{safety.nSignals} PRR signals found</p>
              </div>
            </div>
            {(safety.topSignals || []).slice(0, 2).map((r: string) => (
              <div key={r} className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-red-50 p-2 rounded-lg mb-1">
                <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" /> {r}
              </div>
            ))}
          </ResultSection>

          <ResultSection title="Similar Trials Benchmark" icon={<Search className="h-3.5 w-3.5" />} color="#6366f1">
            <p className="text-[10px] text-slate-400 mb-2">{similar.corpusSize} trials analyzed</p>
            <div className="space-y-1.5">
              {(similar.topSimilar || []).slice(0, 4).map((t: any) => (
                <div key={t.nctId} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <span className="text-[9px] font-black text-indigo-600 w-10">{t.similarityScore}%</span>
                  <div className="flex-1 min-w-0">
                    <a href={`https://clinicaltrials.gov/study/${t.nctId}`} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-bold text-indigo-600 hover:underline">{t.nctId}</a>
                    <p className="text-[9px] text-slate-500 truncate">{t.title}</p>
                  </div>
                  <Chip label={t.status} color={t.status === "COMPLETED" ? "#10b981" : "#6366f1"} />
                </div>
              ))}
            </div>
          </ResultSection>
        </div>
      </div>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Post-Trial Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-3">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color={color} />)}</div>
        </ResultSection>
      )}
    </div>
  );
}
