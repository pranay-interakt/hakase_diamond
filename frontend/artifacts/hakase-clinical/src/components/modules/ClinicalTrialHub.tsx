import { useState, useCallback, useRef } from "react";
import {
  Search, MapPin, Lock, TrendingUp, Activity, BarChart3,
  CheckCircle2, Loader2, AlertTriangle, Sparkles, ArrowRight,
  RefreshCw, ExternalLink, ChevronRight, ShieldAlert, BookOpen,
  FlaskConical, Zap, Target, Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = 1 | 2 | 3 | 4 | 5 | 6;

interface StageConfig {
  id: Stage; label: string; short: string;
  icon: React.ReactNode; color: string; description: string;
}

const STAGES: StageConfig[] = [
  { id: 1, label: "Discovery & Feasibility", short: "Discovery", icon: <Search className="h-4 w-4" />, color: "#06b6d4", description: "Live landscape · CTGov + PubMed + FAERS" },
  { id: 2, label: "Site Selection", short: "Sites", icon: <MapPin className="h-4 w-4" />, color: "#10b981", description: "Global ranking · activation timelines" },
  { id: 3, label: "Regulatory & IND", short: "Regulatory", icon: <Lock className="h-4 w-4" />, color: "#f59e0b", description: "IND/CTA roadmap · compliance checklist" },
  { id: 4, label: "Enrollment Simulation", short: "Enrollment", icon: <TrendingUp className="h-4 w-4" />, color: "#ec4899", description: "Monte Carlo 1000× · P10/P50/P90" },
  { id: 5, label: "Execution Monitor", short: "Execution", icon: <Activity className="h-4 w-4" />, color: "#8b5cf6", description: "Deviation risk · RBM savings · KPIs" },
  { id: 6, label: "Outcomes & ML", short: "Outcomes", icon: <BarChart3 className="h-4 w-4" />, color: "#6366f1", description: "ML success prediction · GO/NO-GO" },
];

const API = (import.meta.env.VITE_API_URL || "") + "/api";

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

const rgba = (hex: string, a = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const formatN = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

// ─── Light-theme atoms ────────────────────────────────────────────────────────

const KPI = ({ label, value, unit, color, sub }: { label: string; value: any; unit?: string; color: string; sub?: string }) => (
  <div style={{ borderRadius: 14, padding: "16px 18px", background: "#fff", border: `1px solid ${rgba(color, 0.2)}`, boxShadow: `0 1px 4px ${rgba(color, 0.06)}` }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{value ?? "—"}{unit && <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 3, opacity: 0.75 }}>{unit}</span>}</div>
    {sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 5 }}>{sub}</div>}
  </div>
);

const Card = ({ title, icon, color, children }: any) => (
  <div style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderBottom: "1px solid #f1f5f9", background: rgba(color, 0.04) }}>
      <div style={{ padding: 6, borderRadius: 8, background: rgba(color, 0.12) }}>
        <span style={{ color, display: "flex" }}>{icon}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{title}</span>
    </div>
    <div style={{ padding: "16px 18px" }}>{children}</div>
  </div>
);

const BarRow = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#64748b", marginBottom: 4 }}>
        <span>{label}</span><span style={{ fontWeight: 700, color }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      </div>
    </div>
  );
};

const PRRBadge = ({ signal }: { signal: any }) => {
  const isSignal = signal.isSignal;
  const isSerious = signal.isSerious;
  const color = isSerious ? "#ef4444" : isSignal ? "#f59e0b" : "#10b981";
  const label = isSerious ? "SERIOUS" : isSignal ? "SIGNAL" : "NOISE";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: rgba(color, 0.05), border: `1px solid ${rgba(color, 0.15)}`, marginBottom: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{signal.reaction}</div>
        <div style={{ fontSize: 11.5, color: "#94a3b8" }}>PRR {signal.prr} · ROR {signal.ror} · χ² {signal.chiSquared} · N={signal.drugReports}</div>
      </div>
      <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 5, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: rgba(color, 0.1), color, border: `1px solid ${rgba(color, 0.2)}` }}>{label}</span>
    </div>
  );
};

const OptRow = ({ opt }: { opt: any }) => {
  const pc = opt.priority === "HIGH" ? "#ef4444" : opt.priority === "MEDIUM" ? "#f59e0b" : "#10b981";
  return (
    <div style={{ padding: "10px 12px", borderRadius: 10, background: rgba(pc, 0.04), border: `1px solid ${rgba(pc, 0.12)}`, marginBottom: 6 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span style={{ display: "inline-flex", padding: "2px 7px", borderRadius: 5, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: rgba(pc, 0.1), color: pc, border: `1px solid ${rgba(pc, 0.2)}`, flexShrink: 0 }}>{opt.priority || "TIP"}</span>
        <div style={{ flex: 1, fontSize: 12, color: "#334155", lineHeight: 1.55 }}>
          {opt.recommendation}
          {opt.impact && <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: pc }}>→ {opt.impact}</div>}
          {opt.timeline_impact && <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: pc }}>→ {opt.timeline_impact}</div>}
        </div>
      </div>
    </div>
  );
};

