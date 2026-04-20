import { useState } from "react";
import {
  LayoutDashboard, Search, Shield, MapPin,
  CheckCircle2, TrendingUp, BookOpen, FileText, ChevronRight,
  Globe, Sparkles, Menu, X, Users, FlaskConical, Activity,
  BookOpen as BookOpenIcon, TestTubeDiagonal, Zap, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  items: { id: Module; label: string; icon: React.ReactNode; badge?: string; color?: string }[];
}[] = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, color: "#6366f1" },
      { id: "trialhub", label: "Clinical Trial Hub", icon: <TestTubeDiagonal className="h-4 w-4" />, badge: "SIM", color: "#ec4899" },
    ],
  },
  {
    label: "Protocol & Discovery",
    items: [
      { id: "protocol", label: "Protocol Studio", icon: <FileText className="h-4 w-4" />, badge: "AI", color: "#8b5cf6" },
      { id: "explorer", label: "Trial Explorer", icon: <Search className="h-4 w-4" />, color: "#3b82f6" },
      { id: "kols", label: "KOL Identification", icon: <Users className="h-4 w-4" />, color: "#6366f1" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "safety", label: "Safety Intelligence", icon: <Shield className="h-4 w-4" />, color: "#ef4444" },
      { id: "evidence", label: "Evidence Library", icon: <BookOpen className="h-4 w-4" />, color: "#8b5cf6" },
      { id: "sites", label: "Site Recommendation", icon: <MapPin className="h-4 w-4" />, color: "#10b981" },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "simulation", label: "Enrollment Simulation", icon: <TrendingUp className="h-4 w-4" />, color: "#06b6d4" },
      { id: "compliance", label: "Regulatory Compliance", icon: <CheckCircle2 className="h-4 w-4" />, color: "#f59e0b" },
      { id: "bridge", label: "Hakase Bridge", icon: <Globe className="h-4 w-4" />, badge: "NEW", color: "#0ea5e9" },
      { id: "regulatory", label: "Regulatory AI", icon: <FlaskConical className="h-4 w-4" />, color: "#fb923c" },
    ],
  },
];

const navItems = navGroups.flatMap(g => g.items);

