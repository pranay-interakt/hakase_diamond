import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useSpring,
} from "framer-motion";

// ─── Utility ──────────────────────────────────────────────

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return pos;
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let v = 0;
    const step = Math.ceil(to / 60);
    const id = setInterval(() => {
      v += step;
      if (v >= to) { setVal(to); clearInterval(id); } else setVal(v);
    }, 16);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Animated gradient mesh background ────────────────────

function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #020817 0%, #0a0f1e 40%, #050d1f 100%)" }} />
      <motion.div
        className="absolute rounded-full blur-3xl opacity-20"
        style={{ width: 700, height: 700, top: -200, left: -200, background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], x: [-20, 20, -20], y: [-10, 10, -10] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full blur-3xl opacity-15"
        style={{ width: 500, height: 500, top: 100, right: -150, background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
        animate={{ scale: [1.1, 1, 1.1], x: [15, -15, 15], y: [10, -10, 10] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute rounded-full blur-3xl opacity-10"
        style={{ width: 400, height: 400, bottom: -100, left: "40%", background: "radial-gradient(circle, #ec4899 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1], x: [-10, 20, -10] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
        backgroundSize: "64px 64px",
      }} />
    </div>
  );
}

// ─── Mouse glow follower ──────────────────────────────────

function MouseGlow() {
  const { x, y } = useMousePosition();
  const springX = useSpring(x, { damping: 30, stiffness: 150 });
  const springY = useSpring(y, { damping: 30, stiffness: 150 });
  return (
    <motion.div
      className="pointer-events-none fixed z-0 rounded-full opacity-[0.08]"
      style={{
        width: 600, height: 600,
        left: springX, top: springY,
        x: "-50%", y: "-50%",
        background: "radial-gradient(circle, #6366f1, transparent 60%)",
      }}
    />
  );
}

// ─── Floating stat card ────────────────────────────────────

function FloatCard({ icon, value, label, delay = 0, style }: { icon: string; value: string; label: string; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute rounded-2xl px-4 py-3 flex items-center gap-3 select-none"
      style={{
        background: "rgba(10,15,30,0.85)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset",
        ...style,
      }}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <div style={{ fontWeight: 900, fontSize: 16, color: "white", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{label}</div>
      </div>
    </motion.div>
  );
}

// ─── Feature card ─────────────────────────────────────────

function FeatureCard({ icon, title, desc, color, delay = 0 }: { icon: string; title: string; desc: string; color: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -6 }}
      className="relative rounded-2xl p-6 cursor-default"
      style={{
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered ? `0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.15) inset` : "0 4px 20px rgba(0,0,0,0.15)",
        transition: "all 0.3s ease",
      }}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 30% 30%, ${color}15, transparent 70%)` }}
          />
        )}
      </AnimatePresence>
      <div className="relative">
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="text-[15px] font-black text-white mb-2 leading-tight">{title}</h3>
        <p className="text-[13px] text-slate-400 leading-relaxed">{desc}</p>
        <motion.div
          className="mt-4 text-[12px] font-bold flex items-center gap-1"
          style={{ color }}
          animate={hovered ? { x: 4 } : { x: 0 }}
          transition={{ duration: 0.2 }}
        >
          Learn more →
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Stat card ────────────────────────────────────────────

function StatItem({ n, suffix, label, icon, delay = 0 }: { n: number; suffix: string; label: string; icon: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center p-8 rounded-2xl relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <span className="text-4xl mb-4">{icon}</span>
      <div className="text-5xl font-black text-white mb-2" style={{ textShadow: "0 0 30px rgba(99,102,241,0.5)" }}>
        {inView ? <Counter to={n} suffix={suffix} /> : "0"}
      </div>
      <p className="text-[13px] text-slate-400 font-medium leading-relaxed max-w-[140px]">{label}</p>
    </motion.div>
  );
}

// ─── Workflow step ─────────────────────────────────────────

function WorkflowStep({ n, icon, title, desc, color, delay = 0 }: { n: string; icon: string; title: string; desc: string; color: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-6"
    >
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black relative"
          style={{ background: `linear-gradient(135deg, ${color}25, ${color}10)`, border: `1.5px solid ${color}40`, boxShadow: `0 0 24px ${color}20` }}>
          {icon}
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
            style={{ background: color }}>
            {n}
          </div>
        </div>
      </div>
      <div className="flex-1 pt-2">
        <h3 className="text-[16px] font-black text-white mb-2">{title}</h3>
        <p className="text-[13px] text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Dashboard Mockup ─────────────────────────────────────

function DashMockup() {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", display: "flex", height: "100%", overflow: "hidden", borderRadius: 12, background: "#0d1117" }}>
      {/* Sidebar */}
      <div style={{ width: 160, background: "#080d14", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "16px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 12px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#6366f1,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: 10, fontWeight: 900 }}>H</span>
          </div>
          <span style={{ color: "white", fontWeight: 800, fontSize: 12 }}>Hakase</span>
        </div>
        {["Overview", "Trial Hub", "Trial Explorer", "KOL Finder", "Safety Intel", "Enrollment", "Sites"].map((item, i) => (
          <div key={item} style={{
            padding: "7px 12px", display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
            background: i === 1 ? "rgba(99,102,241,0.15)" : "transparent",
            borderRight: i === 1 ? "2px solid #6366f1" : "2px solid transparent",
            margin: "0 0 2px",
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: i === 1 ? "#6366f1" : "#334155" }} />
            <span style={{ fontSize: 10, fontWeight: i === 1 ? 700 : 500, color: i === 1 ? "#a5b4fc" : "#64748b" }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10, color: "#475569" }}>Clinical Trial Hub · Stage 1: Discovery</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 9, color: "#34d399", fontWeight: 700 }}>Live Engine</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, overflow: "hidden" }}>
          {/* KPI cards */}
          {[
            { label: "Active Trials", value: "2,847", color: "#6366f1" },
            { label: "Safety Score", value: "78/100", color: "#10b981" },
            { label: "PubMed Articles", value: "14,302", color: "#06b6d4" },
            { label: "Unmet Need", value: "82/100", color: "#f59e0b" },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "10px 12px",
            }}>
              <div style={{ fontSize: 8, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}

          {/* Competitor bar chart */}
          <div style={{ gridColumn: "span 2", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Competitive Landscape · Top Phase Distribution</div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 48 }}>
              {[65, 42, 88, 31, 57, 74, 29, 93].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: 3, background: `linear-gradient(180deg, #6366f1${i % 2 === 0 ? "cc" : "66"}, #6366f133)`, height: `${h}%` }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {["P1","P2","P3","P4","P5","P6","P7","P8"].map(l => (
                <span key={l} style={{ fontSize: 7, color: "#334155" }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main landing page ────────────────────────────────────

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const { scrollY } = useScroll();

  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, 80]);
  const mockupRotate = useTransform(scrollY, [0, 600], [8, 0]);
  const mockupScale = useTransform(scrollY, [0, 600], [0.9, 1]);
  const mockupY = useTransform(scrollY, [0, 600], [30, 0]);

  useEffect(() => {
    const unsub = scrollY.on("change", v => setNavScrolled(v > 40));
    return unsub;
  }, [scrollY]);

  const features = [
    { icon: "🔭", title: "Discovery & Landscape Analysis", desc: "Pull live data from ClinicalTrials.gov (560K+ trials) to map the competitive landscape, assess unmet need, and identify development opportunities.", color: "#6366f1" },
    { icon: "📍", title: "Intelligent Site Selection", desc: "Rank and score clinical sites based on real trial history, geographic diversity (Shannon entropy), and predicted activation timelines.", color: "#10b981" },
    { icon: "🧬", title: "Live Safety Intelligence", desc: "Analyze 20M+ FDA FAERS adverse event reports with PRR/ROR signal detection. Know your drug's safety profile before you start.", color: "#ef4444" },
    { icon: "📈", title: "Monte Carlo Enrollment Simulation", desc: "Run thousands of probabilistic simulations to predict P10/P50/P90 enrollment timelines and model optimistic vs. conservative scenarios.", color: "#ec4899" },
    { icon: "⚖️", title: "Regulatory Intelligence", desc: "Map IND/CTA timelines, identify Fast Track and Breakthrough Therapy designations, and generate submission checklists automatically.", color: "#f59e0b" },
    { icon: "🏆", title: "GO / NO-GO Outcome Prediction", desc: "ML ensemble model (Gradient Boosting + Random Forest) trained on 350K+ trials gives you a data-backed success probability with confidence intervals.", color: "#06b6d4" },
  ];

  const steps = [
    { n: "1", icon: "🎯", title: "Define Your Trial Parameters", desc: "Enter your indication, intervention, target phase, and sponsor type. The engine fetches live data from ClinicalTrials.gov and PubMed instantly.", color: "#6366f1" },
    { n: "2", icon: "⚡", title: "Run Stage-by-Stage Simulations", desc: "Progress through 6 sequential stages — from landscape discovery to site selection, regulatory mapping, enrollment simulation, and execution monitoring.", color: "#06b6d4" },
    { n: "3", icon: "📊", title: "Get Data-Backed Insights", desc: "Each stage returns real outputs: ranked sites, safety signals, Monte Carlo distributions, cost models, and ML-powered success probabilities.", color: "#10b981" },
    { n: "4", icon: "✅", title: "Make Confident Decisions", desc: "The final stage delivers a GO/NO-GO framework with NPV estimates, regulatory filing recommendations, and post-trial optimizations.", color: "#f59e0b" },
  ];

  const marqueeItems = [
    "560K+ Trials Indexed", "Live ClinicalTrials.gov API", "FDA FAERS Safety Signals", "Monte Carlo Simulation",
    "ML Success Prediction", "PubMed Literature Mining", "Geographic Site Scoring", "ICH / FDA Aligned",
  ];

  return (
    <div style={{ background: "#020817", color: "white", minHeight: "100vh", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>
      <MouseGlow />

      {/* ── NAV ── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: navScrolled ? "rgba(2,8,23,0.92)" : "transparent",
          borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
          backdropFilter: navScrolled ? "blur(20px)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", height: 68, display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
              <span style={{ color: "white", fontSize: 16, fontWeight: 900 }}>H</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 20, color: "white", letterSpacing: "-0.02em" }}>hakase<span style={{ color: "#6366f1" }}>AI</span></span>
          </a>

          <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 36 }} className="hidden md:flex">
            {["Features", "How it Works", "Impact"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                style={{ fontSize: 14, fontWeight: 500, color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
                {item}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setLocation("/dashboard")}
              style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", background: "transparent", border: "none", cursor: "pointer", padding: "8px 16px" }}>
              Sign In
            </button>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(99,102,241,0.45)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation("/dashboard")}
              style={{ fontSize: 14, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", cursor: "pointer", padding: "10px 22px", borderRadius: 12 }}>
              Launch App →
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", paddingTop: 80 }}>
        <MeshBackground />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px", position: "relative", zIndex: 1, width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left: Text */}
            <motion.div style={{ opacity: heroOpacity, y: heroY }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 100, marginBottom: 28, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.04em" }}>AI-POWERED CLINICAL INTELLIGENCE</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                style={{ fontSize: "clamp(42px, 5vw, 64px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 24, color: "white" }}>
                The Intelligence<br />Platform for{" "}
                <span style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Clinical Trials
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
                style={{ fontSize: 17, color: "#94a3b8", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
                From discovery to outcome prediction — Hakase pulls live data from ClinicalTrials.gov, FDA FAERS, and PubMed to give you AI-powered insights at every stage of your trial.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
                style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(99,102,241,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLocation("/dashboard")}
                  style={{ fontSize: 15, fontWeight: 800, color: "white", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", cursor: "pointer", padding: "14px 28px", borderRadius: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  Launch Dashboard <span>→</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.08)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", padding: "14px 28px", borderRadius: 14 }}>
                  See How It Works
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {["🔵", "🟣", "🔵"].map((c, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: i === 1 ? "#6366f1" : "#1e293b", border: "2px solid #020817", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: i > 0 ? -8 : 0, fontSize: 10 }}>
                      {["CG", "PB", "FD"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Live APIs: ClinicalTrials.gov · PubMed · FDA FAERS</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Dashboard mockup */}
            <motion.div style={{ position: "relative" }}>
              <motion.div
                initial={{ opacity: 0, y: 60, rotateX: 15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ perspective: 1200 }}
              >
                <motion.div
                  style={{ rotateX: mockupRotate, scale: mockupScale, y: mockupY, transformStyle: "preserve-3d" }}
                >
                  {/* Browser frame */}
                  <div style={{
                    borderRadius: 18, overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 80px rgba(99,102,241,0.15)",
                  }}>
                    {/* Browser chrome */}
                    <div style={{ background: "#0d1117", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {["#ef4444", "#f59e0b", "#10b981"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                      </div>
                      <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "3px 10px", fontSize: 10, color: "#475569", textAlign: "center" }}>
                        app.hakase.ai/dashboard
                      </div>
                    </div>
                    <div style={{ height: 340 }}>
                      <DashMockup />
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating cards */}
              <FloatCard icon="🧬" value="73.2%" label="Success Probability" delay={1.0} style={{ bottom: -20, left: -40 }} />
              <FloatCard icon="📍" value="43 Sites" label="8 Countries Selected" delay={1.2} style={{ top: 20, right: -30 }} />
              <FloatCard icon="⚡" value="1,000 sims" label="Monte Carlo Run" delay={1.4} style={{ top: "50%", right: -50 }} />

              {/* Glow under mockup */}
              <div style={{ position: "absolute", bottom: -60, left: "50%", transform: "translateX(-50%)", width: "80%", height: 80, background: "radial-gradient(ellipse, rgba(99,102,241,0.3), transparent)", filter: "blur(20px)", pointerEvents: "none" }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ background: "rgba(99,102,241,0.08)", borderTop: "1px solid rgba(99,102,241,0.15)", borderBottom: "1px solid rgba(99,102,241,0.15)", overflow: "hidden", padding: "14px 0" }}>
        <div style={{ display: "flex" }}>
          {[1, 2].map(pass => (
            <motion.div
              key={pass}
              style={{ display: "flex", gap: 48, paddingRight: 48, whiteSpace: "nowrap", flexShrink: 0 }}
              animate={{ x: [0, -2000] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: pass === 2 ? 0 : 0 }}
            >
              {[...marqueeItems, ...marqueeItems].map((item, i) => (
                <span key={i} style={{ fontSize: 13, fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#6366f1" }}>✦</span> {item}
                </span>
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section id="impact" style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          <StatItem n={560000} suffix="+" label="Clinical Trials Indexed from ClinicalTrials.gov" icon="📁" delay={0} />
          <StatItem n={20} suffix="M+" label="FDA FAERS Adverse Event Reports Analyzed" icon="🔬" delay={0.1} />
          <StatItem n={350000} suffix="+" label="Trials in ML Training Corpus for Predictions" icon="🧠" delay={0.2} />
          <StatItem n={6} suffix="" label="Sequential Simulation Stages from Discovery to Outcome" icon="⚡" delay={0.3} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, marginBottom: 20, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.04em" }}>CAPABILITIES</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Everything to run{" "}
            <span style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              smarter trials
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: 16, color: "#64748b", maxWidth: 560, margin: "0 auto" }}>
            One platform, six stages, all powered by real data from the world's leading biomedical sources.
          </motion.p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 0.08} />)}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "100px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, marginBottom: 20, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#67e8f9", letterSpacing: "0.04em" }}>HOW IT WORKS</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 16 }}>
              From concept to{" "}
              <span style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                GO decision
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 40, maxWidth: 420 }}>
              Hakase walks you through the entire trial lifecycle step by step, with live API data at every stage.
            </motion.p>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {steps.map((step, i) => <WorkflowStep key={i} {...step} delay={i * 0.1} />)}
            </div>
          </div>

          {/* Right: visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "sticky", top: 100 }}
          >
            <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
              {/* Stage progress visual */}
              <div style={{ background: "#0b1120", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, position: "relative" }}>
                  <div style={{ position: "absolute", top: 20, left: "10%", right: "10%", height: 1, background: "rgba(255,255,255,0.06)" }} />
                  {["Discovery", "Sites", "Regulatory", "Enrollment", "Execution", "Outcomes"].map((stage, i) => (
                    <div key={stage} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                        background: i < 3 ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "rgba(255,255,255,0.05)",
                        border: i < 3 ? "none" : "1px solid rgba(255,255,255,0.1)",
                        boxShadow: i < 3 ? "0 0 16px rgba(99,102,241,0.4)" : "none",
                      }}>
                        {i < 3 ? (
                          <span style={{ color: "white", fontSize: 14 }}>✓</span>
                        ) : (
                          <span style={{ color: "#334155", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 8, color: i < 3 ? "#a5b4fc" : "#334155", fontWeight: 700, textAlign: "center", maxWidth: 50 }}>{stage}</span>
                    </div>
                  ))}
                </div>

                {/* Active stage detail */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc" }}>Stage 3: Regulatory & IND</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[{ l: "Months to FPI", v: "14 mo", c: "#f59e0b" }, { l: "Safety Score", v: "82/100", c: "#10b981" }, { l: "Lit. Score", v: "76/100", c: "#6366f1" }].map(kpi => (
                      <div key={kpi.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 8, color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>{kpi.l}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: kpi.c }}>{kpi.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data sources */}
                <div style={{ display: "flex", gap: 8 }}>
                  {[["🔵", "ClinicalTrials.gov"], ["🔴", "FDA FAERS"], ["🟢", "PubMed"]].map(([dot, name]) => (
                    <div key={String(name)} style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: String(dot) === "🔵" ? "#3b82f6" : String(dot) === "🔴" ? "#f87171" : "#34d399", flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>{String(name)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 32px" }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            borderRadius: 28, padding: "72px 48px", textAlign: "center", position: "relative", overflow: "hidden",
            background: "linear-gradient(135deg, #0f0c29, #1a1040, #0f0c29)",
            border: "1px solid rgba(99,102,241,0.25)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.4), 0 0 80px rgba(99,102,241,0.1) inset",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.2), transparent 60%)", pointerEvents: "none" }} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", width: 500, height: 500, top: -250, left: -250, border: "1px solid rgba(99,102,241,0.1)", borderRadius: "50%", pointerEvents: "none" }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", width: 300, height: 300, bottom: -150, right: -150, border: "1px solid rgba(6,182,212,0.1)", borderRadius: "50%", pointerEvents: "none" }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, marginBottom: 24, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc" }}>READY TO START</span>
            </div>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20, color: "white" }}>
              Run your first trial simulation<br />
              <span style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                in under 60 seconds
              </span>
            </h2>
            <p style={{ fontSize: 16, color: "#94a3b8", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
              No setup, no demo calls. Launch the platform and start querying live clinical trial data immediately.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(99,102,241,0.6)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation("/dashboard")}
                style={{ fontSize: 16, fontWeight: 800, color: "white", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", cursor: "pointer", padding: "16px 36px", borderRadius: 14 }}>
                Launch Dashboard →
              </motion.button>
            </div>
            <p style={{ fontSize: 13, color: "#475569", marginTop: 20 }}>
              Powered by ClinicalTrials.gov · FDA FAERS · PubMed/NCBI
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "36px 32px", maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: 12, fontWeight: 900 }}>H</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "white" }}>hakaseAI</span>
        </div>
        <p style={{ fontSize: 13, color: "#475569" }}>Clinical intelligence platform for researchers, sponsors, and CROs.</p>
        <div style={{ display: "flex", gap: 24 }}>
          {["ClinicalTrials.gov", "FDA FAERS", "PubMed"].map(api => (
            <span key={api} style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>{api}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
