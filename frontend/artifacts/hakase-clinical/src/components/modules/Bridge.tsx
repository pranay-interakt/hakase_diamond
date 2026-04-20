import { useState } from "react";
import { Search, Globe, Zap, ArrowRight, Loader2, Database, Shield, Activity, BarChart3, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Bridge() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [trialData, setTrialData] = useState<any>(null);
  const [error, setError] = useState("");

  const pullData = async () => {
    if (!url.includes("hakase.bio")) {
      setError("Please provide a valid hakase.bio URL or Layer 4 Trial ID");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`http://localhost:8000/api/bridge/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (!resp.ok) throw new Error("API sync failed");
      const data = await resp.json();
      data.lastSync = new Date().toISOString();
      setTrialData(data);
    } catch (e: any) {
      setError("Failed to fetch trial data from Layer 4 ecosystem (Make sure backend is running).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Globe className="h-32 w-32" />
        </div>
        <div className="relative">
          <Badge className="bg-white/20 text-white border-white/20 mb-4 px-3 py-1 text-[10px] font-bold tracking-widest uppercase">Ecosystem Integration</Badge>
          <h2 className="text-3xl font-bold mb-2">Hakase Bridge</h2>
          <p className="max-w-xl text-sky-100 text-sm leading-relaxed">
            Directly pull trial configurations, patient cohorts, and stratification data from 
            <strong> Hakase.bio Layer 4</strong>. Seamlessly continue your clinical analysis 
            with Hakase AI's operational intelligence.
          </p>
          <div className="flex gap-2 mt-6 max-w-lg">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-2.5 h-4 w-4 text-sky-300" />
              <Input 
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-sky-200 focus:bg-white/20 focus:ring-0" 
                placeholder="hakase.bio/trial/L4-..."
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
            <Button onClick={pullData} disabled={loading || !url} className="bg-white text-sky-800 hover:bg-sky-50 font-bold px-6">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync Trial"}
            </Button>
          </div>
          {error && <p className="text-red-200 text-xs mt-2 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</p>}
        </div>
      </div>

      {!trialData && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
           {[
             { title: "L4 Data Pull", desc: "Access the entire trial ontology including molecular markers and cohort filters." },
             { title: "Continuous Flow", desc: "Move from drug discovery (L1-L3) into clinical operations (L4) instantly." },
             { title: "Unified Profile", desc: "Maintain a single source of truth across biological and operational planes." }
           ].map(f => (
             <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-5">
               <Zap className="h-5 w-5 text-sky-500 mb-3" />
               <h3 className="text-sm font-bold text-slate-800 mb-1">{f.title}</h3>
               <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
             </div>
           ))}
        </div>
      )}

      {trialData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                   <Database className="h-5 w-5" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-900">{trialData.name}</h3>
                   <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-xs text-slate-400 font-mono tracking-tighter uppercase">{trialData.id}</span>
                     <Badge variant="outline" className="text-[10px] uppercase font-bold text-sky-600 bg-sky-50 border-sky-100 px-1.5">{trialData.phase}</Badge>
                   </div>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Last Synced</p>
                 <p className="text-xs font-medium text-slate-600">Just now</p>
               </div>
             </div>
             
             <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-1 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ecosystem Path</p>
                    <div className="space-y-1.5 relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                      {Object.entries(trialData.layers).map(([key, label]: [any, any]) => (
                        <div key={key} className={`text-xs flex items-center gap-2 ${key === "L4" ? "text-sky-600 font-bold" : "text-slate-400 font-medium"}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${key === "L4" ? "bg-sky-500 shadow-sm" : "bg-slate-200"}`} />
                          {key}: {label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <Activity className="h-4 w-4 text-emerald-500 mb-2" />
                      <p className="text-xs text-slate-500">Stratification Score</p>
                      <p className="text-2xl font-bold text-slate-900">{trialData.score}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <Users className="h-4 w-4 text-orange-500 mb-2" />
                      <p className="text-xs text-slate-500">Target Cohort</p>
                      <p className="text-2xl font-bold text-slate-900">{trialData.enrollment}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <Shield className="h-4 w-4 text-blue-500 mb-2" />
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="text-sm font-bold text-slate-900 mt-2">{trialData.status}</p>
                    </div>
                  </div>

                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <BarChart3 className="h-5 w-5 text-sky-600 mt-1" />
                      <div>
                        <h4 className="text-sm font-bold text-sky-900">Advanced Analysis Ready</h4>
                        <p className="text-xs text-sky-700 mt-1 leading-relaxed">
                          Your trial configuration has been mapped to the Clinical Hub. You can now run recruitment 
                          simulations, site intelligence, and protocol verification based on this biological data.
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="bg-sky-600 hover:bg-sky-700">Go to Protocol Studio <ArrowRight className="h-3 w-3 ml-2" /></Button>
                          <Button size="sm" variant="outline" className="border-sky-200 text-sky-700 bg-white">View L4 Raw Data</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
