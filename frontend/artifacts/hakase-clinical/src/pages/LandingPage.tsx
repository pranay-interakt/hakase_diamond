import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useInView, useSpring, useMotionValue } from "framer-motion";

// ─── Utilities ────────────────────────────────────────────────────────────────

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}>
      {children}
    </motion.div>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1800, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function TiltCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0); const ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 260, damping: 26 });
  const sy = useSpring(ry, { stiffness: 260, damping: 26 });
  const onMove = useCallback((e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -10);
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
  }, [rx, ry]);
  return (
    <motion.div ref={ref} style={{ ...style, rotateX: sx, rotateY: sy, transformPerspective: 1000 }}
      onMouseMove={onMove} onMouseLeave={() => { rx.set(0); ry.set(0); }}>
      {children}
    </motion.div>
  );
}

// ─── Animated grid bg ─────────────────────────────────────────────────────────

function GridBg({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(99,102,241,${opacity}) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,${opacity}) 1px, transparent 1px)`, backgroundSize: "64px 64px" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.06), transparent)" }} />
    </div>
  );
}

// ─── Noise texture ────────────────────────────────────────────────────────────

const NOISE_SVG = `<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.04'/></svg>`;
const NOISE_URL = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

// ─── Blobs ────────────────────────────────────────────────────────────────────

