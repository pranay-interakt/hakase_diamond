import "../landing.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";

/* ─── scroll hook ──────────────────────────────────────── */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

/* ─── intersection hook ────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── counter ──────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useInView();
  useEffect(() => {
    if (!visible) return;
    let v = 0; const step = Math.ceil(to / 55);
    const id = setInterval(() => { v += step; if (v >= to) { setVal(to); clearInterval(id); } else setVal(v); }, 18);
    return () => clearInterval(id);
  }, [visible, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Aurora Background ────────────────────────────────── */
function AuroraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    // Floating particle field
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2.5 + 0.5,
        a: Math.random() * 0.3 + 0.05,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.004;

      // Aurora blobs
      const blobs = [
        { x: 0.2, y: 0.3, rx: 0.6, ry: 0.5, color: "rgba(99,102,241,", speed: 0.7 },
        { x: 0.8, y: 0.6, rx: 0.5, ry: 0.45, color: "rgba(14,165,233,", speed: 1.1 },
        { x: 0.5, y: 0.8, rx: 0.55, ry: 0.4, color: "rgba(6,182,212,",  speed: 0.9 },
      ];

      for (const b of blobs) {
        const bx = (b.x + Math.sin(t * b.speed) * 0.06) * canvas.width;
        const by = (b.y + Math.cos(t * b.speed * 1.3) * 0.05) * canvas.height;
        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, canvas.width * b.rx);
        grd.addColorStop(0, `${b.color}0.07)`);
        grd.addColorStop(1, `${b.color}0)`);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.a})`;
        ctx.fill();
      }

      // Connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

/* ─── Central DNA Helix ────────────────────────────────── */
function DnaHelix({ scrollY }: { scrollY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(scrollY);
  scrollRef.current = scrollY;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;

    const W = 220, H = 420;
    canvas.width = W;
    canvas.height = H;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.012;
      const globalRot = scrollRef.current * 0.003;
      const phase = t + globalRot;

      const cx = W / 2;
      const segments = 40;
      const segH = H / segments;
      const amp = 55;
      const freq = 0.45;

      // Draw backbone + rungs in one pass
      const pts1: [number, number, number][] = [];
      const pts2: [number, number, number][] = [];

      for (let i = 0; i <= segments; i++) {
        const y = i * segH;
        const angle = i * freq * Math.PI + phase;
        const x1 = cx + Math.cos(angle) * amp;
        const x2 = cx + Math.cos(angle + Math.PI) * amp;
        const depth1 = Math.sin(angle);         // -1 (back) to +1 (front)
        const depth2 = Math.sin(angle + Math.PI);
        pts1.push([x1, y, depth1]);
        pts2.push([x2, y, depth2]);
      }

      // Rungs
      for (let i = 0; i < segments; i += 2) {
        const [x1, y1, d1] = pts1[i];
        const [x2,   ,  ] = pts2[i];
        const centerDepth = (d1 + (pts2[i][2])) / 2;
        const rungAlpha = 0.1 + 0.15 * ((centerDepth + 1) / 2);
        const grd = ctx.createLinearGradient(x1, y1, x2, y1);
        grd.addColorStop(0, `rgba(99,102,241,${rungAlpha})`);
        grd.addColorStop(0.5, `rgba(14,165,233,${rungAlpha * 1.5})`);
        grd.addColorStop(1, `rgba(99,102,241,${rungAlpha})`);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y1);
        ctx.strokeStyle = grd;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Spine 1
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const [x, y, depth] = pts1[i];
        const a = 0.25 + 0.6 * ((depth + 1) / 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        // Node dot
        if (i % 2 === 0) {
          const r = 4 + 2 * ((depth + 1) / 2);
          const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
          grd.addColorStop(0, `rgba(139,92,246,${a})`);
          grd.addColorStop(1, `rgba(99,102,241,0)`);
          ctx.save();
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(x, y, r * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(167,139,250,${a})`;
          ctx.beginPath();
          ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.strokeStyle = "rgba(99,102,241,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spine 2
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const [x, y, depth] = pts2[i];
        const a = 0.25 + 0.6 * ((depth + 1) / 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (i % 2 === 0) {
          const r = 4 + 2 * ((depth + 1) / 2);
          const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
          grd.addColorStop(0, `rgba(14,165,233,${a})`);
          grd.addColorStop(1, `rgba(6,182,212,0)`);
          ctx.save();
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(x, y, r * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(56,189,248,${a})`;
          ctx.beginPath();
          ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.strokeStyle = "rgba(14,165,233,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "220px",
        height: "420px",
        filter: "drop-shadow(0 0 30px rgba(99,102,241,0.35)) drop-shadow(0 0 60px rgba(14,165,233,0.15))",
        position: "relative",
        zIndex: 2,
      }}
    />
  );
}

/* ─── 3D tilt card ─────────────────────────────────────── */
function TiltCard({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -12;
    el.style.transform = `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02) translateY(-3px)`;
    el.style.boxShadow = `0 20px 48px rgba(99,102,241,0.14), 0 4px 12px rgba(0,0,0,0.05)`;
    el.style.borderColor = `rgba(99,102,241,0.25)`;
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = ``;
    el.style.boxShadow = ``;
    el.style.borderColor = ``;
  };
  return (
    <div ref={ref} className={className} style={{ ...style, transition: `transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease` }}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}

/* ─── Feature Card ─────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay, color }: { icon: string; title: string; desc: string; delay: number; color: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}>
      <TiltCard
        className={`feature-card ${visible ? "card-visible" : "card-hidden"}`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className="feature-icon" style={{ fontSize: "1.5rem" }}>{icon}</div>
        <div style={{ width: 28, height: 2, borderRadius: 2, background: color, marginBottom: 10, marginTop: 2 }} />
        <h3 className="feature-title">{title}</h3>
        <p className="feature-desc">{desc}</p>
      </TiltCard>
    </div>
  );
}

/* ─── How Step ─────────────────────────────────────────── */
function HowStep({ n, title, desc, img, reverse = false, connector = true }:
  { n: string; title: string; desc: string; img: string; reverse?: boolean; connector?: boolean }) {
  const { ref, visible } = useInView(0.1);
  return (
    <div ref={ref} className={`lp-step ${reverse ? "lp-step-reverse" : ""} ${visible ? "step-visible" : ""}`}>
      <div className="lp-step-visual">
        <div className="lp-step-num">{n}</div>
        <div className="lp-step-icon-wrap">{img}</div>
        {connector && <div className="lp-step-connector" />}
      </div>
      <div className="lp-step-body">
        <h3 className="lp-step-title">{title}</h3>
        <p className="lp-step-desc">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Dashboard mockup ─────────────────────────────────── */
function HkDashboard() {
  return (
    <div className="hk-dash">
      <div className="hk-sidebar">
        <div className="hk-sidebar-logo"><img src="/hakase-logo.png" alt="Hakase" /></div>
        <div className="hk-sidebar-workspace">
          <div className="hk-ws-icon">M</div>
          <div className="hk-ws-name">Meridian Therapeutics</div>
        </div>
        <nav className="hk-nav">
          {[["Overview"], ["Studies"]].map(([label]) => (
            <div key={label} className="hk-nav-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="5"/></svg>
              {label}
            </div>
          ))}
          <div className="hk-nav-section">Intelligence</div>
          {["Protocol Studio", "Trial Explorer", "Site Intelligence", "KOL Finder", "Safety Intel"].map((label, i) => (
            <div key={label} className={`hk-nav-item ${i === 0 ? "active" : ""}`}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                {i === 0 ? <path d="M2 12V4l6-2 6 2v8l-6 2-6-2z"/> : <circle cx="8" cy="8" r="5"/>}
              </svg>
              {label}
            </div>
          ))}
          <div className="hk-nav-section">Operations</div>
          {["Enrollment Sim", "Regulatory AI", "Compliance"].map((label) => (
            <div key={label} className="hk-nav-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="5"/></svg>
              {label}
            </div>
          ))}
        </nav>
        <div className="hk-sidebar-footer">
          <div className="hk-plan-name">⚡ Professional Plan</div>
          <div className="hk-plan-usage">7 of 10 studies used</div>
          <div className="hk-plan-upgrade">Upgrade to Enterprise →</div>
        </div>
      </div>
      <div className="hk-main">
        <div className="hk-topbar">
          <div className="hk-search">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
            Search studies, sites, KOLs, trials...
          </div>
          <div className="hk-topbar-right">
            <div className="hk-bell">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2a5 5 0 00-5 5v2l-1 2h12l-1-2V7a5 5 0 00-5-5zM6 13a2 2 0 004 0"/></svg>
              <div className="hk-bell-dot"/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div className="hk-avatar">SS</div>
              <div><div className="hk-user-name">Dr. S. Sato</div><div className="hk-user-role">VP Clinical</div></div>
            </div>
          </div>
        </div>
        <div className="hk-content">
          <div className="hk-breadcrumb">
            <span>Overview</span><span className="sep">›</span>
            <span>Studies</span><span className="sep">›</span>
            <span className="active">MERI-2024-001 · Protocol Studio</span>
          </div>
          <div className="hk-banner">
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <span className="hk-banner-id">MERI-2024-001</span>
                <span className="hk-banner-badge">Analysis Complete</span>
              </div>
              <div className="hk-banner-title">Pembrolizumab + Chemo in NSCLC · Phase II · Simulated just now</div>
            </div>
            <div className="hk-banner-actions">
              <button className="hk-banner-btn">↗ Share Report</button>
              <button className="hk-banner-btn">↑ Analyze New Trial</button>
            </div>
          </div>
          <div className="hk-kpi-row">
            <div className="hk-kpi primary">
              <div className="hk-kpi-label">Compliance Score</div>
              <div className="hk-kpi-value">85<span className="hk-kpi-badge">Grade B</span></div>
              <div className="hk-kpi-bar"><div className="hk-kpi-bar-fill" style={{width:"85%"}}/></div>
            </div>
            <div className="hk-kpi">
              <div className="hk-kpi-label">Success Probability</div>
              <div className="hk-kpi-value" style={{color:"#0f172a"}}>73.2%<span style={{fontSize:"0.6rem",color:"#64748b",fontWeight:500,marginLeft:4}}>High</span></div>
              <div className="hk-kpi-flags">
                <div className="hk-kpi-flag" style={{background:"#34d399"}}/>
                <div className="hk-kpi-flag" style={{background:"#34d399"}}/>
                <div className="hk-kpi-flag" style={{background:"#facc15"}}/>
              </div>
            </div>
            <div className="hk-kpi">
              <div className="hk-kpi-label">Sim: +Phase 3 Impact</div>
              <div className="hk-kpi-value" style={{color:"#0f172a"}}>+5<span style={{fontSize:"0.6rem",background:"#d1fae5",color:"#065f46",padding:"1px 5px",borderRadius:4,marginLeft:6,fontWeight:700}}>Score Δ</span></div>
              <div className="hk-kpi-sub">✓ ✓ ✓ <span style={{color:"#94a3b8"}}>Simulated</span></div>
            </div>
            <div className="hk-kpi">
              <div className="hk-kpi-label">AI Amendments</div>
              <div className="hk-kpi-value" style={{color:"#0f172a"}}>3</div>
              <div className="hk-kpi-sub">🧬 Auto-suggested from data</div>
            </div>
          </div>
          <div className="hk-bottom">
            <div className="hk-card">
              <div className="hk-card-title">
                <svg viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.5"><path d="M8 2v1M8 13v1M2 8h1M13 8h1M4 4l.7.7M11.3 11.3l.7.7"/><circle cx="8" cy="8" r="3"/></svg>
                Protocol Issues
              </div>
              {[
                { name:"Primary Endpoint Missing", severity:"high", desc:"Define at least one primary endpoint with a clear outcome." },
                { name:"Blinding Not Specified", severity:"med", desc:"Specify blinding level and justify choice for this trial." },
                { name:"Study Timeline Missing", severity:"low", desc:"Provide estimated start date and enrollment duration." },
              ].map(v => (
                <div key={v.name} className={`hk-vuln-item ${v.severity}`}>
                  <div className="hk-vuln-row">
                    <span className="hk-vuln-name">{v.name}</span>
                    <span className={`hk-vuln-badge ${v.severity}`}>{v.severity === "high" ? "High" : v.severity === "med" ? "Medium" : "Low"}</span>
                  </div>
                  <div className="hk-vuln-desc">{v.desc}</div>
                </div>
              ))}
            </div>
            <div className="hk-card">
              <div className="hk-card-title">
                <svg viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="1.5"><path d="M13 3L6 10l-3-3"/></svg>
                AI Amendment Tips
              </div>
              {["Fix primary endpoint — +5% compliance", "Add blinding justification", "Specify study timeline & milestones", "Randomized allocation verified"].map(s => (
                <div key={s} className="hk-strength-item">
                  <span className="hk-strength-check">✓</span>
                  <span className="hk-strength-text">{s}</span>
                </div>
              ))}
              <div style={{marginTop:8,paddingTop:6,borderTop:"1px solid #f1f5f9"}}>
                <div style={{fontSize:8,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Live Data Sources</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {["ClinicalTrials.gov","FDA FAERS","PubMed","OpenFDA"].map(s=>(
                    <span key={s} style={{fontSize:7.5,background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:4,padding:"1px 5px",color:"#64748b"}}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Features data ────────────────────────────────────── */
const FEATURES = [
  { icon: "🔬", title: "Trial Explorer",       desc: "Search 500K+ ClinicalTrials.gov entries in real time by condition, drug, phase, or status with instant insights.",     color: "#3b82f6", delay: 0   },
  { icon: "🛡️", title: "Safety Intelligence",  desc: "Access 20M+ FDA FAERS adverse events. Visualize reaction frequencies, serious outcomes, and recall history on demand.", color: "#f43f5e", delay: 80  },
  { icon: "📍", title: "Site Intelligence",    desc: "ML-scored investigative sites from 400K+ global locations — ranked by enrollment rate, startup time, and performance.",  color: "#10b981", delay: 160 },
  { icon: "📋", title: "Protocol Studio",      desc: "Upload protocol PDFs, simulate parameter changes (phase, arms, enrollment), get AI amendment suggestions instantly.",     color: "#8b5cf6", delay: 240 },
  { icon: "📈", title: "Enrollment Sim",       desc: "1,000-iteration Monte Carlo simulation producing P10/P50/P90 enrollment timelines from real historical data.",            color: "#06b6d4", delay: 320 },
  { icon: "📚", title: "Evidence Library",     desc: "Mine 36M+ PubMed articles with automatic evidence level classification — meta-analyses and Phase 3 RCTs ranked first.", color: "#7c3aed", delay: 400 },
  { icon: "🧑‍⚕️", title: "KOL Finder",       desc: "Identify Key Opinion Leaders ranked by publications, clinical trial involvement, and therapeutic area relevance.",         color: "#f59e0b", delay: 480 },
  { icon: "⚖️", title: "Regulatory AI",        desc: "Generate FDA/EMA compliance roadmaps, pre-IND readiness checklists, and receive live regulatory guidance alerts.",       color: "#ef4444", delay: 560 },
  { icon: "🌉", title: "Hakase Bridge",         desc: "Import trial configurations from Hakase.bio Layer 4 for seamless cross-platform biological and clinical analysis.",       color: "#0ea5e9", delay: 640 },
];

/* ─── Main ─────────────────────────────────────────────── */
export default function LandingPage() {
  const [, setLocation] = useLocation();
  const scrollY = useScrollY();
  const [scrollPct, setScrollPct] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setNavScrolled(sy > 50);
      setScrollPct(docH > 0 ? (sy / docH) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = cursorRef.current; if (!el) return;
      el.style.left = `${e.clientX}px`;
      el.style.top  = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const magnetRef = useCallback((el: HTMLButtonElement | null) => {
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onLeave = () => { el.style.transform = ``; };
    el.addEventListener("mousemove", onMove as EventListener);
    el.addEventListener("mouseleave", onLeave);
  }, []);

  const statsSection = useInView();
  const featSection  = useInView(0.05);
  const howSection   = useInView(0.1);
  const ctaSection   = useInView(0.2);

  return (
    <div className="lp-root">
      <div className="lp-progress-bar" style={{ width: `${scrollPct}%` }} />
      <div ref={cursorRef} className="lp-cursor-glow" />

      {/* ── NAV ── */}
      <nav className={`lp-nav ${navScrolled ? "lp-nav-scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <a href="#" className="lp-logo">
            <img src="/hakase-logo.png" alt="Hakase" className="lp-logo-img" />
          </a>
          <div className={`lp-links ${menuOpen ? "lp-links-open" : ""}`}>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how"      onClick={() => setMenuOpen(false)}>How it Works</a>
            <a href="#stats"    onClick={() => setMenuOpen(false)}>Impact</a>
            <a href="#contact"  onClick={() => setMenuOpen(false)}>Contact</a>
          </div>
          <div className="lp-nav-cta">
            <button className="lp-btn-ghost" onClick={() => setLocation("/dashboard")}>Sign In</button>
            <button className="lp-btn-primary" onClick={() => setLocation("/dashboard")}>Launch App →</button>
          </div>
          <button className="lp-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span/><span/><span/>
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero" style={{ overflow: "hidden", position: "relative" }}>
        {/* Fluid aurora background */}
        <AuroraCanvas />

        {/* Subtle grid overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }} />

        {/* Gradient radial focal point */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(99,102,241,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Hero layout: text left, DNA center-right */}
        <div style={{
          position: "relative", zIndex: 2,
          maxWidth: 1200, margin: "0 auto", padding: "0 2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          minHeight: "100vh", gap: "3rem",
        }}>
          {/* Left: copy */}
          <div style={{ flex: "1 1 500px", paddingTop: "6rem", paddingBottom: "3rem" }}>
            <div className="lp-badge animate-fadein-up" style={{ animationDelay: "0.1s" }}>
              <span className="lp-badge-dot" />
              The Complete Clinical Trial Intelligence Platform
            </div>

            <h1 className="lp-hero-h1 animate-fadein-up" style={{ animationDelay: "0.22s", maxWidth: 540 }}>
              From protocol to patient,{" "}
              <span className="lp-gradient-text">powered by AI</span>
            </h1>

            <p className="lp-hero-sub animate-fadein-up" style={{ animationDelay: "0.38s", maxWidth: 480 }}>
              Hakase combines real-time data from ClinicalTrials.gov, FDA FAERS, PubMed, and OpenFDA 
              to help you run smarter, faster clinical trials at every stage.
            </p>

            <div className="lp-hero-btns animate-fadein-up" style={{ animationDelay: "0.52s" }}>
              <button ref={magnetRef} className="lp-btn-hero-primary" onClick={() => setLocation("/dashboard")}>
                Launch Dashboard
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="lp-btn-hero-ghost" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
                See How It Works
              </button>
            </div>

            {/* Data pills */}
            <div className="animate-fadein-up" style={{ animationDelay: "0.65s", display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "2rem" }}>
              {[
                { label: "500K+ Trials", color: "#3b82f6" },
                { label: "20M+ AE Reports", color: "#f43f5e" },
                { label: "36M+ Articles", color: "#10b981" },
                { label: "140K+ Drug Labels", color: "#f59e0b" },
              ].map(p => (
                <span key={p.label} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 600, color: "#64748b",
                  background: "rgba(255,255,255,0.7)", border: "1px solid #e2e8f0",
                  borderRadius: 20, padding: "4px 10px", backdropFilter: "blur(4px)",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                  {p.label}
                </span>
              ))}
            </div>

            <div className="lp-trust animate-fadein-up" style={{ animationDelay: "0.75s" }}>
              <span>Trusted by leading biotech &amp; pharma companies</span>
              <div className="lp-trust-logos">
                {["Meridian","NovaBio","PharmaTech","ClinGenix","TrialBase"].map(n => (
                  <span key={n} className="lp-trust-logo">{n}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: central DNA + floating mockup */}
          <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem", paddingTop: "5rem" }}>
            {/* DNA Helix */}
            <div style={{
              position: "relative",
              transform: `translateY(${-scrollY * 0.05}px)`,
              transition: "transform 0.1s linear",
            }}>
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                width: 200, height: 200, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
                animation: "pulse-ring 3s ease-in-out infinite",
                pointerEvents: "none",
              }} />
              <DnaHelix scrollY={scrollY} />
            </div>

            {/* Floating dashboard mini */}
            <div
              className="lp-mockup-wrap animate-fadein-up"
              style={{
                animationDelay: "0.55s",
                transform: `perspective(1200px) rotateX(${Math.min(scrollY * 0.018, 6)}deg) translateY(${-scrollY * 0.1}px) scale(${Math.max(0.93, 1 - scrollY * 0.00018)})`,
                width: "min(520px, 90vw)",
              }}
            >
              <div className="lp-mockup-glow" />
              <div className="lp-mockup-browser">
                <div className="lp-browser-bar">
                  <span className="lp-dot r"/><span className="lp-dot y"/><span className="lp-dot g"/>
                  <span className="lp-browser-url">app.hakase.ai/dashboard</span>
                </div>
                <HkDashboard />
              </div>
              <div className="lp-float-card lp-float-card-1">
                <span className="lp-float-icon">🧬</span>
                <div><div className="lp-float-val">1,847</div><div className="lp-float-lbl">Patients Recruited</div></div>
              </div>
              <div className="lp-float-card lp-float-card-2">
                <span className="lp-float-icon">📊</span>
                <div><div className="lp-float-val">85 / B</div><div className="lp-float-lbl">Compliance Score</div></div>
              </div>
              <div className="lp-float-card lp-float-card-3">
                <span className="lp-float-icon">🌍</span>
                <div><div className="lp-float-val">43 Sites</div><div className="lp-float-lbl">8 Countries</div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lp-scroll-hint">
          <div className="lp-scroll-line" />
          <span>SCROLL</span>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="lp-marquee-section">
        <div className="lp-marquee-inner">
          {[1, 2].map(pass => (
            <div key={pass} className="lp-marquee-track" aria-hidden={pass === 2}>
              {[
                { label: "500K+ Trials Indexed",        val: "💡" },
                { label: "AI Protocol Simulation",       val: "🔬" },
                { label: "60% Fewer Amendments",         val: "✂️" },
                { label: "400K+ Sites Scored",           val: "🏥" },
                { label: "7× Faster Site Selection",     val: "⚡" },
                { label: "ICH / FDA / EMA Aligned",      val: "✅" },
                { label: "HIPAA Compliant",               val: "🔒" },
                { label: "Real-time FDA FAERS Data",      val: "🌍" },
              ].map((item, i) => (
                <div key={i} className="lp-marquee-item">
                  {item.val}&nbsp;<span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section id="stats" className="lp-stats-section">
        <div ref={statsSection.ref} className={`lp-stats-grid ${statsSection.visible ? "stats-visible" : ""}`}>
          {[
            { n: 500000, s: "+", lbl: "Clinical Trials Indexed",    icon: "📁" },
            { n: 20,     s: "M+", lbl: "FDA Adverse Events",        icon: "🛡️" },
            { n: 36,     s: "M+", lbl: "PubMed Articles Mined",     icon: "📚" },
            { n: 400000, s: "+",  lbl: "Global Sites Scored",       icon: "🌍" },
          ].map((s, i) => (
            <div key={i} className="lp-stat-card">
              <div className="lp-stat-icon">{s.icon}</div>
              <div className="lp-stat-num">
                {statsSection.visible ? <Counter to={s.n} suffix={s.s} /> : "0"}
              </div>
              <div className="lp-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-features-section">
        <div ref={featSection.ref} className={`lp-section-header ${featSection.visible ? "header-visible" : ""}`}>
          <div className="lp-section-tag">CAPABILITIES</div>
          <h2 className="lp-section-h2">End-to-End Clinical Trial<br /><span className="lp-gradient-text">Intelligence in One Hub</span></h2>
          <p className="lp-section-sub">Every tool you need for smarter clinical trials — from trial discovery to regulatory submission.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="lp-how-section">
        <div ref={howSection.ref} className={`lp-section-header ${howSection.visible ? "header-visible" : ""}`}>
          <div className="lp-section-tag">WORKFLOW</div>
          <h2 className="lp-section-h2">From Protocol to Patient<br /><span className="lp-gradient-text">in Record Time</span></h2>
        </div>
        <div className="lp-steps">
          <HowStep n="01" title="Upload Your Protocol"      desc="Drop in your existing protocol PDF. Our AI extracts entities, benchmarks against 500K+ historical trials, and instantly surfaces compliance issues and success probability."        img="📄" reverse={false} />
          <HowStep n="02" title="Simulate & Amend"         desc="Use Protocol Studio to manually change phase, arms, and sample size. See live impact on compliance score and get AI amendment suggestions backed by real trial data."                img="🧪" reverse={true}  />
          <HowStep n="03" title="Discover Sites & KOLs"    desc="Our ML engine surfaces the best investigative sites (400K+ scored globally) and Key Opinion Leaders for your exact indication, geography, and enrollment goals."                       img="🗺️" reverse={false} />
          <HowStep n="04" title="Monitor & Iterate"        desc="Track enrollment with Monte Carlo simulation, run safety intelligence against FDA FAERS, and manage regulatory roadmaps — all from one AI-powered command center."                    img="🚀" reverse={true}  connector={false} />
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" className="lp-cta-section">
        <div ref={ctaSection.ref} className={`lp-cta-card ${ctaSection.visible ? "cta-visible" : ""}`}>
          <div className="lp-cta-bg-ring" />
          <div className="lp-cta-bg-ring lp-cta-bg-ring-2" />
          <div className="lp-section-tag">GET STARTED</div>
          <h2 className="lp-cta-h2">Ready to accelerate<br /><span className="lp-gradient-text">your next trial?</span></h2>
          <p className="lp-cta-sub">Join leading life science companies using Hakase to run faster, smarter clinical trials.</p>
          <div className="lp-cta-btns">
            <button className="lp-btn-hero-primary lp-btn-xl" onClick={() => setLocation("/dashboard")}>Launch the Hub →</button>
            <button className="lp-btn-hero-ghost lp-btn-xl">Request a Demo</button>
          </div>
          <p className="lp-cta-note">No credit card required · HIPAA compliant · Setup in minutes</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src="/hakase-logo.png" alt="Hakase" className="lp-logo-img" style={{marginBottom:"0.75rem"}} />
            <p>AI-powered clinical research platform built for life science startups and enterprises.</p>
          </div>
          <div className="lp-footer-links">
            <div>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how">How it Works</a>
              <a href="#stats">Impact</a>
            </div>
            <div>
              <h4>Platform</h4>
              <a href="/dashboard">Protocol Studio</a>
              <a href="/dashboard">Trial Explorer</a>
              <a href="/dashboard">Regulatory AI</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a href="#">Privacy</a><a href="#">Terms</a><a href="#">HIPAA</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 Hakase AI. All rights reserved.</span>
          <span>Built for Clinical Research Innovation</span>
        </div>
      </footer>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%,-50%) scale(1.25); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
