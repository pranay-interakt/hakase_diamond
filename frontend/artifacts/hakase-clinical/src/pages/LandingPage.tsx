import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  motion, AnimatePresence,
  useScroll, useTransform, useInView,
  useSpring, useMotionValue,
} from "framer-motion";

// ─── Particle field ───────────────────────────────────────────────────────────

function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf: number;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.3 + 0.4,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach((a, i) => {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > c.width) a.vx *= -1;
        if (a.y < 0 || a.y > c.height) a.vy *= -1;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(6,182,212,0.4)"; ctx.fill();
        pts.slice(i + 1).forEach(b => {
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < 110) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = `rgba(6,182,212,${(1 - d / 110) * 0.09})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ─── Background blobs ─────────────────────────────────────────────────────────

function Blobs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[
        { w: 700, h: 700, top: -240, left: -240, color: "#0891b2", dur: 14, delay: 0, op: 0.1 },
        { w: 520, h: 520, top: 60, right: -160, color: "#4f46e5", dur: 11, delay: 2, op: 0.1 },
        { w: 400, h: 400, bottom: -100, left: "35%", color: "#ec4899", dur: 16, delay: 4, op: 0.065 },
      ].map((b, i) => (
        <motion.div key={i}
          style={{ position: "absolute", width: b.w, height: b.h, top: b.top as any, left: (b as any).left, right: (b as any).right, bottom: (b as any).bottom, borderRadius: "50%", background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`, filter: "blur(72px)", opacity: b.op }}
          animate={{ scale: [1, 1.14, 1], x: [-10, 10, -10], y: [-6, 6, -6] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: b.delay }} />
      ))}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg,rgba(6,182,212,0.04) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
    </div>
  );
}

// ─── Mouse glow ───────────────────────────────────────────────────────────────

function MouseGlow() {
  const [pos, setPos] = useState({ x: -500, y: -500 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  const sx = useSpring(pos.x, { stiffness: 100, damping: 26 });
  const sy = useSpring(pos.y, { stiffness: 100, damping: 26 });
  return (
    <motion.div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <motion.div style={{ position: "absolute", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.065) 0%, transparent 70%)", transform: "translate(-50%,-50%)", x: sx, y: sy }} />
    </motion.div>
  );
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

function Typewriter({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  const [disp, setDisp] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const cur = texts[idx];
    if (!del && disp.length < cur.length) { const t = setTimeout(() => setDisp(cur.slice(0, disp.length + 1)), 52); return () => clearTimeout(t); }
    if (!del && disp.length === cur.length) { const t = setTimeout(() => setDel(true), 2200); return () => clearTimeout(t); }
    if (del && disp.length > 0) { const t = setTimeout(() => setDisp(disp.slice(0, -1)), 26); return () => clearTimeout(t); }
    if (del && disp.length === 0) { setDel(false); setIdx((idx + 1) % texts.length); }
  }, [disp, del, idx, texts]);
  return (
    <span style={{ color: "#22d3ee" }}>
      {disp}<motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.75, repeat: Infinity }}>|</motion.span>
    </span>
  );
}

// ─── Counter ──────────────────────────────────────────────────────────────────

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1800;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}>
      {children}
    </motion.div>
  );
}

// ─── TiltCard ─────────────────────────────────────────────────────────────────

function TiltCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 300, damping: 28 });
  const sy = useSpring(ry, { stiffness: 300, damping: 28 });
  const onMove = useCallback((e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -12);
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 12);
  }, [rx, ry]);
  return (
    <motion.div ref={ref} style={{ ...style, rotateX: sx, rotateY: sy, transformPerspective: 1000 }}
      onMouseMove={onMove} onMouseLeave={() => { rx.set(0); ry.set(0); }}
      whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 280, damping: 24 }}>
      {children}
    </motion.div>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────

