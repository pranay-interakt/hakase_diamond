import { useState } from "react";
import {
  LayoutDashboard, Search, Shield, MapPin,
  CheckCircle2, TrendingUp, BookOpen, FileText, ChevronRight,
  Globe, Sparkles, Menu, X, Zap, Users, FlaskConical, Activity,
  BookOpen as BookOpenIcon
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

type Module =
  | "protocol"
  | "kols"
  | "bridge"
  | "regulatory";

const navGroups: { label?: string; items: { id: Module; label: string; icon: React.ReactNode; badge?: string }[] }[] = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "explorer",    label: "Trial Explorer",      icon: <Search className="h-4 w-4" /> },
      { id: "safety",      label: "Safety Intelligence", icon: <Shield className="h-4 w-4" /> },
      { id: "sites",       label: "Site Intelligence",   icon: <MapPin className="h-4 w-4" /> },
      { id: "evidence",    label: "Evidence Library",    icon: <BookOpen className="h-4 w-4" /> },
      { id: "kols",        label: "KOL Finder",          icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "protocol",    label: "Protocol Studio",     icon: <FileText className="h-4 w-4" />, badge: "AI" },
      { id: "simulation",  label: "Enrollment Sim",      icon: <TrendingUp className="h-4 w-4" /> },
      { id: "compliance",  label: "Compliance",          icon: <CheckCircle2 className="h-4 w-4" /> },
      { id: "regulatory",  label: "Regulatory AI",       icon: <FlaskConical className="h-4 w-4" /> },
    ],
  },
  {
    label: "Ecosystem",
    items: [
      { id: "bridge",      label: "Hakase Bridge",       icon: <Globe className="h-4 w-4" />, badge: "NEW" },
    ],
  },
];

const navItems = navGroups.flatMap(g => g.items);

