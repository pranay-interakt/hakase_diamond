import { useState } from "react";
import {
  LayoutDashboard, Search, Shield, MapPin,
  CheckCircle2, TrendingUp, BookOpen, FileText, ChevronRight,
  Globe, Sparkles, Menu, X, Users, FlaskConical, Activity,
  BookOpen as BookOpenIcon, TestTubeDiagonal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TrialExplorer from "@/components/modules/TrialExplorer";
import SafetyIntelligence from "@/components/modules/SafetyIntelligence";
import SiteIntelligence from "@/components/modules/SiteIntelligence";
import ComplianceChecker from "@/components/modules/ComplianceChecker";
import EnrollmentSimulation from "@/components/modules/EnrollmentSimulation";
import EvidenceLibrary from "@/components/modules/EvidenceLibrary";
import ProtocolStudio from "@/components/modules/ProtocolStudio";
import KOLFinder from "@/components/modules/KOLFinder";
import Bridge from "@/components/modules/Bridge";
import RegulatoryAI from "@/components/modules/RegulatoryAI";
import ClinicalTrialHub from "@/components/modules/ClinicalTrialHub";

type Module =
  | "overview" | "explorer" | "safety" | "sites"
  | "compliance" | "simulation" | "evidence"
  | "protocol" | "kols" | "bridge" | "regulatory" | "trialhub";

const navGroups: {
  label?: string;
  items: { id: Module; label: string; icon: React.ReactNode; badge?: string }[];
}[] = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "trialhub",   label: "Clinical Trial Hub",  icon: <TestTubeDiagonal className="h-4 w-4" />, badge: "SIM" },
    ],
  },
  {
    label: "Protocol & Discovery",
    items: [
      { id: "protocol",   label: "Protocol Studio",     icon: <FileText className="h-4 w-4" />, badge: "AI" },
      { id: "explorer",   label: "Trial Explorer",      icon: <Search className="h-4 w-4" /> },
      { id: "kols",       label: "KOL Identification",  icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "safety",     label: "Safety Intelligence", icon: <Shield className="h-4 w-4" /> },
      { id: "evidence",   label: "Evidence Library",    icon: <BookOpen className="h-4 w-4" /> },
      { id: "sites",      label: "Site Recommendation",  icon: <MapPin className="h-4 w-4" /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "simulation", label: "Enrollment Simulation", icon: <TrendingUp className="h-4 w-4" /> },
      { id: "compliance", label: "Regulatory Compliance", icon: <CheckCircle2 className="h-4 w-4" /> },
      { id: "bridge",     label: "Hakase Bridge",       icon: <Globe className="h-4 w-4" />, badge: "NEW" },
      { id: "regulatory", label: "Regulatory AI",       icon: <FlaskConical className="h-4 w-4" /> },
    ],
  },
];

const navItems = navGroups.flatMap(g => g.items);

