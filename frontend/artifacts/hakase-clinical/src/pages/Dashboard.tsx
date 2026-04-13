import { useState, useRef, useEffect, Fragment } from "react";
import {
  LayoutDashboard, FolderOpen, Activity, Search, FileText, Users,
  BarChart2, UsersRound, Settings, Bell, HelpCircle, ChevronDown,
  Plus, ArrowRight, AlertTriangle, CheckCircle2, Clock, Globe,
  FlaskConical, ChevronRight, X, Download, Share2,
  Upload, Star, BookOpen, MapPin, ExternalLink, Filter,
  Calendar, MoreHorizontal, Building2, Shield, Zap,
  Brain, Sparkles, Database, Stethoscope, Send, UserSearch, TrendingUp, TrendingDown, Minus, Loader2, DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Screen = "overview" | "studies" | "analytics" | "recruitment" | "explorer" | "drafter" | "kol" | "team";

interface Study {
  id: string;
  title: string;
  phase: string;
  indication: string;
  sites: number;
  enrolled: number;
  target: number;
  status: string;
  months: number;
  countries: number;
  team: string[];
  analysisResults?: any;
}



const statusColor: Record<string, string> = {
  "On Track": "bg-emerald-100 text-emerald-700",
  "At Risk": "bg-amber-100 text-amber-700",
  "Critical": "bg-red-100 text-red-700",
  "Recruiting": "bg-blue-100 text-blue-700",
  "Completed": "bg-slate-100 text-slate-600",
};

const statusDot: Record<string, string> = {
  "On Track": "bg-emerald-500",
  "At Risk": "bg-amber-500",
  "Critical": "bg-red-500",
  "Recruiting": "bg-blue-500",
  "Completed": "bg-slate-400",
};

function Sidebar({ active, onNav }: { active: Screen; onNav: (s: Screen, id?: string) => void }) {
  const navItem = (id: Screen, Icon: React.ElementType, label: string) => (
    <button
      onClick={() => onNav(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        active === id
          ? "bg-[#0EA5E9]/15 text-[#0EA5E9] border-l-2 border-[#0EA5E9]"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="w-56 flex-shrink-0 bg-[#0D1B2A] flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <div className="flex justify-center mb-1">
          <img src="/hakase-logo.png" alt="Hakase AI" className="h-9 w-auto object-contain" />
        </div>
        <button className="mt-3 w-full flex items-center justify-between px-2 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-violet-500 flex items-center justify-center text-white text-xs font-bold">M</div>
            <span className="text-white/80 text-xs font-medium">Meridian Therapeutics</span>
          </div>
          <ChevronDown className="w-3 h-3 text-white/40" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItem("overview", LayoutDashboard, "Overview")}
        {navItem("studies", FolderOpen, "Studies")}

        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-semibold text-white/25 uppercase tracking-widest">Intelligence</p>
        </div>
        {navItem("analytics", Activity, "Clinical Trial Interface")}
        {navItem("explorer", Search, "Trial Explorer")}
        {navItem("drafter", FileText, "Protocol Drafter")}
        {navItem("recruitment", UserSearch, "Patient Recruitment")}
        {navItem("kol", Users, "KOL Identification")}
        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-semibold text-white/25 uppercase tracking-widest">Workspace</p>
        </div>
        {navItem("team", UsersRound, "Team")}
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <BarChart2 className="w-4 h-4 flex-shrink-0" />
          <span>Reports</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span>Settings</span>
        </button>
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="rounded-lg bg-gradient-to-br from-[#0EA5E9]/20 to-violet-500/20 border border-white/10 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span className="text-xs font-semibold text-white">Professional Plan</span>
          </div>
          <p className="text-xs text-white/50 mb-2">7 of 10 studies used</p>
          <button className="text-xs text-[#0EA5E9] font-medium hover:underline">Upgrade to Enterprise →</button>
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 z-10">
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 rounded-lg border border-transparent focus:border-[#0EA5E9] focus:bg-white focus:outline-none transition-all text-slate-600 placeholder:text-slate-400"
            placeholder="Search studies, sites, KOLs, trials..."
            readOnly
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 text-slate-400 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
          <HelpCircle className="w-4 h-4 text-slate-500" />
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1"></div>
        <button className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1 transition-colors">
          <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">SS</div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-700 leading-none">Dr. S. Sato</div>
            <div className="text-xs text-slate-400 leading-none mt-0.5">VP Clinical</div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    </div>
  );
}

function OverviewScreen({ onNav, studies }: { onNav: (s: Screen, id?: string) => void, studies: Study[] }) {
  const milestones = [
    { study: "MERI-2024-089", event: "DMC Safety Review", days: 20, urgent: true },
    { study: "MERI-2024-001", event: "DSMB Meeting", days: 26, urgent: false },
    { study: "MERI-2024-001", event: "Interim Analysis Due", days: 33, urgent: false },
    { study: "MERI-2025-002", event: "Site 4 Activation", days: 38, urgent: false },
    { study: "MERI-2023-047", event: "CSR Submission", days: 49, urgent: false },
  ];
  const activity = [
    { text: "Protocol amendment submitted", study: "MERI-2024-089", time: "2 hours ago", Icon: FileText, color: "text-amber-500" },
    { text: "New site activated: Johns Hopkins", study: "MERI-2023-047", time: "Yesterday", Icon: Building2, color: "text-emerald-500" },
    { text: "KOL identified: Dr. James Liu (Score 87)", study: "MERI-2024-001", time: "2 days ago", Icon: Star, color: "text-blue-500" },
    { text: "Protocol draft v1.2 completed", study: "MERI-2025-011", time: "3 days ago", Icon: CheckCircle2, color: "text-emerald-500" },
    { text: "Enrollment alert: Site 12 below target", study: "MERI-2023-047", time: "4 days ago", Icon: AlertTriangle, color: "text-red-500" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Good morning, Dr. Sato</h1>
        <p className="text-sm text-slate-500 mt-0.5">Thursday, March 12, 2026 · Meridian Therapeutics workspace</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Studies", value: "7", delta: "+2 this quarter", Icon: FlaskConical, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Sites Enrolled", value: "43", delta: "across 8 countries", Icon: Globe, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Patients Recruited", value: "1,847", delta: "/ 2,400 target (77%)", Icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Amendments This Year", value: "2", delta: "↓60% vs industry avg", Icon: Shield, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.label}</p>
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-1">{kpi.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Active Studies</h2>
            <button onClick={() => onNav("studies")} className="text-xs text-[#0EA5E9] font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {studies.filter(s => s.status !== "Completed").map((s) => (
              <div key={s.id} onClick={() => onNav("analytics", s.id)} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 cursor-pointer group transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-slate-400">{s.id}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${statusColor[s.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[s.status]}`}></span>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-[#0EA5E9] transition-colors">{s.title}</p>
                </div>
                <div className="flex items-center gap-5 text-xs text-slate-500 flex-shrink-0">
                  <div className="font-semibold text-slate-700 w-16">{s.phase}</div>
                  <div className="w-28">
                    <div className="flex justify-between mb-1">
                      <span>{s.enrolled}/{s.target}</span>
                      <span className="font-medium text-slate-600">{Math.round(s.enrolled/s.target*100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0EA5E9] rounded-full" style={{ width: `${Math.round(s.enrolled/s.target*100)}%` }}></div>
                    </div>
                  </div>
                  <div className="text-slate-400 w-16">{s.months > 0 ? `${s.months}mo left` : "Complete"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Upcoming Milestones</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.urgent ? "bg-red-50" : "bg-slate-50"}`}>
                    <Calendar className={`w-3.5 h-3.5 ${m.urgent ? "text-red-500" : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{m.event}</p>
                    <p className="text-xs text-slate-400">{m.study}</p>
                  </div>
                  <span className={`text-xs font-semibold flex-shrink-0 ${m.urgent ? "text-red-600" : "text-slate-500"}`}>{m.days}d</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <a.Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${a.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700">{a.text}</p>
                    <p className="text-xs text-slate-400">{a.study} · {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudiesScreen({ onNav, studies }: { onNav: (s: Screen, id?: string) => void, studies: Study[] }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "On Track", "At Risk", "Critical", "Recruiting", "Completed"];
  const shown = filter === "All" ? studies : studies.filter(s => s.status === filter);
  const teamColors: Record<string, string> = { SC: "bg-violet-500", RK: "bg-blue-500", JP: "bg-emerald-500", AM: "bg-amber-500", TL: "bg-red-500", BM: "bg-pink-500" };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Studies</h1>
          <p className="text-sm text-slate-500 mt-0.5">7 active · 1 completed · 2 planned</p>
        </div>
        <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Study
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filter === f ? "bg-[#0EA5E9] text-white" : "text-slate-500 hover:text-slate-800"}`}>{f}</button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:border-slate-300 transition-colors">
          <Filter className="w-3 h-3" /> More Filters
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {shown.map((s) => (
          <div key={s.id} onClick={() => onNav("analytics", s.id)} className={`bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer ${s.status === "Completed" ? "opacity-70" : ""}`}>
            <div className="flex items-start justify-between">
              <span className="text-xs font-mono text-slate-400">{s.id}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[s.status]}`}>{s.status}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-snug">{s.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-xs px-1.5 py-0">{s.phase}</Badge>
                <Badge variant="outline" className="text-xs px-1.5 py-0">{s.indication}</Badge>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{s.enrolled} / {s.target} enrolled</span>
                <span className="font-medium text-slate-700">{Math.round(s.enrolled/s.target*100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${s.status === "Critical" ? "bg-red-500" : s.status === "At Risk" ? "bg-amber-500" : "bg-[#0EA5E9]"}`} style={{ width: `${Math.round(s.enrolled/s.target*100)}%` }}></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {s.sites} sites · {s.countries} countries</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.months > 0 ? `${s.months}mo left` : "Completed"}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex -space-x-1.5">
                {s.team.map(t => <div key={t} className={`w-6 h-6 rounded-full ${teamColors[t] || "bg-slate-400"} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>{t[0]}</div>)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#0EA5E9] font-medium">Analytics →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsScreen({ selectedStudyId, studies, onAddStudy, handleNav }: { selectedStudyId: string | null, studies: Study[], onAddStudy: (s: Study) => void, handleNav: (s: Screen, id?: string) => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("Protocol Default");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const study = studies.find(s => s.id === selectedStudyId);
  const showUpload = !selectedStudyId;

  const analysisReport = study?.analysisResults?.analysis_report || {};
  const vulnerabilities = analysisReport.vulnerability_analysis || analysisReport.risk_assessment?.risk_flags || [];
  const strengths = analysisReport.design_strengths || [];
  const metadata = study?.analysisResults?.metadata || {};
  const allSites = study?.analysisResults?.site_recommendations || [];
  const protocolCountries = metadata.countries_list || [];
  const uniqueCountries = Array.from(new Set(allSites.map((s: any) => s.country))).filter(Boolean).sort();
  
  const displaySites = allSites.filter((s: any) => {
    if (selectedRegionFilter === "Protocol Default") {
        if (!protocolCountries || protocolCountries.length === 0) return true; // Global fallback
        return protocolCountries.some((c: string) => s.country && s.country.toLowerCase().includes(c.toLowerCase()));
    }
    if (selectedRegionFilter === "Global Default (All)") return true;
    return s.country === selectedRegionFilter;
  });

  const successProb = analysisReport.success_probability ? parseFloat(analysisReport.success_probability) : 73.2;
  const modelConf = analysisReport.model_confidence || "High";
  const patientTimeline = study?.analysisResults?.patient_timeline || [];
  const trialStages = analysisReport.trial_stages_progress || [];
  const costReduction = analysisReport.cost_reduction_strategies || [];
  const nextSteps = analysisReport.next_steps || [];
  const aiSources = study?.analysisResults?.sources || [];
  const similarTrials = study?.analysisResults?.similar_trials || [];
  const patientMetrics = study?.analysisResults?.patient_metrics || {};

  if (showUpload) return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => handleNav("overview")} className="hover:text-[#0EA5E9]">Overview</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-800 font-medium">Clinical Trial Interface</span>
      </div>
      <div className="flex items-center justify-center min-h-[calc(100%-56px)] p-8">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mx-auto mb-5">
            <Upload className="w-8 h-8 text-[#0EA5E9]" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Upload Trial Protocol</h2>
          <p className="text-sm text-slate-500 mb-6">Drag and drop your protocol document — any stage, draft or final.</p>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setIsAnalyzing(true);
                
                const formData = new FormData();
                formData.append("file", file);

                try {
                  const response = await fetch("http://localhost:8000/api/analyze-protocol", {
                    method: "POST",
                    body: formData,
                  });

                  if (!response.ok) throw new Error("Analysis failed");
                  const result = await response.json();

                  const newStudy: Study = {
                    id: `HAK-${Math.floor(Math.random() * 10000)}`,
                    title: result.metadata?.trial_title || `Analyzed: ${file.name.replace(/\.[^/.]+$/, "")}`,
                    phase: result.metadata?.phase || "Phase II",
                    indication: result.metadata?.condition || "General Medicine",
                    sites: result.site_recommendations?.length || 1,
                    enrolled: 0,
                    target: 100,
                    status: "Recruiting",
                    months: 24,
                    countries: 1,
                    team: ["SS"],
                    analysisResults: result
                  };
                  onAddStudy(newStudy);
                  setIsAnalyzing(false);
                } catch (err) {
                  console.error(err);
                  setIsAnalyzing(false);
                  alert("Analysis failed. Make sure the backend is running on port 8000.");
                }
              }
            }}
          />
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 hover:border-[#0EA5E9]/50 hover:bg-blue-50/30 transition-colors cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
            <div className="flex flex-col items-center gap-2">
              {isAnalyzing ? (
                <>
                  <Activity className="w-10 h-10 text-[#0EA5E9] animate-pulse" />
                  <p className="text-sm font-medium text-slate-600">Analyzing Trial...</p>
                </>
              ) : (
                <>
                  <FileText className="w-10 h-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Drop PDF or DOCX here</p>
                  <p className="text-xs text-slate-400">or <span className="text-[#0EA5E9] font-medium">browse files</span></p>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-1">Benchmarked against 328,000+ historical trials</p>
          <p className="text-xs text-slate-400">AES-256 encrypted · HIPAA compliant · Analysis in 3–7 minutes</p>
          <button onClick={() => handleNav("overview")} className="mt-6 text-sm text-slate-400 hover:text-slate-600">← Back to dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
        <span>Overview</span><ChevronRight className="w-3 h-3" />
        <span>Studies</span><ChevronRight className="w-3 h-3" />
        <span className="text-slate-800 font-medium">{study?.id || "MERI-2024-001"} · Clinical Trial Interface</span>
      </div>
      <div className="px-6 py-4 bg-blue-50/60 border-b border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">{study?.id || "MERI-2024-001"}</span>
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">Analysis Complete</Badge>
            </div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight pr-12">{study?.title || metadata.trial_title || "Pembrolizumab + Chemo in NSCLC"}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1"><Share2 className="w-3 h-3" /> Share</Button>
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1" onClick={() => handleNav("analytics")}><Upload className="w-3 h-3" /> Re-Analyze</Button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 bg-white/50 p-4 rounded-xl border border-blue-100/50 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Phase</span>
            <span className="text-sm font-semibold text-slate-800">{metadata.phase || study?.phase || "Phase II"}</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-blue-100/50 pl-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Therapeutic Area</span>
            <span className="text-sm font-semibold text-slate-800 truncate" title={metadata.condition}>{metadata.condition || "Oncology"}</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-blue-100/50 pl-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Intervention</span>
            <span className="text-sm font-semibold text-slate-800 truncate" title={metadata.intervention}>{metadata.intervention || "Combination Therapy"}</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-blue-100/50 pl-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Design</span>
            <span className="text-sm font-semibold text-slate-800 truncate" title={metadata.design}>{metadata.design || "Randomised, Double-Blind"}</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-blue-100/50 pl-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Planned Region</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(metadata.countries_list && metadata.countries_list.length > 0) ? (
                metadata.countries_list.slice(0, 2).map((c: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-slate-100 px-1 py-0 border-slate-200">{c}</Badge>
                ))
              ) : (
                <span className="text-sm font-semibold text-slate-400 italic">Global / Not Specified</span>
              )}
              {metadata.countries_list && metadata.countries_list.length > 2 && (
                <span className="text-[10px] text-slate-500 mt-1">+{metadata.countries_list.length - 2} More</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0EA5E9] rounded-2xl p-4 text-white shadow-lg shadow-blue-200">
            <p className="text-xs text-blue-100 font-medium mb-1">Success Probability</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{successProb}%</span>
              <Badge className="bg-white/20 text-white border-0 text-[10px]">{modelConf} Confidence</Badge>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${successProb}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400 font-medium mb-1">Risk Assessment</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{vulnerabilities.length || "0"}</span>
              <span className="text-xs text-slate-500 ml-1">Key Flags</span>
            </div>
            <div className="mt-3 flex gap-1">
              {(vulnerabilities.length > 0 ? vulnerabilities.slice(0, 3) : [1, 2, 3]).map((f: any, i: number) => (
                <div key={i} className={`h-1.5 w-full rounded-full ${f.severity === 'High' ? 'bg-red-400' : (f.severity === 'Medium' || !f.severity ? 'bg-amber-400' : 'bg-slate-200')}`}></div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400 font-medium mb-1">Design Strengths</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800">{study?.analysisResults?.strengths?.length || "5"}</span>
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]">Optimized</Badge>
            </div>
            <div className="mt-3 flex items-center gap-1 overflow-hidden">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-slate-400">+{Math.max(0, (study?.analysisResults?.strengths?.length || 5) - 3)} More</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400 font-medium mb-1">Model Confidence</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800">{study?.analysisResults?.confidence === "High" ? "92.4" : "84.1"}%</span>
            </div>
            <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
              <Brain className="w-3 h-3 text-[#0EA5E9]" />
              Benchmarked against 350K+ trials
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2 grid grid-cols-2 gap-5">
            {/* Protocol Vulnerabilities */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Protocol Risks & Vulnerabilities</h3>
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500">Source Verified</Badge>
              </div>
              <div className="space-y-3 block">
                {(study?.analysisResults?.risk_flags || [
                  { title: "Limited Sample Size", severity: "High", detail: "The planned enrollment may be underpowered for primary endpoints. (Smith et al, 2023)" },
                  { title: "Complex Eligibility", severity: "Medium", detail: "Exclusion criteria are broader than phase II benchmarks." },
                  { title: "Single-Country Design", severity: "Low", detail: "Lack of multinational representation." }
                ]).map((v: any, i: number) => {
                  // Hacky regex to highlight citations like (Author, Year) or [1] 
                  const detailText = v.detail || v.description || "";
                  const formattedText = detailText.replace(/(\([a-zA-Z\s,]+, \d{4}\)|\[S:\d+\]|\[\d+\])/g, '<span class="px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[9px] cursor-pointer hover:bg-amber-200 mx-0.5" title="Verified Citation">$&</span>');

                  return (
                    <div key={i} className={`rounded-lg p-3 border ${v.severity === "High" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-800">{v.title}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${v.severity === "High" ? "bg-red-100 text-red-700 border-0" : "bg-amber-100 text-amber-700 border-0"}`}>{v.severity}</Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{__html: formattedText}}></p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CRO Feasibility & Patient Recruitment */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><UsersRound className="w-4 h-4 text-purple-500" /> CRO Feasibility & Recruitment Constraints</h3>
                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">AI Predictive</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Predicted Dropout</p>
                  <p className="text-xl font-bold text-slate-800">{patientMetrics?.estimated_dropout_rate || "18-22%"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Historical avg for {study?.phase || "this phase"}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Enrollment Speed</p>
                  <p className="text-xl font-bold text-slate-800">{patientMetrics?.enrollment_rate || "1.2"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pts / Site / Month</p>
                </div>
              </div>

              <div className="flex-1 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-700">Recruitment Complexity</p>
                  <Badge className={`text-[10px] ${(patientMetrics?.recruitment_complexity || 'High') === 'High' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`} variant="outline">
                    {patientMetrics?.recruitment_complexity || 'High'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 italic mb-3">
                  {patientMetrics?.duration_estimate 
                    ? `Estimated duration: ${patientMetrics.duration_estimate}. Focus heavily on retention pipelines due to high screening failure rates in ${study?.indication || 'this condition'}.` 
                    : "Focus heavily on retention pipelines due to expected screening failure risks. Consider decentralized trial elements to broaden funnel."}
                </p>
                <div className="mt-auto">
                  <Button size="sm" className="w-full text-xs bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    Export CRO IRB Dossier
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Design Strengths</h3>
            <div className="space-y-3 mb-4">
              {strengths.slice(0, 4).map((s: any, i: number) => (
                <div key={i} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex items-start gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-slate-800">{typeof s === "string" ? s : s.title}</p>
                  </div>
                  {typeof s !== "string" && s.detail && (
                    <p className="text-xs text-slate-600 ml-6 mb-1">{s.detail}</p>
                  )}
                  {typeof s !== "string" && s.sources && s.sources.length > 0 && (
                    <div className="ml-6 flex flex-wrap gap-1 mt-1">
                      {s.sources.slice(0, 2).map((src: any, si: number) => (
                        <a key={si} href={src.url} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-[#0EA5E9] hover:underline bg-white border border-blue-100 px-1.5 py-0.5 rounded">
                          {src.title.slice(0, 40)}↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center justify-between">
                Real Evidence & Citations 
                <Badge variant="outline" className="text-[9px] bg-slate-50">Grounding Literature</Badge>
              </p>
              
              {/* PubMed Sources */}
              {aiSources.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-slate-400 mb-1.5 border-b border-slate-100 pb-1">PubMed Clinical Literature</p>
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-2">
                    {aiSources.slice(0, 10).map((src: any, i: number) => (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-start gap-1 p-1 hover:bg-slate-50 rounded group transition-colors">
                        <BookOpen className="w-3 h-3 text-slate-300 group-hover:text-[#0EA5E9] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-600 font-medium group-hover:text-slate-900 group-hover:underline line-clamp-1">{src.title}</span>
                          <span className="text-slate-400">({src.year}) - {src.journal}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Trials Sources */}
              {similarTrials.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 mb-1.5 border-b border-slate-100 pb-1">Historical Trials (CT.gov)</p>
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-2">
                    {similarTrials.slice(0, 5).map((trial: any, i: number) => {
                      const id = trial?.protocolSection?.identificationModule?.nctId;
                      const title = trial?.protocolSection?.identificationModule?.briefTitle || 'Unknown';
                      return (
                        <a key={i} href={`https://clinicaltrials.gov/study/${id}`} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center gap-1 p-1 hover:bg-slate-50 rounded group transition-colors">
                          <ExternalLink className="w-3 h-3 text-emerald-400 group-hover:text-emerald-600 shrink-0" />
                          <span className="text-emerald-700 font-medium whitespace-nowrap">{id}</span>
                          <span className="text-slate-500 truncate">{title}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Trial Stages & Operational AI Report --- */}
        <div className="grid grid-cols-2 gap-4">
          {/* Patient Timeline Calendar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#0EA5E9]" /> Patient Visit Timeline</h3>
              <Badge variant="outline" className="text-[10px] uppercase bg-blue-50/50">Extracted from Schedule</Badge>
            </div>
            {patientTimeline.length > 0 ? (
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {patientTimeline.map((visit: string, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-slate-200 group-[.is-active]:bg-[#0EA5E9] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-2 rounded border border-slate-100 bg-white shadow-sm">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="font-medium text-xs text-slate-800">{visit}</div>
                      </div>
                      <button className="mt-1 text-[10px] text-[#0EA5E9] font-medium hover:underline flex items-center gap-1"><Clock className="w-3 h-3" /> Add Calendar Alert</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic mt-2">No timeline extracted from protocol.</p>
            )}
          </div>

          {/* AI Operational Report */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-emerald-500" /> Trial Progress & Milestones</h3>
              {trialStages.length > 0 ? (
                <div className="space-y-2">
                  {trialStages.map((ts: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium">{ts.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{ts.date}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${ts.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{ts.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No milestone data.</p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Strategic Next Steps</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                {nextSteps.map((ns: string, i: number) => <li key={i}>{ns}</li>)}
              </ul>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-emerald-600" /> Cost Reduction Strategies</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                {costReduction.map((cr: string, i: number) => <li key={i}>{cr}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Site Recommendations</h3>
            <div className="flex items-center gap-3">
              <select 
                value={selectedRegionFilter}
                onChange={(e) => setSelectedRegionFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-md py-1 px-2 text-slate-600 bg-slate-50 outline-none focus:border-[#0EA5E9]"
              >
                <option value="Protocol Default">Protocol Default Regions</option>
                <option value="Global Default (All)">Global (All Sites)</option>
                <optgroup label="Available Countries">
                  {uniqueCountries.map((c: any, i: number) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </optgroup>
              </select>
              <Badge variant="outline" className="text-xs">ML-Scored · 400K+ sites</Badge>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100">
                <th className="text-left px-5 py-2">Site</th>
                <th className="text-left px-4 py-2">Region</th>
                <th className="text-left px-4 py-2">Score</th>
                <th className="text-left px-4 py-2">TA Experience</th>
                <th className="text-left px-4 py-2">Enrollment Rate</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displaySites.length > 0 ? displaySites.map((s: any, i: number) => (
                <Fragment key={i}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-2.5 font-medium text-slate-800 max-w-xs truncate" title={s.name}>{s.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{s.city ? `${s.city}, ${s.country}` : s.country}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0EA5E9] rounded-full" style={{ width: `${s.success_rate || 0}%` }}></div>
                        </div>
                        <span className="font-semibold text-slate-700">{s.success_rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={`text-xs border-blue-200 text-blue-700`}>{s.trials_count} Trials</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{s.completed_count} Completed</td>
                    <td className="px-4 py-2.5">
                      <Button variant="outline" size="sm" className="text-xs">Add Site</Button>
                    </td>
                  </tr>
                  {/* Detailed AI Context & Provenance Links Row */}
                  {(s.reason || (s.nct_links && s.nct_links.length > 0)) && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="px-5 py-2.5 border-t-0 text-xs">
                        <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-[#0EA5E9]/50 ml-1">
                          <div className="flex items-start gap-1">
                            <Sparkles className="w-3 h-3 text-[#0EA5E9] shrink-0 mt-0.5" />
                            <p className="text-slate-600 font-medium">{s.reason}</p>
                          </div>
                          {s.nct_links && s.nct_links.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 ml-4">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Verified Sources:</span>
                              {s.nct_links.map((link: any, idx: number) => (
                                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                  {link.id}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )) : (
                <tr><td colSpan={6} className="text-center py-4 text-slate-500">No sites found for this protocol criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ExplorerScreen() {
  // --- Trial Explorer State ---
  const [explorerQuery, setExplorerQuery] = useState("pembrolizumab NSCLC");
  const [explorerTrials, setExplorerTrials] = useState<any[]>([]);
  const [explorerTotal, setExplorerTotal] = useState(0);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchTrials = async () => {
      setExplorerLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/trial/search?q=${encodeURIComponent(explorerQuery)}`);
        const data = await res.json();
        if (isMounted) {
          setExplorerTrials(data.trials || []);
          setExplorerTotal(data.total || 0);
          setSelectedTrial(0);
        }
      } catch (err) {
        console.error("Failed to fetch explorer trials:", err);
      } finally {
        if (isMounted) setExplorerLoading(false);
      }
    };
    fetchTrials();

    return () => { isMounted = false; };
  }, [explorerQuery]);

  const t = explorerTrials[selectedTrial] || null;

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
      <div className="p-5 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Trial Explorer</h1>
            <p className="text-xs text-slate-500">556,847 trials indexed from ClinicalTrials.gov · AI brief per study</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              className="pl-9 text-sm" 
              defaultValue={explorerQuery} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setExplorerQuery((e.target as HTMLInputElement).value);
                }
              }}
            />
          </div>
          <Button 
            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
            onClick={() => {
              const el = document.querySelector('input.pl-9') as HTMLInputElement;
              if (el) setExplorerQuery(el.value);
            }}
          >
            Search
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          {["Phase III", "Oncology", "Recruiting"].map(f => (
            <span key={f} className="flex items-center gap-1 text-xs bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20 rounded-full px-2.5 py-1 font-medium">
              {f} <X className="w-3 h-3 cursor-pointer" />
            </span>
          ))}
          <button className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 px-2 py-1 border border-dashed border-slate-300 rounded-full">
            <Plus className="w-3 h-3" /> Add Filter
          </button>
          <span className="ml-auto text-xs text-slate-500">{explorerTotal.toLocaleString()} results</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {explorerLoading ? (
            <div className="w-full flex-1 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Curating real-time AI briefs for top results...</p>
            </div>
        ) : explorerTrials.length === 0 ? (
            <div className="w-full flex-1 flex items-center justify-center text-slate-400">
                <p>No trials found for "{explorerQuery}".</p>
            </div>
        ) : (
          <>
            <div className="w-5/12 overflow-y-auto border-r border-slate-200 divide-y divide-slate-100 bg-white">
              {explorerTrials.map((tr: any, i: number) => (
                <div key={i} onClick={() => setSelectedTrial(i)} className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedTrial === i ? "bg-blue-50 border-l-2 border-[#0EA5E9]" : ""}`}>
                  {tr.match && <div className="text-xs text-[#0EA5E9] font-medium mb-1 flex items-center gap-1"><Star className="w-3 h-3 text-[#0EA5E9]" /> High Relevance match</div>}
                  <p className="text-xs font-mono text-slate-400 mb-0.5">{tr.nct}</p>
                  <p className="text-sm font-medium text-slate-800 leading-snug mb-1">{tr.title.length > 80 ? tr.title.substring(0, 80) + '...' : tr.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">{tr.phase}</Badge>
                    <Badge className={`text-xs px-1.5 py-0 ${tr.status === "Completed" ? "bg-slate-100 text-slate-600" : tr.status.toLowerCase().includes("recruiting") ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{tr.status}</Badge>
                    <span className="text-xs text-slate-400">{tr.enrolled?.toLocaleString() || "N/A"} enrolled</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
              {t && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-mono text-[#0EA5E9] mb-1 hover:underline cursor-pointer"><a href={`https://clinicaltrials.gov/study/${t.nct}`} target="_blank" rel="noreferrer">{t.nct}</a></p>
                      <h2 className="text-base font-bold text-slate-900 leading-snug mb-2">{t.title}</h2>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-slate-50">{t.phase}</Badge>
                        <Badge className={`text-xs ${t.status === "Completed" ? "bg-slate-100 text-slate-600" : t.status.toLowerCase().includes("recruiting") ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{t.status}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs"><Download className="w-3 h-3 mr-1" />Export</Button>
                      <Button size="sm" className="text-xs bg-[#0EA5E9] hover:bg-[#0284C7] text-white">Add to Study</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                    {[
                      ["Sponsor", t.sponsor], 
                      ["Enrollment", t.enrolled ? `${t.enrolled.toLocaleString()} patients` : 'N/A'], 
                      ["Phase", t.phase], 
                      ["Status", t.status]
                    ].map(([k, v]) => (
                      <div key={k} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100"><p className="text-slate-400 mb-0.5 uppercase text-[10px] font-bold tracking-wide">{k}</p><p className="font-medium text-slate-800">{v}</p></div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Auto-Generated AI Brief</p>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-100 overflow-y-auto max-h-48">{t.brief}</p>
                  </div>
                  {t.match && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Relevant to Your Studies</p>
                      <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg p-2.5 border border-blue-100 text-blue-800">
                        <Star className="w-3 h-3 text-[#0EA5E9]" />
                        <span className="text-slate-600">Used as comparator in <span className="font-semibold text-slate-800">MERI-2024-001</span></span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DrafterScreen() {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0, 1]));
  const sections = [
    { title: "1. Study Objectives", content: "The primary objective of this study is to evaluate the efficacy and safety of MEK inhibitor XR-442 in combination with anti-PD-L1 therapy in patients with advanced, unresectable or metastatic melanoma who have received no prior systemic therapy for advanced disease." },
    { title: "2. Study Design", content: "This is a Phase I/II, open-label, multicenter, dose-escalation and dose-expansion study. Phase I will determine the maximum tolerated dose (MTD) and recommended Phase II dose (RP2D). Phase II will evaluate preliminary efficacy at the RP2D in the dose-expansion cohort." },
    { title: "3. Eligibility Criteria", content: "" },
    { title: "4. Study Endpoints", content: "" },
    { title: "5. Safety Monitoring", content: "" },
    { title: "6. Statistical Considerations", content: "" },
  ];

  const toggleSection = (i: number) => {
    setOpenSections(prev => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  return (
    <div className="flex-1 overflow-hidden flex bg-slate-50">
      <div className="w-5/12 border-r border-slate-200 bg-white overflow-y-auto p-5">
        <h2 className="text-base font-bold text-slate-900 mb-1">Protocol Drafter</h2>
        <p className="text-xs text-slate-500 mb-5">CDISC ICH E6(R3) aligned · 10–20 min generation time</p>

        <div className="space-y-3">
          {[
            { label: "Link to Study", value: "MERI-2025-011 · Melanoma" },
            { label: "Therapeutic Area", value: "Oncology — Melanoma" },
            { label: "Intervention", value: "XR-442 (MEK inhibitor) + Anti-PD-L1" },
            { label: "Primary Endpoint", value: "Objective Response Rate (ORR) per RECIST v1.1" },
            { label: "Estimated Enrollment", value: "45" },
          ].map((field) => (
            <div key={field.label}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">{field.label}</label>
              <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0EA5E9] text-slate-700 bg-white" defaultValue={field.value} readOnly />
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Trial Phase</label>
            <div className="flex gap-1">
              {["I", "I/II", "II", "III", "IV"].map(p => (
                <button key={p} className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${p === "I/II" ? "bg-[#0EA5E9] text-white border-[#0EA5E9]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Target Population</label>
            <textarea className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#0EA5E9] text-slate-700" rows={3} defaultValue="Adults ≥18 years with histologically confirmed unresectable or metastatic melanoma, ECOG PS 0–1, no prior systemic therapy for advanced disease." readOnly />
          </div>
        </div>

        <Button className="w-full mt-5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white">Generate Protocol Draft</Button>
        <p className="text-xs text-slate-400 text-center mt-2">Est. 10–20 minutes · Encrypted in transit</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-bold text-slate-900">MERI-2025-011 Protocol v1.2</h2>
                <Badge className="bg-emerald-100 text-emerald-700 text-xs">CDISC Aligned</Badge>
                <Badge className="bg-blue-100 text-blue-700 text-xs">ICH E6(R3)</Badge>
              </div>
              <p className="text-xs text-slate-500">Generated March 12, 2026 · 6 sections · Ready for review</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1"><Download className="w-3 h-3" />DOCX</Button>
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1"><Download className="w-3 h-3" />PDF</Button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {sections.map((s, i) => (
              <div key={i}>
                <button onClick={() => toggleSection(i)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors text-left">
                  <span className="text-sm font-semibold text-slate-800">{s.title}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${openSections.has(i) ? "rotate-90" : ""}`} />
                </button>
                {openSections.has(i) && s.content && (
                  <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{s.content}</div>
                )}
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            <button className="text-sm text-[#0EA5E9] font-medium flex items-center gap-1.5 hover:underline">
              <Activity className="w-4 h-4" /> Validate with Protocol Analytics Engine →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KOLScreen() {
  const [selected, setSelected] = useState(0);
  const kols = [
    { initials: "JL", color: "bg-blue-500", name: "Dr. James Liu", title: "Professor of Oncology", institution: "MD Anderson Cancer Center", location: "Houston, TX", tags: ["NSCLC", "Immunotherapy", "PD-L1"], pubs: 312, hindex: 48, trials: 24, score: 87, saved: true },
    { initials: "RH", color: "bg-violet-500", name: "Dr. Rachel Hernandez", title: "Director, Thoracic Oncology", institution: "Memorial Sloan Kettering", location: "New York, NY", tags: ["Lung Cancer", "Targeted Therapy"], pubs: 187, hindex: 39, trials: 18, score: 81, saved: false },
    { initials: "AK", color: "bg-emerald-500", name: "Prof. Ananya Kumar", title: "Head of Clinical Research", institution: "Institut Gustave Roussy", location: "Paris, France", tags: ["NSCLC", "Biomarkers", "PD-L1"], pubs: 241, hindex: 44, trials: 21, score: 85, saved: true },
    { initials: "MT", color: "bg-amber-500", name: "Dr. Michael Tanaka", title: "Associate Professor", institution: "University of Toronto", location: "Toronto, Canada", tags: ["Immunotherapy", "Phase I"], pubs: 129, hindex: 31, trials: 12, score: 73, saved: false },
  ];
  const k = kols[selected];
  const publications = [
    { title: "PD-L1 expression as a predictive biomarker in combination chemo-immunotherapy for NSCLC", journal: "J Clin Oncol", year: 2024, citations: 142 },
    { title: "Long-term outcomes of pembrolizumab in PD-L1 high NSCLC: 5-year follow-up", journal: "NEJM", year: 2023, citations: 891 },
    { title: "MEK/PD-1 dual inhibition in solid tumors: rationale and early clinical data", journal: "Cancer Cell", year: 2023, citations: 203 },
  ];

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
      <div className="p-5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">KOL Identification</h1>
            <p className="text-xs text-slate-500">Oncology · Powered by PubMed + ClinicalTrials.gov</p>
          </div>
          <div className="ml-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs text-blue-700 font-medium flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Currently available for Oncology indications
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input className="pl-9 text-sm" defaultValue="NSCLC · Pembrolizumab" readOnly />
          </div>
          <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white">Search</Button>
        </div>
        <div className="flex items-center gap-5 mt-3 text-xs text-slate-500">
          {[["142", "KOLs identified"], ["23", "High Influence"], ["12", "Countries"], ["Mar 2026", "Last updated"]].map(([v, l]) => (
            <div key={l} className="flex items-center gap-1.5"><span className="font-bold text-slate-800 text-sm">{v}</span><span>{l}</span></div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {kols.map((kol, i) => (
              <div key={i} onClick={() => setSelected(i)} className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all ${selected === i ? "border-[#0EA5E9] shadow-md" : "border-slate-200"}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${kol.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>{kol.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-bold text-slate-900">{kol.name}</p>
                      {kol.saved && <Badge className="text-xs bg-blue-100 text-blue-700 flex-shrink-0">Saved</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{kol.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{kol.location}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {kol.tags.map(t => <span key={t} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{t}</span>)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span>{kol.pubs} pubs</span>
                  <span>h-index {kol.hindex}</span>
                  <span>{kol.trials} trials</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Influence Score</span><span className="font-bold text-slate-800">{kol.score}/100</span></div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#0EA5E9]" style={{ width: `${kol.score}%` }}></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <Button variant="outline" size="sm" className="text-xs flex-1">Save to Study</Button>
                  <Button size="sm" className="text-xs flex-1 bg-[#0EA5E9] hover:bg-[#0284C7] text-white">View Profile</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 border-l border-slate-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full ${k.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>{k.initials}</div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{k.name}</p>
                <p className="text-xs text-slate-500">{k.institution}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{k.location}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">Influence</p><p className="font-bold text-slate-800">{k.score}/100 · High</p></div>
              <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">Outreach</p><p className="font-bold text-emerald-600">High Potential</p></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="text-xs flex-1 bg-[#0EA5E9] hover:bg-[#0284C7] text-white">Add to Advisory Board</Button>
              <Button variant="outline" size="sm" className="text-xs"><ExternalLink className="w-3 h-3" /></Button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Publications</p>
            <div className="space-y-3">
              {publications.map((pub, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-800 leading-snug mb-1">{pub.title}</p>
                  <p className="text-xs text-slate-400">{pub.journal} · {pub.year} · {pub.citations} citations</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamScreen() {
  const members = [
    { initials: "SC", color: "bg-violet-500", name: "Dr. Sarah Chen", role: "VP Clinical Development", studies: ["MERI-2024-001", "MERI-2023-047", "MERI-2025-011"], last: "Active now", status: "Active" },
    { initials: "RK", color: "bg-blue-500", name: "Robert Kim", role: "Head of Clinical Ops", studies: ["MERI-2022-003", "MERI-2023-047", "MERI-2025-002"], last: "1 hour ago", status: "Active" },
    { initials: "JP", color: "bg-emerald-500", name: "Dr. Jessica Park", role: "Principal Investigator", studies: ["MERI-2024-001", "MERI-2025-002", "MERI-2025-011"], last: "3 hours ago", status: "Active" },
    { initials: "AM", color: "bg-amber-500", name: "Alex Martinez", role: "Data Manager", studies: ["MERI-2023-047", "MERI-2024-089"], last: "Yesterday", status: "Active" },
    { initials: "TL", color: "bg-red-500", name: "Dr. Tina Lee", role: "Regulatory Affairs", studies: ["MERI-2023-047", "MERI-2024-089"], last: "2 days ago", status: "Active" },
    { initials: "BM", color: "bg-pink-500", name: "Brian Moore", role: "CRA Lead", studies: ["MERI-2022-003", "MERI-2024-089"], last: "3 days ago", status: "Active" },
  ];
  const pending = [
    { email: "c.novak@meridian.com", role: "Clinical Research Associate", invited: "Mar 10, 2026" },
    { email: "s.patel@meridian.com", role: "Biostatistician", invited: "Mar 8, 2026" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500 mt-0.5">Meridian Therapeutics · 6 members · 2 pending</p>
        </div>
        <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> Invite Member
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 mb-5">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Active Members</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100">
              <th className="text-left px-5 py-2">Member</th>
              <th className="text-left px-4 py-2">Role</th>
              <th className="text-left px-4 py-2">Studies</th>
              <th className="text-left px-4 py-2">Last Active</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {members.map((m, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${m.color} flex items-center justify-center text-white text-xs font-bold`}>{m.initials}</div>
                    <div>
                      <p className="font-medium text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.last}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{m.role}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {m.studies.slice(0, 2).map(s => <span key={s} className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{s}</span>)}
                    {m.studies.length > 2 && <span className="text-xs text-slate-400">+{m.studies.length - 2}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">{m.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Pending Invitations</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {pending.map((p, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><Users className="w-4 h-4 text-slate-400" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{p.email}</p>
                  <p className="text-xs text-slate-400">{p.role} · Invited {p.invited}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-700 text-xs">Pending</Badge>
                <Button variant="outline" size="sm" className="text-xs">Resend</Button>
                <Button variant="outline" size="sm" className="text-xs text-red-500 hover:text-red-700">Revoke</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PatientRecruitmentScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [activeStudy, setActiveStudy] = useState("MERI-2023-047");

  const studyOptions = [
    { id: "MERI-2023-047", label: "BRD4-i · HR+ Breast Cancer" },
    { id: "MERI-2024-001", label: "Pembrolizumab · NSCLC" },
    { id: "MERI-2024-089", label: "IL-23i · Crohn's" },
    { id: "MERI-2025-002", label: "CAR-T · AML" },
    { id: "MERI-2025-011", label: "MEK-i · Melanoma" },
  ];

  const funnelData = {
    "MERI-2023-047": { eligible: 4820, screened: 2140, consented: 1240, enrolled: 891, active: 798, dropout: 93 },
    "MERI-2024-001": { eligible: 1640, screened: 580, consented: 198, enrolled: 124, active: 119, dropout: 5 },
    "MERI-2024-089": { eligible: 890, screened: 412, consented: 261, enrolled: 203, active: 197, dropout: 6 },
    "MERI-2025-002": { eligible: 210, screened: 48, consented: 18, enrolled: 12, active: 12, dropout: 0 },
    "MERI-2025-011": { eligible: 380, screened: 62, consented: 9, enrolled: 4, active: 4, dropout: 0 },
  };

  const siteData = {
    "MERI-2023-047": [
      { name: "MD Anderson Cancer Center", country: "US", target: 120, enrolled: 118, rate: 4.2, trend: "up", screen_fail: "18%" },
      { name: "Memorial Sloan Kettering", country: "US", target: 100, enrolled: 94, rate: 3.8, trend: "up", screen_fail: "22%" },
      { name: "Institut Gustave Roussy", country: "FR", target: 80, enrolled: 71, rate: 3.1, trend: "flat", screen_fail: "25%" },
      { name: "Charité Berlin", country: "DE", target: 70, enrolled: 58, rate: 2.2, trend: "down", screen_fail: "31%" },
      { name: "Christie NHS Foundation", country: "UK", target: 60, enrolled: 52, rate: 2.0, trend: "down", screen_fail: "34%" },
      { name: "University of Toronto", country: "CA", target: 50, enrolled: 41, rate: 1.8, trend: "flat", screen_fail: "28%" },
    ],
    "MERI-2024-001": [
      { name: "Johns Hopkins", country: "US", target: 40, enrolled: 28, rate: 2.1, trend: "up", screen_fail: "20%" },
      { name: "Mayo Clinic Rochester", country: "US", target: 35, enrolled: 24, rate: 1.9, trend: "up", screen_fail: "23%" },
      { name: "University College London", country: "UK", target: 30, enrolled: 18, rate: 1.4, trend: "flat", screen_fail: "28%" },
    ],
    "MERI-2024-089": [
      { name: "Cleveland Clinic", country: "US", target: 60, enrolled: 55, rate: 3.2, trend: "up", screen_fail: "15%" },
      { name: "Mount Sinai", country: "US", target: 50, enrolled: 48, rate: 2.9, trend: "up", screen_fail: "18%" },
      { name: "Karolinska Institute", country: "SE", target: 50, enrolled: 41, rate: 2.4, trend: "flat", screen_fail: "22%" },
    ],
    "MERI-2025-002": [
      { name: "Dana-Farber Cancer Institute", country: "US", target: 15, enrolled: 7, rate: 0.8, trend: "up", screen_fail: "42%" },
      { name: "Fred Hutchinson", country: "US", target: 15, enrolled: 5, rate: 0.6, trend: "flat", screen_fail: "48%" },
    ],
    "MERI-2025-011": [
      { name: "UCLA Medical Center", country: "US", target: 30, enrolled: 4, rate: 0.4, trend: "up", screen_fail: "55%" },
    ],
  };

  const channels = [
    { name: "Physician Referral Network", patients: 412, pct: 46, color: "bg-[#0EA5E9]" },
    { name: "Patient Registry (BreastCancer.org)", patients: 198, pct: 22, color: "bg-violet-400" },
    { name: "Digital Campaign (Facebook/Google)", patients: 143, pct: 16, color: "bg-emerald-400" },
    { name: "EMR Screening (Epic)", patients: 89, pct: 10, color: "bg-amber-400" },
    { name: "Site Walk-ins & Other", patients: 49, pct: 6, color: "bg-slate-300" },
  ];

  const f = funnelData[activeStudy as keyof typeof funnelData];
  const sites = siteData[activeStudy as keyof typeof siteData];
  const maxFunnel = f.eligible;

  const trendIcon = (t: string) =>
    t === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> :
    t === "down" ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> :
    <Minus className="w-3.5 h-3.5 text-slate-400" />;

  const dropoutRate = f.dropout > 0 ? ((f.dropout / f.enrolled) * 100).toFixed(1) : "0.0";
  const screenFailRate = (((f.screened - f.consented) / f.screened) * 100).toFixed(0);
  const conversionRate = ((f.enrolled / f.screened) * 100).toFixed(1);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient Recruitment</h1>
          <p className="text-sm text-slate-500 mt-0.5">Enrollment funnel · Site performance · Recruitment channels</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 flex-wrap">
            {studyOptions.map(s => (
              <button key={s.id} onClick={() => setActiveStudy(s.id)} className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${activeStudy === s.id ? "bg-[#0EA5E9] text-white" : "text-slate-500 hover:text-slate-800"}`}>{s.id}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Screened", value: f.screened.toLocaleString(), sub: `of ${f.eligible.toLocaleString()} eligible`, Icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Screen-to-Enroll", value: `${conversionRate}%`, sub: "conversion rate", Icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Screen Failure", value: `${screenFailRate}%`, sub: "not proceeding to consent", Icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Dropout Rate", value: `${dropoutRate}%`, sub: `${f.dropout} patients post-enrollment`, Icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.label}</p>
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Enrollment Funnel</h3>
          <div className="space-y-3">
            {[
              { label: "Potentially Eligible", value: f.eligible, color: "bg-slate-200" },
              { label: "Screened", value: f.screened, color: "bg-blue-300" },
              { label: "Consented", value: f.consented, color: "bg-blue-400" },
              { label: "Enrolled", value: f.enrolled, color: "bg-[#0EA5E9]" },
              { label: "Currently Active", value: f.active, color: "bg-emerald-500" },
            ].map((step, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{step.label}</span>
                  <span className="font-semibold text-slate-800">{step.value.toLocaleString()}</span>
                </div>
                <div className="h-6 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                  <div className={`h-full ${step.color} rounded-lg transition-all`} style={{ width: `${(step.value / maxFunnel) * 100}%` }}></div>
                </div>
                {i < 4 && (
                  <div className="text-right text-xs text-slate-400 mt-0.5">
                    ↓ {(((step.value - [f.screened, f.consented, f.enrolled, f.active, 0][i]) / step.value) * 100).toFixed(0)}% lost
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Site Performance</h3>
            <Badge variant="outline" className="text-xs">{sites.length} active sites</Badge>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100">
                <th className="text-left px-5 py-2">Site</th>
                <th className="text-left px-3 py-2">Country</th>
                <th className="text-left px-3 py-2">Enrolled</th>
                <th className="text-left px-3 py-2">Rate/mo</th>
                <th className="text-left px-3 py-2">Screen Fail</th>
                <th className="text-left px-3 py-2">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sites.map((site, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-2.5">
                    <p className="font-medium text-slate-800 text-xs">{site.name}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{site.country}</td>
                  <td className="px-3 py-2.5">
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-semibold text-slate-800">{site.enrolled}</span>
                        <span className="text-slate-400">/{site.target}</span>
                      </div>
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${site.enrolled / site.target >= 0.9 ? "bg-emerald-500" : site.enrolled / site.target >= 0.7 ? "bg-[#0EA5E9]" : "bg-amber-400"}`} style={{ width: `${Math.min((site.enrolled / site.target) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-slate-700">{site.rate}/mo</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-medium ${parseFloat(site.screen_fail) > 30 ? "text-red-600" : parseFloat(site.screen_fail) > 22 ? "text-amber-600" : "text-emerald-600"}`}>{site.screen_fail}</span>
                  </td>
                  <td className="px-3 py-2.5">{trendIcon(site.trend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Recruitment Channels</h3>
            <span className="text-xs text-slate-400">MERI-2023-047</span>
          </div>
          <div className="space-y-3">
            {channels.map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{c.name}</span>
                  <span className="font-semibold text-slate-800">{c.patients} <span className="text-slate-400 font-normal">({c.pct}%)</span></span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Button size="sm" variant="outline" className="text-xs w-full">Manage Recruitment Channels</Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
            AI Recruitment Insights
          </h3>
          <div className="space-y-3">
            {[
              { type: "alert", icon: AlertTriangle, color: "text-amber-500 bg-amber-50 border-amber-100", text: "Charité Berlin and Christie NHS sites have screen failure rates above 30% — eligibility criteria review recommended for EU/UK cohort." },
              { type: "opportunity", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 border-emerald-100", text: "Epic EMR integration at MD Anderson could yield ~40 additional pre-screened patients based on ICD-10 code matching." },
              { type: "forecast", icon: Globe, color: "text-blue-600 bg-blue-50 border-blue-100", text: "At current pace MERI-2023-047 will reach full enrollment in ~5.4 weeks. Final enrollment event projected for April 20, 2026." },
            ].map((insight, i) => (
              <div key={i} className={`rounded-lg p-3 border text-xs ${insight.color}`}>
                <div className="flex items-start gap-2">
                  <insight.icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 leading-relaxed">{insight.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            <Button size="sm" className="text-xs flex-1 bg-[#0EA5E9] hover:bg-[#0284C7] text-white" onClick={() => onNav("kol")}>Find KOLs for Referrals</Button>
            <Button size="sm" variant="outline" className="text-xs flex-1">Export Recruitment Report</Button>
          </div>
        </div>
      </div>
    </div>
  );
}



export default function Dashboard() {
  const [studiesList, setStudiesList] = useState<Study[]>([
    { id: "MERI-2024-001", title: "Pembrolizumab + Chemo in NSCLC", phase: "Phase II", indication: "Oncology", sites: 8, enrolled: 124, target: 200, status: "On Track", months: 14, countries: 4, team: ["SC","RK","JP","AM"] },
    { id: "MERI-2023-047", title: "BRD4-i Monotherapy in HR+ Breast Cancer", phase: "Phase III", indication: "Oncology", sites: 18, enrolled: 891, target: 1000, status: "At Risk", months: 6, countries: 6, team: ["TL","SC","BM"] },
    { id: "MERI-2025-002", title: "CAR-T Therapy for Relapsed AML", phase: "Phase I", indication: "Hematology", sites: 3, enrolled: 12, target: 30, status: "On Track", months: 28, countries: 2, team: ["JP","RK"] },
    { id: "MERI-2024-089", title: "IL-23 Inhibitor in Refractory Crohn's", phase: "Phase II", indication: "Immunology", sites: 6, enrolled: 203, target: 250, status: "Critical", months: 2, countries: 3, team: ["AM","SC","TL","BM"] },
    { id: "MERI-2025-011", title: "MEK-i + PD-L1 in Advanced Melanoma", phase: "Phase I/II", indication: "Oncology", sites: 2, enrolled: 4, target: 45, status: "Recruiting", months: 36, countries: 1, team: ["SC","JP"] },
    { id: "MERI-2022-003", title: "Bispecific Ab in DLBCL", phase: "Phase II", indication: "Hematology", sites: 12, enrolled: 180, target: 180, status: "Completed", months: 0, countries: 5, team: ["RK","AM"] },
  ]);
  const [screen, setScreen] = useState<Screen>("overview");
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);

  const handleNav = (newScreen: Screen, studyId?: string) => {
    setScreen(newScreen);
    if (newScreen === "analytics") {
      setSelectedStudyId(studyId || null);
    }
  };

  const handleAddStudy = (study: Study) => {
    setStudiesList(prev => [study, ...prev]);
    setSelectedStudyId(study.id);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar active={screen} onNav={handleNav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <div className="flex-1 flex overflow-hidden">
          {screen === "overview" && <OverviewScreen onNav={handleNav} studies={studiesList} />}
          {screen === "studies" && <StudiesScreen onNav={handleNav} studies={studiesList} />}
          {screen === "analytics" && <AnalyticsScreen selectedStudyId={selectedStudyId} studies={studiesList} onAddStudy={handleAddStudy} handleNav={handleNav} />}
          {screen === "recruitment" && <PatientRecruitmentScreen onNav={handleNav} />}
          {screen === "explorer" && <ExplorerScreen />}
          {screen === "drafter" && <DrafterScreen />}
          {screen === "kol" && <KOLScreen />}
          {screen === "team" && <TeamScreen />}
        </div>
      </div>
    </div>
  );
}
