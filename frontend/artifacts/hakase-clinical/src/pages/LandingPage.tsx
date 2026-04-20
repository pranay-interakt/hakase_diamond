import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useSpring,
  useMotionValue,
} from "framer-motion";

// ─── Particle canvas ─────────────────────────────────────────────────────────

function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const N = 60;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < N; i++) {
        const a = pts[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > canvas.width) a.vx *= -1;
        if (a.y < 0 || a.y > canvas.height) a.vy *= -1;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99,102,241,0.5)";
        ctx.fill();
        for (let j = i + 1; j < N; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99,102,241,${(1 - d / 130) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ─── Animated gradient blobs ──────────────────────────────────────────────────

function Blobs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[
        { w: 800, h: 800, top: -250, left: -250, color: "#6366f1", dur: 14, delay: 0 },
        { w: 600, h: 600, top: 80, right: -200, color: "#06b6d4", dur: 11, delay: 2 },
        { w: 500, h: 500, bottom: -150, left: "38%", color: "#ec4899", dur: 16, delay: 4 },
        { w: 350, h: 350, top: "40%", left: "55%", color: "#8b5cf6", dur: 9, delay: 1 },
      ].map((b, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: b.w, height: b.h,
            top: b.top as any, left: b.left as any,
            right: (b as any).right, bottom: (b as any).bottom,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            filter: "blur(80px)",
            opacity: 0.12,
          }}
          animate={{ scale: [1, 1.18, 1], x: [-15, 15, -15], y: [-8, 8, -8] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        />
      ))}
    </div>
  );
}

// ─── Grid overlay ─────────────────────────────────────────────────────────────

function Grid() {
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
      backgroundSize: "72px 72px",
    }} />
  );
}

// ─── Mouse glow ───────────────────────────────────────────────────────────────

function MouseGlow() {
  const [pos, setPos] = useState({ x: -400, y: -400 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  const sx = useSpring(pos.x, { stiffness: 120, damping: 28 });
  const sy = useSpring(pos.y, { stiffness: 120, damping: 28 });
  return (
    <motion.div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
    }}>
      <motion.div style={{
        position: "absolute",
        width: 500, height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
        transform: "translate(-50%,-50%)",
        x: sx, y: sy,
      }} />
    </motion.div>
  );
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

function Typewriter({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const cur = texts[idx];
    if (!deleting && displayed.length < cur.length) {
      const t = setTimeout(() => setDisplayed(cur.slice(0, displayed.length + 1)), 60);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === cur.length) {
      const t = setTimeout(() => setDeleting(true), 2200);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((idx + 1) % texts.length);
    }
  }, [displayed, deleting, idx, texts]);
  return (
    <span style={{ color: "#a5b4fc" }}>
      {displayed}
      <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>|</motion.span>
    </span>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  useEffect(() => {
    if (!inView) return;
    const dur = 1800;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── 3D tilt card ─────────────────────────────────────────────────────────────

function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 350, damping: 30 });
  const sy = useSpring(ry, { stiffness: 350, damping: 30 });
  const onMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -14);
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 14);
  }, [rx, ry]);
  const onLeave = useCallback(() => { rx.set(0); ry.set(0); }, [rx, ry]);
  return (
    <motion.div ref={cardRef} className={className} style={{ ...style, rotateX: sx, rotateY: sy, transformPerspective: 1000 }}
      onMouseMove={onMove} onMouseLeave={onLeave} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
      {children}
    </motion.div>
  );
}

// ─── Section fade-in ──────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, y = 30 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}>
      {children}
    </motion.div>
  );
}

// ─── Gradient border card ─────────────────────────────────────────────────────

