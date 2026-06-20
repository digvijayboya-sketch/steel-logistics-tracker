import { useNavigate } from 'react-router-dom'

const QUICK_LINKS = [
  { href: '/dos',         icon: '📋', label: 'Delivery Orders' },
  { href: '/jobs',        icon: '🏭', label: 'Job Cards'       },
  { href: '/expenses',    icon: '💸', label: 'Expenses'        },
  { href: '/deliveries',  icon: '🚛', label: 'Deliveries'      },
]

export const NotFoundPage = () => {
  const navigate = useNavigate()

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100dvh',
      fontFamily: 'Inter, system-ui, sans-serif',
      background:
        'radial-gradient(ellipse 70% 55% at 15% 30%, rgba(45,212,191,.16) 0%, transparent 60%),' +
        'radial-gradient(ellipse 55% 50% at 85% 75%, rgba(99,102,241,.14) 0%, transparent 55%),' +
        '#0b0f1a',
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
    },
    orb1: {
      position: 'fixed', top: -80, right: -60,
      width: 380, height: 380, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(99,102,241,.22) 0%, transparent 70%)',
      filter: 'blur(60px)', pointerEvents: 'none',
    },
    orb2: {
      position: 'fixed', bottom: -60, left: -40,
      width: 300, height: 300, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(45,212,191,.18) 0%, transparent 70%)',
      filter: 'blur(60px)', pointerEvents: 'none',
    },
    gridOverlay: {
      position: 'fixed', inset: 0,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),' +
        'linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      pointerEvents: 'none',
      maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 75%)',
    },
    card: {
      position: 'relative',
      zIndex: 1,
      width: '100%',
      maxWidth: 520,
      background: 'rgba(255,255,255,.04)',
      border: '1px solid rgba(255,255,255,.08)',
      borderRadius: '1.5rem',
      backdropFilter: 'blur(24px)',
      padding: '2.75rem 2.5rem',
      boxShadow: '0 32px 80px rgba(0,0,0,.5)',
      textAlign: 'center',
      animation: 'slideUp .5s cubic-bezier(.16,1,.3,1) both',
    },
    logoBar: {
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '.5rem',
      marginBottom: '1.75rem',
    },
    logoBox: {
      width: 32, height: 32, borderRadius: '.5rem',
      background: 'linear-gradient(135deg,#2dd4bf,#0d9488)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 10px rgba(45,212,191,.3)',
    },
    logoName: { fontSize: '.85rem', fontWeight: 700, color: '#f1f5f9' },
    logoSep:  { color: 'rgba(241,245,249,.22)', fontSize: '.75rem' },
    logoPage: { fontSize: '.75rem', color: 'rgba(241,245,249,.35)' },
    coilWrap: {
      margin: '0 auto 1.25rem',
      width: 90, height: 90,
      animation: 'float 3.5s ease-in-out infinite',
    },
    big404: {
      fontSize: 'clamp(5rem,18vw,8.5rem)',
      fontWeight: 800, lineHeight: 1,
      background: 'linear-gradient(135deg,#2dd4bf 0%,#6366f1 60%,rgba(99,102,241,.4) 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '-.04em',
      marginBottom: '.25rem',
      animation: 'popIn .6s .1s cubic-bezier(.34,1.56,.64,1) both',
    },
    errTitle: {
      fontSize: '1.2rem', fontWeight: 700,
      color: '#f1f5f9', marginBottom: '.5rem',
    },
    errSub: {
      fontSize: '.88rem', color: 'rgba(241,245,249,.45)',
      lineHeight: 1.65, maxWidth: '36ch',
      margin: '0 auto 2rem',
    },
    btnRow: {
      display: 'flex', gap: '.65rem',
      justifyContent: 'center', flexWrap: 'wrap',
      marginBottom: '1.75rem',
    },
    btnPrimary: {
      display: 'inline-flex', alignItems: 'center', gap: '.4rem',
      padding: '.6rem 1.35rem', borderRadius: '.65rem',
      fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
      border: 'none',
      background: 'linear-gradient(135deg,#2dd4bf,#0d9488)',
      color: '#fff', boxShadow: '0 4px 14px rgba(45,212,191,.3)',
      transition: 'all .18s cubic-bezier(.16,1,.3,1)',
    },
    btnGhost: {
      display: 'inline-flex', alignItems: 'center', gap: '.4rem',
      padding: '.6rem 1.35rem', borderRadius: '.65rem',
      fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
      background: 'rgba(255,255,255,.05)',
      border: '1px solid rgba(255,255,255,.08)',
      color: 'rgba(241,245,249,.45)',
      transition: 'all .18s cubic-bezier(.16,1,.3,1)',
    },
    dividerRow: {
      display: 'flex', alignItems: 'center',
      gap: '.65rem', marginBottom: '.9rem',
    },
    divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,.08)' },
    divText: {
      fontSize: '.65rem', color: 'rgba(241,245,249,.22)',
      textTransform: 'uppercase', letterSpacing: '.07em', whiteSpace: 'nowrap',
    },
    quickGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '.4rem',
    },
    qlink: {
      display: 'flex', alignItems: 'center', gap: '.5rem',
      padding: '.55rem .75rem', borderRadius: '.6rem',
      background: 'rgba(255,255,255,.03)',
      border: '1px solid rgba(255,255,255,.06)',
      color: 'rgba(241,245,249,.45)',
      fontSize: '.75rem', fontWeight: 500,
      cursor: 'pointer', textAlign: 'left',
      transition: 'all .16s',
    },
    foot: {
      marginTop: '1.5rem',
      fontSize: '.65rem',
      color: 'rgba(241,245,249,.2)',
      textAlign: 'center',
      position: 'relative', zIndex: 1,
    },
  }

  return (
    <>
      <style>{`
        @keyframes slideUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn    { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .nf-btn-primary:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(45,212,191,.45) !important; }
        .nf-btn-ghost:hover   { transform:translateY(-2px); background:rgba(255,255,255,.09) !important; color:#f1f5f9 !important; }
        .nf-qlink:hover       { background:rgba(45,212,191,.07) !important; border-color:rgba(45,212,191,.25) !important; color:#2dd4bf !important; transform:translateX(2px); }
      `}</style>

      <div style={s.page}>
        <div style={s.orb1} />
        <div style={s.orb2} />
        <div style={s.gridOverlay} />

        <div style={s.card}>
          {/* Logo bar */}
          <div style={s.logoBar}>
            <div style={s.logoBox}>
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <rect x="3" y="3" width="8" height="8" rx="1.5" fill="white" opacity=".9"/>
                <rect x="13" y="3" width="8" height="8" rx="1.5" fill="white" opacity=".5"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity=".5"/>
                <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity=".9"/>
              </svg>
            </div>
            <span style={s.logoName}>SteelTrack</span>
            <span style={s.logoSep}>·</span>
            <span style={s.logoPage}>Page Not Found</span>
          </div>

          {/* Floating coil */}
          <div style={s.coilWrap}>
            <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" width="90" height="90">
              <circle cx="45" cy="45" r="40" stroke="rgba(45,212,191,.25)" strokeWidth="2"/>
              <circle cx="45" cy="45" r="40" stroke="url(#cg1)" strokeWidth="2.5"
                strokeDasharray="80 172" strokeLinecap="round"/>
              <circle cx="45" cy="45" r="30" stroke="rgba(99,102,241,.2)" strokeWidth="2"/>
              <circle cx="45" cy="45" r="30" stroke="url(#cg2)" strokeWidth="2.5"
                strokeDasharray="55 130" strokeLinecap="round" strokeDashoffset="-20"/>
              <circle cx="45" cy="45" r="20" stroke="rgba(45,212,191,.15)" strokeWidth="2"/>
              <circle cx="45" cy="45" r="20" stroke="url(#cg1)" strokeWidth="2"
                strokeDasharray="35 90" strokeLinecap="round" strokeDashoffset="-10"/>
              <circle cx="45" cy="45" r="9" fill="rgba(45,212,191,.1)" stroke="rgba(45,212,191,.4)" strokeWidth="1.5"/>
              <circle cx="45" cy="45" r="4" fill="rgba(45,212,191,.5)"/>
              <text x="45" y="50" textAnchor="middle" fill="white" fontSize="9"
                fontFamily="Inter,sans-serif" fontWeight="700" opacity=".9">?</text>
              <defs>
                <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf"/>
                  <stop offset="100%" stopColor="#6366f1"/>
                </linearGradient>
                <linearGradient id="cg2" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#2dd4bf"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* 404 */}
          <div style={s.big404}>404</div>
          <h1 style={s.errTitle}>Something went wrong</h1>
          <p style={s.errSub}>
            The page you&apos;re looking for doesn&apos;t exist or is unavailable.
            Please use the links below to navigate back.
          </p>

          {/* Buttons */}
          <div style={s.btnRow}>
            <button className="nf-btn-primary" style={s.btnPrimary} onClick={() => navigate('/dashboard')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Go to Dashboard
            </button>
            <button className="nf-btn-ghost" style={s.btnGhost} onClick={() => window.history.back()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Go Back
            </button>
          </div>

          {/* Quick links */}
          <div style={s.dividerRow}>
            <div style={s.divLine} />
            <span style={s.divText}>Or jump to</span>
            <div style={s.divLine} />
          </div>
          <div style={s.quickGrid}>
            {QUICK_LINKS.map(ql => (
              <button key={ql.href} className="nf-qlink" style={s.qlink} onClick={() => navigate(ql.href)}>
                <span style={{ fontSize: '.95rem', flexShrink: 0 }}>{ql.icon}</span>
                {ql.label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.foot}>Steel Logistics & Dispatch Tracker v1.0 · Demo Mode</div>
      </div>
    </>
  )
}