const features: { icon: React.ReactNode; title: string; desc: string; module: Module }[] = [
  { icon: <Search className="h-5 w-5 text-blue-500" />, title: "Trial Explorer", desc: "Search the entire ClinicalTrials.gov registry in real time — 500K+ trials by condition, drug, phase, or status.", module: "explorer" },
  { icon: <Shield className="h-5 w-5 text-red-500" />, title: "Safety Intelligence", desc: "Access 20M+ FDA FAERS adverse events. Visualize reaction frequencies, serious outcomes, recall history and trends.", module: "safety" },
  { icon: <MapPin className="h-5 w-5 text-emerald-500" />, title: "Site Intelligence", desc: "Identify the best investigative sites globally ranked by enrollment rate, startup time, and prior trial experience.", module: "sites" },
  { icon: <CheckCircle2 className="h-5 w-5 text-amber-500" />, title: "Regulatory Compliance", desc: "Validate protocols against ICH E6/E8/E9, FDA 21 CFR, CONSORT, and WHO ICTRP with actionable remediation.", module: "compliance" },
  { icon: <TrendingUp className="h-5 w-5 text-cyan-500" />, title: "Enrollment Simulation", desc: "1,000-iteration Monte Carlo simulation. Rates auto-derived from real completed trials. P10/P50/P90 timelines.", module: "simulation" },
  { icon: <BookOpen className="h-5 w-5 text-violet-500" />, title: "Evidence Library", desc: "Mine 36M+ PubMed articles with automatic evidence level classification — meta-analyses, Phase 3 RCTs ranked first.", module: "evidence" },
  { icon: <Users className="h-5 w-5 text-indigo-500" />, title: "KOL Finder", desc: "Identify Key Opinion Leaders by mining PubMed authorship data — ranked by publications, first/senior authorship, and clinical trial involvement.", module: "kols" },
  { icon: <FileText className="h-5 w-5 text-pink-500" />, title: "Protocol Studio", desc: "Upload protocol PDFs for compliance analysis, manual parameter simulation, strategy tracking, and AI amendments.", module: "protocol" },
  { icon: <Globe className="h-5 w-5 text-sky-500" />, title: "Hakase Bridge", desc: "Directly import trial configurations from Hakase.bio Layer 4 for immersive cross-platform analysis and optimization.", module: "bridge" },
  { icon: <FlaskConical className="h-5 w-5 text-amber-500" />, title: "Regulatory AI", desc: "Navigate FDA/EMA requirements with AI-generated roadmaps, pre-IND checklist verification, and dossier preparation assistance.", module: "regulatory" },
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
      default:            return <Overview onNavigate={m => setActive(m)} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f1f5f9" }}>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 flex-shrink-0 flex flex-col transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          width: "260px",
          background: "linear-gradient(180deg,#0f172a 0%,#0c1628 55%,#091020 100%)",
          borderRight: "1px solid rgba(148,163,184,0.08)",
        }}
      >
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-xl blur-md opacity-70" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }} />
                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <p className="text-[13px] font-bold text-white tracking-tight leading-tight">hakase AI</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#94a3b8" }}>Clinical Trial Hub</p>
              </div>
            </div>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg transition-colors" style={{ background: "rgba(255,255,255,0.04)" }}>
              <X className="h-3.5 w-3.5" style={{ color: "#64748b" }} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "#475569" }}>
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
                      className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left group transition-all duration-200"
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg,rgba(59,130,246,0.18),rgba(99,102,241,0.12))"
                          : "transparent",
                        border: isActive
                          ? "1px solid rgba(99,130,246,0.2)"
                          : "1px solid transparent",
                      }}
                      onMouseEnter={e => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                      }}
                      onMouseLeave={e => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      {isActive && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ background: "linear-gradient(180deg,#3b82f6,#6366f1)" }}
                        />
                      )}

                      <span
                        className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200"
                        style={{
                          background: isActive
                            ? "linear-gradient(135deg,#3b82f6,#6366f1)"
                            : "rgba(255,255,255,0.08)",
                          boxShadow: isActive ? "0 0 12px rgba(99,102,241,0.35)" : "none",
                        }}
                      >
                        <span style={{ color: isActive ? "#fff" : "#cbd5e1" }}>{item.icon}</span>
                      </span>

                      <span
                        className="flex-1 text-[13px] font-semibold tracking-tight"
                        style={{ color: isActive ? "#fff" : "#cbd5e1" }}
                      >
                        {item.label}
                      </span>

                      {item.badge && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-widest"
                          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff" }}
                        >
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

        <div className="px-3 pb-4 pt-2" style={{ borderTop: "1px solid rgba(148,163,184,0.08)" }}>
          <div className="rounded-xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(148,163,184,0.07)" }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3" style={{ color: "#6ee7b7" }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#cbd5e1" }}>Live sources</span>
              </div>
              <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#34d399" }} />
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {[
                { name: "ClinicalTrials.gov", dot: "#3b82f6" },
                { name: "FDA FAERS",          dot: "#f87171" },
                { name: "PubMed",             dot: "#34d399" },
                { name: "OpenFDA",            dot: "#fb923c" },
              ].map(src => (
                <div key={src.name} className="flex items-center gap-1.5 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: src.dot }} />
                  <span className="text-[10px] truncate font-medium" style={{ color: "#94a3b8" }}>{src.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 lg:px-6 bg-white" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Menu className="h-5 w-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 cursor-pointer hover:text-blue-600 transition-colors font-medium" onClick={() => setActive("overview")}>Clinical Hub</span>
              {active !== "overview" && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  <span className="text-slate-800 font-semibold">{navItems.find(n => n.id === active)?.label}</span>
                </>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-xs hidden sm:flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All data sources live
          </Badge>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
            <div key={active} className="animate-in fade-in duration-150">
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
    <div className="space-y-8 max-w-5xl">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-2xl p-8 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 right-4 h-40 w-40 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-4 left-20 h-24 w-24 rounded-full bg-purple-400 blur-2xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-300" />
            <p className="text-blue-300 text-sm font-medium">Clinical Trial Intelligence Platform</p>
          </div>
          <h1 className="text-3xl font-bold mb-3">Hakase Clinical Hub</h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            A comprehensive, data-backed platform for accelerating clinical trials — combining real-time intelligence
            from ClinicalTrials.gov, FDA FAERS, PubMed, and OpenFDA to help you make faster, smarter,
            more data-driven decisions at every stage.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { label: "500K+ Trials", sub: "ClinicalTrials.gov" },
              { label: "20M+ AE Reports", sub: "FDA FAERS" },
              { label: "36M+ Articles", sub: "PubMed" },
              { label: "140K+ Drug Labels", sub: "OpenFDA" },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm border border-white/10">
                <p className="text-sm font-bold text-white">{item.label}</p>
                <p className="text-xs text-slate-300">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Platform Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map(f => (
            <button
              key={f.title}
              onClick={() => onNavigate(f.module)}
              className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors flex-shrink-0">
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Real-Time Data Sources</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "ClinicalTrials.gov", desc: "500K+ trials worldwide", icon: <FlaskConical className="h-4 w-4 text-blue-500" />, color: "bg-blue-50 border-blue-200" },
            { name: "FDA FAERS", desc: "20M+ adverse events", icon: <Shield className="h-4 w-4 text-red-500" />, color: "bg-red-50 border-red-200" },
            { name: "OpenFDA Labels", desc: "140K+ drug labels", icon: <Activity className="h-4 w-4 text-orange-500" />, color: "bg-orange-50 border-orange-200" },
            { name: "PubMed / NCBI", desc: "36M+ biomedical articles", icon: <BookOpenIcon className="h-4 w-4 text-emerald-500" />, color: "bg-emerald-50 border-emerald-200" },
          ].map(src => (
            <div key={src.name} className={`rounded-xl border p-4 ${src.color}`}>
              <div className="flex items-center gap-2 mb-2">
                {src.icon}
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{src.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{src.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1.5">Quick Start Guide</p>
            <ol className="text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
              <li>Use <strong>Trial Explorer</strong> to search for trials relevant to your indication</li>
              <li>Upload your protocol PDF to <strong>Protocol Studio</strong> — get compliance scoring, real-world outcome strategies, site recommendations, and KOL discovery all in one place</li>
              <li>Use <strong>KOL Finder</strong> to identify the leading investigators in your therapeutic area for partnership or advisory board recruitment</li>
              <li>Run an <strong>Enrollment Simulation</strong> to project timelines based on real historical enrollment data</li>
              <li>Check <strong>Safety Intelligence</strong> for the adverse event landscape before finalizing drug selection</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
