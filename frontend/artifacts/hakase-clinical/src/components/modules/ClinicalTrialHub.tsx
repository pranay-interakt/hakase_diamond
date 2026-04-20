import { useState, useCallback } from "react";
import {
  FlaskConical, Search, MapPin, Shield, TrendingUp,
  CheckCircle2, BarChart3, ChevronRight, Loader2,
  AlertTriangle, Sparkles, Target, Clock, DollarSign,
  Activity, Zap, Globe, Users, FileText, Lock,
  ArrowRight, RefreshCw, ExternalLink, Info,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

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
  { id: 1, label: "Discovery & Feasibility", short: "Discovery", icon: <Search className="h-3.5 w-3.5" />, color: "#6366f1", gradient: "from-indigo-500 to-purple-500", description: "Landscape analysis, unmet need, safety baseline" },
  { id: 2, label: "Protocol Design", short: "Protocol", icon: <FileText className="h-3.5 w-3.5" />, color: "#3b82f6", gradient: "from-blue-500 to-cyan-500", description: "Endpoint quality, power, cost estimate, ML success" },
  { id: 3, label: "Site Selection", short: "Sites", icon: <MapPin className="h-3.5 w-3.5" />, color: "#10b981", gradient: "from-emerald-500 to-teal-500", description: "Site ranking, activation timelines, geographic risk" },
  { id: 4, label: "Regulatory & IND", short: "Regulatory", icon: <Lock className="h-3.5 w-3.5" />, color: "#f59e0b", gradient: "from-amber-500 to-orange-500", description: "IND/CTA timelines, designations, compliance checklist" },
  { id: 5, label: "Enrollment Sim", short: "Enrollment", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "#ec4899", gradient: "from-pink-500 to-rose-500", description: "Monte Carlo simulation, scenarios, recruitment cost" },
  { id: 6, label: "Execution", short: "Execution", icon: <Activity className="h-3.5 w-3.5" />, color: "#8b5cf6", gradient: "from-violet-500 to-purple-500", description: "Monitoring plan, deviation risk, KPIs, RBM savings" },
  { id: 7, label: "Outcomes & Analysis", short: "Outcomes", icon: <BarChart3 className="h-3.5 w-3.5" />, color: "#06b6d4", gradient: "from-cyan-500 to-blue-500", description: "ML success prediction, GO/NO-GO, regulatory filing" },
];

// ─── Helpers ─────────────────────────────────────────────

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

const clr = (hex: string, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const ScoreBar = ({ value, max = 100, color }: { value: number; max?: number; color: string }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
      />
    </div>
  );
};

const Chip = ({ label, color = "#6366f1" }: { label: string; color?: string }) => (
  <span
    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
    style={{ background: clr(color, 0.12), color, border: `1px solid ${clr(color, 0.25)}` }}
  >
    {label}
  </span>
);

const StatCard = ({ label, value, unit, color = "#6366f1", sub }: {
  label: string; value: string | number; unit?: string; color?: string; sub?: string;
}) => (
  <div className="rounded-xl p-3" style={{ background: clr(color, 0.07), border: `1px solid ${clr(color, 0.18)}` }}>
    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: clr(color, 0.7) }}>{label}</p>
    <p className="text-xl font-black" style={{ color }}>{value}{unit && <span className="text-sm font-medium ml-0.5">{unit}</span>}</p>
    {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

const OptCard = ({ opt, color }: { opt: any; color: string }) => (
  <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.06)" }}>
    <div className="flex items-start gap-2">
      <div className="p-1.5 rounded-lg mt-0.5" style={{ background: clr(color, 0.12) }}>
        <Zap className="h-3 w-3" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Chip
            label={opt.priority || opt.type || "tip"}
            color={opt.priority === "HIGH" ? "#ef4444" : opt.priority === "MEDIUM" ? "#f59e0b" : "#10b981"}
          />
        </div>
        <p className="text-[12px] text-slate-700 leading-relaxed">{opt.recommendation}</p>
        {(opt.impact || opt.cost_saving || opt.timeline_impact || opt.time_saving) && (
          <p className="text-[11px] font-semibold mt-1.5" style={{ color }}>
            → {opt.impact || opt.cost_saving || opt.timeline_impact || opt.time_saving}
          </p>
        )}
      </div>
    </div>
  </div>
);

const ProbabilityGauge = ({ value, label, color }: { value: number; label: string; color: string }) => {
  const angle = (value / 100) * 180;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-14 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M10,60 A50,50 0 0,1 110,60"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 157} 157`}
          />
          <text x="60" y="55" textAnchor="middle" style={{ fontSize: "16px", fontWeight: "900", fill: color }}>{value}%</text>
        </svg>
      </div>
      <p className="text-[11px] font-semibold text-slate-600">{label}</p>
    </div>
  );
};

// ─── Input Panel Components ───────────────────────────────

const inp = "w-full text-[12px] px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all";
const lbl = "block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1";
const sel = "w-full text-[12px] px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300";

// ─── Main Component ───────────────────────────────────────

