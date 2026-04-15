import { useState } from "react";
import { Search, FlaskConical, Gavel, FileCheck, Map, ArrowRight, BookOpen, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RegulatoryAI() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [condition, setCondition] = useState("");

  const generateRoadmap = async () => {
    if (!condition) return;
    setLoading(true);
    // Mocking roadmap generation
    await new Promise(r => setTimeout(r, 2000));
    setData({
      milestones: [
        { id: 1, title: "Pre-IND Meeting", status: "Required", description: "Request meeting with FDA to discuss clinical development plan and nonclinical data.", docs: ["IND Request", "Meeting Package"] },
        { id: 2, title: "IND Submission", status: "Critical", description: "Submit Investigational New Drug application including CMC, Pharmacology, and Protocol.", docs: ["FDA Form 1571", "Dossier"] },
        { id: 3, title: "Ethics Committee Approval", status: "Ongoing", description: "IRB/EC review of protocol and informed consent forms.", docs: ["ICF", "Investigator Brochure"] },
        { id: 4, title: "Phase 3 BLA/NDA", status: "Future", description: "Marketing application once primary endpoints are confirmed.", docs: ["Clinical Study Report", "Summary of Safety"] },
      ],
      checklists: [
        { label: "Stability Data (12m)", checked: true },
        { label: "GLP Toxicology", checked: true },
        { label: "GMP Batch Validation", checked: false }
      ]
    });
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Gavel className="h-32 w-32" />
        </div>
        <div className="relative">
          <Badge className="bg-white/20 text-white border-white/20 mb-4 px-3 py-1 text-[10px] font-bold tracking-widest uppercase">Regulatory Intelligence</Badge>
          <h2 className="text-3xl font-bold mb-2">Regulatory AI</h2>
          <p className="max-w-xl text-orange-100 text-sm leading-relaxed">
            Generate customized regulatory roadmaps, pre-IND checklists, and compliance dossiers 
            mapped to FDA, EMA, and PMDA requirements based on your trial indication.
          </p>
          <div className="flex gap-2 mt-6 max-w-lg">
            <div className="relative flex-1">
              <FlaskConical className="absolute left-3 top-2.5 h-4 w-4 text-orange-300" />
              <Input 
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-orange-200 focus:bg-white/20 focus:ring-0" 
                placeholder="Indication (e.g. Non-Small Cell Lung Cancer)"
                value={condition}
                onChange={e => setCondition(e.target.value)}
              />
            </div>
            <Button onClick={generateRoadmap} disabled={loading || !condition} className="bg-white text-orange-800 hover:bg-orange-50 font-bold px-6">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Build Roadmap"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
               <Map className="h-5 w-5 text-orange-500" />
               Clinical Development Roadmap
            </h3>
            
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center space-y-4">
                 <Loader2 className="h-10 w-10 mx-auto text-orange-500 animate-spin" />
                 <p className="text-sm text-slate-500 animate-pulse">Consulting FDA Guidance Documents and 21 CFR Part 312...</p>
              </div>
            ) : data ? (
              <div className="space-y-4">
                 {data.milestones.map((m: any, i: number) => (
                    <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden group">
                       <div className={`absolute top-0 left-0 bottom-0 w-1 ${i === 0 ? "bg-emerald-400" : i === 1 ? "bg-orange-400" : i === 2 ? "bg-blue-400" : "bg-slate-200"}`} />
                       <div className="flex items-start justify-between">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Milestone {i+1}</span>
                                <Badge variant="outline" className={`text-[9px] uppercase font-bold px-1.5 ${m.status === 'Critical' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                   {m.status}
                                </Badge>
                             </div>
                             <h4 className="font-bold text-slate-900">{m.title}</h4>
                             <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.description}</p>
                             <div className="flex gap-2 mt-4">
                                {m.docs.map((d: string) => (
                                   <div key={d} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 rounded px-2 py-1">
                                      <FileCheck className="h-3 w-3" /> {d}
                                   </div>
                                ))}
                             </div>
                          </div>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                             View Templates <ArrowRight className="h-3 w-3 ml-2" />
                          </Button>
                       </div>
                    </div>
                 ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-20 text-center">
                 <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                 <p className="text-sm font-medium text-slate-500">Enter an indication to generate a regulatory pathway</p>
                 <p className="text-xs text-slate-400 mt-1">AI-assisted roadmap generation for Global Clinical Trials</p>
              </div>
            )}
         </div>

         <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
               <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Pre-IND Readiness
               </h3>
               <div className="space-y-4">
                  {(data?.checklists || [
                    { label: "Stability Data (12m)", checked: false },
                    { label: "GLP Toxicology", checked: false },
                    { label: "GMP Batch Validation", checked: false },
                    { label: "Investigator CVs", checked: false }
                  ]).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                       <span className="text-xs text-slate-600 font-medium">{item.label}</span>
                       <div className={`h-4 w-4 rounded-md border flex items-center justify-center ${item.checked ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                          {item.checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                       </div>
                    </div>
                  ))}
               </div>
               <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-xs font-bold gap-2">
                  <Sparkles className="h-3 w-3" />
                  Self-Audit IND File
               </Button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
               <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Regulatory Alert
               </h3>
               <p className="text-xs text-amber-700 leading-relaxed">
                  The FDA has recently updated guidance for <strong>{condition || "Oncology"}</strong> trials 
                  regarding Decentralized Clinical Trial (DCT) elements. Ensure protocol inclusion.
               </p>
               <Button variant="link" className="text-amber-700 p-0 h-auto text-[11px] font-bold mt-2">
                  Read Guidance CDRH-2024-X11
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}
