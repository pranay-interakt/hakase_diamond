import { useState } from "react";
import { Search, Loader2, ExternalLink, BookOpen, BarChart2, AlertCircle, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEvidenceMap, getAbstract } from "@/lib/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const evidenceLevelConfig: Record<string, { label: string; color: string; bg: string; order: number }> = {
  "meta-analysis": { label: "Meta-Analysis / Systematic Review", color: "text-purple-700", bg: "bg-purple-100", order: 1 },
  "phase3-rct": { label: "Phase 3 RCT", color: "text-blue-700", bg: "bg-blue-100", order: 2 },
  "rct": { label: "Randomized Trial", color: "text-emerald-700", bg: "bg-emerald-100", order: 3 },
  "other": { label: "Other Clinical Study", color: "text-slate-600", bg: "bg-slate-100", order: 4 },
};

export default function EvidenceLibrary() {
  const [condition, setCondition] = useState("");
  const [intervention, setIntervention] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [abstractPmid, setAbstractPmid] = useState<string | null>(null);
  const [abstract, setAbstract] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");

  const search = async () => {
    if (!condition.trim()) return;
    setLoading(true); setError("");
    try {
      const d = await getEvidenceMap(condition.trim(), intervention.trim());
      setData(d);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadAbstract = async (pmid: string) => {
    if (abstract[pmid]) { setAbstractPmid(abstractPmid === pmid ? null : pmid); return; }
    try {
      const res = await getAbstract(pmid);
      setAbstract(a => ({ ...a, [pmid]: res.abstract || "No abstract available." }));
      setAbstractPmid(pmid);
    } catch {
      setAbstract(a => ({ ...a, [pmid]: "Could not load abstract." }));
      setAbstractPmid(pmid);
    }
  };

  const breakdown = data?.breakdown || {};
  const allArticles: any[] = data?.articles || [];
  const filtered = filter === "all" ? allArticles : allArticles.filter((a: any) => a.evidenceLevel === filter);

  const pieData = [
    { name: "Meta-Analysis", value: breakdown.metaAnalysis || 0, color: "#8b5cf6" },
    { name: "Phase 3 RCT", value: breakdown.phase3Rct || 0, color: "#3b82f6" },
    { name: "RCT", value: breakdown.rct || 0, color: "#10b981" },
    { name: "Other", value: breakdown.other || 0, color: "#94a3b8" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Evidence Library</h2>
        <p className="text-sm text-slate-500">Search 36M+ articles in PubMed — automatically classified by evidence level</p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-1">
        <span className="text-xs text-slate-400 self-center mr-1">Quick search:</span>
        {["Non-small cell lung cancer", "Type 2 Diabetes", "Alzheimer's disease", "Colorectal cancer", "Psoriasis"].map(ex => (
          <button
            key={ex}
            onClick={() => setCondition(ex)}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition-colors"
          >{ex}</button>
        ))}
      </div>

      <div className="flex gap-2 flex-col sm:flex-row">
        <Input
          placeholder="Condition / Indication (required)"
          value={condition}
          onChange={e => setCondition(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          className="flex-1"
        />
        <Input
          placeholder="Intervention / Drug (optional)"
          value={intervention}
          onChange={e => setIntervention(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          className="flex-1"
        />
        <Button onClick={search} disabled={loading || !condition.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" />Search</>}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {data && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-purple-500" /> Evidence Pyramid
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 content-start">
              {[
                { key: "meta-analysis", count: breakdown.metaAnalysis, label: "Meta-Analyses", color: "bg-purple-50 border-purple-200 text-purple-700" },
                { key: "phase3-rct", count: breakdown.phase3Rct, label: "Phase 3 RCTs", color: "bg-blue-50 border-blue-200 text-blue-700" },
                { key: "rct", count: breakdown.rct, label: "Other RCTs", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                { key: "other", count: breakdown.other, label: "Other Studies", color: "bg-slate-50 border-slate-200 text-slate-700" },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setFilter(filter === item.key ? "all" : item.key)}
                  className={`rounded-xl border p-3 text-center transition-all ${item.color} ${filter === item.key ? "ring-2 ring-blue-500" : ""}`}
                >
                  <p className="text-2xl font-bold">{item.count || 0}</p>
                  <p className="text-xs">{item.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <strong>{filtered.length}</strong> of <strong>{data.total?.toLocaleString()}</strong> results
              {filter !== "all" && <span> · Filtered: {evidenceLevelConfig[filter]?.label}</span>}
            </p>
            {filter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>Clear filter</Button>
            )}
          </div>

          <div className="space-y-2">
            {filtered.map((art: any) => {
              const cfg = evidenceLevelConfig[art.evidenceLevel] || evidenceLevelConfig.other;
              return (
                <div key={art.pmid} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
                        <span className="text-xs text-slate-400">{art.pubDate}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-1 line-clamp-2">{art.title}</p>
                      <p className="text-xs text-slate-500 mb-2">
                        {art.journal} · {art.authors.slice(0, 3).join(", ")}{art.authors.length > 3 ? " et al." : ""}
                      </p>
                      {abstractPmid === art.pmid && abstract[art.pmid] && (
                        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 mb-2 leading-relaxed">
                          {abstract[art.pmid]}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => loadAbstract(art.pmid)}
                        className="text-xs text-blue-500 hover:text-blue-700 underline"
                      >
                        {abstractPmid === art.pmid ? "Hide" : "Abstract"}
                      </button>
                      <a href={art.url} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Search PubMed for clinical evidence on your condition or intervention</p>
          <p className="text-xs mt-1">Try: Type 2 Diabetes + Metformin, Non-small cell lung cancer + Pembrolizumab</p>
        </div>
      )}
    </div>
  );
}
