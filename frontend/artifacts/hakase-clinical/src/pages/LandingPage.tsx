import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
const heroImg = "/hero-brain.png";

// ─── Scroll utility ───────────────────────────────────────────────────────────
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

// ─── Reveal on scroll ─────────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  y = 40,
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Counter ──────────────────────────────────────────────────────────────────
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
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Cursor glow ──────────────────────────────────────────────────────────────
function CursorGlow() {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  const sx = useSpring(pos.x, { stiffness: 60, damping: 20 });
  const sy = useSpring(pos.y, { stiffness: 60, damping: 20 });
  return (
    <motion.div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.04), transparent 70%)",
          transform: "translate(-50%,-50%)",
          x: sx,
          y: sy,
        }}
      />
    </motion.div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
const TICKS = [
  "ClinicalTrials.gov v2 API",
  "FDA FAERS · 20M+ Reports",
  "PubMed · 36M+ Articles",
  "OpenFDA Drug Labels",
  "PRR / ROR Signal Detection",
  "Monte Carlo Simulation",
  "Ensemble ML Prediction",
  "Shannon Diversity Index",
  "Real-Time Data Fusion",
  "Phase-Stratified Analysis",
];

function Ticker() {
  return (
    <div
      style={{
        overflow: "hidden",
        padding: "13px 0",
        borderTop: "1px solid #e8e4de",
        borderBottom: "1px solid #e8e4de",
        background: "#f5f3ef",
      }}
    >
      <motion.div
        style={{ display: "flex", gap: 64, whiteSpace: "nowrap" }}
        animate={{ x: [0, -3200] }}
        transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
      >
        {[...TICKS, ...TICKS, ...TICKS, ...TICKS].map((t, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "#a0a0a0",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#777",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              {t}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    num: "01",
    title: "Clinical Trial Discovery",
    desc: "Query 400,000+ live ClinicalTrials.gov records by condition, phase, or intervention — with completion-rate benchmarks and geographic diversity.",
    accent: "#1a1a1a",
  },
  {
    num: "02",
    title: "PRR / ROR Safety Signals",
    desc: "Pharmacovigilance-grade signal detection from 20M+ FAERS adverse event reports. Evans 2001 WHO methodology, automatically.",
    accent: "#1a1a1a",
  },
  {
    num: "03",
    title: "Evidence Library",
    desc: "Full-text PubMed search across 36M+ articles with RCT classification, author-level KOL ranking, and abstract summaries.",
    accent: "#1a1a1a",
  },
  {
    num: "04",
    title: "Monte Carlo Enrollment",
    desc: "1,000-iteration stochastic simulation delivering P10 / P50 / P90 enrollment timelines from real completed-trial rate data.",
    accent: "#1a1a1a",
  },
  {
    num: "05",
    title: "Site Intelligence",
    desc: "Global investigator site ranking by enrollment velocity, startup history, and trial experience across therapeutic areas.",
    accent: "#1a1a1a",
  },
  {
    num: "06",
    title: "ML Outcome Prediction",
    desc: "Gradient Boosting + Random Forest ensemble trained on the full CTGov corpus. GO / NO-GO recommendation with confidence.",
    accent: "#1a1a1a",
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [, navigate] = useLocation();
  const scrollY = useScrollY();
  const navScrolled = scrollY > 40;

  // Hero parallax
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(heroProgress, [0, 1], [0, 80]);
  const imgScale = useTransform(heroProgress, [0, 1], [1, 1.06]);
  const textY = useTransform(heroProgress, [0, 1], [0, 40]);

  return (
    <div
      style={{
        background: "#faf9f7",
        minHeight: "100vh",
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        color: "#0a0a0a",
        overflowX: "hidden",
      }}
    >
      <CursorGlow />

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <motion.nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 40px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: navScrolled
            ? "rgba(250,249,247,0.92)"
            : "transparent",
          backdropFilter: navScrolled ? "blur(16px)" : "none",
          borderBottom: navScrolled ? "1px solid #e8e4de" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/hakase-logo-transparent.png"
            alt="Hakase"
            style={{ height: 28, width: "auto", objectFit: "contain" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            fontSize: 13.5,
            color: "#3a3a3a",
          }}
        >
          {["About", "Modules", "Research", "Contact"].map((item) => (
            <motion.span
              key={item}
              whileHover={{ color: "#0a0a0a" }}
              style={{ cursor: "pointer", transition: "color 0.2s" }}
            >
              {item}
            </motion.span>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "9px 22px",
            borderRadius: 8,
            background: "#0a0a0a",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          Open Platform →
        </motion.button>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#faf9f7",
        }}
      >
        {/* Left: copy — drives section height */}
        <motion.div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "52%",
            padding: "150px 72px 100px 64px",
            y: textY,
          }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 32,
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: 11, color: "#777", letterSpacing: "0.1em" }}>
              +
            </span>
            <span
              style={{
                fontSize: 11.5,
                color: "#555",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Clinical Intelligence Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "clamp(42px, 5.2vw, 72px)",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#0a0a0a",
              margin: "0 0 40px 0",
            }}
          >
            Accelerating<br />
            <span style={{ fontWeight: 700 }}>Clinical Trials</span><br />
            with AI
          </motion.h1>

          {/* Divider + body */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.44 }}
          >
            <div
              style={{
                width: 32,
                height: 1,
                background: "#aaa",
                marginBottom: 20,
              }}
            />
            <p
              style={{
                fontSize: 15.5,
                color: "#555",
                lineHeight: 1.7,
                maxWidth: 400,
                margin: "0 0 40px 0",
                fontWeight: 400,
              }}
            >
              We're redefining how drugs are discovered and trials are planned
              — live data from ClinicalTrials.gov, FDA FAERS, PubMed, and
              OpenFDA fused by clinical-grade AI.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.54 }}
            style={{ display: "flex", gap: 14, alignItems: "center" }}
          >
            <motion.button
              whileHover={{ scale: 1.02, background: "#1a1a1a" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "13px 32px",
                borderRadius: 8,
                background: "#0a0a0a",
                color: "#fff",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Explore Platform
            </motion.button>
            <motion.button
              whileHover={{ background: "#f0ede8" }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: "13px 28px",
                borderRadius: 8,
                background: "transparent",
                color: "#0a0a0a",
                border: "1px solid #d0cbc4",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            style={{
              marginTop: 56,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {["#4a7c9f", "#6e5a9f", "#4a9f7c", "#9f6e4a"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: c,
                    border: "2px solid #faf9f7",
                    marginLeft: i > 0 ? -8 : 0,
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 12.5, color: "#777" }}>
              Trusted by clinical research teams worldwide
            </span>
          </motion.div>
        </motion.div>

        {/* Right: hero image — absolutely fills the right half */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "54%",
            overflow: "hidden",
            background: "#f0ede8",
          }}
        >
          {/* Very subtle noise grain */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
          <motion.img
            src={heroImg}
            alt="AI Clinical Intelligence"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center center",
              y: imgY,
              scale: imgScale,
              display: "block",
            }}
          />
          {/* Gradient fade to left */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, #faf9f7 0%, transparent 22%)",
              zIndex: 2,
            }}
          />
          {/* Bottom fade */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 120,
              background:
                "linear-gradient(to top, #faf9f7, transparent)",
              zIndex: 2,
            }}
          />

          {/* Floating stat badges */}
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: "22%",
              right: 36,
              zIndex: 10,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(16px)",
              border: "1px solid #e8e4de",
              borderRadius: 14,
              padding: "14px 20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{ fontSize: 10, color: "#999", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}
            >
              FAERS Reports Analyzed
            </div>
            <div
              style={{ fontSize: 26, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.02em" }}
            >
              20M+
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            style={{
              position: "absolute",
              bottom: "28%",
              right: 48,
              zIndex: 10,
              background: "rgba(10,10,10,0.9)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: "14px 20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
            }}
          >
            <div
              style={{ fontSize: 10, color: "#666", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}
            >
              ML Confidence
            </div>
            <div
              style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}
            >
              74%{" "}
              <span
                style={{ fontSize: 13, fontWeight: 600, color: "#4ade80" }}
              >
                GO
              </span>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            style={{
              position: "absolute",
              top: "52%",
              left: "8%",
              zIndex: 10,
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(12px)",
              border: "1px solid #e8e4de",
              borderRadius: 12,
              padding: "10px 16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22c55e",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0a0a0a" }}>
              4 Live APIs Connected
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── Ticker ─────────────────────────────────────────────────────────── */}
      <Ticker />

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 64px",
          background: "#faf9f7",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
          borderBottom: "1px solid #e8e4de",
        }}
      >
        {[
          { n: 400000, s: "+", label: "Clinical Trials", sub: "ClinicalTrials.gov" },
          { n: 20, s: "M+", label: "Safety Reports", sub: "FDA FAERS" },
          { n: 36, s: "M+", label: "Publications", sub: "PubMed NCBI" },
          { n: 8, s: "", label: "AI Modules", sub: "End-to-end platform" },
        ].map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08}>
            <div
              style={{
                padding: "32px 40px",
                borderRight: i < 3 ? "1px solid #e8e4de" : "none",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(36px, 4vw, 54px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#0a0a0a",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                <Counter to={stat.n} suffix={stat.s} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0a0a0a", marginBottom: 2 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>{stat.sub}</div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ── Dashboard Preview ──────────────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 64px 100px",
          background: "#f5f3ef",
          borderTop: "1px solid #e8e4de",
          borderBottom: "1px solid #e8e4de",
        }}
      >
        <Reveal>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 52,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 11,
                  color: "#999",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 12,
                }}
              >
                + What to expect
              </span>
              <h2
                style={{
                  fontSize: "clamp(30px, 3.5vw, 46px)",
                  fontWeight: 300,
                  letterSpacing: "-0.02em",
                  color: "#0a0a0a",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                One dashboard.{" "}
                <span style={{ fontWeight: 700 }}>All the intelligence.</span>
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "11px 26px",
                borderRadius: 8,
                background: "#0a0a0a",
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
                marginLeft: 32,
              }}
            >
              Try it live →
            </motion.button>
          </div>
        </Reveal>

        {/* Browser-chrome mockup */}
        <Reveal delay={0.1} y={60}>
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.35 }}
            style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid #ddd9d2",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)",
              background: "#fff",
            }}
          >
            {/* Window chrome bar */}
            <div
              style={{
                padding: "11px 18px",
                background: "#f0ede8",
                borderBottom: "1px solid #e0dcd5",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <div
                    key={c}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: c,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  flex: 1,
                  background: "#e8e4de",
                  borderRadius: 5,
                  padding: "4px 12px",
                  fontSize: 11,
                  color: "#999",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#22c55e",
                    flexShrink: 0,
                  }}
                />
                app.hakase.ai/dashboard
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["#bbb", "#bbb", "#bbb"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 13,
                      height: 13,
                      borderRadius: 3,
                      background: c,
                      opacity: 0.4,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Screenshot */}
            <div style={{ position: "relative", lineHeight: 0 }}>
              <img
                src="/dashboard-mockup.png"
                alt="Hakase Dashboard"
                style={{
                  width: "100%",
                  display: "block",
                  maxHeight: 560,
                  objectFit: "cover",
                  objectPosition: "top center",
                }}
              />
              {/* Bottom fade */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 100,
                  background:
                    "linear-gradient(to top, rgba(245,243,239,0.95), transparent)",
                }}
              />
            </div>
          </motion.div>
        </Reveal>

        {/* Feature chips below mockup */}
        <Reveal delay={0.2}>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 36,
            }}
          >
            {[
              "Clinical Trial Hub",
              "Evidence Library",
              "Safety Intelligence",
              "KOL Finder",
              "Site Intelligence",
              "Enrollment Simulation",
              "Regulatory Mapping",
              "ML Prediction",
            ].map((chip) => (
              <div
                key={chip}
                style={{
                  padding: "7px 16px",
                  borderRadius: 999,
                  background: "#fff",
                  border: "1px solid #e8e4de",
                  fontSize: 12.5,
                  color: "#555",
                  fontWeight: 500,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── How We Work ────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px 64px", background: "#faf9f7" }}>
        <Reveal>
          <div style={{ marginBottom: 64 }}>
            <span
              style={{
                fontSize: 11,
                color: "#999",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 12,
              }}
            >
              + Get it done
            </span>
            <h2
              style={{
                fontSize: "clamp(36px, 4vw, 56px)",
                fontWeight: 300,
                letterSpacing: "-0.03em",
                color: "#0a0a0a",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              HOW WE <span style={{ fontWeight: 800 }}>WORK</span>
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            background: "#e8e4de",
          }}
        >
          {[
            {
              step: "01",
              title: "Query your compound",
              desc: "Enter a drug name or condition. Our engine simultaneously queries ClinicalTrials.gov, FDA FAERS, PubMed, and OpenFDA drug labels in real time.",
            },
            {
              step: "02",
              title: "AI synthesizes the data",
              desc: "PRR/ROR safety signals are computed, literature is classified by study type, KOLs are ranked by authorship depth, and ML predicts trial success probability.",
            },
            {
              step: "03",
              title: "Act on intelligence",
              desc: "Download structured reports, run enrollment simulations, map regulatory pathways, and score investigator sites — all from a single dashboard.",
            },
          ].map((item, i) => (
            <Reveal key={item.step} delay={i * 0.12}>
              <div
                style={{
                  background: "#faf9f7",
                  padding: "52px 44px",
                  minHeight: 280,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#bbb",
                    letterSpacing: "0.1em",
                    marginBottom: 24,
                    fontWeight: 500,
                  }}
                >
                  {item.step}
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#0a0a0a",
                    margin: "0 0 16px 0",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.25,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: 14.5,
                    color: "#666",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Modules / Features ─────────────────────────────────────────────── */}
      <section style={{ padding: "0 64px 100px", background: "#faf9f7" }}>
        <Reveal>
          <div style={{ marginBottom: 56 }}>
            <span
              style={{
                fontSize: 11,
                color: "#999",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 12,
              }}
            >
              + Platform modules
            </span>
            <h2
              style={{
                fontSize: "clamp(32px, 3.5vw, 48px)",
                fontWeight: 300,
                letterSpacing: "-0.03em",
                color: "#0a0a0a",
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              Everything you need for{" "}
              <span style={{ fontWeight: 800 }}>
                end-to-end trials
              </span>
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            background: "#e8e4de",
          }}
        >
          {FEATURES.map((f, i) => (
            <Reveal key={f.num} delay={(i % 3) * 0.07}>
              <motion.div
                whileHover={{ background: "#f5f3ef" }}
                style={{
                  background: "#faf9f7",
                  padding: "44px 40px",
                  cursor: "default",
                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#ccc",
                    letterSpacing: "0.1em",
                    marginBottom: 20,
                    fontWeight: 500,
                  }}
                >
                  {f.num}
                </div>
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#0a0a0a",
                      margin: "0 0 12px 0",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.3,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "#777",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {f.desc}
                  </p>
                </motion.div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Full-bleed CTA ─────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            minHeight: 480,
          }}
        >
          {/* Left: image */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              src={heroImg}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 30%",
                opacity: 0.5,
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, transparent 50%, #0a0a0a 100%)",
              }}
            />
          </div>

          {/* Right: text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "64px",
            }}
          >
            <Reveal>
              <p
                style={{
                  fontSize: 11,
                  color: "#555",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
              >
                + You asked, we answered
              </p>
              <h2
                style={{
                  fontSize: "clamp(32px, 4vw, 52px)",
                  fontWeight: 300,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  margin: "0 0 10px 0",
                }}
              >
                See enough?
              </h2>
              <h2
                style={{
                  fontSize: "clamp(32px, 4vw, 52px)",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  margin: "0 0 32px 0",
                }}
              >
                Reach out now
              </h2>
              <p
                style={{
                  fontSize: 14.5,
                  color: "#888",
                  lineHeight: 1.65,
                  marginBottom: 40,
                  maxWidth: 360,
                }}
              >
                We're redefining how drugs are discovered and treatments are
                planned — using real-time data and clinical-grade AI.
              </p>
              <motion.button
                whileHover={{ scale: 1.03, background: "#f5f5f5" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                style={{
                  padding: "15px 36px",
                  borderRadius: 8,
                  background: "#fff",
                  color: "#0a0a0a",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                  width: "fit-content",
                }}
              >
                Open Platform
              </motion.button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: "#0a0a0a",
          borderTop: "1px solid #1a1a1a",
          padding: "40px 64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/hakase-logo-transparent.png"
            alt="Hakase"
            style={{ height: 22, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
        </div>

        <div style={{ display: "flex", gap: 32, fontSize: 12, color: "#555" }}>
          {["Home", "Modules", "Research", "About"].map((l) => (
            <span key={l} style={{ cursor: "pointer" }}>
              {l}
            </span>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "#444" }}>
          © 2025 Hakase Clinical. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
