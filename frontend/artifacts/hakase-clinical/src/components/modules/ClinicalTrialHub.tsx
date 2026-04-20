import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Search, MapPin, Lock, TrendingUp, Activity, BarChart3,
  CheckCircle2, Loader2, AlertTriangle, Sparkles, ArrowRight,
  RefreshCw, ExternalLink, ChevronRight, ShieldAlert, BookOpen,
  FlaskConical, Zap, Target,
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

// ─── API ──────────────────────────────────────────────────────────────────────

const API = (import.meta.env.VITE_API_URL || "") + "/api";

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

const rgba = (hex: string, a = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const formatN = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

const Badge = ({ label, color = "#06b6d4", size = "sm" }: { label: string; color?: string; size?: "xs" | "sm" }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: size === "xs" ? "2px 7px" : "3px 9px", borderRadius: 6, fontSize: size === "xs" ? 9 : 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: rgba(color, 0.12), color, border: `1px solid ${rgba(color, 0.25)}` }}>
    {label}
  </span>
);

const KPI = ({ label, value, unit, color, sub }: { label: string; value: any; unit?: string; color: string; sub?: string }) => (
  <div style={{ borderRadius: 16, padding: "16px 18px", background: rgba(color, 0.07), border: `1px solid ${rgba(color, 0.18)}` }}>
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: rgba(color, 0.6), marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value ?? "—"}{unit && <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2, opacity: 0.7 }}>{unit}</span>}</div>
    {sub && <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>{sub}</div>}
  </div>
);

const SectionCard = ({ title, icon, color, children }: any) => (
  <div style={{ borderRadius: 18, overflow: "hidden", background: "#0b1628", border: `1px solid ${rgba(color, 0.18)}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${rgba(color, 0.12)}`, background: rgba(color, 0.05) }}>
      <div style={{ padding: 6, borderRadius: 8, background: rgba(color, 0.15) }}>
        <span style={{ color, display: "flex" }}>{icon}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>{title}</span>
    </div>
    <div style={{ padding: "16px 18px" }}>{children}</div>
  </div>
);

const BarRow = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
        <span>{label}</span><span style={{ fontWeight: 700, color }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
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
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: rgba(color, 0.08), border: `1px solid ${rgba(color, 0.2)}`, marginBottom: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{signal.reaction}</div>
        <div style={{ fontSize: 10, color: "#64748b" }}>PRR {signal.prr} · ROR {signal.ror} · χ² {signal.chiSquared} · N={signal.drugReports}</div>
      </div>
      <Badge label={isSerious ? "SERIOUS" : isSignal ? "SIGNAL" : "NOISE"} color={color} size="xs" />
    </div>
  );
};