function Blobs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[
        { w: 640, h: 640, top: -200, left: -200, c: "#4f46e5", a: 0.12, d: 14 },
        { w: 480, h: 480, top: 80, right: -100, c: "#0891b2", a: 0.1, d: 11 },
        { w: 360, h: 360, bottom: -80, left: "40%", c: "#db2777", a: 0.07, d: 16 },
      ].map((b, i) => (
        <motion.div key={i}
          style={{ position: "absolute", width: b.w, height: b.h, top: (b as any).top, left: (b as any).left, right: (b as any).right, bottom: (b as any).bottom, borderRadius: "50%", background: `radial-gradient(circle, ${b.c}, transparent 70%)`, filter: "blur(80px)", opacity: b.a }}
          animate={{ scale: [1, 1.1, 1], x: [-8, 8, -8], y: [-5, 5, -5] }}
          transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

// ─── Mouse glow ───────────────────────────────────────────────────────────────

function MouseGlow() {
  const [p, setP] = useState({ x: -999, y: -999 });
  useEffect(() => {
    const h = (e: MouseEvent) => setP({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  const sx = useSpring(p.x, { stiffness: 90, damping: 24 });
  const sy = useSpring(p.y, { stiffness: 90, damping: 24 });
  return (
    <motion.div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <motion.div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05), transparent 70%)", transform: "translate(-50%,-50%)", x: sx, y: sy }} />
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
    if (!del && disp.length < cur.length) { const t = setTimeout(() => setDisp(cur.slice(0, disp.length + 1)), 50); return () => clearTimeout(t); }
    if (!del && disp.length === cur.length) { const t = setTimeout(() => setDel(true), 2000); return () => clearTimeout(t); }
    if (del && disp.length > 0) { const t = setTimeout(() => setDisp(disp.slice(0, -1)), 24); return () => clearTimeout(t); }
    if (del && disp.length === 0) { setDel(false); setIdx((idx + 1) % texts.length); }
  }, [disp, del, idx, texts]);
  return (
    <span style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {disp}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
        style={{ WebkitTextFillColor: "#6366f1" }}>|</motion.span>
    </span>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────

const TICKS = ["ClinicalTrials.gov v2", "FDA FAERS · 20M+ reports", "PubMed · 36M+ articles", "OpenFDA Drug Labels", "PRR/ROR Signal Detection", "Monte Carlo Simulation", "Ensemble ML Prediction", "Shannon Diversity Index", "Real-Time Data Fusion", "Phase-Stratified Analysis"];

function Ticker() {
  return (
    <div style={{ overflow: "hidden", padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", backdropFilter: "blur(8px)" }}>
      <motion.div style={{ display: "flex", gap: 56, whiteSpace: "nowrap" }} animate={{ x: [0, -2800] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
        {[...TICKS, ...TICKS, ...TICKS].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(99,102,241,0.6)" }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>{t}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Hero Dashboard Mockup ────────────────────────────────────────────────────

function DashMockup() {
  return (
    <div style={{ position: "relative" }}>
      {/* Glow under card */}
      <div style={{ position: "absolute", bottom: -60, left: "5%", right: "5%", height: 100, background: "radial-gradient(ellipse, rgba(99,102,241,0.35), transparent 70%)", filter: "blur(30px)", borderRadius: "50%" }} />

      {/* Stacked layers */}
      <div style={{ position: "absolute", inset: "20px 14px 0 14px", borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", transform: "translateY(16px)" }} />
      <div style={{ position: "absolute", inset: "10px 7px 0 7px", borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", transform: "translateY(8px)" }} />

      {/* Main card */}
      <TiltCard>
        <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "linear-gradient(160deg,#0f1b35,#090f20)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
          {/* Window chrome */}
          <div style={{ padding: "10px 16px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 5 }}>{["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}</div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 5, padding: "3px 10px", fontSize: 10, color: "#334155" }}>app.hakase.ai/dashboard</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 8.5, color: "#22c55e", fontWeight: 700 }}>Live</span>
            </div>
          </div>

          {/* App layout */}
          <div style={{ display: "flex", height: 320 }}>
            {/* Sidebar */}
            <div style={{ width: 110, background: "rgba(0,0,0,0.25)", borderRight: "1px solid rgba(255,255,255,0.04)", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ padding: "4px 6px", marginBottom: 8 }}>
                <img src="/hakase-logo-transparent.png" alt="Hakase" style={{ height: 14, width: "auto", objectFit: "contain" }} />
              </div>
              {[
                { l: "Overview", a: false },
                { l: "Trial Hub", a: true },
                { l: "Trial Explorer", a: false },
                { l: "KOL Finder", a: false },
                { l: "Safety Intel", a: false },
                { l: "Enrollment", a: false },
              ].map(({ l, a }) => (
                <div key={l} style={{ padding: "5px 8px", borderRadius: 6, background: a ? "rgba(99,102,241,0.16)" : "transparent", fontSize: 9, color: a ? "#818cf8" : "#2d3f5e", fontWeight: a ? 700 : 400, display: "flex", alignItems: "center", gap: 4 }}>
                  {a && <div style={{ width: 2, height: 9, background: "#6366f1", borderRadius: 2, flexShrink: 0 }} />}
                  {l}
                </div>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 9, color: "#334155", fontWeight: 600 }}>Clinical Trial Hub · Stage 1: Discovery</div>

              {/* KPI row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 7 }}>
                {[
                  { l: "ACTIVE TRIALS", v: "2,847", c: "#06b6d4" },
                  { l: "SAFETY SCORE", v: "78/100", c: "#22c55e" },
                  { l: "PUBMED", v: "14,302", c: "#818cf8" },
                  { l: "UNMET NEED", v: "82/100", c: "#f59e0b" },
                ].map(k => (
                  <div key={k.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 6.5, color: "#334155", letterSpacing: "0.08em", marginBottom: 2 }}>{k.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: k.c }}>{k.v}</div>
                  </div>
                ))}
              </div>

              {/* Phase chart */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 7, color: "#334155", marginBottom: 5, letterSpacing: "0.08em" }}>PHASE DISTRIBUTION</div>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 52 }}>
                  {[28, 54, 100, 72, 46, 68, 36, 58].map((h, i) => (
                    <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                      style={{ flex: 1, borderRadius: "3px 3px 0 0", background: i === 2 ? "linear-gradient(180deg,#6366f1,#06b6d4)" : "rgba(99,102,241,0.16)" }} />
                  ))}
                </div>
              </div>

              {/* PRR signal row */}
              <div style={{ display: "flex", gap: 5 }}>
                {[
                  { l: "NEUTROPENIA", prr: "4.95", c: "#ef4444" },
                  { l: "ACUTE KIDNEY INJURY", prr: "4.81", c: "#f59e0b" },
                  { l: "ANAEMIA", prr: "3.97", c: "#10b981" },
                ].map(s => (
                  <div key={s.l} style={{ flex: 1, padding: "5px 7px", borderRadius: 6, background: `${s.c}12`, border: `1px solid ${s.c}25` }}>
                    <div style={{ fontSize: 6, color: s.c, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 1 }}>{s.l}</div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: s.c }}>PRR {s.prr}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </TiltCard>

      {/* Floating badges */}
      <motion.div animate={{ y: [-6, 6, -6] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: -20, right: -40, backdropFilter: "blur(16px)", background: "rgba(9,12,25,0.88)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 8.5, color: "#475569", marginBottom: 2 }}>ML Success Score</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#22c55e" }}>74%</div>
      </motion.div>

      <motion.div animate={{ y: [6, -6, 6] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{ position: "absolute", bottom: 40, left: -44, backdropFilter: "blur(16px)", background: "rgba(9,12,25,0.88)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 8.5, color: "#475569", marginBottom: 2 }}>Monte Carlo P50</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#67e8f9" }}>18.4 mo</div>
      </motion.div>

      <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        style={{ position: "absolute", top: "42%", right: -48, backdropFilter: "blur(16px)", background: "rgba(9,12,25,0.88)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 7 }}>
        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>4 live APIs</span>
      </motion.div>
    </div>
  );
}

// ─── Features Bento Grid ──────────────────────────────────────────────────────

const BENTO = [
  {
    title: "Discovery & Feasibility",
    desc: "300+ live ClinicalTrials.gov records analyzed per query. Completion rates, PRR/ROR safety signals, geographic diversity.",
    emoji: "🔬", accent: "#06b6d4", wide: true,
    demo: { type: "bars", data: [{ l: "Phase 1", v: 35 }, { l: "Phase 2", v: 100 }, { l: "Phase 3", v: 72 }, { l: "Phase 4", v: 20 }] },
  },
  {
    title: "Site Intelligence",
    desc: "Global site ranking by enrollment velocity, startup time, and trial experience.",
    emoji: "📍", accent: "#10b981",
    demo: { type: "list", data: [{ r: 1, n: "Mayo Clinic, MN", s: 94 }, { r: 2, n: "MD Anderson, TX", s: 91 }, { r: 3, n: "Mass General, MA", s: 88 }] },
  },
  {
    title: "Monte Carlo Enrollment",
    desc: "1,000-iteration stochastic simulation. P10/P50/P90 timelines derived from real completed trial rates.",
    emoji: "📈", accent: "#ec4899",
    demo: { type: "mc", p10: 14.2, p50: 18.4, p90: 24.1 },
  },
  {
    title: "PRR/ROR Safety Signals",
    desc: "Pharmacovigilance-grade signal detection. Evans 2001 / WHO standard from 20M+ FAERS adverse events.",
    emoji: "🛡️", accent: "#ef4444",
    demo: { type: "prr", signals: [{ r: "NEUTROPENIA", prr: 4.95 }, { r: "AKI", prr: 4.81 }, { r: "ANAEMIA", prr: 3.97 }] },
  },
  {
    title: "Regulatory Mapping",
    desc: "IND/CTA roadmaps, IRB timelines, and Fast Track / Orphan Drug eligibility — auto-generated.",
    emoji: "📋", accent: "#f59e0b",
    demo: { type: "checklist", items: ["Investigator Brochure", "CMC Documentation", "Phase 1 Protocol", "Informed Consent"] },
  },
  {
    title: "ML Outcome Prediction",
    desc: "Ensemble GradientBoosting + RandomForest trained on CTGov corpus. GO/NO-GO recommendation with probability.",
    emoji: "🧬", accent: "#6366f1",
    demo: { type: "gauge", val: 74 },
  },
];

function BentoDemo({ item }: { item: typeof BENTO[0] }) {
  const d = item.demo as any;
  if (d.type === "bars") {
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60, marginTop: 12 }}>
        {d.data.map((b: any, i: number) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
            <motion.div initial={{ height: 0 }} animate={{ height: `${b.v}%` }} transition={{ duration: 0.7, delay: i * 0.1 }}
              style={{ width: "100%", borderRadius: "3px 3px 0 0", background: `${item.accent}${i === 1 ? "ff" : "33"}` }} />
            <span style={{ fontSize: 8, color: "#334155" }}>{b.l.replace("Phase ", "P")}</span>
          </div>
        ))}
      </div>
    );
  }
  if (d.type === "list") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 12 }}>
        {d.data.map((r: any, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 9px", borderRadius: 8, background: i === 0 ? `${item.accent}14` : "rgba(255,255,255,0.03)" }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: item.accent, width: 16, flexShrink: 0 }}>#{r.r}</span>
            <span style={{ fontSize: 9.5, color: "#94a3b8", flex: 1 }}>{r.n}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: item.accent }}>{r.s}</span>
          </div>
        ))}
      </div>
    );
  }
  if (d.type === "mc") {
    const max = d.p90;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
        {[{ l: "P10", v: d.p10, c: "#10b981" }, { l: "P50", v: d.p50, c: item.accent }, { l: "P90", v: d.p90, c: "#ef4444" }].map(({ l, v, c }) => (
          <div key={l}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginBottom: 3 }}>
              <span>{l}</span><span style={{ fontWeight: 700, color: c }}>{v} mo</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${(v / max) * 100}%` }} transition={{ duration: 0.9 }}
                style={{ height: "100%", borderRadius: 999, background: c }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (d.type === "prr") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 12 }}>
        {d.signals.map((s: any, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 9px", borderRadius: 7, background: `${item.accent}0c`, border: `1px solid ${item.accent}20` }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: item.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 9.5, color: "#94a3b8", flex: 1 }}>{s.r}</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: item.accent }}>PRR {s.prr}</span>
          </div>
        ))}
      </div>
    );
  }
  if (d.type === "checklist") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 12 }}>
        {d.items.map((it: string, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 9px", borderRadius: 7, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: `${item.accent}18`, border: `1px solid ${item.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke={item.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <span style={{ fontSize: 9.5, color: "#94a3b8" }}>{it}</span>
          </div>
        ))}
      </div>
    );
  }
  if (d.type === "gauge") {
    const cir = Math.PI * 40;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12 }}>
        <svg width={110} height={66} viewBox="0 0 100 60">
          <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
          <motion.path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke={item.accent} strokeWidth="8" strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${cir}` }} animate={{ strokeDasharray: `${(d.val / 100) * cir} ${cir}` }} transition={{ duration: 1.2 }} />
          <text x="50" y="52" textAnchor="middle" style={{ fontSize: "16px", fontWeight: "900", fill: item.accent }}>{d.val}%</text>
        </svg>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#22c55e", marginBottom: 2 }}>GO</div>
          <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.5 }}>Ensemble ML<br />recommends filing</div>
        </div>
      </div>
    );
  }
  return null;
}

function BentoGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "auto auto", gap: 14 }}>
      {BENTO.map((item, i) => (
        <FadeUp key={item.title} delay={i * 0.06}>
          <motion.div whileHover={{ y: -3, boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${item.accent}22` }}
            style={{ gridColumn: item.wide ? "span 1" : "span 1", padding: "22px", borderRadius: 18, background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden", transition: "box-shadow 0.3s" }}>
            {/* Top color accent */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${item.accent}80, transparent)` }} />
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.accent}14`, border: `1px solid ${item.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>{item.emoji}</div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0", marginBottom: 6 }}>{item.title}</h3>
            <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.65 }}>{item.desc}</p>
            <BentoDemo item={item} />
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 14 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 9.5, color: "#22c55e", fontWeight: 600 }}>Live data</span>
            </div>
          </motion.div>
        </FadeUp>
      ))}
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  { n: "01", title: "Enter your trial parameters", desc: "Condition, drug/intervention, phase, and sponsor type. One unified form populates all 6 stages.", color: "#06b6d4" },
  { n: "02", title: "Hakase pulls live data from 4 APIs", desc: "ClinicalTrials.gov, FDA FAERS, PubMed, and OpenFDA respond in real time — no cached data.", color: "#6366f1" },
  { n: "03", title: "Get your full intelligence report", desc: "Discovery landscape, site rankings, IND timeline, MC enrollment, execution risks, and GO/NO-GO verdict.", color: "#ec4899" },
];

function HowItWorks() {
  return (
    <div style={{ padding: "100px 48px", maxWidth: 1200, margin: "0 auto" }}>
      <FadeUp>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Simple. Fast. Accurate.</div>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>From question to intelligence in seconds.</h2>
        </div>
      </FadeUp>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {STEPS.map((s, i) => (
          <FadeUp key={s.n} delay={i * 0.1}>
            <div style={{ position: "relative", padding: "28px", borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {i < 2 && (
                <div style={{ position: "absolute", top: "50%", right: -22, transform: "translateY(-50%)", zIndex: 10, fontSize: 16, color: "#1e293b" }}>→</div>
              )}
              <div style={{ fontSize: 36, fontWeight: 900, color: "rgba(255,255,255,0.06)", letterSpacing: "-0.04em", marginBottom: 14, lineHeight: 1 }}>{s.n}</div>
              <div style={{ width: 36, height: 3, borderRadius: 999, background: s.color, marginBottom: 16 }} />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0", marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}

// ─── Stats section ────────────────────────────────────────────────────────────

function Stats() {
  const stats = [
    { n: 500, suf: "K+", label: "Clinical Trials Indexed", sub: "ClinicalTrials.gov v2", c: "#06b6d4" },
    { n: 20, suf: "M+", label: "Adverse Event Reports", sub: "FDA FAERS database", c: "#ef4444" },
    { n: 36, suf: "M+", label: "PubMed Articles", sub: "NCBI E-utilities API", c: "#10b981" },
    { n: 1000, suf: "", label: "Monte Carlo Iterations", sub: "Per simulation run", c: "#f59e0b" },
  ];
  return (
    <div style={{ padding: "80px 48px", maxWidth: 1200, margin: "0 auto" }}>
      <FadeUp>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {stats.map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.08}>
              <div style={{ textAlign: "center", padding: "32px 20px", borderRadius: 18, background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 60, height: 2, background: s.c, borderRadius: "0 0 3px 3px" }} />
                <div style={{ fontSize: "clamp(34px, 4vw, 50px)", fontWeight: 900, color: s.c, lineHeight: 1, marginBottom: 8 }}><Counter to={s.n} suffix={s.suf} /></div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "#334155" }}>{s.sub}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </FadeUp>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [, nav] = useLocation();
  const scrollY = useScrollY();
  const navScrolled = scrollY > 20;

  return (
    <div style={{ background: "#030712", minHeight: "100vh", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
      <MouseGlow />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 44px", height: 62,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: navScrolled ? "rgba(3,7,18,0.88)" : "transparent",
          backdropFilter: navScrolled ? "blur(20px)" : "none",
          borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
          transition: "all 0.3s",
        }}>
        <img src="/hakase-logo-transparent.png" alt="Hakase AI" style={{ height: 28, width: "auto", objectFit: "contain" }} />
        <div style={{ display: "flex", gap: 36 }}>
          {["Features", "How it Works", "Impact"].map(l => (
            <motion.a key={l} href="#" whileHover={{ color: "#818cf8" }} style={{ fontSize: 13, fontWeight: 500, color: "#475569", textDecoration: "none", transition: "color 0.2s" }}>{l}</motion.a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <motion.button onClick={() => nav("/dashboard")} whileHover={{ color: "#818cf8" }}
            style={{ fontSize: 13, fontWeight: 500, color: "#475569", background: "none", border: "none", cursor: "pointer" }}>Sign In</motion.button>
          <motion.button onClick={() => nav("/dashboard")} whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(99,102,241,0.5)" }} whileTap={{ scale: 0.97 }}
            style={{ padding: "8px 20px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#0891b2)", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}>
            Launch App →
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", paddingTop: 62 }}>
        <Blobs />
        <GridBg />

        {/* Noise overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: NOISE_URL, pointerEvents: "none", opacity: 0.4 }} />

        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 1280, margin: "0 auto", padding: "80px 48px", display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 72, alignItems: "center" }}>

          {/* Left copy */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: 28 }}>
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI-Powered Clinical Intelligence</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: "clamp(40px, 5vw, 66px)", fontWeight: 900, lineHeight: 1.06, color: "#fff", marginBottom: 22, letterSpacing: "-0.035em" }}>
              The Intelligence<br />Platform for{" "}
              <span style={{ background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 55%, #ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Clinical Trials
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ fontSize: 16, color: "#64748b", lineHeight: 1.75, marginBottom: 32, maxWidth: 440 }}>
              From discovery to GO/NO-GO verdict —{" "}
              <Typewriter texts={["real ClinicalTrials.gov data.", "live FDA FAERS safety signals.", "PubMed evidence synthesis.", "Monte Carlo enrollment modeling."]} />
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ display: "flex", gap: 12, marginBottom: 40, alignItems: "center" }}>
              <motion.button onClick={() => nav("/dashboard")} whileHover={{ scale: 1.04, boxShadow: "0 0 44px rgba(99,102,241,0.55)" }} whileTap={{ scale: 0.96 }}
                style={{ padding: "13px 26px", borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#0891b2)", color: "#fff", fontSize: 14.5, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(99,102,241,0.35)" }}>
                Launch Dashboard →
              </motion.button>
              <motion.button whileHover={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.18)" }}
                style={{ padding: "13px 26px", borderRadius: 12, background: "rgba(255,255,255,0.04)", color: "#cbd5e1", fontSize: 14.5, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.2s" }}>
                See How It Works
              </motion.button>
            </motion.div>

            {/* Source pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { l: "ClinicalTrials.gov", c: "#06b6d4" },
                { l: "FDA FAERS", c: "#ef4444" },
                { l: "PubMed", c: "#22c55e" },
                { l: "OpenFDA", c: "#f59e0b" },
              ].map(s => (
                <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 100, background: `${s.c}10`, border: `1px solid ${s.c}20` }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.c }} />
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: `${s.c}cc` }}>{s.l}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Dashboard mockup */}
          <motion.div initial={{ opacity: 0, x: 44 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}>
            <DashMockup />
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.2, repeat: Infinity }}
          style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: 1, height: 32, background: "linear-gradient(180deg, transparent, rgba(99,102,241,0.5))" }} />
          <span style={{ fontSize: 9, color: "#1e293b", letterSpacing: "0.14em", textTransform: "uppercase" }}>scroll</span>
        </motion.div>
      </div>

      {/* ── Ticker ────────────────────────────────────────────────────────── */}
      <Ticker />

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <Stats />

      {/* ── Features Bento ─────────────────────────────────────────────────── */}
      <div style={{ padding: "0 48px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <FadeUp>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Platform Capabilities</div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 44px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
              Every stage.{" "}
              <span style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Intelligence-first.</span>
            </h2>
          </div>
        </FadeUp>
        <BentoGrid />
      </div>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <HowItWorks />
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: "80px 48px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <FadeUp>
          <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", padding: "72px 60px", textAlign: "center" }}>
            {/* Background */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0a0f24, #0d1430, #08101e)" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 25% 50%, rgba(99,102,241,0.15), transparent 55%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 75% 50%, rgba(6,182,212,0.12), transparent 55%)" }} />
            <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(99,102,241,0.15)", borderRadius: 24 }} />
            {/* Rotating rings */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", width: 600, height: 600, border: "1px solid rgba(99,102,241,0.07)", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", width: 360, height: 360, border: "1px solid rgba(6,182,212,0.09)", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>Start your first simulation</div>
              <h2 style={{ fontSize: "clamp(28px, 4.5vw, 56px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 18, lineHeight: 1.1 }}>
                Your GO/NO-GO verdict<br />
                <span style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  in under 30 seconds.
                </span>
              </h2>
              <p style={{ fontSize: 15, color: "#475569", maxWidth: 400, margin: "0 auto 36px", lineHeight: 1.7 }}>
                Enter your condition and drug. Hakase pulls live data from four global sources and runs all 6 stages automatically.
              </p>
              <motion.button onClick={() => nav("/dashboard")} whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(99,102,241,0.55)" }} whileTap={{ scale: 0.96 }}
                style={{ padding: "15px 34px", borderRadius: 13, background: "linear-gradient(135deg,#6366f1,#0891b2)", color: "#fff", fontSize: 15, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(99,102,241,0.35)" }}>
                Launch the Dashboard →
              </motion.button>
            </div>
          </div>
        </FadeUp>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ padding: "24px 48px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <img src="/hakase-logo-transparent.png" alt="Hakase AI" style={{ height: 22, width: "auto", objectFit: "contain", opacity: 0.6 }} />
        <div style={{ display: "flex", gap: 20 }}>
          {["ClinicalTrials.gov", "PubMed", "FDA FAERS", "OpenFDA"].map(s => (
            <span key={s} style={{ fontSize: 11, color: "#1e293b", fontWeight: 500 }}>{s}</span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#1e293b" }}>© 2026 Hakase AI</div>
      </footer>
    </div>
  );
}