const features: { icon: React.ReactNode; title: string; desc: string; module: Module }[] = [
  { icon: <TestTubeDiagonal className="h-5 w-5 text-pink-600" />, title: "Clinical Trial Hub", desc: "Simulate the entire clinical trial lifecycle in 7 stages — from discovery to outcomes — using live API data, ML success prediction, Monte Carlo enrollment, and cost optimization.", module: "trialhub" },
  { icon: <FileText className="h-5 w-5 text-pink-500" />, title: "Protocol Studio", desc: "Upload protocol PDFs. Run parameter simulations, track amendments, get AI suggestions, and discover sites & KOLs.", module: "protocol" },
  { icon: <Search className="h-5 w-5 text-blue-500" />, title: "Trial Explorer", desc: "Search 500K+ trials from ClinicalTrials.gov in real time by condition, drug, phase, or status.", module: "explorer" },
  { icon: <Users className="h-5 w-5 text-indigo-500" />, title: "KOL Identification", desc: "Identify Key Opinion Leaders from PubMed authorship data — ranked by publications and clinical trial involvement.", module: "kols" },
  { icon: <Shield className="h-5 w-5 text-rose-500" />, title: "Safety Intelligence", desc: "Access 20M+ FDA FAERS adverse events. Visualize reaction frequencies, serious outcomes, and recall history.", module: "safety" },
  { icon: <BookOpen className="h-5 w-5 text-violet-500" />, title: "Evidence Library", desc: "Mine 36M+ PubMed articles with automatic evidence classification — meta-analyses and Phase 3 RCTs ranked first.", module: "evidence" },
  { icon: <MapPin className="h-5 w-5 text-emerald-500" />, title: "Site Recommendation", desc: "Identify top investigative sites globally ranked by enrollment rate, startup time, and prior trial experience.", module: "sites" },
  { icon: <TrendingUp className="h-5 w-5 text-cyan-500" />, title: "Enrollment Simulation", desc: "1,000-iteration Monte Carlo. Rates auto-derived from real completed trials, producing P10/P50/P90 timelines.", module: "simulation" },
  { icon: <CheckCircle2 className="h-5 w-5 text-amber-500" />, title: "Regulatory Compliance", desc: "Validate protocols against ICH E6/E8/E9, FDA 21 CFR, CONSORT, and WHO ICTRP with actionable remediation.", module: "compliance" },
  { icon: <Globe className="h-5 w-5 text-sky-500" />, title: "Hakase Bridge", desc: "Import trial configurations from Hakase.bio Layer 4 for cross-platform analysis and clinical operational mapping.", module: "bridge" },
  { icon: <FlaskConical className="h-5 w-5 text-orange-500" />, title: "Regulatory AI", desc: "Generate FDA/EMA roadmaps, pre-IND readiness checklists, and receive alerts on the latest regulatory guidance.", module: "regulatory" },
];