function GlowCard({ children, accent = "#6366f1", style }: { children: React.ReactNode; accent?: string; style?: React.CSSProperties }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}
      style={{
        position: "relative", borderRadius: 20, padding: 1.5,
        background: hover ? `linear-gradient(135deg, ${accent}60, #1e293b, ${accent}30)` : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
        transition: "background 0.3s",
        ...style,
      }}
      whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div style={{
        background: "linear-gradient(135deg, #0f172a, #0d1b35)",
        borderRadius: 18.5,
        height: "100%",
        overflow: "hidden",
      }}>
        {hover && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, ${accent}15, transparent 70%)`, pointerEvents: "none" }} />
        )}
        {children}
      </div>
    </motion.div>
  );
}

// ─── Floating badge pill ──────────────────────────────────────────────────────

function FloatBadge({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div
      animate={{ y: [-4, 4, -4] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute", backdropFilter: "blur(16px)",
        background: "rgba(15,23,42,0.85)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14, padding: "10px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  "ClinicalTrials.gov v2 API", "FDA FAERS 20M+ Reports", "PubMed 36M+ Articles",
  "OpenFDA Drug Labels", "ML Success Prediction", "Monte Carlo Simulation",
  "PRR/ROR Safety Signals", "Shannon Geographic Diversity", "GradientBoost + RandomForest",
  "WHO ICTRP Integration", "Real-Time Data Fusion", "Evidence Classification",
];

function Marquee() {
  return (
    <div style={{ overflow: "hidden", padding: "16px 0", background: "rgba(99,102,241,0.06)", borderTop: "1px solid rgba(99,102,241,0.1)", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
      <motion.div
        style={{ display: "flex", gap: 48, whiteSpace: "nowrap" }}
        animate={{ x: [0, -2400] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {item}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Main landing page ────────────────────────────────────────────────────────

export default function LandingPage() {
  const [, nav] = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const mockupRotate = useTransform(scrollYProgress, [0, 1], [-4, -1]);

  const features = [
    { icon: "⚗️", title: "Discovery & Feasibility", desc: "Map the competitive landscape with 300+ live CTGov trials. Real completion rates, safety baseline from FAERS, unmet need scoring.", accent: "#6366f1" },
    { icon: "📍", title: "Site Intelligence", desc: "Rank investigative sites globally by prior trial volume, enrollment velocity, and geographic diversity index.", accent: "#06b6d4" },
    { icon: "📋", title: "Regulatory Mapping", desc: "Auto-generate FDA/EMA IND/CTA roadmaps. IRB and ethics timelines derived from real regulatory precedents.", accent: "#10b981" },
    { icon: "📈", title: "Monte Carlo Enrollment", desc: "1,000-iteration stochastic simulation. Rates derived from completed trials — P10/P50/P90 delivery timelines with cost modeling.", accent: "#f59e0b" },
    { icon: "🛡️", title: "PRR/ROR Safety Signals", desc: "Pharmacovigilance-grade signal detection from 20M+ FAERS adverse events. Evans 2001 / WHO standard methodology.", accent: "#ef4444" },
    { icon: "🧬", title: "Outcomes Prediction", desc: "Ensemble ML (GradientBoosting + RandomForest) trained on CTGov corpus. Cross-validated success probability at every stage.", accent: "#8b5cf6" },
  ];

  const steps = [
    { n: "01", title: "Discovery", sub: "ClinicalTrials.gov landscape scan" },
    { n: "02", title: "Site Selection", sub: "Geographic + enrollment ranking" },
    { n: "03", title: "Regulatory", sub: "IND/CTA roadmap generation" },
    { n: "04", title: "Enrollment Sim", sub: "Monte Carlo P10/P50/P90" },
    { n: "05", title: "Execution", sub: "Protocol deviation modeling" },
    { n: "06", title: "Outcomes", sub: "ML success probability" },
  ];

  const stats = [
    { n: 500, suf: "K+", label: "Clinical Trials Indexed", color: "#6366f1" },
    { n: 20, suf: "M+", label: "Adverse Event Reports", color: "#ef4444" },
    { n: 36, suf: "M+", label: "PubMed Articles", color: "#10b981" },
    { n: 1000, suf: "", label: "Monte Carlo Iterations", color: "#f59e0b" },
  ];

  return (
    <div style={{ background: "#020817", minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", overflowX: "hidden" }}>
      <MouseGlow />

      {/* ── Fixed Nav ──────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "0 32px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(2,8,23,0.7)", backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" }}>H</div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>hakase<span style={{ color: "#6366f1" }}>AI</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["Features", "How it Works", "Impact"].map(l => (
            <motion.a key={l} href="#" whileHover={{ color: "#a5b4fc" }}
              style={{ fontSize: 13.5, fontWeight: 500, color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }}>
              {l}
            </motion.a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <motion.button onClick={() => nav("/dashboard")} whileHover={{ color: "#a5b4fc" }}
            style={{ fontSize: 13.5, fontWeight: 500, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
            Sign In
          </motion.button>
          <motion.button
            onClick={() => nav("/dashboard")}
            whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(99,102,241,0.5)" }}
            whileTap={{ scale: 0.97 }}
            style={{ padding: "8px 20px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", fontSize: 13.5, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}>
            Launch App →
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div ref={heroRef} style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", paddingTop: 64 }}>
        <ParticleCanvas />
        <Blobs />
        <Grid />

        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 1280, margin: "0 auto", padding: "80px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          {/* Left */}
          <motion.div style={{ y: heroY, opacity: heroOpacity }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", marginBottom: 28 }}>
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI-Powered Clinical Intelligence</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: "clamp(44px, 5.5vw, 68px)", fontWeight: 900, lineHeight: 1.07, color: "#fff", marginBottom: 20, letterSpacing: "-0.03em" }}>
              The Intelligence<br />
              Platform for{" "}
              <span style={{ background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #8b5cf6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Clinical Trials
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}
              style={{ fontSize: 17, color: "#94a3b8", lineHeight: 1.7, marginBottom: 28, maxWidth: 460 }}>
              From discovery to outcome prediction —{" "}
              <Typewriter texts={["real ClinicalTrials.gov data.", "live FDA FAERS signals.", "PubMed evidence synthesis.", "Monte Carlo enrollment modeling."]} />
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 40 }}>
              <motion.button onClick={() => nav("/dashboard")}
                whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(99,102,241,0.55)" }}
                whileTap={{ scale: 0.96 }}
                style={{ padding: "14px 28px", borderRadius: 13, background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(99,102,241,0.4)" }}>
                Launch Dashboard →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, background: "rgba(255,255,255,0.08)" }}
                style={{ padding: "14px 28px", borderRadius: 13, background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: 15, fontWeight: 600, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>
                See How It Works
              </motion.button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "CG", color: "#3b82f6", name: "ClinicalTrials.gov" },
                { label: "PB", color: "#10b981", name: "PubMed" },
                { label: "FD", color: "#ef4444", name: "FDA FAERS" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "#fff" }}>{s.label}</div>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: "#334155", marginLeft: 2 }}>·</span>
                </div>
              ))}
              <span style={{ fontSize: 11, color: "#64748b" }}>Live APIs</span>
            </motion.div>
          </motion.div>

          {/* Right: 3D mockup */}
          <motion.div style={{ position: "relative", y: mockupY }} initial={{ opacity: 0, x: 40, rotate: -6 }} animate={{ opacity: 1, x: 0, rotate: -4 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <motion.div style={{ rotate: mockupRotate, transformPerspective: "1200px" }}>
              <div style={{
                borderRadius: 20, overflow: "hidden",
                background: "linear-gradient(135deg, #0f1a2e, #0a1628)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}>
                {/* Browser bar */}
                <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 12px", fontSize: 11, color: "#475569" }}>app.hakase.ai/dashboard</div>
                  <div style={{ fontSize: 9, color: "#22c55e", fontWeight: 700 }}>● Live Engine</div>
                </div>
                {/* Sidebar + content */}
                <div style={{ display: "flex", height: 360 }}>
                  <div style={{ width: 130, background: "rgba(0,0,0,0.3)", padding: "12px 8px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 10, color: "#fff", fontWeight: 700, marginBottom: 12, padding: "0 4px" }}>Hakase</div>
                    {["Overview","Trial Hub","Trial Explorer","KOL Finder","Safety Intel","Enrollment","Sites"].map((l, i) => (
                      <div key={l} style={{ padding: "5px 8px", marginBottom: 2, borderRadius: 6, background: i === 1 ? "rgba(99,102,241,0.2)" : "transparent", fontSize: 9.5, color: i === 1 ? "#a5b4fc" : "#475569", fontWeight: i === 1 ? 700 : 400, display: "flex", alignItems: "center", gap: 6 }}>
                        {i === 1 && <div style={{ width: 3, height: 12, background: "#6366f1", borderRadius: 2, flexShrink: 0 }} />}
                        {l}
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1, padding: "16px", overflowY: "hidden" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10 }}>Clinical Trial Hub · Stage 1: Discovery</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {[
                        { l: "ACTIVE TRIALS", v: "2,847", c: "#6366f1" },
                        { l: "SAFETY SCORE", v: "78/100", c: "#10b981" },
                        { l: "PUBMED ARTICLES", v: "14,302", c: "#06b6d4" },
                        { l: "UNMET NEED", v: "82/100", c: "#f59e0b" },
                      ].map(k => (
                        <div key={k.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ fontSize: 8, color: "#64748b", letterSpacing: "0.08em", marginBottom: 4 }}>{k.l}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: k.c }}>{k.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 8, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>COMPETITIVE LANDSCAPE · TOP PHASE DISTRIBUTION</div>
                    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 50 }}>
                      {[40,65,100,75,55,80,45,70,35,60].map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "3px 3px 0 0", background: i === 2 ? "#6366f1" : "rgba(99,102,241,0.25)" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating badges */}
            <FloatBadge style={{ top: -20, right: -30, animationDelay: "0s" }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Success Probability</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981" }}>74%</div>
            </FloatBadge>
            <FloatBadge style={{ bottom: 40, left: -40, animationDelay: "1s" }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Monte Carlo P50</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b" }}>18.4 mo</div>
            </FloatBadge>
            <FloatBadge style={{ top: "45%", right: -50, animationDelay: "2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>3 live APIs connected</span>
              </div>
            </FloatBadge>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: 1, height: 40, background: "linear-gradient(180deg, transparent, rgba(99,102,241,0.5))" }} />
          <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</div>
        </motion.div>
      </div>

      {/* ── Marquee ─────────────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: "100px 48px", maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 70 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>Real Data. Real Intelligence.</div>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 16 }}>
              Backed by millions of<br />
              <span style={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>real data points</span>
            </h2>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.1}>
              <div style={{ textAlign: "center", padding: "40px 24px", borderRadius: 20, background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: "clamp(40px, 4vw, 60px)", fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 12 }}>
                  <Counter to={s.n} suffix={s.suf} />
                </div>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{s.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "40px 48px 100px", maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>Platform Capabilities</div>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
              Every stage of your trial.<br />Intelligence-first.
            </h2>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.07}>
              <TiltCard style={{ height: "100%" }}>
                <GlowCard accent={f.accent} style={{ height: "100%" }}>
                  <div style={{ padding: "28px 28px 32px" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.accent}18`, border: `1px solid ${f.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 18 }}>
                      {f.icon}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 10 }}>{f.title}</h3>
                    <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}>{f.desc}</p>
                    <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Live data</span>
                    </div>
                  </div>
                </GlowCard>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <div style={{ padding: "60px 48px 100px", background: "rgba(99,102,241,0.03)", borderTop: "1px solid rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 70 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>6-Stage Simulation Engine</div>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
                Your trial, end-to-end.
              </h2>
            </div>
          </FadeIn>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.1} y={20}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  {i < steps.length - 1 && (
                    <div style={{ position: "absolute", top: 24, left: "50%", width: "100%", height: 1, background: "linear-gradient(90deg, rgba(99,102,241,0.5), rgba(99,102,241,0.1))", zIndex: 0 }} />
                  )}
                  <motion.div
                    whileHover={{ scale: 1.12, boxShadow: "0 0 24px rgba(99,102,241,0.5)" }}
                    style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", position: "relative", zIndex: 1, marginBottom: 14, boxShadow: "0 0 16px rgba(99,102,241,0.35)", cursor: "default" }}>
                    {s.n}
                  </motion.div>
                  <div style={{ textAlign: "center", padding: "0 8px" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.4 }}>{s.sub}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live Data Sources ────────────────────────────────────────────────── */}
      <div style={{ padding: "100px 48px", maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>Connected In Real-Time</div>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
              Not simulated. Not scraped.<br />
              <span style={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Directly from the source.
              </span>
            </h2>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[
            { name: "ClinicalTrials.gov", tag: "v2 API", stat: "500K+ trials", dot: "#3b82f6", icon: "🧪", desc: "NCBI's global registry of clinical research studies" },
            { name: "FDA FAERS", tag: "OpenFDA", stat: "20M+ AEs", dot: "#ef4444", icon: "🛡️", desc: "Post-market drug safety adverse event database" },
            { name: "PubMed / NCBI", tag: "Entrez API", stat: "36M+ articles", dot: "#10b981", icon: "📖", desc: "Biomedical literature and clinical evidence" },
            { name: "OpenFDA Labels", tag: "REST API", stat: "140K+ labels", dot: "#f59e0b", icon: "💊", desc: "FDA-approved drug labeling and prescribing info" },
          ].map((src, i) => (
            <FadeIn key={src.name} delay={i * 0.1}>
              <TiltCard>
                <div style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                    <span style={{ fontSize: 28 }}>{src.icon}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>LIVE</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{src.name}</div>
                    <div style={{ fontSize: 10, color: src.dot, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{src.tag}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: src.dot, margin: "10px 0" }}>{src.stat}</div>
                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{src.desc}</div>
                </div>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden", margin: "0 48px 100px", borderRadius: 28 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0f0f3d, #0a1628, #0f172a)" }} />
        <motion.div
          animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", width: 600, height: 600, border: "1px solid rgba(99,102,241,0.08)", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <motion.div
          animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", width: 400, height: 400, border: "1px solid rgba(99,102,241,0.12)", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, rgba(99,102,241,0.15), transparent 70%)" }} />

        <div style={{ position: "relative", padding: "80px 60px", textAlign: "center", zIndex: 1 }}>
          <FadeIn>
            <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 4, repeat: Infinity }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", marginBottom: 28 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ready to accelerate?</span>
            </motion.div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 64px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 20 }}>
              Start your first simulation<br />
              <span style={{ background: "linear-gradient(135deg,#6366f1,#06b6d4,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                in 30 seconds.
              </span>
            </h2>
            <p style={{ fontSize: 16, color: "#64748b", maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.7 }}>
              No setup. No waiting. Just enter your condition and drug — and Hakase pulls live data from five global sources instantly.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <motion.button onClick={() => nav("/dashboard")}
                whileHover={{ scale: 1.06, boxShadow: "0 0 50px rgba(99,102,241,0.6)" }}
                whileTap={{ scale: 0.96 }}
                style={{ padding: "16px 36px", borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", fontSize: 16, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}>
                Launch the Dashboard →
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ padding: "32px 48px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#6366f1,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff" }}>H</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>hakaseAI</span>
        </div>
        <div style={{ fontSize: 12, color: "#1e293b" }}>
          Live APIs: ClinicalTrials.gov · PubMed · FDA FAERS · OpenFDA
        </div>
        <div style={{ fontSize: 12, color: "#1e293b" }}>© 2026 Hakase AI</div>
      </footer>
    </div>
  );
}
