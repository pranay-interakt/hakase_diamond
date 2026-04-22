import { useState } from "react";
import {
  Search, MapPin, Loader2, AlertCircle, Star, Clock, TrendingUp,
  Globe, ChevronDown, ChevronUp, CheckCircle2, Info, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { recommendSites } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// ── helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s >= 75 ? "#10b981" : s >= 55 ? "#f59e0b" : "#ef4444";

const scoreBg = (s: number) =>
  s >= 75 ? "#f0fdf4" : s >= 55 ? "#fffbeb" : "#fef2f2";

const scoreBorder = (s: number) =>
  s >= 75 ? "#bbf7d0" : s >= 55 ? "#fde68a" : "#fecaca";

const scoreLabel = (s: number) =>
  s >= 75 ? "Strong" : s >= 55 ? "Good" : "Fair";

// ── Factor bar ────────────────────────────────────────────────────────────────

function FactorBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: 999 }}
        />
      </div>
    </div>
  );
}

// ── Site card ────────────────────────────────────────────────────────────────

function SiteCard({ site, rank }: { site: any; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const score = site.compositeScore ?? site.score ?? 0;
  const sc = scoreColor(score);
  const breakdown = site.rankingBreakdown || {};
  const grounding: string[] = site.grounding || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.04 }}
      style={{ background: "#fff", borderRadius: 14, border: `1px solid ${scoreBorder(score)}`, overflow: "hidden", marginBottom: 10 }}
    >
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px" }}>
        {/* Rank + score */}
        <div style={{ flexShrink: 0, textAlign: "center", minWidth: 52 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 2 }}>#{rank}</div>
          <div style={{
            padding: "6px 8px", borderRadius: 10,
            background: scoreBg(score), border: `1px solid ${scoreBorder(score)}`,
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: sc, lineHeight: 1 }}>{Math.round(score)}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: sc }}>{scoreLabel(score)}</div>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{site.facility}</span>
            {site.recruitingNow && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                RECRUITING
              </span>
            )}
            {site.activeTrials > 0 && !site.recruitingNow && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe" }}>
                ACTIVE
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, color: "#64748b", marginBottom: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin style={{ width: 11, height: 11 }} />
              {[site.city, site.state, site.country].filter(Boolean).join(", ")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Star style={{ width: 11, height: 11 }} />
              {site.trialCount} trials
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <TrendingUp style={{ width: 11, height: 11 }} />
              {site.enrollmentRate} pts/mo
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock style={{ width: 11, height: 11 }} />
              {site.startupWeeks}w startup
            </span>
            {site.conditionTrials > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6366f1", fontWeight: 600 }}>
                <CheckCircle2 style={{ width: 11, height: 11 }} />
                {site.conditionTrials} in-condition
              </span>
            )}
          </div>

          {/* Compact factor bars */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <FactorBar label="Experience"           value={breakdown.experience         ?? 0} max={30} color="#6366f1" />
            <FactorBar label="Condition Match"      value={breakdown.conditionMatch      ?? 0} max={25} color="#10b981" />
            <FactorBar label="Country Preference"   value={breakdown.countryPreference   ?? 0} max={20} color="#3b82f6" />
            <FactorBar label="Dropout Resilience"   value={breakdown.dropoutResilience   ?? 0} max={15} color="#f59e0b" />
            <FactorBar label="Operational Activity" value={breakdown.operationalActivity ?? 0} max={10} color="#ec4899" />
          </div>
        </div>

        {/* Expand toggle */}
        <button onClick={() => setExpanded(v => !v)}
          style={{ flexShrink: 0, padding: "6px 8px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>
          {expanded ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
          {expanded ? "Less" : "Why?"}
        </button>
      </div>

      {/* Expanded grounding */}
      <AnimatePresence>
        {expanded && grounding.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ borderTop: "1px solid #f1f5f9", padding: "12px 16px", background: "#fafafa", overflow: "hidden" }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <Zap style={{ width: 11, height: 11 }} /> Why this site is recommended
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {grounding.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
                  <CheckCircle2 style={{ width: 12, height: 12, color: "#10b981", flexShrink: 0, marginTop: 2 }} />
                  {r}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 14, fontSize: 11, color: "#94a3b8" }}>
              <span><b style={{ color: "#64748b" }}>Completed:</b> {site.completedTrials}</span>
              <span><b style={{ color: "#64748b" }}>Active:</b> {site.activeTrials}</span>
              <span><b style={{ color: "#64748b" }}>Exp. pts/yr:</b> {site.expectedPatients}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SiteIntelligence() {
  const [condition,       setCondition]       = useState("");
  const [intervention,    setIntervention]     = useState("");
  const [therapeuticArea, setTherapeuticArea]  = useState("");
  const [phase,           setPhase]            = useState("");
  const [countries,       setCountries]        = useState("");
  const [countryInput,    setCountryInput]     = useState("");
  const [countryList,     setCountryList]      = useState<string[]>([]);
  const [dropoutRate,     setDropoutRate]      = useState(0.10);
  const [data,            setData]             = useState<any>(null);
  const [loading,         setLoading]          = useState(false);
  const [error,           setError]            = useState("");

  const addCountry = () => {
    if (countryInput.trim() && !countryList.includes(countryInput.trim())) {
      const updated = [...countryList, countryInput.trim()];
      setCountryList(updated);
      setCountries(updated.join(","));
      setCountryInput("");
    }
  };
  const removeCountry = (c: string) => {
    const updated = countryList.filter(x => x !== c);
    setCountryList(updated);
    setCountries(updated.join(","));
  };

  const load = async () => {
    if (!condition.trim()) return;
    setLoading(true); setError("");
    try {
      setData(await recommendSites(
        condition.trim(),
        phase || undefined,
        countries || undefined,
        40,
        intervention || undefined,
        dropoutRate,
        therapeuticArea || undefined,
      ));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sites: any[] = data?.sites || [];
  const countrySummary: any[] = (data?.countrySummary || []).slice(0, 12);
  const rankingFactors: any[] = data?.rankingFactors || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 4 }}>Site Intelligence</h2>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Find and rank the most experienced trial sites globally — powered by live ClinicalTrials.gov data, with 5-factor scoring including country preference and dropout resilience.
        </p>
      </div>

      {/* Search panel */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
        {/* Quick search */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Quick:</span>
          {["NSCLC", "Type 2 Diabetes", "Alzheimer's disease", "Breast cancer", "Multiple myeloma", "Rheumatoid Arthritis"].map(ex => (
            <button key={ex} onClick={() => setCondition(ex)}
              style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", cursor: "pointer", fontWeight: 500 }}>
              {ex}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Condition / Indication *</label>
            <Input placeholder="e.g. Non-small cell lung cancer" value={condition} onChange={e => setCondition(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Intervention / Drug</label>
            <Input placeholder="e.g. Pembrolizumab" value={intervention} onChange={e => setIntervention(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Therapeutic Area</label>
            <Input placeholder="e.g. Oncology, Neurology" value={therapeuticArea} onChange={e => setTherapeuticArea(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Phase</label>
            <select style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#fff", color: "#0f172a" }}
              value={phase} onChange={e => setPhase(e.target.value)}>
              <option value="">All Phases</option>
              {["PHASE1", "PHASE2", "PHASE3", "PHASE4"].map(p => <option key={p} value={p}>{p.replace("PHASE", "Phase ")}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              Expected Dropout Rate — <span style={{ color: "#f59e0b", fontWeight: 700 }}>{Math.round(dropoutRate * 100)}%</span>
            </label>
            <input type="range" min={0} max={0.5} step={0.01} value={dropoutRate}
              onChange={e => setDropoutRate(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#f59e0b" } as any} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8", marginTop: 2 }}>
              <span>0% (No dropout)</span><span>50% (High dropout)</span>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Preferred Countries</label>
            <div style={{ display: "flex", gap: 5 }}>
              <Input placeholder="e.g. United States" value={countryInput}
                onChange={e => setCountryInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCountry()} />
              <button onClick={addCountry}
                style={{ padding: "8px 12px", borderRadius: 8, background: "#10b981", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+</button>
            </div>
            {countryList.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {countryList.map(c => (
                  <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 5, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 11 }}>
                    {c}
                    <button onClick={() => removeCountry(c)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 13 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button onClick={load} disabled={loading || !condition.trim()} style={{ width: "100%", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontWeight: 700, fontSize: 13, height: 42 }}>
          {loading ? <Loader2 style={{ width: 15, height: 15, marginRight: 8 }} className="animate-spin" /> : <Search style={{ width: 15, height: 15, marginRight: 8 }} />}
          {loading ? "Searching ClinicalTrials.gov…" : "Find & Rank Top Sites"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13 }}>
          <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Sites Found",    value: String(data.total),                     color: "#10b981", bg: "#f0fdf4" },
              { label: "Countries",      value: String(countrySummary.length),           color: "#3b82f6", bg: "#eff6ff" },
              { label: "Top Site Score", value: String(Math.round(sites[0]?.compositeScore || 0)), color: "#6366f1", bg: "#f5f3ff" },
              { label: "Target Dropout", value: `${Math.round((data.targetDropoutRate || 0) * 100)}%`, color: "#f59e0b", bg: "#fffbeb" },
            ].map(k => (
              <div key={k.label} style={{ background: k.bg, borderRadius: 12, border: `1px solid ${k.color}22`, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Country chart */}
          {countrySummary.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Globe style={{ width: 14, height: 14, color: "#3b82f6" }} /> Sites by Country
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={countrySummary} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any, n: any) => [v, n === "siteCount" ? "Sites" : n]} />
                  <Bar dataKey="siteCount" fill="#10b981" radius={[4, 4, 0, 0]} name="Sites" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Site list */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Top Recommended Sites</h3>
              <div style={{ display: "flex", gap: 8 }}>
                {countryList.length > 0 && (
                  <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 5, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontWeight: 700 }}>
                    Country Boost Active
                  </span>
                )}
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 5, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#3b82f6", fontWeight: 700 }}>
                  Hakase 5-Factor Ranking
                </span>
              </div>
            </div>
            {sites.slice(0, 25).map((site, i) => (
              <SiteCard key={i} site={site} rank={i + 1} />
            ))}
          </div>

          {/* Methodology */}
          {rankingFactors.length > 0 && (
            <div style={{ background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Info style={{ width: 13, height: 13, color: "#6366f1" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Scoring Methodology — Hakase Site Intelligence Engine</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {rankingFactors.map((f: any) => (
                  <div key={f.factor} style={{ padding: "10px 12px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{f.factor}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1" }}>{f.weight}%</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, margin: 0 }}>{f.description}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 10, lineHeight: 1.6 }}>
                All data sourced live from <b>ClinicalTrials.gov API</b>. Sites with no matching condition trials receive partial credit from general trial experience.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
          <MapPin style={{ width: 44, height: 44, margin: "0 auto 12px", opacity: 0.25 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Find the Best Sites for Your Trial</p>
          <p style={{ fontSize: 12, color: "#94a3b8", maxWidth: 380, margin: "0 auto" }}>
            Enter a condition above. We'll query ClinicalTrials.gov, identify experienced sites, and rank them using a 5-factor algorithm including country preference and dropout resilience.
          </p>
        </div>
      )}
    </div>
  );
}