const features: { icon: React.ReactNode; title: string; desc: string; module: Module; accent: string; emoji: string }[] = [
  { icon: <TestTubeDiagonal className="h-4.5 w-4.5" />, title: "Clinical Trial Hub", desc: "Simulate the entire clinical trial lifecycle in 6 stages using live API data, ML success prediction, Monte Carlo enrollment, and cost optimization.", module: "trialhub", accent: "#ec4899", emoji: "⚗️" },
  { icon: <FileText className="h-4.5 w-4.5" />, title: "Protocol Studio", desc: "Upload protocol PDFs. Run parameter simulations, track amendments, get AI suggestions, and discover sites & KOLs.", module: "protocol", accent: "#8b5cf6", emoji: "📋" },
  { icon: <Search className="h-4.5 w-4.5" />, title: "Trial Explorer", desc: "Search 500K+ trials from ClinicalTrials.gov in real time by condition, drug, phase, or status.", module: "explorer", accent: "#3b82f6", emoji: "🔍" },
  { icon: <Users className="h-4.5 w-4.5" />, title: "KOL Identification", desc: "Identify Key Opinion Leaders from PubMed authorship data — ranked by publications and clinical trial involvement.", module: "kols", accent: "#6366f1", emoji: "👥" },
  { icon: <Shield className="h-4.5 w-4.5" />, title: "Safety Intelligence", desc: "Access 20M+ FDA FAERS adverse events. Visualize reaction frequencies, serious outcomes, and recall history.", module: "safety", accent: "#ef4444", emoji: "🛡️" },
  { icon: <BookOpen className="h-4.5 w-4.5" />, title: "Evidence Library", desc: "Mine 36M+ PubMed articles with automatic evidence classification — meta-analyses and Phase 3 RCTs ranked first.", module: "evidence", accent: "#8b5cf6", emoji: "📚" },
  { icon: <MapPin className="h-4.5 w-4.5" />, title: "Site Recommendation", desc: "Identify top investigative sites globally ranked by enrollment rate, startup time, and prior trial experience.", module: "sites", accent: "#10b981", emoji: "📍" },
  { icon: <TrendingUp className="h-4.5 w-4.5" />, title: "Enrollment Simulation", desc: "1,000-iteration Monte Carlo. Rates auto-derived from real completed trials, producing P10/P50/P90 timelines.", module: "simulation", accent: "#06b6d4", emoji: "📈" },
  { icon: <CheckCircle2 className="h-4.5 w-4.5" />, title: "Regulatory Compliance", desc: "Validate protocols against ICH E6/E8/E9, FDA 21 CFR, CONSORT, and WHO ICTRP with actionable remediation.", module: "compliance", accent: "#f59e0b", emoji: "✅" },
  { icon: <Globe className="h-4.5 w-4.5" />, title: "Hakase Bridge", desc: "Import trial configurations from Hakase.bio Layer 4 for cross-platform analysis and clinical operational mapping.", module: "bridge", accent: "#0ea5e9", emoji: "🌐" },
  { icon: <FlaskConical className="h-4.5 w-4.5" />, title: "Regulatory AI", desc: "Generate FDA/EMA roadmaps, pre-IND readiness checklists, and receive alerts on the latest regulatory guidance.", module: "regulatory", accent: "#fb923c", emoji: "🧬" },
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

  const activeItem = navItems.find(n => n.id === active);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f0f4f8" }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 40 }}
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: 248, flexShrink: 0, display: "flex", flexDirection: "column",
          background: "linear-gradient(180deg, #0c1426 0%, #0a1020 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50,
          transform: mobileOpen ? "translateX(0)" : undefined,
        }}
        className={!mobileOpen ? "lg:relative lg:translate-x-0 -translate-x-full" : ""}
      >
        {/* Logo */}
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <img src="/hakase-logo-transparent.png" alt="Hakase AI" style={{ height: 28, width: "auto", objectFit: "contain" }} />
            <button onClick={() => setMobileOpen(false)} className="lg:hidden" style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#334155", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 6 }}>Clinical Trial Hub</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          {navGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 20 }}>
              {group.label && (
                <div style={{ padding: "0 10px", marginBottom: 6, fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {group.label}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.items.map(item => {
                  const isActive = active === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => { setActive(item.id); setMobileOpen(false); }}
                      whileHover={!isActive ? { x: 2 } : {}}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10,
                        background: isActive ? `${item.color || "#6366f1"}18` : "transparent",
                        border: `1px solid ${isActive ? `${item.color || "#6366f1"}30` : "transparent"}`,
                        cursor: "pointer", textAlign: "left", width: "100%", position: "relative",
                      }}
                    >
                      {isActive && (
                        <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, borderRadius: "0 3px 3px 0", background: item.color || "#6366f1" }} />
                      )}
                      <div style={{
                        width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? (item.color || "#6366f1") : "rgba(255,255,255,0.07)",
                        color: isActive ? "#fff" : "#94a3b8",
                        boxShadow: isActive ? `0 0 10px ${item.color || "#6366f1"}40` : "none",
                        transition: "all 0.15s",
                      }}>
                        {item.icon}
                      </div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "#e2e8f0" : "#8a9ab5" }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 6, letterSpacing: "0.05em",
                          background: item.badge === "NEW" ? "#0ea5e9" : item.badge === "SIM" ? "linear-gradient(135deg,#ec4899,#8b5cf6)" : "linear-gradient(135deg,#6366f1,#3b82f6)",
                          color: "#fff",
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Live sources */}
        <div style={{ padding: "12px 10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Live Sources</span>
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 8px" }}>
              {[
                { name: "ClinicalTrials", dot: "#3b82f6" },
                { name: "FDA FAERS", dot: "#ef4444" },
                { name: "PubMed", dot: "#22c55e" },
                { name: "OpenFDA", dot: "#fb923c" },
              ].map(src => (
                <div key={src.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: src.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 500, color: "#64748b" }}>{src.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginLeft: 248 }} className="lg:ml-[248px] ml-0">
        {/* Topbar */}
        <header style={{
          flexShrink: 0, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px",
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setMobileOpen(true)} className="lg:hidden" style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
              <Menu className="h-5 w-5" />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <button onClick={() => setActive("overview")} style={{ color: "#94a3b8", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Clinical Hub
              </button>
              {active !== "overview" && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" style={{ color: "#cbd5e1" }} />
                  <span style={{ color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    {activeItem && (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 5, background: activeItem.color ? `${activeItem.color}18` : "#f1f5f9", color: activeItem.color || "#6366f1" }}>
                        {activeItem.icon}
                      </span>
                    )}
                    {activeItem?.label}
                  </span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>All sources live</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", background: "#f8fafc" }}>
          <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: "easeOut" }}>
                {renderModule()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function Overview({ onNavigate }: { onNavigate: (m: Module) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Hero banner */}
      <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 60%, #fdf2f8 100%)", border: "1px solid #e2e8f0" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: 40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.07), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", padding: "32px 36px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.12em", textTransform: "uppercase" }}>Hakase AI</span>
                <span style={{ width: 1, height: 12, background: "#c7d2fe" }} />
                <span style={{ fontSize: 11, color: "#64748b" }}>Clinical Trial Intelligence Platform</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.02em" }}>
                Hakase Clinical Hub
              </h1>
              <p style={{ fontSize: 13.5, color: "#475569", maxWidth: 520, lineHeight: 1.7, marginBottom: 22 }}>
                A comprehensive, data-backed platform for accelerating clinical trials — combining real-time intelligence
                from ClinicalTrials.gov, FDA FAERS, PubMed, and OpenFDA.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { label: "500K+ Trials", sub: "ClinicalTrials.gov", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
                  { label: "20M+ AE Reports", sub: "FDA FAERS", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                  { label: "36M+ Articles", sub: "PubMed", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                  { label: "140K+ Drug Labels", sub: "OpenFDA", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 10, background: item.bg, border: `1px solid ${item.border}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{item.label}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8" }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 6px 24px rgba(99,102,241,0.25)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate("trialhub")}
              style={{ padding: "12px 22px", borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, boxShadow: "0 4px 14px rgba(99,102,241,0.2)" }}>
              <Zap className="h-4 w-4" />
              Run Simulation
            </motion.button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Clinical Trials Indexed", value: "500K+", icon: <FlaskConical className="h-4 w-4" />, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Adverse Event Reports", value: "20M+", icon: <Shield className="h-4 w-4" />, color: "#ef4444", bg: "#fef2f2" },
          { label: "PubMed Articles", value: "36M+", icon: <BookOpenIcon className="h-4 w-4" />, color: "#10b981", bg: "#f0fdf4" },
          { label: "Monte Carlo Iterations", value: "1,000", icon: <TrendingUp className="h-4 w-4" />, color: "#f59e0b", bg: "#fffbeb" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: stat.bg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modules grid */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Platform Modules</h2>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>11 modules available</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {features.map(f => (
            <motion.button
              key={f.title}
              onClick={() => onNavigate(f.module)}
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              whileTap={{ scale: 0.98 }}
              style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 18px", textAlign: "left", cursor: "pointer", display: "block", width: "100%" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${f.accent}12`, color: f.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                  {f.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{f.title}</span>
                    <ArrowRight className="h-3.5 w-3.5" style={{ color: "#cbd5e1", flexShrink: 0 }} />
                  </div>
                  <p style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Data Sources + Quick Start */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Data Sources */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px 22px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Real-Time Data Sources</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { name: "ClinicalTrials.gov", desc: "500K+ trials worldwide", dot: "#3b82f6", tag: "v2 API" },
              { name: "FDA FAERS", desc: "20M+ adverse events", dot: "#ef4444", tag: "OpenFDA" },
              { name: "OpenFDA Labels", desc: "140K+ drug labels", dot: "#fb923c", tag: "REST API" },
              { name: "PubMed / NCBI", desc: "36M+ biomedical articles", dot: "#10b981", tag: "Entrez" },
            ].map(src => (
              <div key={src.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: src.dot }} />
                  <motion.div animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ position: "absolute", inset: -2, borderRadius: "50%", background: src.dot }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{src.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{src.desc}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: src.dot, background: `${src.dot}15`, padding: "2px 8px", borderRadius: 6 }}>{src.tag}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick start */}
        <div style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", borderRadius: 16, padding: "24px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Sparkles className="h-4 w-4" style={{ color: "#a5b4fc" }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Quick Start Guide</span>
            </div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { n: 1, text: "Search ClinicalTrials.gov with Trial Explorer" },
                { n: 2, text: "Upload your protocol PDF to Protocol Studio" },
                { n: 3, text: "Identify KOLs from PubMed authorship data" },
                { n: 4, text: "Run an Enrollment Monte Carlo Simulation" },
                { n: 5, text: "Check Safety Intelligence for your drug" },
              ].map(item => (
                <li key={item.n} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0, marginTop: 1 }}>{item.n}</div>
                  <span style={{ fontSize: 12.5, color: "#c7d2fe", lineHeight: 1.5 }}>{item.text}</span>
                </li>
              ))}
            </ol>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, background: "rgba(255,255,255,0.25)" }}
            onClick={() => onNavigate("trialhub")}
            style={{ marginTop: 20, padding: "11px 20px", borderRadius: 11, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Zap className="h-3.5 w-3.5" />
            Launch Clinical Trial Hub
          </motion.button>
        </div>
      </div>
    </div>
  );
}