// Input styles
const inp = { width: "100%", fontSize: 12, padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#cbd5e1", outline: "none" } as const;
const lbl = { display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#475569", marginBottom: 5 } as const;
const sel = { ...inp, background: "#0a1425", appearance: "none" as const };

// ─── Result panels ────────────────────────────────────────────────────────────

function Stage1Results({ data }: { data: any }) {
  const color = "#06b6d4";
  const l = data.landscape || {};
  const lit = data.literatureMaturity || {};
  const safety = data.safetyBaseline || {};
  const phases: Record<string, number> = l.byPhase || {};
  const maxPhase = Math.max(...Object.values(phases).map(v => Number(v)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <KPI label="Total Trials" value={l.totalTrials ?? "—"} color={color} sub="In landscape" />
        <KPI label="Unmet Need" value={data.unmetNeedScore} unit="/100" color="#f59e0b" sub="Higher = more opportunity" />
        <KPI label="PubMed Articles" value={lit.articleCount ? formatN(lit.articleCount) : "—"} color="#10b981" sub="Literature maturity" />
        <KPI label="Safety Score" value={safety.safetyScore ?? (safety.totalDrugReports === 0 ? "N/A" : "—")} unit={safety.safetyScore ? "/100" : ""} color={safety.riskLevel === "HIGH" ? "#ef4444" : safety.riskLevel === "MODERATE" ? "#f59e0b" : "#10b981"} sub={safety.riskLevel ? `${safety.riskLevel} risk · ${(safety.totalDrugReports || 0).toLocaleString()} AEs` : "No FAERS data"} />
      </div>

      {/* Phase distribution */}
      {Object.keys(phases).length > 0 && (
        <SectionCard title="Phase Distribution" icon={<BarChart3 className="h-4 w-4" />} color={color}>
          {Object.entries(phases).map(([ph, cnt]) => (
            <BarRow key={ph} label={ph.replace("_", " ")} value={Number(cnt)} max={maxPhase} color={color} />
          ))}
        </SectionCard>
      )}

      {/* Competitor trials */}
      {(data.topCompetitorTrials || []).length > 0 && (
        <SectionCard title="Competitor Trials" icon={<Target className="h-4 w-4" />} color={color}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
              <thead>
                <tr>{["NCT ID", "Sponsor", "Phase", "Status", "Enrolled", ""].map(h => (
                  <th key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#334155", paddingBottom: 2, textAlign: "left" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {(data.topCompetitorTrials || []).slice(0, 8).map((t: any) => (
                  <tr key={t.nctId} style={{ background: "rgba(255,255,255,0.02)" }}>
                    <td style={{ fontSize: 11, color: "#22d3ee", fontWeight: 700, padding: "7px 8px 7px 0", fontFamily: "monospace" }}>{t.nctId}</td>
                    <td style={{ fontSize: 11, color: "#94a3b8", padding: "7px 8px" }}>{(t.sponsor || "").slice(0, 20)}</td>
                    <td style={{ padding: "7px 8px" }}><Badge label={(t.phase || [])[0] || "—"} color={color} size="xs" /></td>
                    <td style={{ padding: "7px 8px" }}><Badge label={t.status || "—"} color={t.status === "RECRUITING" ? "#10b981" : t.status === "COMPLETED" ? "#6366f1" : "#64748b"} size="xs" /></td>
                    <td style={{ fontSize: 11, color: "#64748b", padding: "7px 8px", textAlign: "right" }}>{(t.enrollmentCount || 0).toLocaleString()}</td>
                    <td style={{ padding: "7px 0 7px 8px" }}>
                      <a href={`https://clinicaltrials.gov/study/${t.nctId}`} target="_blank" rel="noreferrer" style={{ color: "#475569", display: "flex" }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* PubMed articles */}
      {(lit.topArticles || []).length > 0 && (
        <SectionCard title="Top PubMed Articles" icon={<BookOpen className="h-4 w-4" />} color="#10b981">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(lit.topArticles || []).slice(0, 5).map((art: any, i: number) => (
              <a key={art.pmid || i} href={art.link} target="_blank" rel="noreferrer" style={{ display: "block", textDecoration: "none", padding: "10px 12px", borderRadius: 10, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)", transition: "border-color 0.2s" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#a7f3d0", lineHeight: 1.4, marginBottom: 4 }}>{art.title}</div>
                <div style={{ fontSize: 10, color: "#334155" }}>{art.journal} · {art.year} · PMID {art.pmid}</div>
              </a>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Safety signals */}
      {(safety.signals || []).length > 0 && (
        <SectionCard title={`PRR/ROR Safety Signals — ${safety.totalDrugReports?.toLocaleString()} FAERS reports`} icon={<ShieldAlert className="h-4 w-4" />} color="#ef4444">
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 10 }}>{safety.method}</div>
          {(safety.signals || []).slice(0, 8).map((sig: any, i: number) => <PRRBadge key={i} signal={sig} />)}
        </SectionCard>
      )}

      {/* Optimizations */}
      {(data.optimizations || []).length > 0 && (
        <SectionCard title="Strategic Recommendations" icon={<Zap className="h-4 w-4" />} color="#f59e0b">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(data.optimizations || []).slice(0, 4).map((opt: any, i: number) => {
              const pc = opt.priority === "HIGH" ? "#ef4444" : opt.priority === "MEDIUM" ? "#f59e0b" : "#10b981";
              return (
                <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: rgba(pc, 0.05), border: `1px solid ${rgba(pc, 0.15)}` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Badge label={opt.priority || "TIP"} color={pc} size="xs" />
                    <div style={{ flex: 1, fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>
                      {opt.recommendation}
                      {opt.impact && <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: pc }}>→ {opt.impact}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function Stage2Results({ data }: { data: any }) {
  const color = "#10b981";
  const sites = data.rankedSites || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <KPI label="Sites Identified" value={sites.length} color={color} sub="Globally ranked" />
        <KPI label="Avg Score" value={sites.length > 0 ? Math.round(sites.slice(0, 5).reduce((s: number, x: any) => s + (x.compositeScore || 0), 0) / Math.min(5, sites.length)) : "—"} unit="/100" color="#06b6d4" sub="Top 5 sites" />
        <KPI label="Countries" value={[...new Set(sites.map((s: any) => s.country))].length} color="#f59e0b" sub="Geographic diversity" />
      </div>
      {sites.length > 0 && (
        <SectionCard title="Site Rankings" icon={<MapPin className="h-4 w-4" />} color={color}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 5px" }}>
            <thead>
              <tr>{["Rank", "Institution", "Country", "Score", "Activation", "Exp. Sites"].map(h => (
                <th key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#334155", textAlign: "left", paddingBottom: 2 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {sites.slice(0, 10).map((s: any, i: number) => (
                <tr key={i} style={{ background: i === 0 ? rgba(color, 0.06) : "transparent" }}>
                  <td style={{ fontSize: 12, fontWeight: 900, color: i === 0 ? color : "#475569", padding: "6px 8px 6px 0" }}>#{i + 1}</td>
                  <td style={{ fontSize: 11, color: "#cbd5e1", padding: "6px 8px", maxWidth: 180 }}>{(s.institution || s.name || "—").slice(0, 28)}</td>
                  <td style={{ fontSize: 10, color: "#64748b", padding: "6px 8px" }}>{s.country || "—"}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color }}>{Math.round(s.compositeScore || 0)}</span>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${s.compositeScore || 0}%`, background: color, borderRadius: 999 }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 10, color: "#64748b", padding: "6px 8px" }}>{s.startupWeeks || s.activationWeeks || "—"} wk</td>
                  <td style={{ fontSize: 10, color: "#64748b", padding: "6px 0" }}>{s.expectedPatients || s.expectedEnrollment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
      {(data.optimizations || []).length > 0 && (
        <SectionCard title="Site Strategy Recommendations" icon={<Zap className="h-4 w-4" />} color="#f59e0b">
          {(data.optimizations || []).slice(0, 3).map((opt: any, i: number) => {
            const pc = opt.priority === "HIGH" ? "#ef4444" : opt.priority === "MEDIUM" ? "#f59e0b" : "#10b981";
            return (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: rgba(pc, 0.05), border: `1px solid ${rgba(pc, 0.15)}`, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8 }}><Badge label={opt.priority || "TIP"} color={pc} size="xs" /><span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.55, flex: 1 }}>{opt.recommendation}</span></div>
              </div>
            );
          })}
        </SectionCard>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <KPI label="IND Prep" value={timeline.indPreparationWeeks || timeline.totalWeeks} unit=" wk" color={color} sub="Preparation" />
        <KPI label="Review" value={timeline.fdaReviewWeeks || timeline.fdaReview} unit=" wk" color="#06b6d4" sub="FDA review" />
        <KPI label="Total to IND" value={timeline.totalWeeks || timeline.totalWeeksToInd} unit=" wk" color="#10b981" sub="Best case" />
      </div>
      {designations.length > 0 && (
        <SectionCard title="Potential Regulatory Designations" icon={<CheckCircle2 className="h-4 w-4" />} color={color}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {designations.map((d: any, i: number) => (
              <div key={i} style={{ padding: "10px 14px", borderRadius: 12, background: rgba(color, 0.07), border: `1px solid ${rgba(color, 0.2)}` }}>
                <div style={{ fontSize: 12, fontWeight: 800, color }}>{d.designation || d.name}</div>
                {d.benefit && <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{d.benefit}</div>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      {reqs.length > 0 && (
        <SectionCard title="IND/CTA Requirements Checklist" icon={<Lock className="h-4 w-4" />} color={color}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {reqs.map((r: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.02)" }}>
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color }} />
                <div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>{r.item || r.requirement}</div>
                  {r.details && <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{r.details}</div>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      {(data.optimizations || []).length > 0 && (
        <SectionCard title="Regulatory Strategy" icon={<Zap className="h-4 w-4" />} color={color}>
          {(data.optimizations || []).slice(0, 4).map((opt: any, i: number) => {
            const pc = opt.priority === "HIGH" ? "#ef4444" : opt.priority === "MEDIUM" ? "#f59e0b" : "#10b981";
            return <div key={i} style={{ padding: "8px 12px", borderRadius: 10, background: rgba(pc, 0.05), border: `1px solid ${rgba(pc, 0.15)}`, marginBottom: 6 }}><div style={{ display: "flex", gap: 8 }}><Badge label={opt.priority || "TIP"} color={pc} size="xs" /><span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>{opt.recommendation}</span></div></div>;
          })}
        </SectionCard>
      )}
    </div>
  );
}

function Stage4Results({ data }: { data: any }) {
  const color = "#ec4899";
  const mc = data.monteCarlo || {};
  const scenarios = data.scenarios || [];
  const p10 = mc.p10 || 0; const p50 = mc.p50 || 0; const p90 = mc.p90 || 0;
  const maxVal = Math.max(p10, p50, p90) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <KPI label="P10 (Optimistic)" value={mc.p10} unit=" mo" color="#10b981" sub="Best 10%" />
        <KPI label="P50 (Median)" value={mc.p50} unit=" mo" color={color} sub="Most likely" />
        <KPI label="P90 (Conservative)" value={mc.p90} unit=" mo" color="#ef4444" sub="Worst 10%" />
        <KPI label="Monthly Rate" value={mc.medianMonthlyRate?.toFixed?.(1) || data.monthlyEnrollmentRate?.toFixed?.(1) || "—"} unit=" pts/mo" color="#06b6d4" sub="Per site" />
      </div>

      <SectionCard title="Monte Carlo Distribution — 1,000 Iterations" icon={<TrendingUp className="h-4 w-4" />} color={color}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[{ label: "P10 — Best case (10th percentile)", val: p10, c: "#10b981" }, { label: "P50 — Median (50th percentile)", val: p50, c: color }, { label: "P90 — Conservative (90th percentile)", val: p90, c: "#ef4444" }].map(({ label, val, c }) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 5 }}>
                <span>{label}</span><span style={{ fontWeight: 800, color: c }}>{val} months</span>
              </div>
              <div style={{ height: 12, borderRadius: 999, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(val / maxVal) * 100}%` }} transition={{ duration: 1, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${c}, ${c}99)`, boxShadow: `0 0 8px ${c}66` }} />
              </div>
            </div>
          ))}
        </div>
        {mc.reasoning && <div style={{ marginTop: 12, fontSize: 11, color: "#475569", lineHeight: 1.6, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", borderLeft: `2px solid ${rgba(color, 0.35)}` }}>{mc.reasoning}</div>}
      </SectionCard>

      {scenarios.length > 0 && (
        <SectionCard title="Scenario Comparison" icon={<BarChart3 className="h-4 w-4" />} color={color}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {scenarios.slice(0, 3).map((sc: any, i: number) => {
              const sc_color = i === 0 ? "#10b981" : i === 1 ? color : "#ef4444";
              return (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 14, background: rgba(sc_color, 0.06), border: `1px solid ${rgba(sc_color, 0.18)}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: sc_color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{sc.name || sc.scenario}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: sc_color }}>{sc.p50 || sc.medianMonths} <span style={{ fontSize: 11, opacity: 0.7 }}>mo</span></div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>${((sc.totalCost || sc.cost || 0) / 1e6).toFixed(1)}M est.</div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {(data.optimizations || []).length > 0 && (
        <SectionCard title="Enrollment Acceleration" icon={<Zap className="h-4 w-4" />} color={color}>
          {(data.optimizations || []).slice(0, 3).map((opt: any, i: number) => {
            const pc = opt.priority === "HIGH" ? "#ef4444" : opt.priority === "MEDIUM" ? "#f59e0b" : "#10b981";
            return <div key={i} style={{ padding: "8px 12px", borderRadius: 10, background: rgba(pc, 0.05), border: `1px solid ${rgba(pc, 0.15)}`, marginBottom: 6 }}><div style={{ display: "flex", gap: 8 }}><Badge label={opt.priority || "TIP"} color={pc} size="xs" /><span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>{opt.recommendation}{opt.timeline_impact ? <span style={{ color: pc }}> → {opt.timeline_impact}</span> : null}</span></div></div>;
          })}
        </SectionCard>
      )}
    </div>
  );
}

function Stage5Results({ data }: { data: any }) {
  const color = "#8b5cf6";
  const kpis = data.kpis || {};
  const risks = data.deviationRisks || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <KPI label="Protocol Deviations" value={kpis.expectedDeviations || data.expectedDeviations} unit="" color="#ef4444" sub="Expected total" />
        <KPI label="Drop-Out Rate" value={kpis.dropoutRate ? `${(kpis.dropoutRate * 100).toFixed(1)}` : (data.dropoutRate ? `${(data.dropoutRate * 100).toFixed(1)}` : "—")} unit="%" color="#f59e0b" sub="Predicted" />
        <KPI label="RBM Savings" value={data.rbmSavings || kpis.rbmSavings} unit="%" color="#10b981" sub="vs. traditional monitoring" />
        <KPI label="Monitoring Cost" value={data.monitoringCost ? `$${((data.monitoringCost) / 1000).toFixed(0)}K` : "—"} color={color} sub="Projected" />
      </div>
      {risks.length > 0 && (
        <SectionCard title="Protocol Deviation Risk Analysis" icon={<ShieldAlert className="h-4 w-4" />} color={color}>
          {risks.slice(0, 5).map((r: any, i: number) => {
            const pc = r.severity === "HIGH" ? "#ef4444" : r.severity === "MEDIUM" ? "#f59e0b" : "#10b981";
            return (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: rgba(pc, 0.05), border: `1px solid ${rgba(pc, 0.15)}`, marginBottom: 8 }}>
                <Badge label={r.severity || "LOW"} color={pc} size="xs" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>{r.risk || r.riskType}</div>
                  {r.mitigation && <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{r.mitigation}</div>}
                </div>
                {r.probability && <div style={{ fontSize: 10, color: pc, fontWeight: 700 }}>{(r.probability * 100).toFixed(0)}%</div>}
              </div>
            );
          })}
        </SectionCard>
      )}
      {(data.optimizations || []).length > 0 && (
        <SectionCard title="Execution Recommendations" icon={<Zap className="h-4 w-4" />} color={color}>
          {(data.optimizations || []).slice(0, 4).map((opt: any, i: number) => {
            const pc = opt.priority === "HIGH" ? "#ef4444" : opt.priority === "MEDIUM" ? "#f59e0b" : "#10b981";
            return <div key={i} style={{ padding: "8px 12px", borderRadius: 10, background: rgba(pc, 0.05), border: `1px solid ${rgba(pc, 0.15)}`, marginBottom: 6 }}><div style={{ display: "flex", gap: 8 }}><Badge label={opt.priority || "TIP"} color={pc} size="xs" /><span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>{opt.recommendation}</span></div></div>;
          })}
        </SectionCard>
      )}
    </div>
  );
}

function GaugeArc({ value, color, size = 120 }: { value: number; color: string; size?: number }) {
  const r = 44; const cir = Math.PI * r; const pct = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60">
      <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
      <motion.path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * cir} ${cir}`}
        initial={{ strokeDasharray: `0 ${cir}` }}
        animate={{ strokeDasharray: `${(pct / 100) * cir} ${cir}` }}
        transition={{ duration: 1.2, ease: "easeOut" }} />
      <text x="50" y="52" textAnchor="middle" style={{ fontSize: "18px", fontWeight: "900", fill: color }}>{value}%</text>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* GO / NO-GO Banner */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        style={{ borderRadius: 18, padding: "20px 24px", background: isGo ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.08))" : "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.08))", border: `2px solid ${isGo ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: isGo ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 28 }}>{isGo ? "✅" : "❌"}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: isGo ? "#34d399" : "#f87171", letterSpacing: "-0.02em" }}>{gonogo.recommendation || (isGo ? "GO" : "NO-GO")}</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, lineHeight: 1.5 }}>{gonogo.reasoning || `ML ensemble predicts ${Math.round(successProb)}% probability of trial success.`}</div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <GaugeArc value={Math.round(successProb)} color={isGo ? "#10b981" : "#ef4444"} />
          <div style={{ fontSize: 10, color: "#475569", marginTop: -4 }}>Success Probability</div>
        </div>
      </motion.div>

      {/* Per-phase probabilities */}
      {Object.keys(probs).length > 0 && (
        <SectionCard title="Stage-by-Stage Success Probability" icon={<BarChart3 className="h-4 w-4" />} color={color}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {Object.entries(probs).slice(0, 4).map(([phase, prob]: [string, any]) => {
              const p = Math.round(prob * 100);
              const pc = p >= 70 ? "#10b981" : p >= 50 ? "#f59e0b" : "#ef4444";
              return (
                <div key={phase} style={{ textAlign: "center", padding: "14px 10px", borderRadius: 14, background: rgba(pc, 0.06), border: `1px solid ${rgba(pc, 0.15)}` }}>
                  <GaugeArc value={p} color={pc} size={90} />
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{phase.replace("_", " ")}</div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ML Details */}
      {(ensemble.modelBreakdown || ml.modelBreakdown) && (
        <SectionCard title="Ensemble ML Breakdown" icon={<Sparkles className="h-4 w-4" />} color={color}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.entries(ensemble.modelBreakdown || ml.modelBreakdown || {}).map(([model, score]: [string, any]) => {
              const s = Math.round((score || 0) * 100);
              const pc = s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";
              return (
                <div key={model} style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>{model.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: pc }}>{s}%</div>
                  <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.05)", marginTop: 6, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s}%` }} transition={{ duration: 0.9 }}
                      style={{ height: "100%", background: pc, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {(data.optimizations || []).length > 0 && (
        <SectionCard title="Strategic Next Steps" icon={<Zap className="h-4 w-4" />} color={color}>
          {(data.optimizations || []).slice(0, 4).map((opt: any, i: number) => {
            const pc = opt.priority === "HIGH" ? "#ef4444" : opt.priority === "MEDIUM" ? "#f59e0b" : "#10b981";
            return <div key={i} style={{ padding: "8px 12px", borderRadius: 10, background: rgba(pc, 0.05), border: `1px solid ${rgba(pc, 0.15)}`, marginBottom: 6 }}><div style={{ display: "flex", gap: 8 }}><Badge label={opt.priority || "TIP"} color={pc} size="xs" /><span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>{opt.recommendation}</span></div></div>;
          })}
        </SectionCard>
      )}
    </div>
  );
}

// ─── Stage Forms ──────────────────────────────────────────────────────────────

function Stage1Form({ v, set }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div><label style={lbl}>Condition / Indication *</label><input style={inp} placeholder="e.g. Non-small cell lung cancer" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} /></div>
      <div><label style={lbl}>Intervention / Drug</label><input style={inp} placeholder="e.g. Pembrolizumab" value={v.intervention} onChange={e => set({ ...v, intervention: e.target.value })} /></div>
      <div><label style={lbl}>Phase</label>
        <select style={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          {["PHASE1", "PHASE2", "PHASE3", "PHASE4"].map(p => <option key={p} value={p}>{p.replace("PHASE", "Phase ")}</option>)}
        </select></div>
      <div><label style={lbl}>Sponsor Type</label>
        <select style={sel} value={v.sponsor_type} onChange={e => set({ ...v, sponsor_type: e.target.value })}>
          <option value="INDUSTRY">Industry / Pharma</option><option value="NIH">NIH</option><option value="FED">Federal</option><option value="OTHER">Academic / Other</option>
        </select></div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={v.indication_rare} onChange={e => set({ ...v, indication_rare: e.target.checked })} style={{ accentColor: "#06b6d4" }} />
        <span style={{ fontSize: 11, color: "#475569" }}>Rare / Orphan indication</span>
      </label>
    </div>
  );
}

function Stage2Form({ v, set }: any) {
  const [ci, setCi] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div><label style={lbl}>Condition *</label><input style={inp} placeholder="e.g. Breast Cancer" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} /></div>
      <div><label style={lbl}>Phase</label>
        <select style={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          {["PHASE1", "PHASE2", "PHASE3"].map(p => <option key={p} value={p}>{p.replace("PHASE", "Phase ")}</option>)}
        </select></div>
      <div><label style={lbl}>Enrollment Target</label><input type="number" style={inp} min={10} value={v.enrollment_target} onChange={e => set({ ...v, enrollment_target: parseInt(e.target.value) || 200 })} /></div>
      <div><label style={lbl}>Sites Requested</label><input type="number" style={inp} min={1} max={200} value={v.n_sites_requested} onChange={e => set({ ...v, n_sites_requested: parseInt(e.target.value) || 10 })} /></div>
      <div>
        <label style={lbl}>Preferred Countries</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={{ ...inp, flex: 1 }} placeholder="e.g. United States" value={ci} onChange={e => setCi(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && ci.trim()) { set({ ...v, preferred_countries: [...v.preferred_countries, ci.trim()] }); setCi(""); } }} />
          <button onClick={() => { if (ci.trim()) { set({ ...v, preferred_countries: [...v.preferred_countries, ci.trim()] }); setCi(""); } }}
            style={{ padding: "8px 12px", borderRadius: 10, background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>+</button>
        </div>
        {v.preferred_countries.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {v.preferred_countries.map((c: string, i: number) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: "#34d399", fontSize: 10 }}>
                {c}
                <button onClick={() => set({ ...v, preferred_countries: v.preferred_countries.filter((_: any, j: number) => j !== i) })} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div><label style={lbl}>Condition *</label><input style={inp} placeholder="e.g. NSCLC" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} /></div>
      <div><label style={lbl}>Intervention</label><input style={inp} placeholder="e.g. Osimertinib" value={v.intervention} onChange={e => set({ ...v, intervention: e.target.value })} /></div>
      <div><label style={lbl}>Phase</label>
        <select style={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          {["PHASE1", "PHASE2", "PHASE3"].map(p => <option key={p} value={p}>{p.replace("PHASE", "Phase ")}</option>)}
        </select></div>
      <div><label style={lbl}>Sponsor Type</label>
        <select style={sel} value={v.sponsor_type} onChange={e => set({ ...v, sponsor_type: e.target.value })}>
          <option value="INDUSTRY">Industry</option><option value="NIH">NIH</option><option value="FED">Federal</option><option value="OTHER">Other</option>
        </select></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={v.indication_rare} onChange={e => set({ ...v, indication_rare: e.target.checked })} style={{ accentColor: "#f59e0b" }} />
          <span style={{ fontSize: 11, color: "#475569" }}>Rare / Orphan Disease</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={v.has_prior_ind} onChange={e => set({ ...v, has_prior_ind: e.target.checked })} style={{ accentColor: "#f59e0b" }} />
          <span style={{ fontSize: 11, color: "#475569" }}>Prior IND already active</span>
        </label>
      </div>
    </div>
  );
}

function Stage4Form({ v, set }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div><label style={lbl}>Condition *</label><input style={inp} placeholder="e.g. Rheumatoid Arthritis" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} /></div>
      <div><label style={lbl}>Phase</label>
        <select style={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          {["PHASE1", "PHASE2", "PHASE3"].map(p => <option key={p} value={p}>{p.replace("PHASE", "Phase ")}</option>)}
        </select></div>
      <div><label style={lbl}>Enrollment Target</label><input type="number" style={inp} min={10} value={v.enrollment_target} onChange={e => set({ ...v, enrollment_target: parseInt(e.target.value) || 200 })} /></div>
      <div><label style={lbl}>Number of Sites</label><input type="number" style={inp} min={1} max={200} value={v.n_sites} onChange={e => set({ ...v, n_sites: parseInt(e.target.value) || 10 })} /></div>
      <div>
        <label style={lbl}>Dropout Rate — {Math.round(v.dropout_rate * 100)}%</label>
        <input type="range" min={0} max={0.5} step={0.01} value={v.dropout_rate} onChange={e => set({ ...v, dropout_rate: parseFloat(e.target.value) })} style={{ width: "100%", accentColor: "#ec4899" } as any} />
      </div>
      <div><label style={lbl}>Simulations</label>
        <select style={sel} value={v.n_simulations} onChange={e => set({ ...v, n_simulations: parseInt(e.target.value) })}>
          <option value={500}>500 — Fast</option><option value={1000}>1,000 — Standard</option><option value={2000}>2,000 — High Fidelity</option>
        </select></div>
    </div>
  );
}

function Stage5Form({ v, set }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div><label style={lbl}>Condition *</label><input style={inp} placeholder="e.g. Major Depressive Disorder" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} /></div>
      <div><label style={lbl}>Phase</label>
        <select style={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          {["PHASE1", "PHASE2", "PHASE3"].map(p => <option key={p} value={p}>{p.replace("PHASE", "Phase ")}</option>)}
        </select></div>
      <div><label style={lbl}>Enrolled Patients</label><input type="number" style={inp} min={10} value={v.n_patients} onChange={e => set({ ...v, n_patients: parseInt(e.target.value) || 200 })} /></div>
      <div><label style={lbl}>Duration (months)</label><input type="number" style={inp} min={1} max={120} value={v.duration_months} onChange={e => set({ ...v, duration_months: parseInt(e.target.value) || 24 })} /></div>
      <div><label style={lbl}>Number of Sites</label><input type="number" style={inp} min={1} max={200} value={v.n_sites} onChange={e => set({ ...v, n_sites: parseInt(e.target.value) || 10 })} /></div>
    </div>
  );
}

function Stage6Form({ v, set }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div><label style={lbl}>Condition *</label><input style={inp} placeholder="e.g. Alzheimer's Disease" value={v.condition} onChange={e => set({ ...v, condition: e.target.value })} /></div>
      <div><label style={lbl}>Intervention</label><input style={inp} placeholder="e.g. Lecanemab" value={v.intervention} onChange={e => set({ ...v, intervention: e.target.value })} /></div>
      <div><label style={lbl}>Phase</label>
        <select style={sel} value={v.phase} onChange={e => set({ ...v, phase: e.target.value })}>
          {["PHASE1", "PHASE2", "PHASE3"].map(p => <option key={p} value={p}>{p.replace("PHASE", "Phase ")}</option>)}
        </select></div>
      <div><label style={lbl}>Enrollment Target</label><input type="number" style={inp} min={10} value={v.enrollment_target} onChange={e => set({ ...v, enrollment_target: parseInt(e.target.value) || 200 })} /></div>
      <div><label style={lbl}>Primary Endpoint</label><input style={inp} placeholder="e.g. CDR-SB at 18 months" value={v.primary_endpoint} onChange={e => set({ ...v, primary_endpoint: e.target.value })} /></div>
      <div><label style={lbl}>Masking</label>
        <select style={sel} value={v.masking} onChange={e => set({ ...v, masking: e.target.value })}>
          <option value="NONE">None</option><option value="SINGLE">Single</option><option value="DOUBLE">Double Blind</option><option value="TRIPLE">Triple Blind</option>
        </select></div>
      <div><label style={lbl}>Sponsor Type</label>
        <select style={sel} value={v.sponsor_type} onChange={e => set({ ...v, sponsor_type: e.target.value })}>
          <option value="INDUSTRY">Industry</option><option value="NIH">NIH</option><option value="FED">Federal</option><option value="OTHER">Other</option>
        </select></div>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 82, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", position: "relative" }}>
            <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
              style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)" }} />
          </div>
        ))}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 120 + i * 20, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" }}>
          <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
            style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)" }} />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ stage, config }: { stage: Stage; config: StageConfig }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340, borderRadius: 20, border: `2px dashed ${rgba(config.color, 0.2)}`, background: rgba(config.color, 0.03) }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
        style={{ padding: 20, borderRadius: 20, background: rgba(config.color, 0.08), border: `1px solid ${rgba(config.color, 0.15)}`, marginBottom: 20 }}>
        <span style={{ color: config.color, display: "flex", transform: "scale(1.8)" }}>{config.icon}</span>
      </motion.div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#cbd5e1", marginBottom: 6 }}>Stage {stage} · {config.label}</div>
      <div style={{ fontSize: 12, color: "#475569", textAlign: "center", maxWidth: 280, lineHeight: 1.6, marginBottom: 16 }}>{config.description}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#334155" }}>
        <ChevronRight className="h-3.5 w-3.5" style={{ color: config.color }} />
        <span>Fill parameters and click <span style={{ color: config.color, fontWeight: 700 }}>Run Simulation</span></span>
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, borderRadius: 20, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}>
      <div style={{ padding: 16, borderRadius: "50%", background: "rgba(239,68,68,0.08)", marginBottom: 14 }}>
        <AlertTriangle className="h-7 w-7" style={{ color: "#ef4444" }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#f87171", marginBottom: 6 }}>Simulation Error</div>
      <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center", maxWidth: 300, marginBottom: 16, lineHeight: 1.5 }}>{message}</div>
      <button onClick={onRetry} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 12, background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClinicalTrialHub() {
  const [activeStage, setActiveStage] = useState<Stage>(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<number, any>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [, nav] = useLocation();

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

  const config = STAGES[activeStage - 1];
  const result = results[activeStage];
  const error = errors[activeStage];
  const completedCount = Object.keys(results).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100vh - 80px)", background: "#020b19" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#020b19", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div style={{ padding: "10px", borderRadius: 14, background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(6,182,212,0.25)" }}>
          <FlaskConical className="h-5 w-5" style={{ color: "#06b6d4" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Clinical Trial Hub</div>
          <div style={{ fontSize: 10, color: "#334155", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>6-stage simulation · Live APIs · ML reasoning</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {completedCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#34d399" }}>{completedCount} of 6 done</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e" }}>Live Engine</span>
          </div>
        </div>
      </div>

      {/* ── Stage Tabs ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", padding: "0 24px", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "#020b19", flexShrink: 0, overflowX: "auto" }}>
        {STAGES.map(s => {
          const isActive = activeStage === s.id;
          const isDone = !!results[s.id];
          return (
            <button key={s.id} onClick={() => setActiveStage(s.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", border: "none", borderBottom: isActive ? `2px solid ${s.color}` : "2px solid transparent", background: "none", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}>
              <span style={{ color: isActive ? s.color : isDone ? "#22c55e" : "#334155", display: "flex", transition: "color 0.2s" }}>
                {isDone && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#22c55e" }} /> : s.icon}
              </span>
              <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? s.color : isDone ? "#94a3b8" : "#334155", transition: "color 0.2s" }}>{s.short}</span>
            </button>
          );
        })}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* Left: Input Panel */}
        <div style={{ width: 264, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.05)", background: "#050d1e" }}>
          {/* Stage header */}
          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ padding: 7, borderRadius: 10, background: rgba(config.color, 0.12), border: `1px solid ${rgba(config.color, 0.2)}` }}>
                <span style={{ color: config.color, display: "flex" }}>{config.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: config.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>Stage {activeStage}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{config.label}</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.5 }}>{config.description}</div>
          </div>

          {/* Form */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
            {activeStage === 1 && <Stage1Form v={s1} set={setS1} />}
            {activeStage === 2 && <Stage2Form v={s2} set={setS2} />}
            {activeStage === 3 && <Stage3Form v={s3} set={setS3} />}
            {activeStage === 4 && <Stage4Form v={s4} set={setS4} />}
            {activeStage === 5 && <Stage5Form v={s5} set={setS5} />}
            {activeStage === 6 && <Stage6Form v={s6} set={setS6} />}
          </div>

          {/* Actions */}
          <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 8 }}>
            <motion.button onClick={() => runStage(activeStage)} disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 12, background: `linear-gradient(135deg, ${config.color}, ${config.color}bb)`, color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1, boxShadow: `0 4px 16px ${rgba(config.color, 0.3)}` }}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Simulating…</> : <><Sparkles className="h-4 w-4" /> Run Simulation</>}
            </motion.button>
            {result && !loading && activeStage < 6 && (
              <button onClick={() => setActiveStage((activeStage + 1) as Stage)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px", borderRadius: 12, background: "rgba(255,255,255,0.04)", color: "#64748b", fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
                Next Stage <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Data sources */}
          <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1e293b", marginBottom: 8 }}>Live Data Sources</div>
            {[{ n: "ClinicalTrials.gov", c: "#06b6d4" }, { n: "FDA FAERS", c: "#ef4444" }, { n: "PubMed / NCBI", c: "#10b981" }, { n: "OpenFDA Labels", c: "#f59e0b" }].map(s => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: "50%", background: s.c, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "#334155" }}>{s.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "#020b19" }}>
          <AnimatePresence mode="wait">
            <motion.div key={`${activeStage}-${!!result}`}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              {loading && <Skeleton />}
              {!loading && error && <ErrorState message={error} onRetry={() => runStage(activeStage)} />}
              {!loading && !error && !result && <EmptyState stage={activeStage} config={config} />}
              {!loading && !error && result && (
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
