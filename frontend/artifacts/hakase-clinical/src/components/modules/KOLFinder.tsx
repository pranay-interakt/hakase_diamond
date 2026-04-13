import { useState } from "react";
import { Search, Loader2, AlertCircle, Users, BookOpen, ExternalLink, Award, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { findKOLs } from "@/lib/api";

export default function KOLFinder() {
  const [condition, setCondition] = useState("");
  const [intervention, setIntervention] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const search = async () => {
    if (!condition.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await findKOLs(condition.trim(), intervention.trim(), 20);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">KOL Finder</h2>
        <p className="text-sm text-slate-500">
          Identify Key Opinion Leaders by mining real PubMed publication data — ranked by publication count, first-authorship, and clinical trial involvement.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Disease / Therapeutic Area <span className="text-red-500">*</span></label>
            <Input
              placeholder="e.g. Type 2 Diabetes, Non-small cell lung cancer"
              value={condition}
              onChange={e => setCondition(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Drug / Intervention (optional)</label>
            <Input
              placeholder="e.g. metformin, pembrolizumab, CAR-T"
              value={intervention}
              onChange={e => setIntervention(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
            />
          </div>
        </div>
        <Button onClick={search} disabled={loading || !condition.trim()} className="w-full">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Mining PubMed…</>
          ) : (
            <><Search className="h-4 w-4 mr-2" />Find KOLs</>
          )}
        </Button>
        {loading && (
          <p className="text-center text-xs text-slate-400">Analyzing publication records from PubMed — this takes 10–20 seconds</p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="text-base font-semibold text-slate-900">
                {result.kols.length} KOLs identified
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              From {result.articlesAnalyzed} PubMed articles on <em>{result.condition}</em>
            </span>
          </div>

          {result.kols.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
              <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No KOLs found with 2+ publications. Try a broader condition term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.kols.map((kol: any, idx: number) => (
                <KOLCard key={idx} kol={kol} rank={idx + 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <Award className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500 mb-1">Enter a disease area to find leading investigators</p>
          <p className="text-xs text-slate-400">Rankings based on publication count, first/last authorship in clinical trials, and PubMed relevance scoring</p>
        </div>
      )}
    </div>
  );
}

function KOLCard({ kol, rank }: { kol: any; rank: number }) {
  const primaryAffiliation = kol.affiliations?.[0] || "";
  const institutionName = primaryAffiliation.split(",")[0].trim().slice(0, 60);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          rank <= 3 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
        }`}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{kol.name}</p>
            <a
              href={kol.pubmedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-blue-500 hover:text-blue-700"
              title="View on PubMed"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {institutionName && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-500 truncate" title={primaryAffiliation}>{institutionName}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2.5">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-700 font-medium">{kol.publications}</span>
              <span className="text-xs text-slate-400">publications</span>
            </div>
            {kol.firstAuthor > 0 && (
              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                {kol.firstAuthor}× first author
              </span>
            )}
            {kol.lastAuthor > 0 && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                {kol.lastAuthor}× senior author
              </span>
            )}
          </div>

          {kol.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {kol.keywords.slice(0, 5).map((kw: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs px-1.5 py-0 text-slate-500 border-slate-200">
                  {kw.length > 25 ? kw.slice(0, 25) + "…" : kw}
                </Badge>
              ))}
            </div>
          )}

          {kol.affiliations?.slice(1, 3).length > 0 && (
            <div className="mt-2 space-y-0.5">
              {kol.affiliations.slice(1, 3).map((aff: string, i: number) => (
                <p key={i} className="text-xs text-slate-400 truncate" title={aff}>
                  {aff.split(",")[0].trim().slice(0, 55)}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