// ─── Result Panels ─────────────────────────────────────────────────────────────

function Stage1Results({ data }: { data: any }) {
  const color = "#06b6d4";
  const l = data.landscape || {};
  const lit = data.literatureMaturity || {};
  const safety = data.safetyBaseline || {};
  const phases: Record<string, number> = l.phaseDistribution || l.byPhase || {};
  const maxPhase = Math.max(...Object.values(phases).map(v => Number(v)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <KPI label="Total Trials" value={l.totalTrials ?? "—"} color={color} sub="In landscape" />
        <KPI label="Unmet Need" value={data.unmetNeedScore} unit="/100" color="#f59e0b" sub="Market opportunity" />
        <KPI label="PubMed Articles" value={lit.articleCount ? formatN(lit.articleCount) : "—"} color="#10b981" sub="Literature depth" />
        <KPI label="Safety Score" value={safety.safetyScore ?? "—"} unit={safety.safetyScore ? "/100" : ""} color={safety.riskLevel === "HIGH" ? "#ef4444" : safety.riskLevel === "MODERATE" ? "#f59e0b" : "#10b981"} sub={safety.riskLevel ? `${safety.riskLevel} risk · ${(safety.totalDrugReports || 0).toLocaleString()} AEs` : "No FAERS data"} />
      </div>

      {Object.keys(phases).length > 0 && (
        <Card title="Phase Distribution" icon={<BarChart3 className="h-4 w-4" />} color={color}>
          {Object.entries(phases).map(([ph, cnt]) => (
            <BarRow key={ph} label={ph.replace(/_/g, " ")} value={Number(cnt)} max={maxPhase} color={color} />
          ))}
        </Card>
      )}

      {(data.topCompetitorTrials || []).length > 0 && (
        <Card title="Competitor Trials" icon={<Target className="h-4 w-4" />} color={color}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {["NCT ID", "Sponsor", "Phase", "Status", "Enrolled", ""].map(h => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "0 8px 8px 0", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.topCompetitorTrials || []).slice(0, 8).map((t: any, i: number) => (
                  <tr key={t.nctId} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ fontSize: 11, color: "#0284c7", fontWeight: 700, padding: "7px 8px 7px 0", fontFamily: "monospace" }}>{t.nctId}</td>
                    <td style={{ fontSize: 11, color: "#475569", padding: "7px 8px" }}>{(t.sponsor || "").slice(0, 22)}</td>
                    <td style={{ padding: "7px 8px", fontSize: 11, color: color, fontWeight: 700 }}>{(t.phase || [])[0] || "—"}</td>
                    <td style={{ padding: "7px 8px" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", background: t.status === "RECRUITING" ? "#dcfce7" : t.status === "COMPLETED" ? "#ede9fe" : "#f1f5f9", color: t.status === "RECRUITING" ? "#16a34a" : t.status === "COMPLETED" ? "#7c3aed" : "#64748b" }}>{t.status || "—"}</span>
                    </td>
                    <td style={{ fontSize: 11, color: "#64748b", padding: "7px 8px", textAlign: "right" }}>{(t.enrollmentCount || 0).toLocaleString()}</td>
                    <td style={{ padding: "7px 0 7px 8px" }}>
                      <a href={`https://clinicaltrials.gov/study/${t.nctId}`} target="_blank" rel="noreferrer" style={{ color: "#94a3b8", display: "flex" }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {(lit.topArticles || []).length > 0 && (
        <Card title="Top PubMed Articles" icon={<BookOpen className="h-4 w-4" />} color="#10b981">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(lit.topArticles || []).slice(0, 5).map((art: any, i: number) => (
              <a key={art.pmid || i} href={art.link} target="_blank" rel="noreferrer" style={{ display: "block", textDecoration: "none", padding: "10px 12px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", transition: "border-color 0.2s" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#065f46", lineHeight: 1.4, marginBottom: 4 }}>{art.title}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{art.journal} · {art.year} · PMID {art.pmid}</div>
              </a>
            ))}
          </div>
        </Card>
      )}

      {(safety.signals || []).length > 0 && (
        <Card title={`PRR/ROR Safety Signals — ${safety.totalDrugReports?.toLocaleString()} FAERS reports`} icon={<ShieldAlert className="h-4 w-4" />} color="#ef4444">
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10 }}>{safety.method}</div>
          {(safety.signals || []).slice(0, 8).map((sig: any, i: number) => <PRRBadge key={i} signal={sig} />)}
        </Card>
      )}

      {(data.optimizations || []).length > 0 && (
        <Card title="Strategic Recommendations" icon={<Zap className="h-4 w-4" />} color="#f59e0b">
          {(data.optimizations || []).slice(0, 4).map((opt: any, i: number) => <OptRow key={i} opt={opt} />)}
        </Card>
      )}
    </div>
  );
}

function Stage2Results({ data }: { data: any }) {
  const color = "#10b981";
  const sites = data.rankedSites || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <KPI label="Sites Identified" value={sites.length} color={color} sub="Globally ranked" />
        <KPI label="Avg Top-5 Score" value={sites.length > 0 ? Math.round(sites.slice(0, 5).reduce((s: number, x: any) => s + (x.compositeScore || 0), 0) / Math.min(5, sites.length)) : "—"} unit="/100" color="#06b6d4" sub="Top 5 sites" />
        <KPI label="Countries" value={[...new Set(sites.map((s: any) => s.country))].length} color="#f59e0b" sub="Geographic spread" />
      </div>
      {sites.length > 0 && (
        <Card title="Site Rankings" icon={<MapPin className="h-4 w-4" />} color={color}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                {["Rank", "Institution", "Country", "Score", "Startup", "Expected Pts"].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textAlign: "left", padding: "0 8px 8px 0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.slice(0, 10).map((s: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc", background: i === 0 ? rgba(color, 0.04) : "transparent" }}>
                  <td style={{ fontSize: 12, fontWeight: 900, color: i === 0 ? color : "#94a3b8", padding: "7px 8px 7px 0" }}>#{i + 1}</td>
                  <td style={{ fontSize: 11, color: "#334155", padding: "7px 8px", maxWidth: 180 }}>{(s.institution || s.name || "—").slice(0, 28)}</td>
                  <td style={{ fontSize: 10, color: "#64748b", padding: "7px 8px" }}>{s.country || "—"}</td>
                  <td style={{ padding: "7px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color }}>{Math.round(s.compositeScore || 0)}</span>
                      <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 999, overflow: "hidden", minWidth: 40 }}>
                        <div style={{ height: "100%", width: `${s.compositeScore || 0}%`, background: color, borderRadius: 999 }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 10, color: "#64748b", padding: "7px 8px" }}>{s.startupWeeks || s.activationWeeks || "—"} wk</td>
                  <td style={{ fontSize: 10, color: "#64748b", padding: "7px 0" }}>{s.expectedPatients || s.expectedEnrollment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {(data.optimizations || []).length > 0 && (
        <Card title="Site Strategy Recommendations" icon={<Zap className="h-4 w-4" />} color="#f59e0b">
          {(data.optimizations || []).slice(0, 3).map((opt: any, i: number) => <OptRow key={i} opt={opt} />)}
        </Card>
      )}
    </div>
  );
}

function Stage3Results({ data }: { data: any }) {
  const color = "#f59e0b";
  const timeline = data.timeline || {};
  const reqs = data.keyRequirements || [];
  const designations = data.potentialDesignations || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <KPI label="IND Prep" value={timeline.indPreparationWeeks || timeline.totalWeeks} unit=" wk" color={color} sub="Preparation" />
        <KPI label="FDA Review" value={timeline.fdaReviewWeeks || timeline.fdaReview} unit=" wk" color="#06b6d4" sub="Agency review" />
        <KPI label="Total to IND" value={timeline.totalWeeks || timeline.totalWeeksToInd} unit=" wk" color="#10b981" sub="Best case" />
      </div>
      {designations.length > 0 && (
        <Card title="Potential Regulatory Designations" icon={<CheckCircle2 className="h-4 w-4" />} color={color}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {designations.map((d: any, i: number) => (
              <div key={i} style={{ padding: "10px 14px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#92400e" }}>{d.designation || d.name}</div>
                {d.benefit && <div style={{ fontSize: 10, color: "#78716c", marginTop: 3 }}>{d.benefit}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
      {reqs.length > 0 && (
        <Card title="IND/CTA Requirements Checklist" icon={<Lock className="h-4 w-4" />} color={color}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {reqs.map((r: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fef3c7" }}>
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color }} />
                <div>
                  <div style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>{r.item || r.requirement}</div>
                  {r.details && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{r.details}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {(data.optimizations || []).length > 0 && (
        <Card title="Regulatory Strategy" icon={<Zap className="h-4 w-4" />} color={color}>
          {(data.optimizations || []).slice(0, 4).map((opt: any, i: number) => <OptRow key={i} opt={opt} />)}
        </Card>
      )}
    </div>
  );
}

function Stage4Results({ data }: { data: any }) {
  const color = "#ec4899";
  const mc = data.monteCarlo || {};
  const scenarios = data.scenarios || [];
  const p10 = mc.p10 || 0; const p50 = mc.p50 || 0; const p90 = mc.p90 || 0;
  const maxVal = Math.max(p10, p50, p90, 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <KPI label="P10 (Optimistic)" value={mc.p10} unit=" mo" color="#10b981" sub="Best 10%" />
        <KPI label="P50 (Median)" value={mc.p50} unit=" mo" color={color} sub="Most likely" />
        <KPI label="P90 (Conservative)" value={mc.p90} unit=" mo" color="#ef4444" sub="Worst 10%" />
        <KPI label="Monthly Rate" value={mc.medianMonthlyRate?.toFixed?.(1) || data.monthlyEnrollmentRate?.toFixed?.(1) || "—"} unit=" pts/mo" color="#06b6d4" sub="Per site avg" />
      </div>

      <Card title="Monte Carlo Distribution — 1,000 Iterations" icon={<TrendingUp className="h-4 w-4" />} color={color}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[{ label: "P10 — Best case (10th percentile)", val: p10, c: "#10b981" }, { label: "P50 — Median (50th percentile)", val: p50, c: color }, { label: "P90 — Conservative (90th percentile)", val: p90, c: "#ef4444" }].map(({ label, val, c }) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 5 }}>
                <span>{label}</span><span style={{ fontWeight: 800, color: c }}>{val} months</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(val / maxVal) * 100}%` }} transition={{ duration: 1, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${c}, ${c}99)` }} />
              </div>
            </div>
          ))}
        </div>
        {mc.reasoning && <div style={{ marginTop: 14, fontSize: 11, color: "#64748b", lineHeight: 1.6, padding: "10px 12px", borderRadius: 8, background: "#fdf2f8", borderLeft: `3px solid ${rgba(color, 0.4)}` }}>{mc.reasoning}</div>}
      </Card>

      {scenarios.length > 0 && (
        <Card title="Scenario Comparison" icon={<BarChart3 className="h-4 w-4" />} color={color}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {scenarios.slice(0, 3).map((sc: any, i: number) => {
              const sc_color = i === 0 ? "#10b981" : i === 1 ? color : "#ef4444";
              return (
                <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: rgba(sc_color, 0.05), border: `1px solid ${rgba(sc_color, 0.15)}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: sc_color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{sc.name || sc.scenario}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: sc_color }}>{sc.p50 || sc.medianMonths} <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 500 }}>mo</span></div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>${((sc.totalCost || sc.cost || 0) / 1e6).toFixed(1)}M est.</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {(data.optimizations || []).length > 0 && (
        <Card title="Enrollment Acceleration" icon={<Zap className="h-4 w-4" />} color={color}>
          {(data.optimizations || []).slice(0, 3).map((opt: any, i: number) => <OptRow key={i} opt={opt} />)}
        </Card>
      )}
    </div>
  );
}

function Stage5Results({ data }: { data: any }) {
  const color = "#8b5cf6";
  const kpis = data.kpis || {};
  const risks = data.deviationRisks || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <KPI label="Protocol Deviations" value={kpis.expectedDeviations || data.expectedDeviations} color="#ef4444" sub="Expected total" />
        <KPI label="Drop-Out Rate" value={kpis.dropoutRate ? `${(kpis.dropoutRate * 100).toFixed(1)}` : (data.dropoutRate ? `${(data.dropoutRate * 100).toFixed(1)}` : "—")} unit="%" color="#f59e0b" sub="Predicted" />
        <KPI label="RBM Savings" value={data.rbmSavings || kpis.rbmSavings} unit="%" color="#10b981" sub="vs. traditional" />
        <KPI label="Monitoring Cost" value={data.monitoringCost ? `$${((data.monitoringCost) / 1000).toFixed(0)}K` : "—"} color={color} sub="Projected" />
      </div>
      {risks.length > 0 && (
        <Card title="Protocol Deviation Risk Analysis" icon={<ShieldAlert className="h-4 w-4" />} color={color}>
          {risks.slice(0, 5).map((r: any, i: number) => {
            const pc = r.severity === "HIGH" ? "#ef4444" : r.severity === "MEDIUM" ? "#f59e0b" : "#10b981";
            return (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: rgba(pc, 0.04), border: `1px solid ${rgba(pc, 0.12)}`, marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" as const, background: rgba(pc, 0.1), color: pc, flexShrink: 0 }}>{r.severity || "LOW"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{r.risk || r.riskType}</div>
                  {r.mitigation && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{r.mitigation}</div>}
                </div>
                {r.probability && <div style={{ fontSize: 10, color: pc, fontWeight: 700 }}>{(r.probability * 100).toFixed(0)}%</div>}
              </div>
            );
          })}
        </Card>
      )}
      {(data.optimizations || []).length > 0 && (
        <Card title="Execution Recommendations" icon={<Zap className="h-4 w-4" />} color={color}>
          {(data.optimizations || []).slice(0, 4).map((opt: any, i: number) => <OptRow key={i} opt={opt} />)}
        </Card>
      )}
    </div>
  );
}

function GaugeArc({ value, color, size = 120 }: { value: number; color: string; size?: number }) {
  const r = 40; const cir = Math.PI * r; const pct = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60">
      <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="#f1f5f9" strokeWidth="9" strokeLinecap="round" />
      <motion.path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * cir} ${cir}`}
        initial={{ strokeDasharray: `0 ${cir}` }}
        animate={{ strokeDasharray: `${(pct / 100) * cir} ${cir}` }}
        transition={{ duration: 1.2, ease: "easeOut" }} />
      <text x="50" y="52" textAnchor="middle" style={{ fontSize: "17px", fontWeight: "900", fill: color }}>{value}%</text>
    </svg>
  );
}

function Stage6Results({ data }: { data: any }) {
  const color = "#6366f1";
  const ml = data.mlPrediction || {};
  const probs = ml.stageProbabilities || data.stageProbabilities || {};
  const ensemble = ml.ensembleResult || {};
  const successProb = ensemble.successProbability ?? ml.successProbability ?? data.overallSuccessProbability ?? 0;
  const gonogo = data.goNoGoRecommendation || ml.goNoGoRecommendation || {};
  const isGo = gonogo.recommendation === "GO" || successProb >= 50;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        style={{ borderRadius: 16, padding: "20px 24px", background: isGo ? "#f0fdf4" : "#fef2f2", border: `2px solid ${isGo ? "#bbf7d0" : "#fecaca"}`, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: isGo ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 24 }}>{isGo ? "✅" : "❌"}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: isGo ? "#16a34a" : "#dc2626", letterSpacing: "-0.02em" }}>{gonogo.recommendation || (isGo ? "GO" : "NO-GO")}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>{gonogo.reasoning || `ML ensemble predicts ${Math.round(successProb)}% probability of trial success.`}</div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <GaugeArc value={Math.round(successProb)} color={isGo ? "#10b981" : "#ef4444"} />
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: -2 }}>Success Probability</div>
        </div>
      </motion.div>

      {Object.keys(probs).length > 0 && (
        <Card title="Stage-by-Stage Success Probability" icon={<BarChart3 className="h-4 w-4" />} color={color}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {Object.entries(probs).slice(0, 4).map(([phase, prob]: [string, any]) => {
              const p = Math.round(prob * 100);
              const pc = p >= 70 ? "#10b981" : p >= 50 ? "#f59e0b" : "#ef4444";
              return (
                <div key={phase} style={{ textAlign: "center", padding: "14px 10px", borderRadius: 14, background: rgba(pc, 0.05), border: `1px solid ${rgba(pc, 0.12)}` }}>
                  <GaugeArc value={p} color={pc} size={90} />
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{phase.replace(/_/g, " ")}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {(ensemble.modelBreakdown || ml.modelBreakdown) && (
        <Card title="Ensemble ML Breakdown" icon={<Sparkles className="h-4 w-4" />} color={color}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.entries(ensemble.modelBreakdown || ml.modelBreakdown || {}).map(([model, score]: [string, any]) => {
              const s = Math.round((score || 0) * 100);
              const pc = s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";
              return (
                <div key={model} style={{ padding: "12px 14px", borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{model.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: pc }}>{s}%</div>
                  <div style={{ height: 4, borderRadius: 999, background: "#f1f5f9", marginTop: 6, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s}%` }} transition={{ duration: 0.9 }}
                      style={{ height: "100%", background: pc, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {(data.optimizations || []).length > 0 && (
        <Card title="Strategic Next Steps" icon={<Zap className="h-4 w-4" />} color={color}>
          {(data.optimizations || []).slice(0, 4).map((opt: any, i: number) => <OptRow key={i} opt={opt} />)}
        </Card>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 14, background: "#f1f5f9", border: "1px solid #e2e8f0", overflow: "hidden", position: "relative" }}>
            <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
              style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)" }} />
          </div>
        ))}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 120 + i * 20, borderRadius: 14, background: "#f1f5f9", border: "1px solid #e2e8f0", overflow: "hidden", position: "relative" }}>
          <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
            style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)" }} />
        </div>
      ))}
    </div>
  );
}

// ─── Empty / Error ────────────────────────────────────────────────────────────

function EmptyState({ stage, config }: { stage: Stage; config: StageConfig }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, borderRadius: 16, border: `2px dashed ${rgba(config.color, 0.25)}`, background: rgba(config.color, 0.02) }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
        style={{ padding: 20, borderRadius: 18, background: rgba(config.color, 0.08), border: `1px solid ${rgba(config.color, 0.15)}`, marginBottom: 18 }}>
        <span style={{ color: config.color, display: "flex", transform: "scale(1.8)" }}>{config.icon}</span>
      </motion.div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Stage {stage} · {config.label}</div>
      <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", maxWidth: 260, lineHeight: 1.6, marginBottom: 14 }}>{config.description}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
        <ChevronRight className="h-3.5 w-3.5" style={{ color: config.color }} />
        <span>Enter inputs and click <span style={{ color: config.color, fontWeight: 700 }}>Run All Stages</span></span>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 240, borderRadius: 16, border: "1px solid #fecaca", background: "#fef2f2" }}>
      <AlertTriangle className="h-7 w-7" style={{ color: "#ef4444", marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>Simulation Error</div>
      <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center", maxWidth: 300, marginBottom: 16, lineHeight: 1.5 }}>{message}</div>
      <button onClick={onRetry} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}

// ─── Shared input styles ───────────────────────────────────────────────────────

const inp: React.CSSProperties = { width: "100%", fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", outline: "none", boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 5 };
const sel: React.CSSProperties = { ...inp, appearance: "none" };

// ─── Shared Input State ────────────────────────────────────────────────────────

interface SharedInputs {
  condition: string;
  intervention: string;
  phase: string;
  sponsor_type: string;
  indication_rare: boolean;
  enrollment_target: number;
  n_sites: number;
  dropout_rate: number;
  n_simulations: number;
  duration_months: number;
  primary_endpoint: string;
  masking: string;
  preferred_countries: string[];
}

const defaultInputs: SharedInputs = {
  condition: "",
  intervention: "",
  phase: "PHASE2",
  sponsor_type: "INDUSTRY",
  indication_rare: false,
  enrollment_target: 200,
  n_sites: 10,
  dropout_rate: 0.08,
  n_simulations: 1000,
  duration_months: 24,
  primary_endpoint: "",
  masking: "DOUBLE",
  preferred_countries: [],
};

function buildBodies(inp: SharedInputs) {
  return {
    1: { condition: inp.condition, intervention: inp.intervention, phase: inp.phase, indication_rare: inp.indication_rare, sponsor_type: inp.sponsor_type },
    2: { condition: inp.condition, phase: inp.phase, enrollment_target: inp.enrollment_target, preferred_countries: inp.preferred_countries, n_sites_requested: inp.n_sites },
    3: { condition: inp.condition, intervention: inp.intervention, phase: inp.phase, indication_rare: inp.indication_rare, sponsor_type: inp.sponsor_type, has_prior_ind: false },
    4: { condition: inp.condition, phase: inp.phase, enrollment_target: inp.enrollment_target, n_sites: inp.n_sites, dropout_rate: inp.dropout_rate, n_simulations: inp.n_simulations },
    5: { condition: inp.condition, phase: inp.phase, enrollment_target: inp.enrollment_target, duration_months: inp.duration_months, n_sites: inp.n_sites, n_patients: inp.enrollment_target },
    6: { condition: inp.condition, intervention: inp.intervention, phase: inp.phase, enrollment_target: inp.enrollment_target, primary_endpoint: inp.primary_endpoint || "Overall Survival", masking: inp.masking, allocation: "RANDOMIZED", sponsor_type: inp.sponsor_type },
  } as Record<Stage, any>;
}

const ENDPOINTS: Record<Stage, string> = {
  1: "/trial-hub/stage1/discovery",
  2: "/trial-hub/stage3/site-selection",
  3: "/trial-hub/stage4/regulatory",
  4: "/trial-hub/stage5/enrollment",
  5: "/trial-hub/stage6/execution",
  6: "/trial-hub/stage7/outcomes",
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ClinicalTrialHub() {
  const [activeStage, setActiveStage] = useState<Stage>(1);
  const [runningStage, setRunningStage] = useState<Stage | null>(null);
  const [results, setResults] = useState<Record<number, any>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [inputs, setInputs] = useState<SharedInputs>(defaultInputs);
  const [countryInput, setCountryInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const runAllStages = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setResults({});
    setErrors({});

    const bodies = buildBodies(inputs);

    for (let s = 1; s <= 6; s++) {
      const stage = s as Stage;
      setRunningStage(stage);
      setActiveStage(stage);
      try {
        const url = `${API}${ENDPOINTS[stage]}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodies[stage]),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Server error" }));
          setErrors(prev => ({ ...prev, [stage]: err.detail || `HTTP ${res.status}` }));
          break;
        }
        const data = await res.json();
        setResults(prev => ({ ...prev, [stage]: data }));
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setErrors(prev => ({ ...prev, [stage]: e.message || "Network error" }));
        }
        break;
      }
    }
    setRunningStage(null);
  }, [inputs]);

  const runSingle = useCallback(async (stage: Stage) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRunningStage(stage);
    setErrors(prev => ({ ...prev, [stage]: "" }));
    try {
      const bodies = buildBodies(inputs);
      const url = `${API}${ENDPOINTS[stage]}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodies[stage]),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResults(prev => ({ ...prev, [stage]: data }));
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setErrors(prev => ({ ...prev, [stage]: e.message || "Network error" }));
      }
    }
    setRunningStage(null);
  }, [inputs]);

  const config = STAGES[activeStage - 1];
  const result = results[activeStage];
  const error = errors[activeStage];
  const isLoading = runningStage === activeStage;
  const completedCount = Object.keys(results).length;
  const isRunningAll = runningStage !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#f8fafc", minHeight: "calc(100vh - 56px)", borderRadius: 12 }}>

      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", gap: 14, flexShrink: 0, borderRadius: "12px 12px 0 0" }}>
        <div style={{ padding: 10, borderRadius: 12, background: "linear-gradient(135deg, #e0f2fe, #ede9fe)", border: "1px solid #bae6fd" }}>
          <FlaskConical className="h-5 w-5" style={{ color: "#0284c7" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>Clinical Trial Hub</div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>6-stage simulation · Live APIs · ML reasoning</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {completedCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#16a34a" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>{completedCount}/6 complete</span>
            </div>
          )}
          {isRunningAll && runningStage && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#0284c7" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0284c7" }}>Stage {runningStage} running…</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a" }}>Live Engine</span>
          </div>
        </div>
      </div>

      {/* Stage Tabs */}
      <div style={{ display: "flex", padding: "0 20px", borderBottom: "1px solid #e2e8f0", background: "#fff", flexShrink: 0, overflowX: "auto" }}>
        {STAGES.map(s => {
          const isActive = activeStage === s.id;
          const isDone = !!results[s.id];
          const isErr = !!errors[s.id];
          const isRunning = runningStage === s.id;
          return (
            <button key={s.id} onClick={() => setActiveStage(s.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", border: "none", borderBottom: isActive ? `2px solid ${s.color}` : "2px solid transparent", background: "none", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}>
              <span style={{ color: isActive ? s.color : isDone ? "#16a34a" : isErr ? "#ef4444" : "#cbd5e1", display: "flex" }}>
                {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isDone && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : isErr && !isActive ? <AlertTriangle className="h-3.5 w-3.5" /> : s.icon}
              </span>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? s.color : isDone ? "#16a34a" : isErr ? "#ef4444" : "#94a3b8" }}>{s.short}</span>
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* Left: Shared Input Panel */}
        <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #e2e8f0", background: "#fff" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ padding: 6, borderRadius: 8, background: rgba(config.color, 0.1) }}>
                <span style={{ color: config.color, display: "flex" }}>{config.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: config.color }}>Stage {activeStage}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{config.label}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{config.description}</div>
          </div>

          {/* Form */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <div>
                <label style={lbl}>Condition / Indication *</label>
                <input style={inp} placeholder="e.g. Non-small cell lung cancer" value={inputs.condition} onChange={e => setInputs(v => ({ ...v, condition: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Intervention / Drug</label>
                <input style={inp} placeholder="e.g. Pembrolizumab" value={inputs.intervention} onChange={e => setInputs(v => ({ ...v, intervention: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Phase</label>
                <select style={sel} value={inputs.phase} onChange={e => setInputs(v => ({ ...v, phase: e.target.value }))}>
                  {["PHASE1", "PHASE2", "PHASE3", "PHASE4"].map(p => <option key={p} value={p}>{p.replace("PHASE", "Phase ")}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Sponsor Type</label>
                <select style={sel} value={inputs.sponsor_type} onChange={e => setInputs(v => ({ ...v, sponsor_type: e.target.value }))}>
                  <option value="INDUSTRY">Industry / Pharma</option>
                  <option value="NIH">NIH</option>
                  <option value="FED">Federal</option>
                  <option value="OTHER">Academic / Other</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Enrollment Target</label>
                <input type="number" style={inp} min={10} value={inputs.enrollment_target} onChange={e => setInputs(v => ({ ...v, enrollment_target: parseInt(e.target.value) || 200 }))} />
              </div>
              <div>
                <label style={lbl}>Number of Sites</label>
                <input type="number" style={inp} min={1} max={200} value={inputs.n_sites} onChange={e => setInputs(v => ({ ...v, n_sites: parseInt(e.target.value) || 10 }))} />
              </div>
              <div>
                <label style={lbl}>Dropout Rate — {Math.round(inputs.dropout_rate * 100)}%</label>
                <input type="range" min={0} max={0.5} step={0.01} value={inputs.dropout_rate}
                  onChange={e => setInputs(v => ({ ...v, dropout_rate: parseFloat(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#ec4899" } as any} />
              </div>
              <div>
                <label style={lbl}>Duration (months)</label>
                <input type="number" style={inp} min={1} max={120} value={inputs.duration_months} onChange={e => setInputs(v => ({ ...v, duration_months: parseInt(e.target.value) || 24 }))} />
              </div>
              <div>
                <label style={lbl}>Primary Endpoint</label>
                <input style={inp} placeholder="e.g. Overall Survival" value={inputs.primary_endpoint} onChange={e => setInputs(v => ({ ...v, primary_endpoint: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Masking</label>
                <select style={sel} value={inputs.masking} onChange={e => setInputs(v => ({ ...v, masking: e.target.value }))}>
                  <option value="NONE">None</option>
                  <option value="SINGLE">Single Blind</option>
                  <option value="DOUBLE">Double Blind</option>
                  <option value="TRIPLE">Triple Blind</option>
                </select>
              </div>
              <div>
                <label style={{ ...lbl, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: 0 }}>
                  <input type="checkbox" checked={inputs.indication_rare} onChange={e => setInputs(v => ({ ...v, indication_rare: e.target.checked }))} style={{ accentColor: "#06b6d4" }} />
                  <span>Rare / Orphan indication</span>
                </label>
              </div>
              <div>
                <label style={lbl}>Preferred Countries</label>
                <div style={{ display: "flex", gap: 5 }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="e.g. United States" value={countryInput} onChange={e => setCountryInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && countryInput.trim()) { setInputs(v => ({ ...v, preferred_countries: [...v.preferred_countries, countryInput.trim()] })); setCountryInput(""); } }} />
                  <button onClick={() => { if (countryInput.trim()) { setInputs(v => ({ ...v, preferred_countries: [...v.preferred_countries, countryInput.trim()] })); setCountryInput(""); } }}
                    style={{ padding: "8px 11px", borderRadius: 10, background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>+</button>
                </div>
                {inputs.preferred_countries.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {inputs.preferred_countries.map((c, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 5, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 10 }}>
                        {c}
                        <button onClick={() => setInputs(v => ({ ...v, preferred_countries: v.preferred_countries.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 12 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 8 }}>
            <motion.button onClick={runAllStages} disabled={isRunningAll || !inputs.condition}
              whileHover={!isRunningAll ? { scale: 1.02 } : {}} whileTap={!isRunningAll ? { scale: 0.97 } : {}}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 12, background: isRunningAll ? "#f1f5f9" : "linear-gradient(135deg, #6366f1, #3b82f6)", color: isRunningAll ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: isRunningAll || !inputs.condition ? "not-allowed" : "pointer", boxShadow: isRunningAll ? "none" : "0 4px 16px rgba(99,102,241,0.25)" }}>
              {isRunningAll ? <><Loader2 className="h-4 w-4 animate-spin" /> Running all stages…</> : <><Play className="h-4 w-4" /> Run All 6 Stages</>}
            </motion.button>
            {!isRunningAll && result && (
              <button onClick={() => runSingle(activeStage)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px", borderRadius: 12, background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", cursor: "pointer" }}>
                <RefreshCw className="h-3.5 w-3.5" /> Re-run Stage {activeStage}
              </button>
            )}
            {!isRunningAll && result && activeStage < 6 && (
              <button onClick={() => setActiveStage((activeStage + 1) as Stage)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px", borderRadius: 12, background: rgba(config.color, 0.08), color: config.color, fontSize: 12, fontWeight: 600, border: `1px solid ${rgba(config.color, 0.2)}`, cursor: "pointer" }}>
                Next Stage <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Live data sources */}
          <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>Live data sources</div>
            {[{ n: "ClinicalTrials.gov", c: "#06b6d4" }, { n: "FDA FAERS", c: "#ef4444" }, { n: "PubMed / NCBI", c: "#10b981" }, { n: "OpenFDA Labels", c: "#f59e0b" }].map(s => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: s.c, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{s.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", background: "#f8fafc" }}>
          <AnimatePresence mode="wait">
            <motion.div key={`${activeStage}-${!!result}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {isLoading && <Skeleton />}
              {!isLoading && error && <ErrorState message={error} onRetry={() => runSingle(activeStage)} />}
              {!isLoading && !error && !result && <EmptyState stage={activeStage} config={config} />}
              {!isLoading && !error && result && (
                <>
                  {activeStage === 1 && <Stage1Results data={result} />}
                  {activeStage === 2 && <Stage2Results data={result} />}
                  {activeStage === 3 && <Stage3Results data={result} />}
                  {activeStage === 4 && <Stage4Results data={result} />}
                  {activeStage === 5 && <Stage5Results data={result} />}
                  {activeStage === 6 && <Stage6Results data={result} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
