import { useState } from "react";
import {
  LayoutDashboard, FolderOpen, Activity, Search, FileText, Users,
  BarChart2, UsersRound, Settings, Bell, HelpCircle, ChevronDown,
  Plus, ArrowRight, AlertTriangle, CheckCircle2, Clock, Globe,
  FlaskConical, ChevronRight, X, Download, Share2,
  Upload, Star, BookOpen, MapPin, ExternalLink, Filter,
  Calendar, MoreHorizontal, Building2, Shield, Zap,
  Brain, Sparkles, Database, Stethoscope, Send
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Screen = "ask" | "overview" | "studies" | "analytics" | "explorer" | "drafter" | "kol" | "team";

const studies = [
  { id: "MERI-2024-001", title: "Pembrolizumab + Chemo in NSCLC", phase: "Phase II", indication: "Oncology", sites: 8, enrolled: 124, target: 200, status: "On Track", months: 14, countries: 4, team: ["SC","RK","JP","AM"] },
  { id: "MERI-2023-047", title: "BRD4-i Monotherapy in HR+ Breast Cancer", phase: "Phase III", indication: "Oncology", sites: 18, enrolled: 891, target: 1000, status: "At Risk", months: 6, countries: 6, team: ["TL","SC","BM"] },
  { id: "MERI-2025-002", title: "CAR-T Therapy for Relapsed AML", phase: "Phase I", indication: "Hematology", sites: 3, enrolled: 12, target: 30, status: "On Track", months: 28, countries: 2, team: ["JP","RK"] },
  { id: "MERI-2024-089", title: "IL-23 Inhibitor in Refractory Crohn's", phase: "Phase II", indication: "Immunology", sites: 6, enrolled: 203, target: 250, status: "Critical", months: 2, countries: 3, team: ["AM","SC","TL","BM"] },
  { id: "MERI-2025-011", title: "MEK-i + PD-L1 in Advanced Melanoma", phase: "Phase I/II", indication: "Oncology", sites: 2, enrolled: 4, target: 45, status: "Recruiting", months: 36, countries: 1, team: ["SC","JP"] },
  { id: "MERI-2022-003", title: "Bispecific Ab in DLBCL", phase: "Phase II", indication: "Hematology", sites: 12, enrolled: 180, target: 180, status: "Completed", months: 0, countries: 5, team: ["RK","AM"] },
];

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

function Sidebar({ active, onNav }: { active: Screen; onNav: (s: Screen) => void }) {
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
        <button
          onClick={() => onNav("ask")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-1 ${
            active === "ask"
              ? "bg-[#0EA5E9]/15 text-[#0EA5E9] border-l-2 border-[#0EA5E9]"
              : "bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>Ask Hakase</span>
          <span className="ml-auto text-xs bg-[#0EA5E9]/20 text-[#0EA5E9] rounded px-1.5 py-0.5 font-semibold">AI</span>
        </button>
        {navItem("overview", LayoutDashboard, "Overview")}
        {navItem("studies", FolderOpen, "Studies")}
        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-semibold text-white/25 uppercase tracking-widest">Intelligence</p>
        </div>
        {navItem("analytics", Activity, "Protocol Analytics")}
        {navItem("explorer", Search, "Trial Explorer")}
        {navItem("drafter", FileText, "Protocol Drafter")}
        {navItem("kol", Users, "KOL Intelligence")}
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

function OverviewScreen({ onNav }: { onNav: (s: Screen) => void }) {
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
              <div key={s.id} onClick={() => onNav("analytics")} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 cursor-pointer group transition-colors">
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

function StudiesScreen({ onNav }: { onNav: (s: Screen) => void }) {
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
          <div key={s.id} onClick={() => onNav("analytics")} className={`bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer ${s.status === "Completed" ? "opacity-70" : ""}`}>
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

function AnalyticsScreen() {
  const [showUpload, setShowUpload] = useState(false);

  const vulnerabilities = [
    { title: "Eligibility criteria too restrictive", detail: "PD-L1 TPS ≥1% threshold may exclude 40–60% of screened patients based on comparator trials.", severity: "High" },
    { title: "Enrollment timeline underestimated", detail: "36-month enrollment target is optimistic — competing trials in NSCLC reduced available patient pool by ~23%.", severity: "Medium" },
    { title: "Safety monitoring gap detected", detail: "No pre-specified stopping rule for Grade 3+ immune-related AEs beyond standard CTCAE criteria.", severity: "Medium" },
  ];
  const strengths = ["CDISC ICH E6(R3) aligned endpoint structure", "Appropriate Phase II sample size (n=200) for 80% power", "Clear primary endpoint — PFS at 12 months", "Multi-regional design supports regulatory submission"];
  const sites = [
    { name: "MD Anderson Cancer Center", region: "US-South", score: 94, exp: "High", rate: "4.2/mo" },
    { name: "Memorial Sloan Kettering", region: "US-East", score: 91, exp: "High", rate: "3.8/mo" },
    { name: "Institut Gustave Roussy", region: "France", score: 88, exp: "High", rate: "3.1/mo" },
    { name: "University of Toronto", region: "Canada", score: 82, exp: "Medium", rate: "2.4/mo" },
    { name: "Charité Berlin", region: "Germany", score: 79, exp: "Medium", rate: "2.2/mo" },
  ];

  if (showUpload) return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => setShowUpload(false)} className="hover:text-[#0EA5E9]">Protocol Analytics</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-800 font-medium">Upload Protocol</span>
      </div>
      <div className="flex items-center justify-center min-h-[calc(100%-56px)] p-8">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mx-auto mb-5">
            <Upload className="w-8 h-8 text-[#0EA5E9]" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Upload Clinical Protocol</h2>
          <p className="text-sm text-slate-500 mb-6">Drag and drop your protocol document — any stage, draft or final.</p>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 hover:border-[#0EA5E9]/50 hover:bg-blue-50/30 transition-colors cursor-pointer mb-4">
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Drop PDF or DOCX here</p>
              <p className="text-xs text-slate-400">or <span className="text-[#0EA5E9] font-medium">browse files</span></p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-1">Benchmarked against 328,000+ historical trials</p>
          <p className="text-xs text-slate-400">AES-256 encrypted · HIPAA compliant · Analysis in 3–7 minutes</p>
          <button onClick={() => setShowUpload(false)} className="mt-6 text-sm text-slate-400 hover:text-slate-600">← Back to analytics</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
        <span>Overview</span><ChevronRight className="w-3 h-3" />
        <span>Studies</span><ChevronRight className="w-3 h-3" />
        <span className="text-slate-800 font-medium">MERI-2024-001 · Protocol Analytics</span>
      </div>
      <div className="px-6 py-4 bg-blue-50/60 border-b border-blue-100 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono text-slate-500">MERI-2024-001</span>
            <Badge className="bg-emerald-100 text-emerald-700 text-xs">Analysis Complete</Badge>
          </div>
          <p className="text-sm font-semibold text-slate-800">Pembrolizumab + Chemo in NSCLC · Phase II · Analyzed 2 hours ago</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1"><Share2 className="w-3 h-3" /> Share Report</Button>
          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1" onClick={() => setShowUpload(true)}><Upload className="w-3 h-3" /> Upload New Version</Button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Success Probability", value: "73%", sub: "Above phase II baseline (58%)", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
            { label: "Est. Timeline", value: "28mo", sub: "Based on 47 comparable trials", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
            { label: "Risk Flags", value: "3", sub: "1 high · 2 medium severity", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
            { label: "Comparator Trials", value: "47", sub: "Matched from 328K+ database", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
              <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Protocol Vulnerabilities</h3>
            <div className="space-y-3">
              {vulnerabilities.map((v, i) => (
                <div key={i} className={`rounded-lg p-3 border ${v.severity === "High" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-slate-800">{v.title}</p>
                    <Badge className={`text-xs flex-shrink-0 ${v.severity === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{v.severity}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{v.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Design Strengths</h3>
            <div className="space-y-2 mb-4">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">{s}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Market Context</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">TAM</p><p className="font-semibold text-slate-700">$2.3B</p></div>
                <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">Competing Trials</p><p className="font-semibold text-slate-700">12 active</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Site Recommendations</h3>
            <Badge variant="outline" className="text-xs">ML-Scored · 400K+ sites</Badge>
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
              {sites.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{s.region}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0EA5E9] rounded-full" style={{ width: `${s.score}%` }}></div>
                      </div>
                      <span className="font-semibold text-slate-700">{s.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-xs ${s.exp === "High" ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700"}`}>{s.exp}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{s.rate}</td>
                  <td className="px-4 py-2.5">
                    <Button variant="outline" size="sm" className="text-xs">Add Site</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ExplorerScreen() {
  const [selectedTrial, setSelectedTrial] = useState(0);
  const trials = [
    { nct: "NCT02142894", title: "Pembrolizumab vs. Docetaxel in Previously Treated NSCLC", sponsor: "Merck Sharp & Dohme", phase: "Phase III", status: "Completed", enrolled: 1034, brief: "Landmark KEYNOTE-010 trial establishing pembrolizumab as standard of care in 2L+ NSCLC. PD-L1 TPS ≥1% required. OS benefit vs. chemo in both TPS ≥1% and ≥50% populations.", match: true },
    { nct: "NCT03978624", title: "Atezolizumab + Bevacizumab + Chemo in Stage IV NSCLC", sponsor: "Hoffmann-La Roche", phase: "Phase III", status: "Completed", enrolled: 1202, brief: "IMpower150 combination regimen showed OS benefit in EGFR/ALK-unselected NSCLC including liver metastases. Relevant comparator for chemo backbone design.", match: true },
    { nct: "NCT04292496", title: "Cemiplimab + Chemo vs. Chemo Alone in Advanced NSCLC", sponsor: "Regeneron", phase: "Phase III", status: "Recruiting", enrolled: 810, brief: "EMPOWER-Lung 3 evaluating cemiplimab in combination setting. Enrollment ongoing across 30+ countries. Similar eligibility design to MERI-2024-001.", match: true },
    { nct: "NCT04025879", title: "Nivolumab + Ipilimumab + Chemo in Stage IV NSCLC", sponsor: "Bristol Myers Squibb", phase: "Phase III", status: "Completed", enrolled: 719, brief: "CheckMate 9LA: dual checkpoint + 2 cycles chemo. Showed early and sustained OS benefit. Key comparator for dual IO strategies.", match: false },
    { nct: "NCT04387942", title: "Tislelizumab vs. Docetaxel in Pre-Treated NSCLC", sponsor: "BeiGene", phase: "Phase III", status: "Active", enrolled: 805, brief: "RATIONALE-303 global study of tislelizumab in 2L setting. PD-L1 unselected. Enrollment completed; awaiting final OS analysis.", match: false },
  ];
  const t = trials[selectedTrial];

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
            <Input className="pl-9 text-sm" defaultValue="pembrolizumab NSCLC" readOnly />
          </div>
          <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white">Search</Button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          {["Phase III", "Oncology", "Recruiting / Completed"].map(f => (
            <span key={f} className="flex items-center gap-1 text-xs bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20 rounded-full px-2.5 py-1 font-medium">
              {f} <X className="w-3 h-3 cursor-pointer" />
            </span>
          ))}
          <button className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 px-2 py-1 border border-dashed border-slate-300 rounded-full">
            <Plus className="w-3 h-3" /> Add Filter
          </button>
          <span className="ml-auto text-xs text-slate-500">1,247 results</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-5/12 overflow-y-auto border-r border-slate-200 divide-y divide-slate-100 bg-white">
          {trials.map((tr, i) => (
            <div key={i} onClick={() => setSelectedTrial(i)} className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedTrial === i ? "bg-blue-50 border-l-2 border-[#0EA5E9]" : ""}`}>
              {tr.match && <div className="text-xs text-[#0EA5E9] font-medium mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> Matches MERI-2024-001</div>}
              <p className="text-xs font-mono text-slate-400 mb-0.5">{tr.nct}</p>
              <p className="text-sm font-medium text-slate-800 leading-snug mb-1">{tr.title}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-1.5 py-0">{tr.phase}</Badge>
                <Badge className={`text-xs px-1.5 py-0 ${tr.status === "Completed" ? "bg-slate-100 text-slate-600" : tr.status === "Recruiting" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{tr.status}</Badge>
                <span className="text-xs text-slate-400">{tr.enrolled.toLocaleString()} enrolled</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-mono text-slate-400 mb-1">{t.nct}</p>
                <h2 className="text-base font-bold text-slate-900 leading-snug mb-2">{t.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t.phase}</Badge>
                  <Badge className={`text-xs ${t.status === "Completed" ? "bg-slate-100 text-slate-600" : t.status === "Recruiting" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{t.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs"><Download className="w-3 h-3 mr-1" />Export</Button>
                <Button size="sm" className="text-xs bg-[#0EA5E9] hover:bg-[#0284C7] text-white">Add to Study</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              {[["Sponsor", t.sponsor], ["Enrollment", `${t.enrolled.toLocaleString()} patients`], ["Phase", t.phase], ["Status", t.status]].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-2.5"><p className="text-slate-400 mb-0.5">{k}</p><p className="font-semibold text-slate-700">{v}</p></div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#0EA5E9]" /> AI Brief</p>
              <p className="text-sm text-slate-700 leading-relaxed">{t.brief}</p>
            </div>
            {t.match && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Relevant to Your Studies</p>
                <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                  <Star className="w-3 h-3 text-[#0EA5E9]" />
                  <span className="text-slate-600">Used as comparator in <span className="font-semibold text-slate-800">MERI-2024-001</span></span>
                </div>
              </div>
            )}
          </div>
        </div>
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
            <h1 className="text-lg font-bold text-slate-900">KOL Intelligence</h1>
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

function AskHakaseScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const suggestions = [
    { label: "Summarize enrollment risk across all active Meridian studies" },
    { label: "Analyze protocol risks for MERI-2024-089 (IL-23 Crohn's trial)" },
    { label: "Which sites are underperforming in MERI-2023-047?" },
    { label: "Identify KOLs for the CAR-T AML program (MERI-2025-002)" },
    { label: "Compare PFS assumptions in MERI-2024-001 vs KEYNOTE-010" },
    { label: "Draft eligibility criteria for MEK-i + PD-L1 melanoma study" },
  ];

  const agents = [
    {
      Icon: Brain,
      tag: "R&D",
      tagColor: "text-violet-600 bg-violet-50",
      title: "BioResearch Analyst",
      desc: "Benchmarks protocols against 328K+ trials. Flags design risks and competing programs.",
      color: "border-violet-100 hover:border-violet-300",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
      action: () => onNav("analytics"),
    },
    {
      Icon: Stethoscope,
      tag: "CLINICAL",
      tagColor: "text-emerald-600 bg-emerald-50",
      title: "Clinical Ops Director",
      desc: "Monitors site performance, enrollment pace, and flags at-risk milestones in real time.",
      color: "border-emerald-100 hover:border-emerald-300",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      action: () => onNav("studies"),
    },
    {
      Icon: Shield,
      tag: "REGULATORY",
      tagColor: "text-blue-600 bg-blue-50",
      title: "Regulatory Consultant",
      desc: "Reviews protocols for ICH E6(R3) and CDISC alignment. Drafts amendment justifications.",
      color: "border-blue-100 hover:border-blue-300",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      action: () => onNav("drafter"),
    },
    {
      Icon: Database,
      tag: "DATA",
      tagColor: "text-amber-600 bg-amber-50",
      title: "Data Quality Engine",
      desc: "Audits CRF completeness, flags missing data patterns, and validates CDISC datasets.",
      color: "border-amber-100 hover:border-amber-300",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      action: () => onNav("analytics"),
    },
    {
      Icon: Users,
      tag: "KOL",
      tagColor: "text-pink-600 bg-pink-50",
      title: "KOL Scout",
      desc: "Surfaces high-influence investigators for your indication using PubMed + trials data.",
      color: "border-pink-100 hover:border-pink-300",
      iconBg: "bg-pink-50",
      iconColor: "text-pink-500",
      action: () => onNav("kol"),
    },
    {
      Icon: Search,
      tag: "TRIALS",
      tagColor: "text-slate-600 bg-slate-100",
      title: "Trial Explorer",
      desc: "Searches 556K+ ClinicalTrials.gov records and generates AI briefs for any NCT study.",
      color: "border-slate-100 hover:border-slate-300",
      iconBg: "bg-slate-50",
      iconColor: "text-slate-500",
      action: () => onNav("explorer"),
    },
  ];

  const handleSubmit = () => {
    if (query.trim()) setSubmitted(query.trim());
  };

  if (submitted) return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white flex flex-col items-center p-8">
      <div className="w-full max-w-2xl">
        <button onClick={() => setSubmitted(null)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-6">
          ← New query
        </button>
        <div className="bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 rounded-2xl px-5 py-3 mb-6 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 font-medium">{submitted}</p>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#0EA5E9] flex items-center justify-center"><Sparkles className="w-3 h-3 text-white" /></div>
              <span className="text-sm font-semibold text-slate-800">Hakase AI · Meridian Therapeutics Context</span>
              <Badge className="text-xs bg-emerald-100 text-emerald-700 ml-auto">Live</Badge>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              Across your 7 active Meridian studies, I've identified <strong>3 enrollment risk signals</strong> requiring attention:
            </p>
            <div className="space-y-3">
              {[
                { study: "MERI-2024-089", risk: "Critical — Only 2 months to CSR deadline with 81% enrollment. Site 6 (Berlin) contributing 0 patients in last 30 days.", level: "Critical" },
                { study: "MERI-2023-047", risk: "At Risk — BRD4-i Phase III is 89% enrolled but 3 sites have dropout rates above protocol threshold (12% vs 8% expected).", level: "At Risk" },
                { study: "MERI-2025-002", risk: "Monitor — CAR-T AML Phase I is on track at 40% but competing NCT04739358 opened at MSKCC last week.", level: "Monitor" },
              ].map((r) => (
                <div key={r.study} className={`rounded-xl p-3 border text-sm ${r.level === "Critical" ? "bg-red-50 border-red-100" : r.level === "At Risk" ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-slate-500">{r.study}</span>
                    <Badge className={`text-xs ${r.level === "Critical" ? "bg-red-100 text-red-700" : r.level === "At Risk" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{r.level}</Badge>
                  </div>
                  <p className="text-slate-700">{r.risk}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
              <Button size="sm" className="text-xs bg-[#0EA5E9] hover:bg-[#0284C7] text-white" onClick={() => onNav("analytics")}>Open Protocol Analytics</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => onNav("studies")}>View All Studies</Button>
              <Button size="sm" variant="outline" className="text-xs">Export Report</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white flex flex-col items-center px-8 pt-14 pb-8">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div className="flex items-center gap-2 mb-5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" />
          <span className="text-xs font-semibold text-slate-600">Hakase Clinical Intelligence v2.0</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 text-center mb-3 leading-tight">
          Ask <span className="text-[#0EA5E9]">Hakase</span> anything
        </h1>
        <p className="text-slate-500 text-sm text-center mb-8 max-w-md leading-relaxed">
          Orchestrate clinical trials with autonomous AI agents. Search across all Meridian studies, protocols, and intelligence.
        </p>

        <div className="w-full mb-4">
          <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <Brain className="w-5 h-5 text-[#0EA5E9] absolute left-4 flex-shrink-0" />
            <input
              className="flex-1 pl-12 pr-14 py-4 text-sm bg-transparent rounded-2xl focus:outline-none text-slate-700 placeholder:text-slate-400"
              placeholder="Ask Hakase anything about Meridian's protocols, sites, or trials..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
            <button
              onClick={handleSubmit}
              className="absolute right-3 w-9 h-9 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full mb-10">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setSubmitted(s.label)}
              className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-full px-4 py-2 hover:border-[#0EA5E9]/40 hover:text-[#0EA5E9] hover:bg-blue-50/40 transition-all text-left w-fit"
            >
              <span className="text-[#0EA5E9] font-semibold text-xs">Ask Hakase</span>
              <span className="text-slate-400">·</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="w-full">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-4">Select Specialized Agent</p>
          <div className="grid grid-cols-3 gap-3">
            {agents.map((a, i) => (
              <button
                key={i}
                onClick={a.action}
                className={`bg-white rounded-2xl border p-4 text-left hover:shadow-md transition-all ${a.color}`}
              >
                <div className={`w-9 h-9 rounded-xl ${a.iconBg} flex items-center justify-center mb-3`}>
                  <a.Icon className={`w-5 h-5 ${a.iconColor}`} />
                </div>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${a.tagColor.split(" ")[0]}`}>{a.tag}</p>
                <p className="text-sm font-bold text-slate-800 mb-1">{a.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{a.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [screen, setScreen] = useState<Screen>("ask");

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar active={screen} onNav={setScreen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <div className="flex-1 flex overflow-hidden">
          {screen === "ask" && <AskHakaseScreen onNav={setScreen} />}
          {screen === "overview" && <OverviewScreen onNav={setScreen} />}
          {screen === "studies" && <StudiesScreen onNav={setScreen} />}
          {screen === "analytics" && <AnalyticsScreen />}
          {screen === "explorer" && <ExplorerScreen />}
          {screen === "drafter" && <DrafterScreen />}
          {screen === "kol" && <KOLScreen />}
          {screen === "team" && <TeamScreen />}
        </div>
      </div>
    </div>
  );
}
