import { useState } from "react";
import { Play, Loader2, AlertCircle, TrendingUp, Users, Clock, BarChart2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { simulateEnrollment } from "@/lib/api";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, Legend, AreaChart, Area,
} from "recharts";

export default function EnrollmentSimulation() {
  const [target, setTarget] = useState("200");
  const [sites, setSites] = useState("10");
  const [rate, setRate] = useState("");
  const [dropout, setDropout] = useState("0.05");
  const [nctRef, setNctRef] = useState("");
  const [condition, setCondition] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true); setError("");
    try {
      const body: Record<string, any> = {
        targetEnrollment: Number(target),
        nSites: Number(sites),
        dropoutRate: Number(dropout),
        nSimulations: 1000,
      };
      if (rate) body.monthlyRatePerSite = Number(rate);
      if (nctRef.trim()) body.referenceNctId = nctRef.trim().toUpperCase();
      else if (condition.trim()) body.condition = condition.trim();
      setResult(await simulateEnrollment(body));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const hist = result?.histogram || [];
  const scenarios = result?.scenarios || {};

  const percentileData = result ? [
    { name: "Optimistic (P10)", months: result.p10, color: "#10b981" },
    { name: "Likely (P50)", months: result.p50, color: "#3b82f6" },
    { name: "Conservative (P90)", months: result.p90, color: "#f97316" },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Enrollment Simulation</h2>
        <p className="text-sm text-slate-500">Monte Carlo simulation (1,000 runs) using real historical enrollment rates from ClinicalTrials.gov</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Simulation Parameters</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Target Enrollment *</label>
            <Input type="number" value={target} onChange={e => setTarget(e.target.value)} min={10} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Number of Sites *</label>
            <Input type="number" value={sites} onChange={e => setSites(e.target.value)} min={1} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Dropout Rate</label>
            <Input type="number" step="0.01" value={dropout} onChange={e => setDropout(e.target.value)} min={0} max={1} placeholder="0.05" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Monthly Rate/Site <span className="text-slate-400">(auto from data if blank)</span>
            </label>
            <Input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} placeholder="auto-derived" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Reference NCT ID <span className="text-slate-400">(for rate derivation)</span>
            </label>
            <Input className="font-mono" value={nctRef} onChange={e => setNctRef(e.target.value)} placeholder="NCT04..." />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Condition <span className="text-slate-400">(fallback)</span>
            </label>
            <Input value={condition} onChange={e => setCondition(e.target.value)} placeholder="e.g. Type 2 Diabetes" />
          </div>
        </div>
        <Button onClick={run} disabled={loading || !target || !sites} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {loading ? "Running 1,000 Simulations..." : "Run Simulation"}
        </Button>
        {result && (
          <p className="text-xs text-slate-400 text-center">
            Rate used: <strong>{result.monthlyRateUsed} pts/site/month</strong>
            {!rate && " (derived from real similar trials)"}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-xs text-emerald-600 mb-1">Optimistic (10th %ile)</p>
              <p className="text-3xl font-bold text-emerald-700">{result.p10}</p>
              <p className="text-xs text-emerald-500">months</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 mb-1">Median (50th %ile)</p>
              <p className="text-3xl font-bold text-blue-700">{result.p50}</p>
              <p className="text-xs text-blue-500">months</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <p className="text-xs text-orange-600 mb-1">Conservative (90th %ile)</p>
              <p className="text-3xl font-bold text-orange-700">{result.p90}</p>
              <p className="text-xs text-orange-500">months</p>
            </div>
          </div>

          {hist.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-blue-500" />
                Enrollment Duration Distribution (1,000 simulations)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hist} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="bin" tick={{ fontSize: 11 }} tickFormatter={v => `${v}m`} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v, "Simulations"]} labelFormatter={l => `~${l} months`} />
                  <ReferenceLine x={result.p50} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: "Median", position: "top", fontSize: 10, fill: "#3b82f6" }} />
                  <Bar dataKey="count" fill="#3b82f6" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {Object.keys(scenarios).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Scenario Comparison</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(scenarios).map(([key, val]: [string, any]) => (
                  <div key={key} className="border border-slate-100 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-slate-500 capitalize mb-2">{key}</p>
                    <p className="text-xl font-bold text-slate-900">{val.months}<span className="text-sm font-normal text-slate-400"> mo</span></p>
                    <p className="text-xs text-slate-400">{val.rate} pts/site/mo</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">Simulation Methodology</p>
            <p>Monte Carlo simulation with {result.nSimulations.toLocaleString()} independent runs. Each run models per-site enrollment as a Poisson process with site-level rate variation (±30% coefficient of variation). Dropout modeled as monthly attrition rate applied to enrolled pool.</p>
            {!rate && <p>Enrollment rate derived from median rate across similar completed ClinicalTrials.gov studies for the specified condition/phase.</p>}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-12 text-slate-400">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Configure parameters above to run enrollment Monte Carlo simulation</p>
          <p className="text-xs mt-1">Rates are auto-derived from real ClinicalTrials.gov data when a condition or NCT ID is provided</p>
        </div>
      )}
    </div>
  );
}
