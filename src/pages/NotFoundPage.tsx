import { useNavigate } from 'react-router-dom'

const QUICK_LINKS = [
  { href: '/dos',         icon: '📋', label: 'Delivery Orders' },
  { href: '/jobs',        icon: '🏭', label: 'Job Cards'       },
  { href: '/expenses',    icon: '💸', label: 'Expenses'        },
  { href: '/deliveries',  icon: '🚛', label: 'Deliveries'      },
]

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn   { from{opacity:0;transform:scale(.75)} to{opacity:1;transform:scale(1)} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        .nf-primary:hover  { transform:translateY(-2px); box-shadow:0 8px 24px rgba(45,212,191,.42) !important; }
        .nf-ghost:hover    { transform:translateY(-2px); background:var(--g3) !important; color:var(--tx1) !important; }
        .nf-qlink:hover    { background:rgba(45,212,191,.07) !important; border-color:rgba(45,212,191,.22) !important; color:#2dd4bf !important; transform:translateX(3px); }
      `}</style>

      <div style={{
        minHeight: '100dvh',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: 'var(--tx1)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden',
      }}>
        {/* Orbs */}
        <div style={{ position:'fixed', top:'-10%', right:'-8%', width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.20) 0%,transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />
        <div style={{ position:'fixed', bottom:'-8%', left:'-5%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(45,212,191,.16) 0%,transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />

        {/* Card */}
        <div style={{
          position:'relative', zIndex:1,
          width:'100%', maxWidth:500,
          background:'var(--card-bg)',
          border:'1px solid var(--card-border)',
          borderRadius:'1.5rem',
          backdropFilter:'blur(24px)',
          padding:'2.5rem 2.25rem',
          boxShadow:'var(--sh-lg)',
          textAlign:'center',
          animation:'slideUp .45s ease both',
        }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:'1.5rem' }}>
            <div style={{ width:30, height:30, borderRadius:'.5rem', background:'linear-gradient(140deg,#2dd4bf,#0d9488)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(45,212,191,.30)' }}>
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <rect x="3" y="3" width="8" height="8" rx="1.5" fill="white" opacity=".95"/>
                <rect x="13" y="3" width="8" height="8" rx="1.5" fill="white" opacity=".45"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity=".45"/>
                <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity=".95"/>
              </svg>
            </div>
            <span style={{ fontSize:'.84rem', fontWeight:700, color:'var(--tx1)' }}>SteelTrack</span>
            <span style={{ color:'var(--tx4)', fontSize:'.75rem' }}>·</span>
            <span style={{ fontSize:'.75rem', color:'var(--tx3)' }}>Page Not Found</span>
          </div>

          {/* Coil */}
          <div style={{ margin:'0 auto .9rem', width:82, height:82, animation:'float 3.5s ease-in-out infinite' }}>
            <svg viewBox="0 0 90 90" fill="none" width="82" height="82">
              <circle cx="45" cy="45" r="40" stroke="rgba(45,212,191,.20)" strokeWidth="2"/>
              <circle cx="45" cy="45" r="40" stroke="url(#cg1)" strokeWidth="2.5" strokeDasharray="80 172" strokeLinecap="round"/>
              <circle cx="45" cy="45" r="30" stroke="rgba(99,102,241,.18)" strokeWidth="2"/>
              <circle cx="45" cy="45" r="30" stroke="url(#cg2)" strokeWidth="2.5" strokeDasharray="55 130" strokeLinecap="round" strokeDashoffset="-20"/>
              <circle cx="45" cy="45" r="20" stroke="rgba(45,212,191,.14)" strokeWidth="2"/>
              <circle cx="45" cy="45" r="20" stroke="url(#cg1)" strokeWidth="2" strokeDasharray="35 90" strokeLinecap="round" strokeDashoffset="-10"/>
              <circle cx="45" cy="45" r="9" fill="rgba(45,212,191,.10)" stroke="rgba(45,212,191,.36)" strokeWidth="1.5"/>
              <circle cx="45" cy="45" r="4" fill="rgba(45,212,191,.5)"/>
              <text x="45" y="50" textAnchor="middle" fill="white" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="700" opacity=".9">?</text>
              <defs>
                <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf"/><stop offset="100%" stopColor="#6366f1"/>
                </linearGradient>
                <linearGradient id="cg2" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#2dd4bf"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div style={{ fontSize:'clamp(4.5rem,16vw,8rem)', fontWeight:800, lineHeight:1, background:'linear-gradient(135deg,#2dd4bf 0%,#6366f1 60%,rgba(99,102,241,.4) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing:'-.04em', marginBottom:'.2rem', animation:'popIn .6s .1s ease both' }}>404</div>
          <h1 style={{ fontSize:'1.15rem', fontWeight:700, color:'var(--tx1)', marginBottom:'.4rem', letterSpacing:'-0.01em' }}>Page not found</h1>
          <p style={{ fontSize:'.875rem', color:'var(--tx2)', lineHeight:1.65, maxWidth:'34ch', margin:'0 auto 1.75rem' }}>
            This page doesn&apos;t exist or has been moved. Use the links below to get back on track.
          </p>

          {/* Buttons */}
          <div style={{ display:'flex', gap:'.6rem', justifyContent:'center', flexWrap:'wrap', marginBottom:'1.5rem' }}>
            <button className="nf-primary" onClick={() => navigate('/dashboard')}
              style={{ display:'inline-flex', alignItems:'center', gap:'.4rem', padding:'.6rem 1.3rem', borderRadius:'.65rem', border:'none', background:'linear-gradient(135deg,#2dd4bf,#0d9488)', color:'#07211e', fontSize:'.84rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(45,212,191,.30)', transition:'all .18s ease' }}>
              🏠 Go to Dashboard
            </button>
            <button className="nf-ghost" onClick={() => window.history.back()}
              style={{ display:'inline-flex', alignItems:'center', gap:'.4rem', padding:'.6rem 1.3rem', borderRadius:'.65rem', background:'var(--g2)', border:'1px solid var(--gb)', color:'var(--tx2)', fontSize:'.84rem', fontWeight:600, cursor:'pointer', transition:'all .18s ease' }}>
              ← Go Back
            </button>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'.55rem', marginBottom:'.75rem' }}>
            <div style={{ flex:1, height:1, background:'var(--gb)' }} />
            <span style={{ fontSize:'.64rem', color:'var(--tx4)', textTransform:'uppercase', letterSpacing:'.07em', whiteSpace:'nowrap' }}>Or jump to</span>
            <div style={{ flex:1, height:1, background:'var(--gb)' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'.35rem' }}>
            {QUICK_LINKS.map(ql => (
              <button key={ql.href} className="nf-qlink" onClick={() => navigate(ql.href)}
                style={{ display:'flex', alignItems:'center', gap:'.45rem', padding:'.5rem .7rem', borderRadius:'.55rem', background:'var(--g1)', border:'1px solid var(--gb)', color:'var(--tx2)', fontSize:'.78rem', fontWeight:500, cursor:'pointer', textAlign:'left', transition:'all .16s ease' }}>
                <span style={{ fontSize:'.9rem', flexShrink:0 }}>{ql.icon}</span>
                {ql.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop:'1.25rem', fontSize:'.64rem', color:'var(--tx4)', textAlign:'center', position:'relative', zIndex:1 }}>
          Steel Logistics &amp; Dispatch Tracker v1.0 · Demo Mode
        </div>
      </div>
    </>
  )
}
