import { useState } from "react";
import { Search, Loader2, AlertCircle, TrendingUp, Target, BarChart2, Users, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSimilarTrials } from "@/lib/api";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const statusBadge: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  TERMINATED: "bg-red-100 text-red-700",
  RECRUITING: "bg-blue-100 text-blue-700",
  ACTIVE_NOT_RECRUITING: "bg-amber-100 text-amber-700",
};

export default function SimilarTrials() {
  const [nctId, setNctId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const id = nctId.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const result = await getSimilarTrials(id, 15);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const ref = data?.reference;
  const similar = data?.similar || [];
  const stats = data?.enrollmentStats || {};
  const prob = data?.successProbability || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Similar Trial Intelligence</h2>
        <p className="text-sm text-slate-500">Compare your trial against real similar trials from ClinicalTrials.gov to benchmark and predict outcomes</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Enter NCT ID (e.g. NCT04000001)"
          value={nctId}
          onChange={e => setNctId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load()}
          className="font-mono"
        />
        <Button onClick={load} disabled={loading || !nctId.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" /> Analyze</>}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {ref && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">REFERENCE TRIAL — {ref.nctId}</p>
              <p className="text-sm font-semibold text-slate-900 line-clamp-2">{ref.title}</p>
              <div className="flex gap-3 mt-2 text-xs text-slate-600 flex-wrap">
                {ref.phase?.map((p: string) => <Badge key={p} variant="outline" className="text-xs">{p.replace("_"," ")}</Badge>)}
                {ref.conditions?.[0] && <span>{ref.conditions[0]}</span>}
                {ref.enrollmentCount && <span className="flex items-center gap-1"><Users className="h-3 w-3"/>{ref.enrollmentCount.toLocaleString()} pts</span>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
              label="Success Probability"
              value={`${prob.probability}%`}
              sub={prob.rating}
              color={prob.rating === "High" ? "text-emerald-600" : prob.rating === "Moderate" ? "text-amber-600" : "text-red-600"}
            />
            <MetricCard
              icon={<Users className="h-5 w-5 text-purple-500" />}
              label="Median Enrollment"
              value={stats.median ? `${Math.round(stats.median).toLocaleString()}` : "—"}
              sub={`Range: ${stats.min || "—"}–${stats.max || "—"}`}
            />
            <MetricCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              label="Completed"
              value={`${similar.filter((s: any) => s.status === "COMPLETED").length}`}
              sub={`of ${similar.length} similar`}
            />
            <MetricCard
              icon={<XCircle className="h-5 w-5 text-red-400" />}
              label="Terminated"
              value={`${similar.filter((s: any) => s.status === "TERMINATED" || s.status === "WITHDRAWN").length}`}
              sub={`of ${similar.length} similar`}
            />
          </div>

          {prob.factors && prob.factors.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" /> Success Probability Breakdown
              </h3>
              <div className="space-y-2">
                {prob.factors.map((f: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-40 text-xs text-slate-600 flex-shrink-0 truncate" title={f.factor}>{f.factor}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (f.score / f.weight) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 w-20 text-right flex-shrink-0">{f.description.slice(0, 25)}…</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {similar.length > 0 && stats.median && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-blue-500" /> Enrollment Distribution — Similar Trials
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="similarityScore" name="Similarity %" unit="%" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="enrollmentCount" name="Enrollment" tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg p-2 text-xs shadow-lg max-w-48">
                          <p className="font-medium text-slate-900 line-clamp-2 mb-1">{d?.title}</p>
                          <p className="text-slate-600">{d?.nctId} · {(d?.status || "").replace(/_/g," ")}</p>
                          <p className="text-blue-600">{d?.enrollmentCount?.toLocaleString()} pts · {d?.similarityScore}% similar</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    data={similar.filter((s: any) => s.enrollmentCount)}
                    fill="#3b82f6"
                    fillOpacity={0.7}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Top Similar Trials</h3>
            {similar.slice(0, 10).map((s: any) => (
              <div key={s.nctId} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <a
                        href={`https://clinicaltrials.gov/study/${s.nctId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-blue-600 hover:underline"
                      >
                        {s.nctId}
                      </a>
                      <Badge className={statusBadge[s.status] || "bg-slate-100 text-slate-600"}>
                        {(s.status || "").replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-800 line-clamp-2 mb-1">{s.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      {s.enrollmentCount && <span>{s.enrollmentCount.toLocaleString()} pts</span>}
                      {s.locationCount && <span>{s.locationCount} sites</span>}
                      {s.sponsorName && <span>{s.sponsorName}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-bold text-blue-600">{s.similarityScore}%</div>
                    <div className="text-xs text-slate-400">similar</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-slate-400">
          <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter an NCT ID to find similar trials and benchmark metrics</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className={`text-2xl font-bold ${color || "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