const TICKER = ["ClinicalTrials.gov v2 API", "FDA FAERS 20M+ Reports", "PubMed 36M+ Articles", "OpenFDA Drug Labels", "ML Success Prediction", "Monte Carlo Simulation", "PRR/ROR Safety Signals", "Shannon Diversity Index", "Ensemble GB + RF", "Real-Time Data Fusion"];

function Marquee() {
  return (
    <div style={{ overflow: "hidden", padding: "13px 0", background: "rgba(6,182,212,0.04)", borderTop: "1px solid rgba(6,182,212,0.09)", borderBottom: "1px solid rgba(6,182,212,0.09)" }}>
      <motion.div style={{ display: "flex", gap: 52, whiteSpace: "nowrap" }}
        animate={{ x: [0, -2600] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
        {[...TICKER, ...TICKER, ...TICKER].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#06b6d4" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{item}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Hero card ────────────────────────────────────────────────────────────────

function HeroCard() {
  return (
    <div style={{ position: "relative", perspective: "1200px" }}>
      <div style={{ position: "absolute", bottom: -40, left: "10%", right: "10%", height: 60, background: "radial-gradient(ellipse, rgba(6,182,212,0.28), transparent 70%)", filter: "blur(16px)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", inset: 0, transform: "translateZ(-60px) translateX(24px) translateY(18px) rotateY(2deg)", borderRadius: 20, background: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.07)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
      <div style={{ position: "absolute", inset: 0, transform: "translateZ(-28px) translateX(12px) translateY(9px) rotateY(1deg)", borderRadius: 20, background: "rgba(15,26,50,0.8)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }} />
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: "linear-gradient(160deg, #0f1f40 0%, #0a1628 100%)", border: "1px solid rgba(6,182,212,0.18)", boxShadow: "0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
        <div style={{ padding: "12px 18px", background: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>{["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}</div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 12px", fontSize: 11, color: "#334155" }}>app.hakase.ai/dashboard</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 700 }}>Live Engine</span>
          </div>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ width: 118, background: "rgba(0,0,0,0.2)", padding: "12px 8px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ marginBottom: 14, padding: "0 4px" }}>
              <img src="/hakase-logo-transparent.png" alt="Hakase" style={{ height: 16, width: "auto", objectFit: "contain" }} />
            </div>
            {["Overview", "Trial Hub", "Trial Explorer", "KOL Finder", "Safety Intel", "Enrollment"].map((l, i) => (
              <div key={l} style={{ padding: "5px 8px", marginBottom: 2, borderRadius: 6, background: i === 1 ? "rgba(6,182,212,0.18)" : "transparent", fontSize: 9, color: i === 1 ? "#22d3ee" : "#334155", fontWeight: i === 1 ? 700 : 400, display: "flex", alignItems: "center", gap: 5 }}>
                {i === 1 && <div style={{ width: 2.5, height: 10, background: "#06b6d4", borderRadius: 2, flexShrink: 0 }} />}
                {l}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, padding: 14 }}>
            <div style={{ fontSize: 9, color: "#475569", marginBottom: 10 }}>Clinical Trial Hub · Stage 1: Discovery</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[{ l: "ACTIVE TRIALS", v: "2,847", c: "#06b6d4" }, { l: "SAFETY SCORE", c: "#22c55e", v: "78/100" }, { l: "PUBMED ARTICLES", c: "#6366f1", v: "14,302" }, { l: "UNMET NEED", c: "#f59e0b", v: "82/100" }].map(k => (
                <div key={k.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "9px 11px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 7, color: "#334155", letterSpacing: "0.08em", marginBottom: 3 }}>{k.l}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: k.c }}>{k.v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7.5, color: "#334155", marginBottom: 5, letterSpacing: "0.08em" }}>PHASE DISTRIBUTION</div>
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 44 }}>
              {[35, 58, 100, 70, 50, 75, 40, 66, 30, 55].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "3px 3px 0 0", background: i === 2 ? "#06b6d4" : "rgba(6,182,212,0.2)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: -18, right: -36, backdropFilter: "blur(16px)", background: "rgba(10,22,40,0.9)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(6,182,212,0.1)" }}>
        <div style={{ fontSize: 9, color: "#475569", marginBottom: 2 }}>ML Success Score</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#22c55e" }}>74%</div>
      </motion.div>
      <motion.div animate={{ y: [5, -5, 5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{ position: "absolute", bottom: 36, left: -44, backdropFilter: "blur(16px)", background: "rgba(10,22,40,0.9)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.1)" }}>
        <div style={{ fontSize: 9, color: "#475569", marginBottom: 2 }}>Monte Carlo P50</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#a5b4fc" }}>18.4 mo</div>
      </motion.div>
      <motion.div animate={{ y: [-3, 3, -3] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ position: "absolute", top: "38%", right: -50, backdropFilter: "blur(16px)", background: "rgba(10,22,40,0.9)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
        <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>3 live APIs</span>
      </motion.div>
    </div>
  );
}

// ─── Platform Showcase (replaces DNA section) ─────────────────────────────────

const SHOWCASE_STAGES = [
  {
    id: 1, label: "Discovery & Feasibility", color: "#06b6d4", emoji: "🔬",
    kpis: [{ l: "Active Trials", v: "2,847", c: "#06b6d4" }, { l: "Unmet Need", v: "82/100", c: "#f59e0b" }, { l: "PubMed Articles", v: "14.3K", c: "#10b981" }, { l: "FAERS Reports", v: "48,200", c: "#ef4444" }],
    chart: { label: "Phase Distribution", bars: [{ l: "Phase 1", v: 35 }, { l: "Phase 2", v: 100 }, { l: "Phase 3", v: 78 }, { l: "Phase 4", v: 22 }] },
    signal: "8 competitor trials recruiting · 3 PRR signals detected",
  },
  {
    id: 2, label: "Site Selection", color: "#10b981", emoji: "📍",
    kpis: [{ l: "Sites Ranked", v: "142", c: "#10b981" }, { l: "Top Score", v: "94/100", c: "#06b6d4" }, { l: "Countries", v: "18", c: "#f59e0b" }, { l: "Avg Startup", v: "6.2 wk", c: "#8b5cf6" }],
    table: [{ rank: 1, name: "Mayo Clinic, MN", score: 94 }, { rank: 2, name: "MD Anderson, TX", score: 91 }, { rank: 3, name: "Mass General, MA", score: 88 }],
    signal: "Shannon diversity index 0.81 · 3 high-velocity sites",
  },
  {
    id: 3, label: "Regulatory & IND", color: "#f59e0b", emoji: "📋",
    kpis: [{ l: "IND Prep", v: "8 wk", c: "#f59e0b" }, { l: "FDA Review", v: "30 days", c: "#06b6d4" }, { l: "Total Timeline", v: "16 wk", c: "#10b981" }, { l: "Designations", v: "2 eligible", c: "#8b5cf6" }],
    checklist: ["Investigator Brochure", "Phase 1 Safety Protocol", "Manufacturing (CMC)", "Informed Consent Forms"],
    signal: "Fast Track + Orphan Drug designation eligible",
  },
  {
    id: 4, label: "Enrollment Simulation", color: "#ec4899", emoji: "📈",
    kpis: [{ l: "P10 Optimistic", v: "14.2 mo", c: "#10b981" }, { l: "P50 Median", v: "18.4 mo", c: "#ec4899" }, { l: "P90 Conservative", v: "24.1 mo", c: "#ef4444" }, { l: "Monthly Rate", v: "12.3/site", c: "#06b6d4" }],
    chart: { label: "Monte Carlo Distribution", bars: [{ l: "P10", v: 47, extra: "14.2 mo" }, { l: "P25", v: 65, extra: "" }, { l: "P50", v: 100, extra: "18.4 mo" }, { l: "P75", v: 78, extra: "" }, { l: "P90", v: 55, extra: "24.1 mo" }] },
    signal: "1,000-iteration simulation from 89 real completed trials",
  },
  {
    id: 5, label: "Execution Monitor", color: "#8b5cf6", emoji: "⚙️",
    kpis: [{ l: "Deviations Est.", v: "24", c: "#ef4444" }, { l: "Dropout Rate", v: "8.2%", c: "#f59e0b" }, { l: "RBM Savings", v: "31%", c: "#10b981" }, { l: "Monitoring Cost", v: "$142K", c: "#8b5cf6" }],
    risks: [{ label: "Protocol deviation — eligibility", sev: "HIGH" }, { label: "Missing data — PRO questionnaire", sev: "MEDIUM" }, { label: "SAE documentation delay", sev: "LOW" }],
    signal: "Risk-based monitoring plan generated · 3 deviation patterns flagged",
  },
  {
    id: 6, label: "Outcomes & ML", color: "#6366f1", emoji: "🧬",
    kpis: [{ l: "Success Probability", v: "74%", c: "#10b981" }, { l: "GB Model", v: "71%", c: "#6366f1" }, { l: "RF Model", v: "77%", c: "#8b5cf6" }, { l: "Recommendation", v: "GO", c: "#22c55e" }],
    gauge: { value: 74, label: "Ensemble ML Prediction" },
    signal: "Ensemble GradientBoosting + RandomForest · cross-validated AUC 0.79",
  },
];

function MiniGauge({ value, color, size = 100 }: { value: number; color: string; size?: number }) {
  const cir = Math.PI * 44;
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60">
      <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeLinecap="round" />
      <motion.path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${cir}` }}
        animate={{ strokeDasharray: `${(value / 100) * cir} ${cir}` }}
        transition={{ duration: 1, ease: "easeOut" }} />
      <text x="50" y="52" textAnchor="middle" style={{ fontSize: "17px", fontWeight: "900", fill: color }}>{value}%</text>
    </svg>
  );
}

function ShowcasePanel({ stage }: { stage: typeof SHOWCASE_STAGES[0] }) {
  return (
    <motion.div key={stage.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {stage.kpis.map((k, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: `${k.c}10`, border: `1px solid ${k.c}28` }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: `${k.c}99`, marginBottom: 5 }}>{k.l}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Chart or table or checklist or gauge */}
      <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: `1px solid ${stage.color}22` }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${stage.color}14`, background: `${stage.color}08`, fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>
          {stage.chart?.label || stage.gauge?.label || (stage.table ? "Site Rankings" : stage.checklist ? "IND Requirements" : stage.risks ? "Deviation Risk Analysis" : "")}
        </div>
        <div style={{ padding: "14px 16px" }}>
          {stage.chart && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stage.chart.bars.map((b, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                    <span>{b.l}</span>
                    {(b as any).extra && <span style={{ fontWeight: 700, color: stage.color }}>{(b as any).extra}</span>}
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.04)" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${b.v}%` }} transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.08 }}
                      style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {stage.table && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stage.table.map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: i === 0 ? `${stage.color}10` : "rgba(255,255,255,0.02)" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 8, background: `${stage.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: stage.color, flexShrink: 0 }}>#{row.rank}</div>
                  <span style={{ fontSize: 12, color: "#cbd5e1", flex: 1 }}>{row.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: stage.color }}>{row.score}</span>
                </div>
              ))}
            </div>
          )}
          {stage.checklist && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stage.checklist.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 10, background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 5, background: `${stage.color}18`, border: `1px solid ${stage.color}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke={stage.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{item}</span>
                </div>
              ))}
            </div>
          )}
          {stage.gauge && (
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <MiniGauge value={stage.gauge.value} color={stage.color} size={120} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#22c55e", marginBottom: 4 }}>GO</div>
                <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>Ensemble ML recommends<br />proceeding to regulatory filing.</div>
              </div>
            </div>
          )}
          {stage.risks && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stage.risks.map((r, i) => {
                const rc = r.sev === "HIGH" ? "#ef4444" : r.sev === "MEDIUM" ? "#f59e0b" : "#10b981";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: `${rc}08`, border: `1px solid ${rc}20` }}>
                    <span style={{ display: "inline-flex", padding: "2px 7px", borderRadius: 5, fontSize: 9, fontWeight: 700, background: `${rc}15`, color: rc, letterSpacing: "0.06em" }}>{r.sev}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Signal line */}
      <div style={{ fontSize: 11, color: "#334155", display: "flex", alignItems: "center", gap: 7 }}>
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
        {stage.signal}
      </div>
    </motion.div>
  );
}

function PlatformShowcase() {
  const [active, setActive] = useState(0);

  // Auto-cycle through stages
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % SHOWCASE_STAGES.length), 4200);
    return () => clearInterval(t);
  }, []);

  const stage = SHOWCASE_STAGES[active];

  return (
    <div style={{ padding: "100px 48px", maxWidth: 1280, margin: "0 auto" }}>
      <FadeIn>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>6-Stage Intelligence Engine</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 50px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 14 }}>
            See the platform in action.
          </h2>
          <p style={{ fontSize: 15, color: "#475569", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Every stage powered by live APIs, ensemble ML, and real trial data.
          </p>
        </div>
      </FadeIn>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 28, alignItems: "start" }}>
        {/* Stage tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SHOWCASE_STAGES.map((s, i) => (
            <button key={s.id} onClick={() => setActive(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: active === i ? `${s.color}14` : "rgba(255,255,255,0.02)", border: `1px solid ${active === i ? `${s.color}35` : "rgba(255,255,255,0.05)"}`, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: active === i ? `${s.color}22` : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, transition: "all 0.2s" }}>
                {s.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: active === i ? "#e2e8f0" : "#475569", transition: "color 0.2s" }}>
                  {s.label}
                </div>
                {active === i && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: 2, background: s.color, borderRadius: 999, marginTop: 4, width: "60%" }} />
                )}
              </div>
              {active === i && (
                <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>

        {/* Active panel */}
        <div style={{ borderRadius: 20, padding: 24, background: "linear-gradient(160deg, #0b1628 0%, #060f1e 100%)", border: `1px solid ${stage.color}22`, boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${stage.color}0a`, minHeight: 340 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ padding: "8px 10px", borderRadius: 12, background: `${stage.color}14`, border: `1px solid ${stage.color}2a`, fontSize: 18 }}>{stage.emoji}</div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: stage.color, letterSpacing: "0.12em", textTransform: "uppercase" }}>Stage {stage.id}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{stage.label}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 999, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e" }}>Live data</span>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <ShowcasePanel key={active} stage={stage} />
          </AnimatePresence>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
        {SHOWCASE_STAGES.map((s, i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ width: active === i ? 24 : 6, height: 6, borderRadius: 999, background: active === i ? s.color : "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [, nav] = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const features = [
    { emoji: "⚗️", title: "Discovery & Feasibility", desc: "300+ live CTGov trials analyzed. Completion rates, FAERS baseline, PRR/ROR safety signals, geographic diversity.", accent: "#06b6d4" },
    { emoji: "📍", title: "Site Intelligence", desc: "Global site ranking by enrollment velocity, startup time, prior trial experience, and Shannon diversity index.", accent: "#6366f1" },
    { emoji: "📋", title: "Regulatory Mapping", desc: "FDA/EMA IND/CTA roadmaps auto-generated. IRB timelines from real regulatory precedent data.", accent: "#10b981" },
    { emoji: "📈", title: "Monte Carlo Sim", desc: "1,000-iteration stochastic enrollment simulation. P10/P50/P90 timelines from real completed trial rates.", accent: "#f59e0b" },
    { emoji: "🛡️", title: "PRR/ROR Safety", desc: "Pharmacovigilance-grade signal detection from 20M+ FAERS reports. Evans 2001 / WHO standard.", accent: "#ef4444" },
    { emoji: "🧬", title: "Outcome Prediction", desc: "Ensemble ML (GradientBoosting + RandomForest) trained on CTGov corpus. Cross-validated AUC at each stage.", accent: "#8b5cf6" },
  ];

  return (
    <div style={{ background: "#020817", minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", overflowX: "hidden" }}>
      <MouseGlow />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(2,8,23,0.75)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(6,182,212,0.08)" }}>
        <img src="/hakase-logo-transparent.png" alt="Hakase AI" style={{ height: 30, width: "auto", objectFit: "contain" }} />
        <div style={{ display: "flex", gap: 32 }}>
          {["Features", "How it Works", "Impact"].map(l => (
            <motion.a key={l} href="#" whileHover={{ color: "#22d3ee" }} style={{ fontSize: 13.5, fontWeight: 500, color: "#64748b", textDecoration: "none" }}>{l}</motion.a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <motion.button onClick={() => nav("/dashboard")} whileHover={{ color: "#22d3ee" }} style={{ fontSize: 13.5, fontWeight: 500, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>Sign In</motion.button>
          <motion.button onClick={() => nav("/dashboard")} whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(6,182,212,0.5)" }} whileTap={{ scale: 0.97 }}
            style={{ padding: "8px 20px", borderRadius: 10, background: "linear-gradient(135deg,#0891b2,#6366f1)", color: "#fff", fontSize: 13.5, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 0 16px rgba(6,182,212,0.3)" }}>
            Launch App →
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div ref={heroRef} style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", paddingTop: 64 }}>
        <ParticleCanvas />
        <Blobs />
        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 1280, margin: "0 auto", padding: "80px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <motion.div style={{ y: heroY, opacity: heroOpacity }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", marginBottom: 28 }}>
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#06b6d4" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22d3ee", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI-Powered Clinical Intelligence</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: "clamp(42px, 5vw, 66px)", fontWeight: 900, lineHeight: 1.07, color: "#fff", marginBottom: 20, letterSpacing: "-0.03em" }}>
              The Intelligence<br />Platform for{" "}
              <span style={{ background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 60%, #ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Clinical Trials
              </span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              style={{ fontSize: 16.5, color: "#64748b", lineHeight: 1.7, marginBottom: 28, maxWidth: 440 }}>
              From discovery to outcome prediction —{" "}
              <Typewriter texts={["real ClinicalTrials.gov data.", "live FDA FAERS signals.", "PubMed evidence synthesis.", "Monte Carlo enrollment modeling."]} />
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} style={{ display: "flex", gap: 12, marginBottom: 40 }}>
              <motion.button onClick={() => nav("/dashboard")} whileHover={{ scale: 1.04, boxShadow: "0 0 44px rgba(6,182,212,0.55)" }} whileTap={{ scale: 0.96 }}
                style={{ padding: "14px 28px", borderRadius: 13, background: "linear-gradient(135deg,#0891b2,#6366f1)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(6,182,212,0.35)" }}>
                Launch Dashboard →
              </motion.button>
              <motion.button whileHover={{ background: "rgba(255,255,255,0.08)" }}
                style={{ padding: "14px 28px", borderRadius: 13, background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: 15, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                See How It Works
              </motion.button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {[{ label: "ClinicalTrials.gov", color: "#06b6d4" }, { label: "FDA FAERS", color: "#ef4444" }, { label: "PubMed", color: "#10b981" }].map((s, i) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                  <span style={{ fontSize: 11, color: "#334155" }}>{s.label}</span>
                  {i < 2 && <span style={{ fontSize: 11, color: "#1e293b", marginLeft: 2 }}>·</span>}
                </div>
              ))}
              <span style={{ fontSize: 11, color: "#334155", marginLeft: 4 }}>Live APIs</span>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <TiltCard><HeroCard /></TiltCard>
          </motion.div>
        </div>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: 1, height: 36, background: "linear-gradient(180deg, transparent, rgba(6,182,212,0.5))" }} />
          <div style={{ fontSize: 9.5, color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>Scroll</div>
        </motion.div>
      </div>

      {/* ── Marquee ──────────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── Platform Showcase ─────────────────────────────────────────────── */}
      <PlatformShowcase />

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "80px 48px 100px", maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>Real Data. Real Intelligence.</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
              Backed by millions of{" "}
              <span style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>real data points.</span>
            </h2>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          {[
            { n: 500, suf: "K+", label: "Clinical Trials Indexed", color: "#06b6d4", sub: "ClinicalTrials.gov" },
            { n: 20, suf: "M+", label: "Adverse Event Reports", color: "#ef4444", sub: "OpenFDA FAERS" },
            { n: 36, suf: "M+", label: "PubMed Articles", color: "#10b981", sub: "NCBI E-utilities" },
            { n: 1000, suf: "", label: "Monte Carlo Iterations", color: "#f59e0b", sub: "Per simulation run" },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.08}>
              <div style={{ textAlign: "center", padding: "36px 20px", borderRadius: 20, background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 80, height: 2, background: s.color, borderRadius: "0 0 4px 4px" }} />
                <div style={{ fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 10 }}>
                  <Counter to={s.n} suffix={s.suf} />
                </div>
                <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#334155" }}>{s.sub}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 48px 100px", maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>Platform Capabilities</div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 42px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>Every stage. Intelligence-first.</h2>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.07}>
              <TiltCard style={{ height: "100%" }}>
                <motion.div whileHover={{ borderColor: `${f.accent}50` }}
                  style={{ height: "100%", padding: "24px", borderRadius: 18, background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)` }} />
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: `${f.accent}14`, border: `1px solid ${f.accent}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{f.emoji}</div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 7 }}>{f.title}</h3>
                  <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65, marginBottom: 14 }}>{f.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>Live data connected</span>
                  </div>
                </motion.div>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden", margin: "0 48px 100px", borderRadius: 26 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #050f20, #0a1628, #060d1f)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(6,182,212,0.1), transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%, rgba(99,102,241,0.1), transparent 60%)" }} />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", width: 700, height: 700, border: "1px solid rgba(6,182,212,0.06)", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", width: 400, height: 400, border: "1px solid rgba(99,102,241,0.1)", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "72px 60px", textAlign: "center" }}>
          <FadeIn>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 58px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 18 }}>
              Your first simulation<br />
              <span style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                starts in 30 seconds.
              </span>
            </h2>
            <p style={{ fontSize: 15, color: "#475569", maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}>
              Enter your condition and drug. Hakase pulls live data from five global sources instantly.
            </p>
            <motion.button onClick={() => nav("/dashboard")} whileHover={{ scale: 1.06, boxShadow: "0 0 50px rgba(6,182,212,0.55)" }} whileTap={{ scale: 0.96 }}
              style={{ padding: "16px 36px", borderRadius: 14, background: "linear-gradient(135deg,#0891b2,#6366f1)", color: "#fff", fontSize: 16, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(6,182,212,0.35)" }}>
              Launch the Dashboard →
            </motion.button>
          </FadeIn>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ padding: "28px 48px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src="/hakase-logo-transparent.png" alt="Hakase AI" style={{ height: 24, width: "auto", objectFit: "contain", opacity: 0.7 }} />
        <div style={{ fontSize: 11.5, color: "#1e293b" }}>Live APIs: ClinicalTrials.gov · PubMed · FDA FAERS · OpenFDA</div>
        <div style={{ fontSize: 11.5, color: "#1e293b" }}>© 2026 Hakase AI</div>
      </footer>
    </div>
  );
}