export default function Dashboard() {
  const [active, setActive] = useState<Module>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderModule = () => {
    switch (active) {
      case "explorer":    return <TrialExplorer onSelectTrial={() => {}} />;
      case "safety":      return <SafetyIntelligence />;
      case "sites":       return <SiteIntelligence />;
      case "compliance":  return <ComplianceChecker />;
      case "simulation":  return <EnrollmentSimulation />;
      case "evidence":    return <EvidenceLibrary />;
      case "kols":        return <KOLFinder />;
      case "protocol":    return <ProtocolStudio />;
      case "bridge":      return <Bridge />;
      case "regulatory":  return <RegulatoryAI />;
      case "trialhub":    return <ClinicalTrialHub />;
      default:            return <Overview onNavigate={m => setActive(m)} />;
    }
  };


  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc" }}>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 flex-shrink-0 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          width: "240px",
          background: "#0b1120",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex flex-col items-center gap-2 w-full">
            <img
              src="/hakase-logo.png"
              alt="Hakase AI"
              className="h-7 w-auto object-contain mx-auto"
              style={{ background: "transparent" }}
            />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-200" style={{ letterSpacing: "0.12em" }}>Clinical Trial Hub</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden absolute right-4 top-5 w-6 h-6 flex items-center justify-center rounded" style={{ color: "#64748b" }}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-3">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-2.5 mb-1 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "#334155" }}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = active === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActive(item.id); setMobileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 relative"
                      style={{
                        background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                        border: `1px solid ${isActive ? "rgba(99,102,241,0.25)" : "transparent"}`,
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full" style={{ background: "linear-gradient(180deg,#6366f1,#3b82f6)" }} />
                      )}
                      <span
                        className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md transition-all"
                        style={{
                          background: isActive ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "rgba(255,255,255,0.06)",
                          boxShadow: isActive ? "0 0 8px rgba(99,102,241,0.4)" : "none",
                          color: isActive ? "#fff" : "#94a3b8",
                        }}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 text-[12.5px] font-semibold" style={{ color: isActive ? "#e2e8f0" : "#94a3b8" }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide"
                          style={{ background: item.badge === "NEW" ? "#0ea5e9" : item.badge === "SIM" ? "linear-gradient(135deg,#ec4899,#8b5cf6)" : "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff" }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Live sources */}
        <div className="px-2.5 pb-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3" style={{ color: "#34d399" }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>Live Sources</span>
              </div>
              <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#34d399" }} />
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              {[
                { name: "ClinicalTrials", dot: "#3b82f6" },
                { name: "FDA FAERS",      dot: "#f87171" },
                { name: "PubMed",         dot: "#34d399" },
                { name: "OpenFDA",        dot: "#fb923c" },
              ].map(src => (
                <div key={src.name} className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: src.dot }} />
                  <span className="text-[10px] font-medium truncate" style={{ color: "#64748b" }}>{src.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="flex-shrink-0 h-13 flex items-center justify-between px-5 lg:px-7 bg-white" style={{ borderBottom: "1px solid #e2e8f0", height: "52px" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <Menu className="h-4.5 w-4.5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setActive("overview")}
                className="text-slate-400 hover:text-blue-600 transition-colors font-medium text-[13px]"
              >
                Clinical Hub
              </button>
              {active !== "overview" && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  <span className="text-slate-800 font-semibold text-[13px]">
                    {navItems.find(n => n.id === active)?.label}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[11px] hidden sm:flex items-center gap-1.5 px-2.5 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All sources live
            </Badge>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-5 lg:px-8 py-6 max-w-6xl mx-auto w-full">
            <div key={active} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              {renderModule()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Overview({ onNavigate }: { onNavigate: (m: Module) => void }) {
  return (
    <div className="space-y-7">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#0b1120 0%,#0f1f40 50%,#0b1a35 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#6366f1,transparent)" }} />
          <div className="absolute -bottom-10 left-10 h-40 w-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#3b82f6,transparent)" }} />
        </div>
        <div className="relative px-8 py-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-300">Hakase AI</span>
              <span className="h-3.5 w-px bg-blue-400/40" />
              <span className="text-[11px] font-medium text-blue-400/80">Clinical Trial Intelligence Platform</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Hakase Clinical Hub</h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed mb-6">
            A comprehensive, data-backed platform for accelerating clinical trials — combining real-time intelligence
            from ClinicalTrials.gov, FDA FAERS, PubMed, and OpenFDA to help you make faster, smarter decisions at every stage.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: "500K+ Trials",       sub: "ClinicalTrials.gov", color: "#3b82f6" },
              { label: "20M+ AE Reports",    sub: "FDA FAERS",          color: "#f87171" },
              { label: "36M+ Articles",      sub: "PubMed",             color: "#34d399" },
              { label: "140K+ Drug Labels",  sub: "OpenFDA",            color: "#fb923c" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                <div>
                  <p className="text-[13px] font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-slate-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3">Platform Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map(f => (
            <button
              key={f.title}
              onClick={() => onNavigate(f.module)}
              className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100/50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors flex-shrink-0">
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[13px] font-bold text-slate-900">{f.title}</p>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3">Real-Time Data Sources</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "ClinicalTrials.gov", desc: "500K+ trials worldwide",   icon: <FlaskConical className="h-4 w-4 text-blue-500" />,   color: "bg-blue-50 border-blue-100" },
            { name: "FDA FAERS",          desc: "20M+ adverse events",      icon: <Shield className="h-4 w-4 text-rose-500" />,          color: "bg-rose-50 border-rose-100" },
            { name: "OpenFDA Labels",     desc: "140K+ drug labels",        icon: <Activity className="h-4 w-4 text-orange-500" />,      color: "bg-orange-50 border-orange-100" },
            { name: "PubMed / NCBI",      desc: "36M+ biomedical articles", icon: <BookOpenIcon className="h-4 w-4 text-emerald-500" />, color: "bg-emerald-50 border-emerald-100" },
          ].map(src => (
            <div key={src.name} className={`rounded-xl border p-4 ${src.color}`}>
              <div className="flex items-center gap-2 mb-2">
                {src.icon}
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[13px] font-bold text-slate-800">{src.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{src.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-bold text-indigo-900 mb-2">Quick Start</p>
            <ol className="text-[12px] text-indigo-700 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Use <strong>Trial Explorer</strong> to search for trials relevant to your indication</li>
              <li>Upload your protocol PDF to <strong>Protocol Studio</strong> — simulate parameters, get AI amendment suggestions</li>
              <li>Use <strong>KOL Identification</strong> to identify leading investigators in your therapeutic area</li>
              <li>Run an <strong>Enrollment Simulation</strong> to project timelines from real historical enrollment data</li>
              <li>Check <strong>Safety Intelligence</strong> for the adverse event landscape before finalizing drug selection</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
