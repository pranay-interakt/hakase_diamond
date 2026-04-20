import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
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
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.4,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > c.width) a.vx *= -1;
        if (a.y < 0 || a.y > c.height) a.vy *= -1;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(6,182,212,0.45)"; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j]; const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = `rgba(6,182,212,${(1 - d / 120) * 0.1})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ─── DNA Helix Canvas ─────────────────────────────────────────────────────────

const DNA_STAGES = [
  { label: "Discovery", sub: "CTGov landscape · 300+ trials", color: "#06b6d4" },
  { label: "Site Selection", sub: "Global ranking · Shannon diversity", color: "#6366f1" },
  { label: "Regulatory", sub: "IND/CTA roadmap · precedent data", color: "#10b981" },
  { label: "Enrollment Sim", sub: "Monte Carlo P10/P50/P90", color: "#f59e0b" },
  { label: "Execution", sub: "Protocol deviation modeling", color: "#ec4899" },
  { label: "Outcomes", sub: "ML success probability · GB+RF", color: "#8b5cf6" },
];

function DNASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const [progress, setProgress] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", v => setProgress(v));

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf: number;
    let internalProgress = progress;

    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    const draw = () => {
      internalProgress = progress;
      const W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const N = 50;
      const helixH = H * 0.78;
      const startY = H * 0.11;
      const scroll = Math.max(0, Math.min(1, (internalProgress - 0.1) / 0.75));
      const rotation = scroll * Math.PI * 5;
      const amplitude = 55 + scroll * 35;

      const COLORS_A = ["#06b6d4", "#0891b2", "#22d3ee", "#06b6d4", "#0ea5e9"];
      const COLORS_B = ["#6366f1", "#4f46e5", "#818cf8", "#6366f1", "#8b5cf6"];
      const RUNG_COLOR = (z: number) => `rgba(120,150,255,${0.15 + z * 0.18})`;

      const strand1x: number[] = [], strand1y: number[] = [];
      const strand2x: number[] = [], strand2y: number[] = [];

      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const y = startY + t * helixH;
        const angle = t * Math.PI * 7 + rotation;
        const z1 = Math.sin(angle);
        const x1 = cx + Math.cos(angle) * amplitude;
        const x2 = cx + Math.cos(angle + Math.PI) * amplitude;
        strand1x.push(x1); strand1y.push(y);
        strand2x.push(x2); strand2y.push(y);
      }

      // Draw connecting rungs
      for (let i = 0; i <= N; i += 3) {
        const angle = (i / N) * Math.PI * 7 + rotation;
        const z = Math.sin(angle);
        if (z > -0.1) {
          ctx.beginPath();
          ctx.moveTo(strand1x[i], strand1y[i]);
          ctx.lineTo(strand2x[i], strand2y[i]);
          ctx.strokeStyle = RUNG_COLOR(z);
          ctx.lineWidth = 1.5 + z * 1;
          ctx.stroke();
        }
      }

      // Draw strand 1
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        if (i === 0) ctx.moveTo(strand1x[i], strand1y[i]);
        else ctx.lineTo(strand1x[i], strand1y[i]);
      }
      const grad1 = ctx.createLinearGradient(cx - amplitude, startY, cx + amplitude, startY + helixH);
      grad1.addColorStop(0, "rgba(6,182,212,0.6)");
      grad1.addColorStop(0.5, "rgba(6,182,212,0.9)");
      grad1.addColorStop(1, "rgba(6,182,212,0.6)");
      ctx.strokeStyle = grad1;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw strand 2
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        if (i === 0) ctx.moveTo(strand2x[i], strand2y[i]);
        else ctx.lineTo(strand2x[i], strand2y[i]);
      }
      const grad2 = ctx.createLinearGradient(cx - amplitude, startY, cx + amplitude, startY + helixH);
      grad2.addColorStop(0, "rgba(99,102,241,0.6)");
      grad2.addColorStop(0.5, "rgba(99,102,241,0.9)");
      grad2.addColorStop(1, "rgba(99,102,241,0.6)");
      ctx.strokeStyle = grad2;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#6366f1";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw nodes on strand 1 and 2
      for (let i = 0; i <= N; i += 2) {
        const angle = (i / N) * Math.PI * 7 + rotation;
        const z1 = Math.sin(angle); const z2 = Math.sin(angle + Math.PI);
        const r1 = 3.5 + z1 * 1.5, r2 = 3.5 + z2 * 1.5;
        if (r1 > 0) {
          ctx.beginPath(); ctx.arc(strand1x[i], strand1y[i], Math.max(1, r1), 0, Math.PI * 2);
          ctx.fillStyle = COLORS_A[i % COLORS_A.length]; ctx.shadowColor = COLORS_A[i % COLORS_A.length]; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
        }
        if (r2 > 0) {
          ctx.beginPath(); ctx.arc(strand2x[i], strand2y[i], Math.max(1, r2), 0, Math.PI * 2);
          ctx.fillStyle = COLORS_B[i % COLORS_B.length]; ctx.shadowColor = COLORS_B[i % COLORS_B.length]; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [progress]);

  const stageProgress = Math.max(0, (progress - 0.15) / 0.7);

  return (
    <div ref={sectionRef} style={{ height: "250vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#020817 0%,#050f24 100%)" }} />

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 40, alignItems: "center" }}>

          {/* Left: stage cards */}
          <div>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>6-Stage Intelligence Engine</div>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 10, lineHeight: 1.1 }}>
                Your trial lifecycle,<br />
                <span style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  unwinding in real-time.
                </span>
              </h2>
              <p style={{ fontSize: 14, color: "#475569", marginBottom: 36, lineHeight: 1.6 }}>Scroll to reveal each stage — powered by live APIs, ensemble ML, and Monte Carlo simulation.</p>
            </motion.div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DNA_STAGES.map((stage, i) => {
                const revealed = stageProgress > (i / DNA_STAGES.length) * 0.85;
                const active = stageProgress > (i / DNA_STAGES.length) * 0.85 && stageProgress < ((i + 1) / DNA_STAGES.length) * 0.85;
                return (
                  <motion.div key={stage.label}
                    animate={{ opacity: revealed ? 1 : 0.25, x: revealed ? 0 : -16 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14,
                      background: revealed ? `${stage.color}12` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${revealed ? `${stage.color}35` : "rgba(255,255,255,0.05)"}`,
                      boxShadow: revealed ? `0 0 20px ${stage.color}12` : "none",
                    }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: revealed ? `${stage.color}22` : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: revealed ? stage.color : "#334155" }}>0{i + 1}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: revealed ? "#e2e8f0" : "#334155" }}>{stage.label}</div>
                      <div style={{ fontSize: 11, color: revealed ? "#64748b" : "#1e293b", marginTop: 2 }}>{stage.sub}</div>
                    </div>
                    {revealed && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: 7, height: 7, borderRadius: "50%", background: stage.color, boxShadow: `0 0 8px ${stage.color}` }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: DNA canvas */}
          <div style={{ position: "relative", height: 540, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
            <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#1e293b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              scroll to reveal →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Background blobs ─────────────────────────────────────────────────────────

function Blobs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[
        { w: 750, h: 750, top: -260, left: -260, color: "#0891b2", dur: 14, delay: 0, op: 0.1 },
        { w: 550, h: 550, top: 60, right: -180, color: "#4f46e5", dur: 11, delay: 2, op: 0.1 },
        { w: 450, h: 450, bottom: -120, left: "35%", color: "#ec4899", dur: 16, delay: 4, op: 0.07 },
      ].map((b, i) => (
        <motion.div key={i} style={{
          position: "absolute", width: b.w, height: b.h,
          top: b.top as any, left: b.left as any, right: (b as any).right, bottom: (b as any).bottom,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
          filter: "blur(72px)", opacity: b.op,
        }}
          animate={{ scale: [1, 1.15, 1], x: [-12, 12, -12], y: [-8, 8, -8] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        />
      ))}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px), linear-gradient(90deg,rgba(6,182,212,0.05) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
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
      <motion.div style={{ position: "absolute", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)", transform: "translate(-50%,-50%)", x: sx, y: sy }} />
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
      const t = setTimeout(() => setDisplayed(cur.slice(0, displayed.length + 1)), 55);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === cur.length) {
      const t = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 28);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((idx + 1) % texts.length);
    }
  }, [displayed, deleting, idx, texts]);
  return (
    <span style={{ color: "#22d3ee" }}>
      {displayed}
      <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.75, repeat: Infinity }}>|</motion.span>
    </span>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  useEffect(() => {
    if (!inView) return;
    const dur = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
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
    <motion.div ref={ref} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}>
      {children}
    </motion.div>
  );
}

// ─── 3D Tilt ──────────────────────────────────────────────────────────────────

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
    <div style={{ overflow: "hidden", padding: "14px 0", background: "rgba(6,182,212,0.05)", borderTop: "1px solid rgba(6,182,212,0.1)", borderBottom: "1px solid rgba(6,182,212,0.1)" }}>
      <motion.div style={{ display: "flex", gap: 52, whiteSpace: "nowrap" }}
        animate={{ x: [0, -2600] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
        {[...TICKER, ...TICKER, ...TICKER].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#06b6d4" }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{item}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Hero: Upright 3D card stack ──────────────────────────────────────────────

function HeroCard() {
  return (
    <div style={{ position: "relative", perspective: "1200px" }}>
      {/* Shadow glow under stack */}
      <div style={{ position: "absolute", bottom: -40, left: "10%", right: "10%", height: 60, background: "radial-gradient(ellipse, rgba(6,182,212,0.3), transparent 70%)", filter: "blur(16px)", borderRadius: "50%" }} />

      {/* Card 3 (back) */}
      <div style={{
        position: "absolute", inset: 0,
        transform: "translateZ(-60px) translateX(24px) translateY(18px) rotateY(2deg)",
        borderRadius: 20, background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.08)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      }} />
      {/* Card 2 (mid) */}
      <div style={{
        position: "absolute", inset: 0,
        transform: "translateZ(-28px) translateX(12px) translateY(9px) rotateY(1deg)",
        borderRadius: 20, background: "rgba(15,26,50,0.8)", border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }} />

      {/* Main card (front) */}
      <div style={{
        position: "relative",
        borderRadius: 20, overflow: "hidden",
        background: "linear-gradient(160deg, #0f1f40 0%, #0a1628 100%)",
        border: "1px solid rgba(6,182,212,0.18)",
        boxShadow: "0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}>
        {/* Browser bar */}
        <div style={{ padding: "12px 18px", background: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>{["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}</div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 12px", fontSize: 11, color: "#334155" }}>app.hakase.ai/dashboard</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 700 }}>Live Engine</span>
          </div>
        </div>
        {/* Dashboard UI */}
        <div style={{ display: "flex" }}>
          {/* Sidebar */}
          <div style={{ width: 118, background: "rgba(0,0,0,0.2)", padding: "12px 8px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, padding: "0 4px" }}>
              <img src="/hakase-logo-transparent.png" alt="Hakase" style={{ height: 16, width: "auto", objectFit: "contain" }} />
            </div>
            {["Overview","Trial Hub","Trial Explorer","KOL Finder","Safety Intel","Enrollment"].map((l, i) => (
              <div key={l} style={{ padding: "5px 8px", marginBottom: 2, borderRadius: 6, background: i === 1 ? "rgba(6,182,212,0.18)" : "transparent", fontSize: 9, color: i === 1 ? "#22d3ee" : "#334155", fontWeight: i === 1 ? 700 : 400, display: "flex", alignItems: "center", gap: 5 }}>
                {i === 1 && <div style={{ width: 2.5, height: 10, background: "#06b6d4", borderRadius: 2, flexShrink: 0 }} />}
                {l}
              </div>
            ))}
          </div>
          {/* Main content */}
          <div style={{ flex: 1, padding: 14 }}>
            <div style={{ fontSize: 9, color: "#475569", marginBottom: 10 }}>Clinical Trial Hub · Stage 1: Discovery</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { l: "ACTIVE TRIALS", v: "2,847", c: "#06b6d4" },
                { l: "SAFETY SCORE", c: "#22c55e", v: "78/100" },
                { l: "PUBMED ARTICLES", c: "#6366f1", v: "14,302" },
                { l: "UNMET NEED", c: "#f59e0b", v: "82/100" },
              ].map(k => (
                <div key={k.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "9px 11px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 7, color: "#334155", letterSpacing: "0.08em", marginBottom: 3 }}>{k.l}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: k.c }}>{k.v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7.5, color: "#334155", marginBottom: 5, letterSpacing: "0.08em" }}>PHASE DISTRIBUTION · COMPETITIVE LANDSCAPE</div>
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 44 }}>
              {[35, 58, 100, 70, 50, 75, 40, 66, 30, 55].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "3px 3px 0 0", background: i === 2 ? "#06b6d4" : "rgba(6,182,212,0.2)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating stat chips */}
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

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
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
          <motion.button onClick={() => nav("/dashboard")}
            whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(6,182,212,0.5)" }}
            whileTap={{ scale: 0.97 }}
            style={{ padding: "8px 20px", borderRadius: 10, background: "linear-gradient(135deg,#0891b2,#6366f1)", color: "#fff", fontSize: 13.5, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 0 16px rgba(6,182,212,0.3)" }}>
            Launch App →
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div ref={heroRef} style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", paddingTop: 64 }}>
        <ParticleCanvas />
        <Blobs />

        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 1280, margin: "0 auto", padding: "80px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          {/* Left */}
          <motion.div style={{ y: heroY, opacity: heroOpacity }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", marginBottom: 28 }}>
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#06b6d4" }} />
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

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              style={{ display: "flex", gap: 12, marginBottom: 40 }}>
              <motion.button onClick={() => nav("/dashboard")}
                whileHover={{ scale: 1.04, boxShadow: "0 0 44px rgba(6,182,212,0.55)" }}
                whileTap={{ scale: 0.96 }}
                style={{ padding: "14px 28px", borderRadius: 13, background: "linear-gradient(135deg,#0891b2,#6366f1)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(6,182,212,0.35)" }}>
                Launch Dashboard →
              </motion.button>
              <motion.button whileHover={{ background: "rgba(255,255,255,0.08)" }}
                style={{ padding: "14px 28px", borderRadius: 13, background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: 15, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                See How It Works
              </motion.button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
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

          {/* Right: upright 3D card stack */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <TiltCard>
              <HeroCard />
            </TiltCard>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: 1, height: 36, background: "linear-gradient(180deg, transparent, rgba(6,182,212,0.5))" }} />
          <div style={{ fontSize: 9.5, color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>Scroll</div>
        </motion.div>
      </div>

      {/* ── Marquee ────────────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── DNA Section ────────────────────────────────────────────────────── */}
      <DNASection />

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: "100px 48px", maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>Real Data. Real Intelligence.</div>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 50px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
              Backed by millions of{" "}
              <span style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>real data points.</span>
            </h2>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[
            { n: 500, suf: "K+", label: "Clinical Trials Indexed", color: "#06b6d4", sub: "ClinicalTrials.gov" },
            { n: 20, suf: "M+", label: "Adverse Event Reports", color: "#ef4444", sub: "OpenFDA FAERS" },
            { n: 36, suf: "M+", label: "PubMed Articles", color: "#10b981", sub: "NCBI E-utilities" },
            { n: 1000, suf: "", label: "Monte Carlo Iterations", color: "#f59e0b", sub: "Per simulation run" },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.08}>
              <div style={{ textAlign: "center", padding: "36px 20px", borderRadius: 20, background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 80, height: 2, background: s.color, borderRadius: "0 0 4px 4px" }} />
                <div style={{ fontSize: "clamp(38px, 4vw, 56px)", fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 10 }}>
                  <Counter to={s.n} suffix={s.suf} />
                </div>
                <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#334155" }}>{s.sub}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 48px 100px", maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>Platform Capabilities</div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
              Every stage. Intelligence-first.
            </h2>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.07}>
              <TiltCard style={{ height: "100%" }}>
                <motion.div whileHover={{ borderColor: `${f.accent}50` }}
                  style={{ height: "100%", padding: "26px", borderRadius: 18, background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)` }} />
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.accent}14`, border: `1px solid ${f.accent}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>{f.emoji}</div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, marginBottom: 16 }}>{f.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ fontSize: 10.5, color: "#22c55e", fontWeight: 600 }}>Live data connected</span>
                  </div>
                </motion.div>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── Live Sources ────────────────────────────────────────────────────── */}
      <div style={{ padding: "60px 48px 100px", maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>Connected In Real-Time</div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
              Not scraped. Not cached.{" "}
              <span style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Directly live.</span>
            </h2>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          {[
            { name: "ClinicalTrials.gov", tag: "v2 REST API", stat: "500K+ trials", dot: "#06b6d4", icon: "🧪", desc: "NCBI's global registry of clinical research. Real-time search with 200+ fields." },
            { name: "FDA FAERS", tag: "OpenFDA", stat: "20M+ AEs", dot: "#ef4444", icon: "🛡️", desc: "Post-market drug safety adverse event database. 3 search strategy fallback." },
            { name: "PubMed / NCBI", tag: "Entrez API", stat: "36M+ articles", dot: "#10b981", icon: "📖", desc: "Biomedical literature. esearch + esummary for titles, journals, and abstracts." },
            { name: "OpenFDA Labels", tag: "REST API", stat: "140K+ labels", dot: "#f59e0b", icon: "💊", desc: "FDA-approved drug labeling. Also covers drug recall and enforcement data." },
          ].map((src, i) => (
            <FadeIn key={src.name} delay={i * 0.09}>
              <TiltCard>
                <div style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{src.icon}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                        style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: 9.5, color: "#22c55e", fontWeight: 700 }}>LIVE</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{src.name}</div>
                  <div style={{ fontSize: 9.5, color: src.dot, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{src.tag}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: src.dot, marginBottom: 8 }}>{src.stat}</div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.55 }}>{src.desc}</div>
                </div>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
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
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", marginBottom: 26 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22d3ee", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ready to accelerate?</span>
            </div>
            <h2 style={{ fontSize: "clamp(30px, 5vw, 62px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 18 }}>
              Your first simulation<br />
              <span style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                starts in 30 seconds.
              </span>
            </h2>
            <p style={{ fontSize: 15, color: "#475569", maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.7 }}>
              Enter your condition and drug. Hakase pulls live data from five global sources instantly.
            </p>
            <motion.button onClick={() => nav("/dashboard")}
              whileHover={{ scale: 1.06, boxShadow: "0 0 50px rgba(6,182,212,0.55)" }}
              whileTap={{ scale: 0.96 }}
              style={{ padding: "16px 36px", borderRadius: 14, background: "linear-gradient(135deg,#0891b2,#6366f1)", color: "#fff", fontSize: 16, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(6,182,212,0.35)" }}>
              Launch the Dashboard →
            </motion.button>
          </FadeIn>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ padding: "28px 48px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src="/hakase-logo-transparent.png" alt="Hakase AI" style={{ height: 24, width: "auto", objectFit: "contain", opacity: 0.7 }} />
        <div style={{ fontSize: 11.5, color: "#1e293b" }}>Live APIs: ClinicalTrials.gov · PubMed · FDA FAERS · OpenFDA</div>
        <div style={{ fontSize: 11.5, color: "#1e293b" }}>© 2026 Hakase AI</div>
      </footer>
    </div>
  );
}
