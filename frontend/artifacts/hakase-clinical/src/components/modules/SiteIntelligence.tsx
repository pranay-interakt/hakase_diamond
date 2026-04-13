import { useState } from "react";
import { Search, MapPin, Loader2, AlertCircle, Star, Clock, TrendingUp, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { recommendSites } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const scoreColor = (s: number) => s >= 75 ? "text-emerald-600 bg-emerald-50" : s >= 55 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

export default function SiteIntelligence() {
  const [condition, setCondition] = useState("");
  const [phase, setPhase] = useState("");
  const [countries, setCountries] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"list" | "map">("list");

  const load = async () => {
    if (!condition.trim()) return;
    setLoading(true); setError("");
    try {
      setData(await recommendSites(condition.trim(), phase || undefined, countries || undefined, 40));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const sites: any[] = data?.sites || [];
  const countrySummary: any[] = (data?.countrySummary || []).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Site Intelligence</h2>
        <p className="text-sm text-slate-500">Site recommendations scored by enrollment capacity, startup time, and experience from real ClinicalTrials.gov data</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Condition *</label>
            <Input placeholder="e.g. Type 2 Diabetes" value={condition} onChange={e => setCondition(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Phase (optional)</label>
            <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={phase} onChange={e => setPhase(e.target.value)}>
              <option value="">All Phases</option>
              {["PHASE1","PHASE2","PHASE3","PHASE4"].map(p => <option key={p} value={p}>{p.replace("_"," ")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Countries (comma-separated)</label>
            <Input placeholder="e.g. United States, Germany" value={countries} onChange={e => setCountries(e.target.value)} />
          </div>
        </div>
        <Button onClick={load} disabled={loading || !condition.trim()} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Find Top Sites
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-2xl font-bold text-slate-900">{data.total}</p>
              <p className="text-xs text-slate-500">Sites Found</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-2xl font-bold text-slate-900">{countrySummary.length}</p>
              <p className="text-xs text-slate-500">Countries</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-2xl font-bold text-emerald-600">{sites[0]?.score || 0}</p>
              <p className="text-xs text-slate-500">Top Site Score</p>
            </div>
          </div>

          {countrySummary.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" /> Sites by Country
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={countrySummary} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="siteCount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sites" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Top Recommended Sites</h3>
              <Badge variant="outline" className="text-xs">Ranked by Hakase Score</Badge>
            </div>
            {sites.slice(0, 20).map((site: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-center min-w-12 ${scoreColor(site.score)}`}>
                    <p className="text-lg font-bold">{site.score}</p>
                    <p className="text-xs">score</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium text-slate-900 truncate">{site.facility}</p>
                      {site.status && (
                        <Badge className={site.status === "RECRUITING" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                          {site.status.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[site.city, site.state, site.country].filter(Boolean).join(", ")}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{site.enrollmentRate} pts/mo</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{site.startupWeeks}w startup</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" />{site.trialCount} trials</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right text-xs text-slate-400">
                    <p>{site.activeTrials} active</p>
                    <p>{site.completedTrials} completed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
            <p className="font-medium text-slate-700 mb-1">Scoring Methodology</p>
            <p>Sites scored on enrollment rate capacity (regional averages), regulatory startup timeline, trial experience (prior study count), and current activity status — all derived from historical ClinicalTrials.gov data.</p>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-slate-400">
          <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter a condition to find and rank potential trial sites worldwide</p>
        </div>
      )}
    </div>
  );
}
