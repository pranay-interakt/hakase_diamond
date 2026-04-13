import { useState } from "react";
import { Search, Loader2, AlertCircle, Shield, AlertTriangle, Activity, TrendingUp, FileWarning } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getFullSafetyProfile } from "@/lib/api";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f43f5e"];

export default function SafetyIntelligence() {
  const [drug, setDrug] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const d = drug.trim();
    if (!d) return;
    setLoading(true);
    setError("");
    try {
      const data = await getFullSafetyProfile(d);
      setProfile(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reactions = profile?.adverseEvents?.reactions || [];
  const serious = profile?.seriousOutcomes || {};
  const label = profile?.label || {};
  const recalls = profile?.recalls || [];
  const timeline = profile?.faersTimeline || [];

  const totalEvents = profile?.adverseEvents?.total || 0;

  const seriousData = [
    { name: "Death", value: serious.death || 0, color: "#ef4444" },
    { name: "Hospitalization", value: serious.hospitalization || 0, color: "#f97316" },
    { name: "Life-Threatening", value: serious.life_threatening || 0, color: "#eab308" },
    { name: "Disability", value: serious.disability || 0, color: "#8b5cf6" },
  ].filter(d => d.value > 0);

  const timelineData = timeline.slice(-24).map((t: any) => ({
    month: t.month.slice(0, 6),
    reports: t.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Safety Intelligence</h2>
        <p className="text-sm text-slate-500">Real adverse event data from FDA FAERS (20M+ reports) + drug labels + recall history</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Drug name (e.g. Metformin, Ibuprofen, Pembrolizumab)"
            value={drug}
            onChange={e => setDrug(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
          />
        </div>
        <Button onClick={load} disabled={loading || !drug.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" />Analyze</>}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {profile && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Activity className="h-5 w-5 text-orange-500" />} label="Total FAERS Reports" value={totalEvents.toLocaleString()} />
            <StatCard icon={<AlertTriangle className="h-5 w-5 text-red-500" />} label="Death Reports" value={(serious.death || 0).toLocaleString()} color="text-red-600" />
            <StatCard icon={<FileWarning className="h-5 w-5 text-amber-500" />} label="Hospitalizations" value={(serious.hospitalization || 0).toLocaleString()} color="text-amber-600" />
            <StatCard icon={<Shield className="h-5 w-5 text-purple-500" />} label="Recall Events" value={recalls.length.toString()} color={recalls.length > 0 ? "text-red-600" : "text-emerald-600"} />
          </div>

          {reactions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" /> Top Adverse Reactions
                <Badge variant="outline" className="ml-auto text-xs">FDA FAERS</Badge>
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reactions.slice(0, 12)} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="term" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: number) => [val.toLocaleString(), "Reports"]} />
                  <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {seriousData.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Serious Outcome Breakdown</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={seriousData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {seriousData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val: number) => val.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {timelineData.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" /> Report Volume Trend
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={timelineData} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(0, 6)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {label.warnings && label.warnings[0] && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> FDA Label Warnings
              </h3>
              <p className="text-xs text-amber-700 line-clamp-5 whitespace-pre-wrap">{label.warnings[0]}</p>
            </div>
          )}

          {recalls.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                <FileWarning className="h-4 w-4" /> FDA Recall History
              </h3>
              <div className="space-y-2">
                {recalls.map((r: any, i: number) => (
                  <div key={i} className="bg-white rounded-lg border border-red-100 p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-red-100 text-red-700">{r.classificationLevel}</Badge>
                      <span className="text-slate-500">{r.date}</span>
                      <Badge variant="outline">{r.status}</Badge>
                    </div>
                    <p className="text-slate-700 line-clamp-2">{r.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {label.contraindications && label.contraindications[0] && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Contraindications</h3>
              <p className="text-xs text-slate-600 line-clamp-5 whitespace-pre-wrap">{label.contraindications[0]}</p>
            </div>
          )}
        </div>
      )}

      {!profile && !loading && (
        <div className="text-center py-16 text-slate-400">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter a drug name to access comprehensive safety data from FDA FAERS</p>
          <p className="text-xs mt-1">Try: Metformin, Adalimumab, Pembrolizumab, Aspirin</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className={`text-2xl font-bold ${color || "text-slate-900"}`}>{value}</p>
    </div>
  );
}
