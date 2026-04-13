import "../landing.css";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

/* ─── intersection hook ──────────────────────────────────── */
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

/* ─── counter ────────────────────────────────────────────── */
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

/* ─── 3D tilt card ───────────────────────────────────────── */
function TiltCard({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * -14;
    el.style.transform = `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) scale(1.03) translateY(-4px)`;
    el.style.boxShadow = `0 20px 50px rgba(14,165,233,0.13), 0 4px 12px rgba(0,0,0,0.06)`;
    el.style.borderColor = `rgba(14,165,233,0.32)`;
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

/* ─── DNA Canvas ─────────────────────────────────────────── */
function DnaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const spacing = 18;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.008;

      // Draw two DNA helices
      const helices = [
        { xBase: canvas.width * 0.08, color1: "rgba(14,165,233,", color2: "rgba(6,182,212," },
        { xBase: canvas.width * 0.92, color1: "rgba(124,58,237,", color2: "rgba(14,165,233," },
      ];

      for (const helix of helices) {
        const amp = 28, freq = 0.045;
        const count = Math.floor(canvas.height / spacing) + 2;

        for (let i = 0; i < count; i++) {
          const y = (i * spacing - (t * 60) % (spacing * count));
          const x1 = helix.xBase + Math.sin(y * freq + t) * amp;
          const x2 = helix.xBase + Math.sin(y * freq + t + Math.PI) * amp;
          const alphaMod = 0.5 + 0.5 * Math.sin(y * freq + t);

          // rung (bridge)
          if (i % 3 === 0) {
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.strokeStyle = `rgba(14,165,233,${0.07 * alphaMod})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // strand nodes
          const a1 = alphaMod * 0.5;
          ctx.beginPath(); ctx.arc(x1, y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${helix.color1}${a1})`;
          ctx.fill();

          ctx.beginPath(); ctx.arc(x2, y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${helix.color2}${a1})`;
          ctx.fill();
        }

        // spine lines
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const y = i * spacing - (t * 60) % (spacing * count);
          const x = helix.xBase + Math.sin(y * freq + t) * amp;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `${helix.color1}0.12)`;
        ctx.lineWidth = 1.5; ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const y = i * spacing - (t * 60) % (spacing * count);
          const x = helix.xBase + Math.sin(y * freq + t + Math.PI) * amp;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `${helix.color2}0.1)`;
        ctx.lineWidth = 1.5; ctx.stroke();
      }

      // floating particles
      const pCount = 30;
      for (let i = 0; i < pCount; i++) {
        const px = (canvas.width * 0.1) + (canvas.width * 0.8) * ((i * 137.508) % 1);
        const py = ((i * spacing * 2.3 + t * 18) % (canvas.height + 20)) - 10;
        const pa = 0.06 + 0.04 * Math.sin(t + i);
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14,165,233,${pa})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="lp-dna-canvas" />;
}

/* ─── inline Hakase dashboard mockup ────────────────────── */
function HkDashboard() {
  return (
    <div className="hk-dash">
      {/* sidebar */}
      <div className="hk-sidebar">
        <div className="hk-sidebar-logo">
          <img src="/hakase-logo.png" alt="Hakase" />
        </div>
        <div className="hk-sidebar-workspace">
          <div className="hk-ws-icon">M</div>
          <div className="hk-ws-name">Meridian Therapeutics</div>
        </div>
        <nav className="hk-nav">
          {[
            ["Overview", "M3 9l9-7-9-7v4H0v6h12v4z"],
            ["Studies", "M3 7h14M3 12h14M3 17h14"],
          ].map(([label]) => (
            <div key={label} className="hk-nav-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="5"/></svg>
              {label}
            </div>
          ))}
          <div className="hk-nav-section">Intelligence</div>
          {["Clinical Trial Interface", "Trial Explorer", "Protocol Drafter", "Patient Recruitment", "KOL Identification"].map((label, i) => (
            <div key={label} className={`hk-nav-item ${i === 0 ? "active" : ""}`}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                {i === 0 ? <path d="M2 12V4l6-2 6 2v8l-6 2-6-2z"/> : <circle cx="8" cy="8" r="5"/>}
              </svg>
              {label}
            </div>
          ))}
          <div className="hk-nav-section">Workspace</div>
          {["Team", "Reports", "Settings"].map((label) => (
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

      {/* main */}
      <div className="hk-main">
        {/* topbar */}
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
          {/* breadcrumb */}
          <div className="hk-breadcrumb">
            <span>Overview</span><span className="sep">›</span>
            <span>Studies</span><span className="sep">›</span>
            <span className="active">MERI-2024-001 · Clinical Trial Interface</span>
          </div>

          {/* banner */}
          <div className="hk-banner">
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <span className="hk-banner-id">MERI-2024-001</span>
                <span className="hk-banner-badge">Analysis Complete</span>
              </div>
              <div className="hk-banner-title">Pembrolizumab + Chemo in NSCLC · Phase II · Analyzed just now</div>
            </div>
            <div className="hk-banner-actions">
              <button className="hk-banner-btn">↗ Share Report</button>
              <button className="hk-banner-btn">↑ Analyze New Trial</button>
            </div>
          </div>

          {/* KPI row */}
          <div className="hk-kpi-row">
            <div className="hk-kpi primary">
              <div className="hk-kpi-label">Success Probability</div>
              <div className="hk-kpi-value">73.2%<span className="hk-kpi-badge">High Confidence</span></div>
              <div className="hk-kpi-bar"><div className="hk-kpi-bar-fill" style={{width:"73.2%"}}/></div>
            </div>
            <div className="hk-kpi">
              <div className="hk-kpi-label">Risk Assessment</div>
              <div className="hk-kpi-value" style={{color:"#0f172a"}}>3<span style={{fontSize:"0.6rem",color:"#64748b",fontWeight:500,marginLeft:4}}>Key Flags</span></div>
              <div className="hk-kpi-flags">
                <div className="hk-kpi-flag" style={{background:"#f87171"}}/>
                <div className="hk-kpi-flag" style={{background:"#fb923c"}}/>
                <div className="hk-kpi-flag" style={{background:"#facc15"}}/>
              </div>
            </div>
            <div className="hk-kpi">
              <div className="hk-kpi-label">Design Strengths</div>
              <div className="hk-kpi-value" style={{color:"#0f172a"}}>5<span style={{fontSize:"0.6rem",background:"#d1fae5",color:"#065f46",padding:"1px 5px",borderRadius:4,marginLeft:6,fontWeight:700}}>Optimized</span></div>
              <div className="hk-kpi-sub">✓ ✓ ✓ <span style={{color:"#94a3b8"}}>+2 More</span></div>
            </div>
            <div className="hk-kpi">
              <div className="hk-kpi-label">Model Confidence</div>
              <div className="hk-kpi-value" style={{color:"#0f172a"}}>84.1%</div>
              <div className="hk-kpi-sub">🧠 Benchmarked against 350K+ trials</div>
            </div>
          </div>

          {/* bottom split */}
          <div className="hk-bottom">
            <div className="hk-card">
              <div className="hk-card-title">
                <svg viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.5"><path d="M8 2v1M8 13v1M2 8h1M13 8h1M4 4l.7.7M11.3 11.3l.7.7M4 12l.7-.7M11.3 4.7l.7-.7"/><circle cx="8" cy="8" r="3"/></svg>
                Protocol Vulnerabilities
              </div>
              {[
                { name:"Limited Sample Size", severity:"high", desc:"The planned enrollment may be underpowered for primary endpoints." },
                { name:"Complex Eligibility", severity:"med", desc:"Exclusion criteria are broader than phase II benchmarks." },
                { name:"Single-Country Design", severity:"low", desc:"Lack of multinational representation could slow enrollment." },
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
                Design Strengths
              </div>
              {[
                "Double-blinded randomized control layout",
                "Strong primary endpoint definition",
                "Biomarker-enriched selection criteria",
                "Industry-standard CRO engagement",
              ].map(s => (
                <div key={s} className="hk-strength-item">
                  <span className="hk-strength-check">✓</span>
                  <span className="hk-strength-text">{s}</span>
                </div>
              ))}
              <div style={{marginTop:8,paddingTop:6,borderTop:"1px solid #f1f5f9"}}>
                <div style={{fontSize:8,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Evidence Sources</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {["ClinicalTrials.gov (556K trials)","OpenFDA FAERS","PubMed"].map(s=>(
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

/* ─── feature card ───────────────────────────────────────── */
/* ─── feature card ───────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}>
      <TiltCard className={`feature-card ${visible ? "card-visible" : "card-hidden"}`} style={{ transitionDelay: `${delay}ms` }}>
        <div className="feature-icon">{icon}</div>
        <h3 className="feature-title">{title}</h3>
        <p className="feature-desc">{desc}</p>
      </TiltCard>
    </div>
  );
}


/* ─── how-step ───────────────────────────────────────────── */
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

/* ─── main ───────────────────────────────────────────────── */
export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [scrollY, setScrollY]   = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollY(sy);
      setNavScrolled(sy > 50);
      setScrollPct(docH > 0 ? (sy / docH) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // cursor glow follower
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = cursorRef.current; if (!el) return;
      el.style.left = `${e.clientX}px`;
      el.style.top  = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // magnetic button helper
  const magnetRef = (el: HTMLButtonElement | null) => {
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.22;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.22;
      el.style.transform = `translate(${dx}px, ${dy}px) translateY(-2px)`;
    };
    const onLeave = () => { el.style.transform = ``; };
    el.addEventListener("mousemove", onMove as EventListener);
    el.addEventListener("mouseleave", onLeave);
  };

  const statsSection = useInView();
  const featSection  = useInView(0.05);
  const howSection   = useInView(0.1);
  const ctaSection   = useInView(0.2);

  return (
    <div className="lp-root">
      {/* scroll progress */}
      <div className="lp-progress-bar" style={{ width: `${scrollPct}%` }} />

      {/* cursor glow */}
      <div ref={cursorRef} className="lp-cursor-glow" />

      {/* ── NAV ─────────────────────────────────────────────── */}
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

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="lp-hero">
        <DnaCanvas />

        {/* rotating orbital rings */}
        <div className="lp-ring lp-ring-1" style={{ transform: `translate(-50%,-50%) rotate(${scrollY * 0.04}deg)` }} />
        <div className="lp-ring lp-ring-2" style={{ transform: `translate(-50%,-50%) rotate(${-scrollY * 0.02}deg)` }} />
        <div className="lp-ring lp-ring-3" />

        {/* blobs */}
        <div className="lp-blob lp-blob-a" style={{ transform: `translateY(${-scrollY * 0.1}px)` }} />
        <div className="lp-blob lp-blob-b" style={{ transform: `translateY(${-scrollY * 0.07}px)` }} />

        <div className="lp-hero-content">
          <div className="lp-badge animate-fadein-up" style={{ animationDelay: "0.1s" }}>
            <span className="lp-badge-dot" />
            Streamline Clinical Development with AI
          </div>
          <h1 className="lp-hero-h1 animate-fadein-up" style={{ animationDelay: "0.22s" }}>
            The AI Platform for<br />
            <span className="lp-gradient-text">Clinical Research</span>
          </h1>
          <p className="lp-hero-sub animate-fadein-up" style={{ animationDelay: "0.38s" }}>
            From protocol drafting to patient recruitment and site selection —<br />
            Hakase accelerates every stage of your clinical trial with AI precision.
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
          <div className="lp-trust animate-fadein-up" style={{ animationDelay: "0.65s" }}>
            <span>Trusted by leading biotech &amp; pharma companies</span>
            <div className="lp-trust-logos">
              {["Meridian","NovaBio","PharmaTech","ClinGenix","TrialBase"].map(n => (
                <span key={n} className="lp-trust-logo">{n}</span>
              ))}
            </div>
          </div>
        </div>

        {/* dashboard mockup — HTML version matching the real UI */}
        <div
          className="lp-mockup-wrap animate-fadein-up"
          style={{
            animationDelay: "0.45s",
            transform: `perspective(1400px) rotateX(${Math.min(scrollY * 0.025, 7)}deg) translateY(${-scrollY * 0.15}px) scale(${Math.max(0.92, 1 - scrollY * 0.00025)})`,
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

          {/* floating stat cards */}
          <div className="lp-float-card lp-float-card-1">
            <span className="lp-float-icon">🧬</span>
            <div><div className="lp-float-val">1,847</div><div className="lp-float-lbl">Patients Recruited</div></div>
          </div>
          <div className="lp-float-card lp-float-card-2">
            <span className="lp-float-icon">📊</span>
            <div><div className="lp-float-val">73.2%</div><div className="lp-float-lbl">Success Probability</div></div>
          </div>
          <div className="lp-float-card lp-float-card-3">
            <span className="lp-float-icon">🌍</span>
            <div><div className="lp-float-val">43 Sites</div><div className="lp-float-lbl">8 Countries</div></div>
          </div>
        </div>

        <div className="lp-scroll-hint">
          <div className="lp-scroll-line" />
          <span>SCROLL</span>
        </div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────────── */}
      <div className="lp-marquee-section">
        <div className="lp-marquee-inner">
          {[1, 2].map(pass => (
            <div key={pass} className="lp-marquee-track" aria-hidden={pass === 2}>
              {[
                { label: "328,000+ Trials Indexed",       val: "💡" },
                { label: "73.2% Average Success Lift",    val: "📈" },
                { label: "60% Fewer Amendments",         val: "✂️" },
                { label: "43 Sites Per Study",            val: "🏥" },
                { label: "7× Faster Site Selection",     val: "⚡" },
                { label: "ICH / FDA Aligned",            val: "✅" },
                { label: "HIPAA Compliant",               val: "🔒" },
                { label: "400K+ Sites Scored",           val: "🌍" },
              ].map((item, i) => (
                <div key={i} className="lp-marquee-item">
                  {item.val}&nbsp;<span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section id="stats" className="lp-stats-section">
        <div ref={statsSection.ref} className={`lp-stats-grid ${statsSection.visible ? "stats-visible" : ""}`}>
          {[
            { n: 328000, s: "+", lbl: "Historical Trials Benchmarked", icon: "📁" },
            { n: 43,     s: "",  lbl: "Avg. Sites per Study",           icon: "🏥" },
            { n: 60,     s: "%", lbl: "Fewer Protocol Amendments",      icon: "📉" },
            { n: 7,      s: "x", lbl: "Faster Site Selection",          icon: "⚡" },
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

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="lp-features-section">
        <div ref={featSection.ref} className={`lp-section-header ${featSection.visible ? "header-visible" : ""}`}>
          <div className="lp-section-tag">CAPABILITIES</div>
          <h2 className="lp-section-h2">Everything You Need to Run<br /><span className="lp-gradient-text">Smarter Clinical Trials</span></h2>
          <p className="lp-section-sub">One platform powering every stage of clinical research — from landscape analysis to patient access.</p>
        </div>
        <div className="lp-features-grid">
          {[
            { icon:"🔬", title:"Landscape Analysis",   desc:"Assess historical studies by randomization rate. Understand the drivers of studies with high RAND rates.",       delay:0   },
            { icon:"📋", title:"Protocol Drafter",     desc:"AI-generated protocol drafts aligned to ICH/FDA standards. Reduce amendment cycles by 60% backed by 350K+ trials.", delay:80  },
            { icon:"🏥", title:"Site Selection",       desc:"ML-scored across 400K+ sites. Analyse by performance, capacity, competition and specificity.",                     delay:160 },
            { icon:"📈", title:"Model Enrolment",      desc:"Produce time estimates from historical data. Model enrollment scenarios with varying sites and patient counts.",     delay:240 },
            { icon:"🧑‍⚕️", title:"Patient Recruitment", desc:"AI-powered patient matching using demographic, study and site analytics for optimal site location decisions.",       delay:320 },
            { icon:"⭐", title:"KOL Identification",   desc:"Identify Key Opinion Leaders with precision scoring for your therapeutic area and geographic region instantly.",     delay:400 },
          ].map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how" className="lp-how-section">
        <div ref={howSection.ref} className={`lp-section-header ${howSection.visible ? "header-visible" : ""}`}>
          <div className="lp-section-tag">WORKFLOW</div>
          <h2 className="lp-section-h2">From Protocol to Patient<br /><span className="lp-gradient-text">in Record Time</span></h2>
        </div>
        <div className="lp-steps">
          <HowStep n="01" title="Upload Your Protocol"     desc="Drop in your existing protocol PDF or DOCX. Our AI ingests and benchmarks it against 328,000+ historical trials in seconds."                               img="📄" reverse={false} />
          <HowStep n="02" title="AI Analysis & Risk Flags" desc="Get instant success probability scores, vulnerability detection, and design strength analysis — all backed by evidence from top publications."           img="🧠" reverse={true}  />
          <HowStep n="03" title="Site & KOL Mapping"       desc="Our ML engine surfaces the best sites (400K+ scored) and Key Opinion Leaders for your exact indication, geography, and enrollment goals."                img="🗺️" reverse={false} />
          <HowStep n="04" title="Launch & Monitor"         desc="Track enrollment in real time, model scenarios, and iterate rapidly. One dashboard for every person on your clinical team."                               img="🚀" reverse={true}  connector={false} />
        </div>
      </section>

      {/* ── SHOWCASE ────────────────────────────────────────── */}
      <section className="lp-showcase-section">
        <div className="lp-showcase-inner">
          <div className="lp-showcase-text">
            <div className="lp-section-tag">PRODUCT</div>
            <h2 className="lp-section-h2" style={{ textAlign:"left" }}>
              Your entire trial,<br /><span className="lp-gradient-text">in one view</span>
            </h2>
            <p className="lp-section-sub" style={{ textAlign:"left", margin:0 }}>
              A real-time command centre for clinical operations. Monitor enrollment, track milestones, manage multi-country sites, and get AI alerts — all without switching tools.
            </p>
            <ul className="lp-check-list">
              {["Real-time enrollment tracking","Protocol vulnerability alerts","AI-powered site scores","KOL identification & outreach","HIPAA compliant · AES-256 encrypted"].map(t => (
                <li key={t}><span className="lp-check">✓</span>{t}</li>
              ))}
            </ul>
            <button className="lp-btn-hero-primary" style={{ marginTop:"2rem", alignSelf:"flex-start" }} onClick={() => setLocation("/dashboard")}>
              Open Dashboard →
            </button>
          </div>
          <div className="lp-showcase-img-wrap"
            style={{ transform: `perspective(1000px) rotateY(${-scrollY * 0.008}deg) rotateX(${scrollY * 0.004}deg)` }}>
            <div className="lp-showcase-glow" />
            <img src="/dashboard-mockup.png" alt="Dashboard" className="lp-showcase-img" />
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section id="contact" className="lp-cta-section">
        <div ref={ctaSection.ref} className={`lp-cta-card ${ctaSection.visible ? "cta-visible" : ""}`}>
          <div className="lp-cta-bg-ring" />
          <div className="lp-cta-bg-ring lp-cta-bg-ring-2" />
          <div className="lp-section-tag">GET STARTED</div>
          <h2 className="lp-cta-h2">Ready to accelerate<br /><span className="lp-gradient-text">your next trial?</span></h2>
          <p className="lp-cta-sub">Join leading life science companies using Hakase to run faster, smarter clinical trials.</p>
          <div className="lp-cta-btns">
            <button className="lp-btn-hero-primary lp-btn-xl" onClick={() => setLocation("/dashboard")}>Launch the Dashboard</button>
            <button className="lp-btn-hero-ghost lp-btn-xl">Request a Demo</button>
          </div>
          <p className="lp-cta-note">No credit card required · HIPAA compliant · Setup in minutes</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
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
              <h4>Company</h4>
              <a href="#">About</a><a href="#">Careers</a><a href="#">Blog</a>
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
    </div>
  );
}
