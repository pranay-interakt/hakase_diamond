import { useState } from "react";
import { Search, ExternalLink, ChevronRight, Filter, Loader2, AlertCircle, FlaskConical, Calendar, MapPin, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchTrials } from "@/lib/api";

const PHASE_OPTIONS = ["PHASE1", "PHASE2", "PHASE3", "PHASE4", "EARLY_PHASE1"];
const STATUS_OPTIONS = ["RECRUITING", "ACTIVE_NOT_RECRUITING", "COMPLETED", "TERMINATED", "NOT_YET_RECRUITING"];

const statusColor: Record<string, string> = {
  RECRUITING: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  TERMINATED: "bg-red-100 text-red-700",
  ACTIVE_NOT_RECRUITING: "bg-blue-100 text-blue-700",
  NOT_YET_RECRUITING: "bg-amber-100 text-amber-700",
};

export default function TrialExplorer({ onSelectTrial }: { onSelectTrial?: (nctId: string) => void }) {
  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState("");
  const [intervention, setIntervention] = useState("");
  const [phase, setPhase] = useState("");
  const [status, setStatus] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const search = async () => {
    if (!query && !condition && !intervention) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page_size: "20" };
      if (query) params.q = query;
      if (condition) params.condition = condition;
      if (intervention) params.intervention = intervention;
      if (phase) params.phase = phase;
      if (status) params.status = status;
      const data = await searchTrials(params);
      setResults(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => e.key === "Enter" && search();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trial Explorer</h2>
        <p className="text-sm text-slate-500">Search 500,000+ trials from ClinicalTrials.gov in real time</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search by keyword, NCT ID, sponsor, drug name..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(v => !v)}>
            <Filter className="h-4 w-4" />
          </Button>
          <Button onClick={search} disabled={loading || (!query && !condition && !intervention)}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <Input placeholder="Condition (e.g. Diabetes)" value={condition} onChange={e => setCondition(e.target.value)} />
            <Input placeholder="Intervention / Drug" value={intervention} onChange={e => setIntervention(e.target.value)} />
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger><SelectValue placeholder="Phase" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Phases</SelectItem>
                {PHASE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{results.total?.toLocaleString()}</span> trials found
            </p>
          </div>
          <div className="space-y-2">
            {(results.studies || []).map((study: any) => (
              <div
                key={study.nctId}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => onSelectTrial?.(study.nctId)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-blue-600 font-medium">{study.nctId}</span>
                      <Badge className={statusColor[study.status] || "bg-slate-100 text-slate-600"}>
                        {(study.status || "").replace(/_/g, " ")}
                      </Badge>
                      {(study.phase || []).map((p: string) => (
                        <Badge key={p} variant="outline" className="text-xs">{p.replace("_", " ")}</Badge>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">{study.title}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      {study.conditions?.[0] && (
                        <span className="flex items-center gap-1">
                          <FlaskConical className="h-3 w-3" /> {study.conditions[0]}
                        </span>
                      )}
                      {study.enrollmentCount && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {study.enrollmentCount.toLocaleString()} participants
                        </span>
                      )}
                      {study.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {study.startDate}
                        </span>
                      )}
                      {study.locationCount > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {study.locationCount} sites
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`https://clinicaltrials.gov/study/${study.nctId}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!results && !loading && (
        <div className="text-center py-16 text-slate-400">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Search ClinicalTrials.gov for trials by condition, drug, sponsor, or keyword</p>
        </div>
      )}
    </div>
  );
}