export default function ClinicalTrialHub() {
  const [activeStage, setActiveStage] = useState<Stage>(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<number, any>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Form state for each stage
  const [s1, setS1] = useState({ condition: "", intervention: "", phase: "PHASE2", indication_rare: false, sponsor_type: "INDUSTRY" });
  const [s2, setS2] = useState({ condition: "", phase: "PHASE2", enrollment_target: 200, primary_endpoint: "", duration_months: 24, masking: "DOUBLE", allocation: "RANDOMIZED", n_arms: 2 });
  const [s3, setS3] = useState({ condition: "", phase: "PHASE2", enrollment_target: 200, preferred_countries: [] as string[], n_sites_requested: 10 });
  const [s4, setS4] = useState({ condition: "", intervention: "", phase: "PHASE2", indication_rare: false, sponsor_type: "INDUSTRY", has_prior_ind: false });
  const [s5, setS5] = useState({ condition: "", phase: "PHASE2", enrollment_target: 200, n_sites: 10, dropout_rate: 0.08, n_simulations: 1000 });
  const [s6, setS6] = useState({ condition: "", phase: "PHASE2", enrollment_target: 200, duration_months: 24, n_sites: 10, n_patients: 200 });
  const [s7, setS7] = useState({ condition: "", intervention: "", phase: "PHASE2", enrollment_target: 200, primary_endpoint: "", masking: "DOUBLE", allocation: "RANDOMIZED", sponsor_type: "INDUSTRY" });

  const runStage = useCallback(async (stage: Stage) => {
    setLoading(true);
    setErrors(prev => ({ ...prev, [stage]: "" }));
    try {
      const endpoints: Record<Stage, { url: string; body: any }> = {
        1: { url: `${API}/trial-hub/stage1/discovery`, body: s1 },
        2: { url: `${API}/trial-hub/stage2/protocol-design`, body: s2 },
        3: { url: `${API}/trial-hub/stage3/site-selection`, body: s3 },
        4: { url: `${API}/trial-hub/stage4/regulatory`, body: s4 },
        5: { url: `${API}/trial-hub/stage5/enrollment`, body: s5 },
        6: { url: `${API}/trial-hub/stage6/execution`, body: s6 },
        7: { url: `${API}/trial-hub/stage7/outcomes`, body: s7 },
      };
      const { url, body } = endpoints[stage];
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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
  }, [s1, s2, s3, s4, s5, s6, s7]);

  const stageConfig = STAGES[activeStage - 1];
  const result = results[activeStage];
  const error = errors[activeStage];

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 100px)" }}>
      {/* Header */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "linear-gradient(135deg,#0b1120 0%,#1e1b4b 50%,#0b1120 100%)" }}>
        <div className="relative px-6 py-5">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-20" style={{ background: "radial-gradient(circle,#6366f1,transparent)" }} />
            <div className="absolute -bottom-5 left-20 h-32 w-32 rounded-full opacity-15" style={{ background: "radial-gradient(circle,#3b82f6,transparent)" }} />
          </div>
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Clinical Trial Hub</h1>
              <p className="text-[11px] text-indigo-300">End-to-end trial simulation · 7 stages · Live APIs · ML/DL reasoning</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-300">Live Simulation Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Tab Bar */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        {STAGES.map(s => {
          const isActive = activeStage === s.id;
          const hasDone = !!results[s.id];
          return (
            <button
              key={s.id}
              onClick={() => setActiveStage(s.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-left transition-all duration-150 whitespace-nowrap flex-shrink-0"
              style={{
                background: isActive ? clr(s.color, 0.12) : "rgba(0,0,0,0.03)",
                border: `1.5px solid ${isActive ? clr(s.color, 0.35) : "rgba(0,0,0,0.06)"}`,
                boxShadow: isActive ? `0 0 12px ${clr(s.color, 0.18)}` : "none",
              }}
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-md text-white flex-shrink-0"
                style={{ background: hasDone ? s.color : isActive ? s.color : "#94a3b8" }}>
                {s.icon}
              </span>
              <span className="text-[11px] font-bold" style={{ color: isActive ? s.color : "#64748b" }}>
                {s.id}. {s.short}
              </span>
              {hasDone && (
                <CheckCircle2 className="h-3 w-3 flex-shrink-0" style={{ color: s.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content: Left Input + Right Simulation */}
      <div className="flex gap-5 flex-1">
        {/* ── Left: Input Panel ── */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4">
          <div className="rounded-2xl overflow-hidden flex-1" style={{ background: "#0b1120", border: "1px solid rgba(255,255,255,0.07)" }}>
            {/* Stage header */}
            <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg" style={{ background: `linear-gradient(135deg,${stageConfig.color},${stageConfig.color}aa)` }}>
                  {stageConfig.icon}
                </div>
                <div>
                  <p className="text-[11px] font-black text-white">Stage {activeStage}</p>
                  <p className="text-[10px] font-medium" style={{ color: stageConfig.color }}>{stageConfig.label}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">{stageConfig.description}</p>
            </div>

            {/* Dynamic form */}
            <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 380px)" }}>
              {activeStage === 1 && <Stage1Form v={s1} set={setS1} />}
              {activeStage === 2 && <Stage2Form v={s2} set={setS2} />}
              {activeStage === 3 && <Stage3Form v={s3} set={setS3} />}
              {activeStage === 4 && <Stage4Form v={s4} set={setS4} />}
              {activeStage === 5 && <Stage5Form v={s5} set={setS5} />}
              {activeStage === 6 && <Stage6Form v={s6} set={setS6} />}
              {activeStage === 7 && <Stage7Form v={s7} set={setS7} />}
            </div>

            {/* Run button */}
            <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => runStage(activeStage)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] text-white transition-all duration-150 disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg,${stageConfig.color},${stageConfig.color}bb)`,
                  boxShadow: `0 0 16px ${clr(stageConfig.color, 0.35)}`,
                }}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Simulating…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Run Stage {activeStage} Simulation</>
                )}
              </button>
              {result && !loading && (
                <button
                  onClick={() => {
                    if (activeStage < 7) setActiveStage((activeStage + 1) as Stage);
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Next Stage <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Data sources */}
          <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Data Sources</p>
            <div className="space-y-1">
              {[
                { name: "ClinicalTrials.gov", dot: "#3b82f6" },
                { name: "FDA FAERS", dot: "#f87171" },
                { name: "PubMed / NCBI", dot: "#34d399" },
                { name: "OpenFDA", dot: "#fb923c" },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: s.dot }} />
                  <span className="text-[10px] font-medium text-slate-500">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Simulation Results ── */}
        <div className="flex-1 min-w-0">
          {!result && !loading && !error && <EmptyState stage={activeStage} color={stageConfig.color} />}
          {loading && <LoadingState color={stageConfig.color} />}
          {error && !loading && <ErrorState message={error} onRetry={() => runStage(activeStage)} />}
          {result && !loading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeStage === 1 && <Stage1Results data={result} />}
              {activeStage === 2 && <Stage2Results data={result} />}
              {activeStage === 3 && <Stage3Results data={result} />}
              {activeStage === 4 && <Stage4Results data={result} />}
              {activeStage === 5 && <Stage5Results data={result} />}
              {activeStage === 6 && <Stage6Results data={result} />}
              {activeStage === 7 && <Stage7Results data={result} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty / Loading / Error States ──────────────────────

function EmptyState({ stage, color }: { stage: Stage; color: string }) {
  const cfg = STAGES[stage - 1];
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-72 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.4)", border: `2px dashed ${clr(color, 0.25)}` }}>
      <div className="p-4 rounded-2xl mb-4" style={{ background: clr(color, 0.1) }}>
        <div className="scale-150" style={{ color }}>{cfg.icon}</div>
      </div>
      <p className="text-[14px] font-bold text-slate-700 mb-1">Stage {stage}: {cfg.label}</p>
      <p className="text-[12px] text-slate-400 text-center max-w-xs">{cfg.description}</p>
      <p className="text-[11px] text-slate-400 mt-3">Fill in the parameters on the left and click <strong style={{ color }}>Run Simulation</strong></p>
    </div>
  );
}

function LoadingState({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-72 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.5)", border: `1px solid ${clr(color, 0.2)}` }}>
      <div className="p-4 rounded-full mb-4" style={{ background: clr(color, 0.12) }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color }} />
      </div>
      <p className="text-[13px] font-bold text-slate-700 mb-1">Running Simulation…</p>
      <p className="text-[11px] text-slate-400">Fetching live data from ClinicalTrials.gov, PubMed & FDA FAERS</p>
      <div className="mt-4 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-1.5 w-8 rounded-full" style={{
            background: color,
            animation: `pulse 1.4s ${i * 0.2}s ease-in-out infinite`,
            opacity: 0.6,
          }} />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-72 rounded-2xl bg-red-50"
      style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
      <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
      <p className="text-[13px] font-bold text-red-700 mb-1">Simulation Error</p>
      <p className="text-[11px] text-red-500 text-center max-w-xs mb-4">{message}</p>
      <button onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white"
        style={{ background: "#ef4444" }}>
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}

// ─── Stage Form Components ────────────────────────────────

function Stage1Form({ v, set }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Condition / Indication *</label>
        <input className={inp} placeholder="e.g. Non-small cell lung cancer" value={v.condition}
          onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Intervention / Drug</label>
        <input className={inp} placeholder="e.g. Pembrolizumab" value={v.intervention}
          onChange={e => set({ ...v, intervention: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Target Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
          <option value="PHASE4">Phase 4</option>
        </select>
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Sponsor Type</label>
        <select className={sel} value={v.sponsor_type} onChange={e => set({ ...v, sponsor_type: e.target.value })}>
          <option value="INDUSTRY">Industry / Pharma</option>
          <option value="NIH">NIH</option>
          <option value="FED">Federal Agency</option>
          <option value="OTHER">Other / Academic</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="rare1" checked={v.indication_rare}
          onChange={e => set({ ...v, indication_rare: e.target.checked })}
          className="h-3.5 w-3.5 rounded accent-indigo-500" />
        <label htmlFor="rare1" className="text-[11px] text-slate-400 cursor-pointer">Rare disease / Orphan indication</label>
      </div>
    </div>
  );
}

function Stage2Form({ v, set }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Condition *</label>
        <input className={inp} placeholder="e.g. Type 2 Diabetes" value={v.condition}
          onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Enrollment Target</label>
        <input type="number" className={inp} min={10} max={50000} value={v.enrollment_target}
          onChange={e => set({ ...v, enrollment_target: parseInt(e.target.value) || 200 })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Primary Endpoint</label>
        <input className={inp} placeholder="e.g. PFS at 12 months" value={v.primary_endpoint}
          onChange={e => set({ ...v, primary_endpoint: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Duration (months)</label>
        <input type="number" className={inp} min={1} max={120} value={v.duration_months}
          onChange={e => set({ ...v, duration_months: parseInt(e.target.value) || 24 })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lbl} style={{ color: "#94a3b8" }}>Masking</label>
          <select className={sel} value={v.masking} onChange={e => set({ ...v, masking: e.target.value })}>
            <option value="NONE">None (Open)</option>
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double Blind</option>
            <option value="TRIPLE">Triple Blind</option>
          </select>
        </div>
        <div>
          <label className={lbl} style={{ color: "#94a3b8" }}># Arms</label>
          <input type="number" className={inp} min={1} max={6} value={v.n_arms}
            onChange={e => set({ ...v, n_arms: parseInt(e.target.value) || 2 })} />
        </div>
      </div>
    </div>
  );
}

function Stage3Form({ v, set }: any) {
  const [countryInput, setCountryInput] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Condition *</label>
        <input className={inp} placeholder="e.g. Breast Cancer" value={v.condition}
          onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Enrollment Target</label>
        <input type="number" className={inp} min={10} value={v.enrollment_target}
          onChange={e => set({ ...v, enrollment_target: parseInt(e.target.value) || 200 })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Sites Requested</label>
        <input type="number" className={inp} min={1} max={200} value={v.n_sites_requested}
          onChange={e => set({ ...v, n_sites_requested: parseInt(e.target.value) || 10 })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Preferred Countries</label>
        <div className="flex gap-1.5">
          <input className={inp} placeholder="e.g. United States" value={countryInput}
            onChange={e => setCountryInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && countryInput.trim()) {
                set({ ...v, preferred_countries: [...v.preferred_countries, countryInput.trim()] });
                setCountryInput("");
              }
            }} />
          <button onClick={() => {
            if (countryInput.trim()) {
              set({ ...v, preferred_countries: [...v.preferred_countries, countryInput.trim()] });
              setCountryInput("");
            }
          }} className="px-2 rounded-lg text-white font-bold text-[12px]" style={{ background: "#6366f1" }}>+</button>
        </div>
        {v.preferred_countries.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {v.preferred_countries.map((c: string, i: number) => (
              <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                {c}
                <button onClick={() => set({ ...v, preferred_countries: v.preferred_countries.filter((_: any, j: number) => j !== i) })} className="text-indigo-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stage4Form({ v, set }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Condition *</label>
        <input className={inp} placeholder="e.g. NSCLC" value={v.condition}
          onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Intervention</label>
        <input className={inp} placeholder="e.g. Osimertinib" value={v.intervention}
          onChange={e => set({ ...v, intervention: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Sponsor Type</label>
        <select className={sel} value={v.sponsor_type} onChange={e => set({ ...v, sponsor_type: e.target.value })}>
          <option value="INDUSTRY">Industry</option>
          <option value="NIH">NIH</option>
          <option value="FED">Federal</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={v.indication_rare} onChange={e => set({ ...v, indication_rare: e.target.checked })}
            className="h-3.5 w-3.5 rounded accent-amber-500" />
          <span className="text-[11px] text-slate-400">Rare / Orphan Disease</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={v.has_prior_ind} onChange={e => set({ ...v, has_prior_ind: e.target.checked })}
            className="h-3.5 w-3.5 rounded accent-amber-500" />
          <span className="text-[11px] text-slate-400">Prior IND already active</span>
        </label>
      </div>
    </div>
  );
}

function Stage5Form({ v, set }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Condition *</label>
        <input className={inp} placeholder="e.g. Rheumatoid Arthritis" value={v.condition}
          onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Enrollment Target</label>
        <input type="number" className={inp} min={10} value={v.enrollment_target}
          onChange={e => set({ ...v, enrollment_target: parseInt(e.target.value) || 200 })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Number of Sites</label>
        <input type="number" className={inp} min={1} max={200} value={v.n_sites}
          onChange={e => set({ ...v, n_sites: parseInt(e.target.value) || 10 })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Dropout Rate</label>
        <div className="flex items-center gap-2">
          <input type="range" min={0} max={0.5} step={0.01} value={v.dropout_rate}
            onChange={e => set({ ...v, dropout_rate: parseFloat(e.target.value) })}
            className="flex-1 accent-pink-500" />
          <span className="text-[12px] font-bold text-pink-400 w-10">{Math.round(v.dropout_rate * 100)}%</span>
        </div>
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Simulations</label>
        <select className={sel} value={v.n_simulations} onChange={e => set({ ...v, n_simulations: parseInt(e.target.value) })}>
          <option value={500}>500 (fast)</option>
          <option value={1000}>1,000 (standard)</option>
          <option value={2000}>2,000 (high fidelity)</option>
        </select>
      </div>
    </div>
  );
}

function Stage6Form({ v, set }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Condition *</label>
        <input className={inp} placeholder="e.g. Major Depressive Disorder" value={v.condition}
          onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Enrolled Patients</label>
        <input type="number" className={inp} min={10} value={v.n_patients}
          onChange={e => set({ ...v, n_patients: parseInt(e.target.value) || 200 })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Duration (months)</label>
        <input type="number" className={inp} min={1} max={120} value={v.duration_months}
          onChange={e => set({ ...v, duration_months: parseInt(e.target.value) || 24 })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Number of Sites</label>
        <input type="number" className={inp} min={1} max={200} value={v.n_sites}
          onChange={e => set({ ...v, n_sites: parseInt(e.target.value) || 10 })} />
      </div>
    </div>
  );
}

function Stage7Form({ v, set }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Condition *</label>
        <input className={inp} placeholder="e.g. Alzheimer's Disease" value={v.condition}
          onChange={e => set({ ...v, condition: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Intervention</label>
        <input className={inp} placeholder="e.g. Lecanemab" value={v.intervention}
          onChange={e => set({ ...v, intervention: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Phase</label>
        <select className={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          <option value="PHASE1">Phase 1</option>
          <option value="PHASE2">Phase 2</option>
          <option value="PHASE3">Phase 3</option>
        </select>
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Enrollment Target</label>
        <input type="number" className={inp} min={10} value={v.enrollment_target}
          onChange={e => set({ ...v, enrollment_target: parseInt(e.target.value) || 200 })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Primary Endpoint</label>
        <input className={inp} placeholder="e.g. CDR-SB change at 18 months" value={v.primary_endpoint}
          onChange={e => set({ ...v, primary_endpoint: e.target.value })} />
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Masking</label>
        <select className={sel} value={v.masking} onChange={e => set({ ...v, masking: e.target.value })}>
          <option value="NONE">None</option>
          <option value="SINGLE">Single</option>
          <option value="DOUBLE">Double Blind</option>
          <option value="TRIPLE">Triple Blind</option>
        </select>
      </div>
      <div>
        <label className={lbl} style={{ color: "#94a3b8" }}>Sponsor Type</label>
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

// ─── Stage Result Panels ──────────────────────────────────

function ResultSection({ title, icon, color, children }: any) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: clr(color, 0.04) }}>
        <div className="p-1.5 rounded-lg" style={{ background: clr(color, 0.12) }}><span style={{ color }}>{icon}</span></div>
        <span className="text-[13px] font-black text-slate-800">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Stage1Results({ data }: { data: any }) {
  const color = "#6366f1";
  const l = data.landscape || {};
  const lit = data.literatureMaturity || {};
  const safety = data.safetyBaseline || {};
  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Trials" value={l.totalTrials ?? "—"} color={color} sub="In landscape" />
        <StatCard label="Active Trials" value={l.activeTrials ?? "—"} color="#3b82f6" sub="Competitors" />
        <StatCard label="Completion Rate" value={`${l.completionRate ?? "—"}`} unit="%" color="#10b981" sub="Historical" />
        <StatCard label="Unmet Need Score" value={Math.round(data.unmetNeedScore ?? 0)} color="#f59e0b" sub="/100" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Literature & Safety */}
        <ResultSection title="Scientific Evidence" icon={<FileText className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-semibold text-slate-600">{lit.tier ?? "—"}</span>
                <Chip label={`${lit.maturityScore ?? 0}/100`} color={color} />
              </div>
              <ScoreBar value={lit.maturityScore ?? 0} color={color} />
            </div>
            <p className="text-[11px] text-slate-500">{lit.reasoning}</p>
            <div className="flex items-center justify-between rounded-lg p-2.5" style={{ background: "rgba(99,102,241,0.06)" }}>
              <span className="text-[11px] text-slate-600">PubMed Articles</span>
              <span className="text-[13px] font-black" style={{ color }}>{lit.articleCount?.toLocaleString() ?? "—"}</span>
            </div>
          </div>
        </ResultSection>

        <ResultSection title="Safety Profile (Pharmacovigilance)" icon={<Shield className="h-3.5 w-3.5" />} color="#ef4444">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ProbabilityGauge value={safety.safetyScore ?? 0} label="Safety Score" color={safety.riskLevel === "LOW" ? "#10b981" : safety.riskLevel === "MODERATE" ? "#f59e0b" : "#ef4444"} />
              <div>
                <Chip label={safety.riskLevel ?? "—"} color={safety.riskLevel === "LOW" ? "#10b981" : safety.riskLevel === "MODERATE" ? "#f59e0b" : "#ef4444"} />
                <p className="text-[11px] text-slate-500 mt-1.5">{safety.totalFaersReports?.toLocaleString() ?? 0} total FAERS reports</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{safety.nSignals} PRR signals · {safety.nSeriousReactions} serious signals</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic border-l-2 border-slate-200 pl-2">{safety.reasoning}</p>
            {safety.topSignals?.length > 0 && (
              <div className="pt-1">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Top PRR/ROR Signals</p>
                {(safety.topSignals).slice(0, 3).map((r: string) => (
                  <div key={r} className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-1">
                    <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" /> {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ResultSection>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recommended Design */}
      <ResultSection title="Recommended Trial Design" icon={<Target className="h-3.5 w-3.5" />} color="#10b981">
        <div className="rounded-xl p-3.5 mb-3" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p className="text-[13px] font-bold text-emerald-800 mb-1">{data.recommendedDesign}</p>
          <p className="text-[11px] text-emerald-700">{data.designRationale}</p>
        </div>
      </ResultSection>

      {/* Geographic & Enrollment Info */}
      <ResultSection title="Geographic Diversity (Shannon Index)" icon={<Globe className="h-3.5 w-3.5" />} color="#06b6d4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg flex flex-col items-center justify-center min-w-[100px]" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <span className="text-[18px] font-black" style={{ color: "#06b6d4" }}>{data.geographicDiversity?.shannonIndex}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Shannon H'</span>
            <Chip label={data.geographicDiversity?.riskLevel} color={data.geographicDiversity?.riskLevel === "LOW" ? "#10b981" : data.geographicDiversity?.riskLevel === "MEDIUM" ? "#f59e0b" : "#ef4444"} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-slate-700 mb-1">Top Country Concentration</p>
            <div className="flex items-center gap-2 mb-2">
               <span className="text-[11px] text-slate-600 w-24 truncate">{data.geographicDiversity?.topCountry}</span>
               <div className="flex-1"><ScoreBar value={data.geographicDiversity?.topCountryShare || 0} color="#06b6d4" /></div>
               <span className="text-[11px] font-bold text-slate-500 w-10">{data.geographicDiversity?.topCountryShare}%</span>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-1.5 max-w-xs">{data.geographicDiversity?.concentrationNarrative}</p>
          </div>
        </div>
      </ResultSection>
      </div>

      {/* Optimizations */}
      {data.optimizations?.length > 0 && (
        <ResultSection title="Strategic Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color="#f59e0b">
          <div className="space-y-2.5">
            {data.optimizations.map((opt: any, i: number) => (
              <OptCard key={i} opt={opt} color="#f59e0b" />
            ))}
          </div>
        </ResultSection>
      )}

      {/* Competitors */}
      {data.topCompetitorTrials?.length > 0 && (
        <ResultSection title="Active Competitor Trials" icon={<Globe className="h-3.5 w-3.5" />} color="#6366f1">
          <div className="space-y-2">
            {data.topCompetitorTrials.slice(0, 5).map((t: any) => (
              <div key={t.nctId} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: "rgba(0,0,0,0.03)" }}>
                <div>
                  <a href={`https://clinicaltrials.gov/study/${t.nctId}`} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    {t.nctId} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  <p className="text-[11px] text-slate-600">{t.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
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

function Stage2Results({ data }: { data: any }) {
  const color = "#3b82f6";
  const dq = data.designQuality || {};
  const sp = data.statisticalPower || {};
  const eb = data.enrollmentBenchmarks || {};
  const cost = data.costEstimate || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="ML Success Prob" value={`${dq.successProbability ?? "—"}`} unit="%" color={color} sub={dq.method?.split(" ")[0]} />
        <StatCard label="Detectable Effect" value={sp.detectableEffectSize ?? "—"} sub="Cohen's d" color="#10b981" />
        <StatCard label="Benchmark Median" value={Math.round(eb.median ?? 0)} sub="patients (similar trials)" color="#f59e0b" />
        <StatCard label="Est. Total Cost" value={`$${cost.totalUSD ? Math.round(cost.totalUSD / 1e6) : "—"}M`} color="#8b5cf6" sub="Industry estimate" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ResultSection title="Design Quality (ML)" icon={<Sparkles className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ProbabilityGauge value={dq.successProbability ?? 0} label="Success Probability" color={
                (dq.successProbability ?? 0) >= 70 ? "#10b981" : (dq.successProbability ?? 0) >= 45 ? "#f59e0b" : "#ef4444"
              } />
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5 font-medium">{dq.reasoning}</p>
                <div className="flex gap-2 text-[10px]">
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">AUC: {dq.crossValidation?.aucCV.toFixed(2)}</span>
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">N={dq.trainingSamples}</span>
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{dq.individualModels?.gradientBoosting}% GB</span>
                </div>
              </div>
            </div>
            {dq.featureImportances && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Feature Importances</p>
                {Object.entries(dq.featureImportances).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 w-32 capitalize">{k.replace(/_/g, " ")}</span>
                    <div className="flex-1"><ScoreBar value={(v as number) * 100} color={color} /></div>
                    <span className="text-[10px] font-bold text-slate-500 w-8">{Math.round((v as number) * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ResultSection>

        <ResultSection title="Statistical Power" icon={<BarChart3 className="h-3.5 w-3.5" />} color="#10b981">
          <div className="space-y-3">
            <div className={`rounded-xl p-3 ${sp.powerAdequate ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
              <div className="flex items-center gap-2 mb-1">
                {sp.powerAdequate
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                <span className="text-[12px] font-bold">{sp.powerAdequate ? "Adequately Powered" : "Power Concern"}</span>
              </div>
              <p className="text-[11px] text-slate-600">{sp.recommendation}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-50"><span className="text-slate-500">n per arm:</span> <strong>{sp.nPerArm}</strong></div>
              <div className="p-2 rounded-lg bg-slate-50"><span className="text-slate-500">Detectable d:</span> <strong>{sp.detectableEffectSize}</strong></div>
            </div>
          </div>
        </ResultSection>
      </div>

      <ResultSection title="Enrollment Benchmark vs Your Target" icon={<Target className="h-3.5 w-3.5" />} color="#f59e0b">
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: "Min", value: eb.min },
            { label: "P25", value: eb.p25 },
            { label: "Median", value: eb.median },
            { label: "P75", value: eb.p75 },
            { label: "Max", value: eb.max },
          ].map(item => (
            <div key={item.label} className={`rounded-xl p-2.5 ${item.label === "Median" ? "ring-2 ring-amber-400" : ""}`}
              style={{ background: item.label === "Median" ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.03)" }}>
              <p className="text-[10px] text-slate-500">{item.label}</p>
              <p className="text-[15px] font-black text-slate-800">{Math.round(item.value || 0)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl p-2.5" style={{ background: eb.isUnderpowered ? "rgba(239,68,68,0.07)" : "rgba(16,185,129,0.07)" }}>
          <Info className="h-3.5 w-3.5 flex-shrink-0" style={{ color: eb.isUnderpowered ? "#ef4444" : "#10b981" }} />
          <p className="text-[11px]" style={{ color: eb.isUnderpowered ? "#ef4444" : "#10b981" }}>
            Your target: <strong>{eb.yourTarget}</strong> patients — {eb.isUnderpowered ? "potentially underpowered vs benchmark" : "within benchmark range"}
          </p>
        </div>
      </ResultSection>

      <ResultSection title="Amendment Risk Factors" icon={<AlertTriangle className="h-3.5 w-3.5" />} color="#ef4444">
        {data.amendmentRisks?.length > 0
          ? <div className="space-y-2">{data.amendmentRisks.map((r: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-slate-700 p-2 rounded-lg bg-red-50">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />{r}
            </div>
          ))}</div>
          : <p className="text-[12px] text-emerald-600 font-medium">No significant amendment risk factors detected</p>}
      </ResultSection>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color="#6366f1">
          <div className="space-y-2.5">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color="#6366f1" />)}</div>
        </ResultSection>
      )}
    </div>
  );
}

function Stage3Results({ data }: { data: any }) {
  const color = "#10b981";
  const sites = data.rankedSites || [];
  const req = data.siteRequirements || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Sites Requested" value={req.requested ?? "—"} color={color} />
        <StatCard label="Sites Needed (Base)" value={req.neededBase ?? "—"} color="#3b82f6" sub="Base scenario" />
        <StatCard label="Sites Needed (Conservative)" value={req.neededConservative ?? "—"} color="#ef4444" sub="Worst case" />
        <StatCard label="Rate/Site/Month" value={req.ratePerSitePerMonth ?? "—"} color="#f59e0b" sub="Patients" />
      </div>

      <ResultSection title="Top Ranked Sites (PyTrial Methodology)" icon={<MapPin className="h-3.5 w-3.5" />} color={color}>
        <div className="space-y-2">
          {sites.slice(0, 8).map((site: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-slate-50"
              style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-black"
                style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c2b" : color }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-800">{site.facility || site.country}</p>
                <p className="text-[10px] text-slate-500">{site.country} · {site.trialCount} trials</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Experience</p>
                  <p className="text-[11px] font-bold text-slate-700">{site.rankingBreakdown?.experience?.toFixed(0)}/40</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">PyTrial</p>
                  <p className="text-[11px] font-bold text-slate-700">{site.rankingBreakdown?.pytrialMethodology?.toFixed(0)}/40</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Location</p>
                  <p className="text-[11px] font-bold text-slate-700">{site.rankingBreakdown?.locationRelevance?.toFixed(0)}/20</p>
                </div>
                <div className="w-20">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[9px] text-slate-400">Score</span>
                    <span className="text-[11px] font-black" style={{ color }}>{site.score}</span>
                  </div>
                  <ScoreBar value={site.score} color={color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ResultSection>

      <div className="grid grid-cols-2 gap-4">
      <ResultSection title="Geographic Diversity & Risk" icon={<Globe className="h-3.5 w-3.5" />} color="#06b6d4">
        <div className="flex flex-col gap-3">
           <div className="flex justify-between items-center bg-cyan-50 p-2.5 rounded-lg border border-cyan-100">
             <div>
               <p className="text-[11px] font-bold text-cyan-800">Shannon Index</p>
               <p className="text-[10px] text-cyan-600">Site distribution entropy</p>
             </div>
             <div className="text-right">
               <p className="text-[16px] font-black text-cyan-700">{data.geographicDiversity?.shannonIndex}</p>
               <Chip label={data.geographicDiversity?.riskLevel} color={data.geographicDiversity?.riskLevel === "LOW" ? "#10b981" : data.geographicDiversity?.riskLevel === "MEDIUM" ? "#f59e0b" : "#ef4444"} />
             </div>
           </div>
           <p className="text-[11px] text-slate-600">{data.geographicDiversity?.concentrationNarrative}</p>
        </div>
      </ResultSection>

      <ResultSection title="Activation Timelines" icon={<Clock className="h-3.5 w-3.5" />} color="#f59e0b">
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(data.activationTimelines || {}).map(([region, timeline]: [string, any]) => (
            <div key={region} className="rounded-xl p-3.5" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-[12px] font-black text-slate-800 mb-2">{region}</p>
              {Object.entries(timeline).filter(([k]) => k !== "total").map(([k, v]) => (
                <div key={k} className="flex justify-between text-[10px] text-slate-600 mb-1">
                  <span className="capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="font-bold">{String(v)} mo</span>
                </div>
              ))}
              <div className="border-t border-amber-200 pt-1.5 mt-1.5 flex justify-between">
                <span className="text-[10px] font-bold text-amber-700">Total</span>
                <span className="text-[12px] font-black text-amber-700">{timeline.total} months</span>
              </div>
            </div>
          ))}
        </div>
      </ResultSection>
      </div>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color="#6366f1">
          <div className="space-y-2.5">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color="#6366f1" />)}</div>
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
          ? <div className="space-y-2.5">{data.designations.map((d: any) => (
            <div key={d.name} className="rounded-xl p-3.5" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[12px] font-black text-slate-800">{d.name}</p>
                <Chip label={d.timeline} color={color} />
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mb-1">{d.benefit}</p>
              <p className="text-[10px] text-slate-500">{d.eligibility}</p>
              <a href={d.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:underline mt-1">
                FDA guidance <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          ))}</div>
          : <p className="text-[12px] text-slate-500">No expedited pathways identified for this configuration</p>}
      </ResultSection>

      <ResultSection title="Submission Checklist" icon={<CheckCircle2 className="h-3.5 w-3.5" />} color="#10b981">
        <div className="space-y-1.5">
          {(data.checklist || []).map((item: any, i: number) => (
            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${item.status === "URGENT" ? "bg-red-50" : "bg-slate-50"}`}>
              <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 ${item.status === "URGENT" ? "border-red-400" : "border-slate-300"}`} />
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-slate-700">{item.item}</p>
                <p className="text-[10px] text-slate-500">{item.due}</p>
              </div>
              {item.status === "URGENT" && <Chip label="URGENT" color="#ef4444" />}
            </div>
          ))}
        </div>
      </ResultSection>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color="#6366f1">
          <div className="space-y-2.5">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color={color} />)}</div>
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
        <StatCard label="P10 (Best Case)" value={sim.p10Months ?? sim.p10 ?? "—"} unit=" mo" color="#10b981" sub="10th pctl" />
        <StatCard label="P50 (Median)" value={sim.p50Months ?? sim.p50 ?? "—"} unit=" mo" color={color} sub="50th pctl" />
        <StatCard label="P90 (Worst Case)" value={sim.p90Months ?? sim.p90 ?? "—"} unit=" mo" color="#ef4444" sub="90th pctl" />
        <StatCard label="Total Screening Cost" value={`$${cost.screeningCostUSD ? Math.round(cost.screeningCostUSD / 1e3) : "—"}K`} color="#8b5cf6" sub="Est." />
      </div>

      <ResultSection title="Monte Carlo Simulation Distribution" icon={<BarChart3 className="h-3.5 w-3.5" />} color={color}>
        <p className="text-[10px] text-slate-500 mb-3">{sim.methodology || sim.rateSource}</p>
        {hist.length > 0 && (
          <div className="flex items-end gap-1 h-20">
            {hist.map((h: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${h.bin} months: ${h.count} simulations`}>
                <div className="w-full rounded-t-sm transition-all" style={{
                  height: `${Math.max(2, (h.count / maxCount) * 100)}%`,
                  background: `linear-gradient(180deg, ${color}, ${color}66)`,
                }} />
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

      <ResultSection title="Scenario Analysis" icon={<TrendingUp className="h-3.5 w-3.5" />} color="#3b82f6">
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(scenarios).map(([name, s]: [string, any]) => (
            <div key={name} className="rounded-xl p-3.5" style={{
              background: name === "optimistic" ? "rgba(16,185,129,0.07)" : name === "conservative" ? "rgba(239,68,68,0.07)" : "rgba(59,130,246,0.07)",
              border: `1px solid ${name === "optimistic" ? "rgba(16,185,129,0.2)" : name === "conservative" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)"}`,
            }}>
              <p className="text-[11px] font-black text-slate-700 mb-2 capitalize">{name}</p>
              <p className="text-[20px] font-black" style={{
                color: name === "optimistic" ? "#10b981" : name === "conservative" ? "#ef4444" : "#3b82f6"
              }}>{s.estimatedMonths}<span className="text-[12px] font-medium"> mo</span></p>
              <p className="text-[10px] text-slate-500">{s.monthlyRatePerSite} pts/site/mo</p>
            </div>
          ))}
        </div>
      </ResultSection>

      <div className="grid grid-cols-2 gap-4">
        <ResultSection title="Recruitment Cost Model" icon={<DollarSign className="h-3.5 w-3.5" />} color="#8b5cf6">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Screening Cost" value={`$${Math.round((cost.screeningCostUSD || 0) / 1e3)}K`} color="#8b5cf6" sub={`${cost.screenToEnrollRatio}:1 ratio`} />
            <StatCard label="Enrollment Cost" value={`$${Math.round((cost.enrollmentCostUSD || 0) / 1e3)}K`} color="#6366f1" sub="per completer" />
            <StatCard label="Total Cost" value={`$${Math.round((cost.totalRecruitmentCostUSD || 0) / 1e6)}M`} color="#ec4899" sub="Recruitment total" />
          </div>
        </ResultSection>

        <ResultSection title="Screen Failure Model" icon={<Users className="h-3.5 w-3.5" />} color="#ef4444">
           {data.screenFailureModel ? (
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg flex flex-col items-center justify-center min-w-[90px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                 <span className="text-[16px] font-black text-red-600">{data.screenFailureModel.screenToEnrollRatio}:1</span>
                 <span className="text-[9px] text-red-400 font-bold uppercase mt-1">Screen Ratio</span>
              </div>
              <div>
                <div className="flex gap-1.5 mb-1.5">
                  <Chip label={`Complexity: ${data.screenFailureModel.complexity}`} color="#ef4444" />
                  <Chip label={`${data.screenFailureModel.estimatedWords} words`} color="#8b5cf6" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Eligibility criteria complexity implies a <strong>{data.screenFailureModel.screenToEnrollRatio}:1</strong> screen-to-enroll ratio. This significantly drives up total recruitment costs.
                </p>
              </div>
            </div>
           ) : (
             <p className="text-[12px] text-slate-500">Screen failure model not available.</p>
           )}
        </ResultSection>
      </div>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-2.5">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color={color} />)}</div>
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
        <StatCard label="Total Study Duration" value={ops.totalStudyMonths ?? "—"} unit=" mo" color={color} />
        <StatCard label="Monitoring Cost" value={`$${Math.round((mon.monitoringCostUSD || 0) / 1e3)}K`} color="#ef4444" />
        <StatCard label="RBM Savings" value={`$${Math.round((mon.rbmSavingsUSD || 0) / 1e3)}K`} color="#10b981" sub="35% vs traditional SDV" />
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
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">{item.label}</span>
                <span className="text-[14px] font-black" style={{ color: item.color }}>{item.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </ResultSection>

        <ResultSection title="Operational Efficiency" icon={<Activity className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-3">
              <ProbabilityGauge value={eff.score ?? 0} label="Efficiency Score" color={color} />
            </div>
            {(eff.factors || []).map((f: string, i: number) => (
              <p key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                <span style={{ color }}>•</span> {f}
              </p>
            ))}
          </div>
        </ResultSection>
      </div>

      <ResultSection title="Trial KPIs" icon={<Target className="h-3.5 w-3.5" />} color={color}>
        <div className="space-y-1.5">
          {(data.kpis || []).map((kpi: any) => (
            <div key={kpi.metric} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
              <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[11px] font-bold text-slate-700 w-36">{kpi.metric}</span>
              <span className="text-[11px] text-slate-600 flex-1">{kpi.target}</span>
              <Chip label={kpi.monitoring} color={color} />
            </div>
          ))}
        </div>
      </ResultSection>

      {data.optimizations?.length > 0 && (
        <ResultSection title="Optimizations" icon={<Zap className="h-3.5 w-3.5" />} color={color}>
          <div className="space-y-2.5">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color={color} />)}</div>
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
      {/* GO / NO-GO Decision Banner */}
      <div className="rounded-2xl p-5 text-center" style={{
        background: `linear-gradient(135deg, ${goColor}15, ${goColor}08)`,
        border: `2px solid ${goColor}40`,
      }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: `${goColor}aa` }}>GO / NO-GO Decision</p>
        <p className="text-5xl font-black mb-2" style={{ color: goColor }}>{gono.decision}</p>
        <p className="text-[14px] font-bold text-slate-700">
          {gono.probability}% success probability · Threshold: {gono.threshold}%
        </p>
        {gono.npvEstimateUSD && (
          <p className="text-[12px] text-slate-500 mt-1">
            NPV estimate: ${Math.round(gono.npvEstimateUSD / 1e6)}M (at 15% market penetration)
          </p>
        )}
        {gono.nextPhaseRecommendations?.length > 0 && (
          <div className="mt-3 text-left space-y-1.5">
            {gono.nextPhaseRecommendations.map((r: string, i: number) => (
              <p key={i} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                <ArrowRight className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: goColor }} />{r}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="ML Success Prob" value={`${pred.successProbabilityML ?? "—"}`} unit="%" color={color} sub={pred.mlMethod?.split(" ")[0]} />
        <StatCard label="Full Analysis" value={`${pred.fullAnalysis?.probability ?? "—"}`} unit="%" color="#6366f1" sub={pred.fullAnalysis?.rating} />
        <StatCard label="Safety Score" value={safety.safetyScore ?? "—"} color={safety.riskLevel === "LOW" ? "#10b981" : "#ef4444"} sub={safety.riskLevel} />
        <StatCard label="Literature Score" value={lit.maturityScore ?? "—"} color="#f59e0b" sub={lit.tier} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ResultSection title="ML Outcome Breakdown (GB+RF)" icon={<Sparkles className="h-3.5 w-3.5" />} color={color}>
          <div className="flex gap-4 mb-3">
            <div className="flex-1 bg-cyan-50 rounded-lg p-2 border border-cyan-100 flex items-center justify-between">
              <span className="text-[10px] text-cyan-700 font-bold">Cross-Validated AUC</span>
              <span className="text-[12px] font-black text-cyan-800">{pred.crossValidation?.aucCV?.toFixed(2)}</span>
            </div>
            <div className="flex-1 bg-blue-50 rounded-lg p-2 border border-blue-100 flex items-center justify-between">
              <span className="text-[10px] text-blue-700 font-bold">Training Corpus</span>
              <span className="text-[12px] font-black text-blue-800">{pred.trainingSamples}</span>
            </div>
          </div>
          
          <div className="space-y-2.5">
            {(pred.fullAnalysis?.factors || []).slice(0, 5).map((f: any) => (
              <div key={f.factor} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">{f.factor}</span>
                  <span className="font-black" style={{ color }}>{f.score?.toFixed(1)}/{f.weight}</span>
                </div>
                <ScoreBar value={(f.score / f.weight) * 100} color={color} />
                <p className="text-[10px] text-slate-500 max-w-xs truncate" title={f.description}>{f.description}</p>
              </div>
            ))}
          </div>
        </ResultSection>

        <div className="space-y-4">
          <ResultSection title="Pharmacovigilance (PRR)" icon={<Shield className="h-3.5 w-3.5" />} color="#ef4444">
             <div className="flex items-center gap-3 mb-2">
                 <ProbabilityGauge value={safety.safetyScore ?? 0} label="Safe" color={safety.riskLevel === "LOW" ? "#10b981" : safety.riskLevel === "MODERATE" ? "#f59e0b" : "#ef4444"} />
                 <div>
                    <Chip label={safety.riskLevel} color={safety.riskLevel === "LOW" ? "#10b981" : safety.riskLevel === "MODERATE" ? "#f59e0b" : "#ef4444"} />
                    <p className="text-[10px] text-slate-500 mt-1">{safety.nSignals} PRR ≥ 2 signals found</p>
                 </div>
             </div>
             {(safety.topSignals || []).slice(0, 2).map((r: string) => (
               <div key={r} className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-red-50 p-1.5 rounded-lg mb-1">
                  <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" /> {r}
               </div>
             ))}
          </ResultSection>

          <ResultSection title="Top Similar Trials" icon={<Search className="h-3.5 w-3.5" />} color="#6366f1">
            <p className="text-[10px] text-slate-500 mb-2">TF-IDF cosine similarity · {similar.corpusSize} trials analyzed</p>
          <div className="space-y-1.5">
            {(similar.topSimilar || []).slice(0, 5).map((t: any) => (
              <div key={t.nctId} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                <div className="w-12 text-center">
                  <div className="h-1.5 rounded-full mb-0.5" style={{ background: `linear-gradient(90deg, #6366f1, #6366f155)`, width: `${t.similarityScore}%` }} />
                  <span className="text-[9px] font-bold text-indigo-600">{t.similarityScore}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <a href={`https://clinicaltrials.gov/study/${t.nctId}`} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-bold text-indigo-600 hover:underline">{t.nctId}</a>
                  <p className="text-[10px] text-slate-500 truncate">{t.title}</p>
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
          <div className="space-y-2.5">{data.optimizations.map((opt: any, i: number) => <OptCard key={i} opt={opt} color={color} />)}</div>
        </ResultSection>
      )}
    </div>
  );
}
