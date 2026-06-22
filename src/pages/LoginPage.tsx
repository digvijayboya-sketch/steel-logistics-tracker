import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { toast } from 'sonner'

const FEATURES = [
  { icon: '📋', label: 'DO Management',      desc: 'Full lifecycle from supplier to customer' },
  { icon: '🏭', label: 'SC Queue Tracker',   desc: 'Live service centre status & queue position' },
  { icon: '💸', label: 'Field Expense Log',  desc: 'Photo-tagged cash payment reconciliation' },
  { icon: '🚛', label: 'Delivery Tracker',   desc: 'Real-time route & location change log' },
]

const STATS = [
  { value: '100%', label: 'DO Traceability' },
  { value: '₹0',   label: 'Untracked Spend' },
  { value: 'Live', label: 'SC Queue View'   },
]

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

export const LoginPage = () => {
  const { login }   = useAuthStore()
  const navigate    = useNavigate()
  const [email,     setEmail]    = useState('')
  const [password,  setPassword] = useState('')
  const [showPw,    setShowPw]   = useState(false)
  const [loading,   setLoading]  = useState(false)
  const [success,   setSuccess]  = useState(false)
  const [error,     setError]    = useState('')

  const attemptLogin = (em: string, pw: string) => {
    setLoading(true); setError('')
    setTimeout(() => {
      const ok = login(em, pw)
      setLoading(false)
      if (ok) { setSuccess(true); setTimeout(() => navigate('/dashboard'), 600) }
      else { setError('Invalid email or password. Please try again.'); toast.error('Invalid credentials') }
    }, 450)
  }

  return (
    <>
      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes slideR { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideU { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .lp-input:focus {
          border-color: rgba(45,212,191,.7) !important;
          box-shadow: 0 0 0 3px rgba(45,212,191,.14);
        }
        .lp-input { transition: border-color .16s, box-shadow .16s; }
        .lp-submit:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(45,212,191,.45) !important;
          filter: brightness(1.08);
        }
        .lp-feat:hover {
          background: rgba(45,212,191,.06) !important;
          border-color: rgba(45,212,191,.20) !important;
        }
        @media (min-width:860px) {
          .lp-hero  { display:flex !important; }
          .lp-right { margin:0 !important; border-left:1px solid rgba(255,255,255,.06); }
        }
      `}</style>

      <div style={{
        minHeight: '100dvh', display: 'flex',
        background:
          'radial-gradient(ellipse 80% 60% at 18% 38%, rgba(45,212,191,.16) 0%, transparent 58%),' +
          'radial-gradient(ellipse 60% 55% at 82% 72%, rgba(99,102,241,.13) 0%, transparent 55%),' +
          '#0c1524',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}>

        {/* ── LEFT HERO ── */}
        <div style={{
          flex: 1, display: 'none', flexDirection: 'column',
          justifyContent: 'center', padding: '3rem 3.5rem',
          position: 'relative', overflow: 'hidden',
        }} className="lp-hero">
          {/* Background orbs */}
          <div style={{ position:'absolute', top:'-8%', right:'-6%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.22) 0%,transparent 70%)', filter:'blur(48px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'8%', left:'-10%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(45,212,191,.18) 0%,transparent 70%)', filter:'blur(48px)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1, animation:'slideR .5s ease both' }}>
            {/* Live badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'0.28rem 0.8rem', borderRadius:'9999px',
              background:'rgba(45,212,191,.10)', border:'1px solid rgba(45,212,191,.22)',
              color:'#2dd4bf', fontSize:'0.70rem', fontWeight:700,
              letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'1.4rem',
            }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#2dd4bf', animation:'pulse 2s infinite', flexShrink:0 }} />
              Live Operations
            </div>

            <h1 style={{
              fontSize:'clamp(2rem,3vw,2.75rem)', fontWeight:800,
              lineHeight:1.15, color:'#f0f6fc', marginBottom:'0.9rem',
              letterSpacing:'-0.025em',
            }}>
              Track every coil.<br />
              <span style={{
                background:'linear-gradient(135deg,#2dd4bf,#6366f1)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>End-to-end.</span>
            </h1>

            <p style={{ fontSize:'0.9375rem', color:'rgba(240,246,252,.60)', lineHeight:1.7, maxWidth:'380px', marginBottom:'1.75rem' }}>
              From supplier Delivery Order to final customer drop — one platform
              for your entire steel logistics operation.
            </p>

            {/* Stats row */}
            <div style={{ display:'flex', gap:'0.65rem', flexWrap:'wrap', marginBottom:'2.25rem' }}>
              {STATS.map(st => (
                <div key={st.label} style={{
                  padding:'0.4rem 0.9rem', borderRadius:'9999px',
                  background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.09)',
                  display:'flex', gap:'0.38rem', alignItems:'baseline',
                }}>
                  <span style={{ color:'#2dd4bf', fontWeight:700, fontSize:'0.82rem' }}>{st.value}</span>
                  <span style={{ color:'rgba(240,246,252,.45)', fontSize:'0.70rem' }}>{st.label}</span>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
              {FEATURES.map(f => (
                <div key={f.label} className="lp-feat" style={{
                  display:'flex', gap:'0.8rem', alignItems:'flex-start',
                  padding:'0.7rem 0.9rem', borderRadius:'0.8rem',
                  background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)',
                  transition:'all .18s ease', cursor:'default',
                }}>
                  <span style={{ fontSize:'1.1rem', lineHeight:1, flexShrink:0, marginTop:2 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize:'0.84rem', fontWeight:600, color:'#f0f6fc', marginBottom:2 }}>{f.label}</div>
                    <div style={{ fontSize:'0.75rem', color:'rgba(240,246,252,.45)', lineHeight:1.45 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          width:'100%', maxWidth:440,
          display:'flex', flexDirection:'column',
          justifyContent:'center', padding:'2rem 1.5rem',
          margin:'0 auto',
        }} className="lp-right">
          <div style={{
            background:'rgba(255,255,255,.05)',
            border:'1px solid rgba(255,255,255,.10)',
            borderRadius:'1.25rem',
            backdropFilter:'blur(24px)',
            padding:'2rem 1.75rem',
            boxShadow:'0 28px 72px rgba(0,0,0,.50)',
            animation:'slideU .4s ease both',
          }}>
            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'1.6rem' }}>
              <div style={{
                width:40, height:40, borderRadius:'0.7rem', flexShrink:0,
                background:'linear-gradient(140deg,#2dd4bf,#0d9488)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 4px 16px rgba(45,212,191,.38)',
              }}>
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <rect x="3"  y="3"  width="8" height="8" rx="1.5" fill="white" opacity="0.95"/>
                  <rect x="13" y="3"  width="8" height="8" rx="1.5" fill="white" opacity="0.45"/>
                  <rect x="3"  y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.45"/>
                  <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.95"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize:'1.0rem', fontWeight:700, color:'#f0f6fc', lineHeight:1.2 }}>SteelTrack</div>
                <div style={{ fontSize:'0.68rem', color:'rgba(240,246,252,.48)', marginTop:1 }}>Logistics &amp; Dispatch Tracker</div>
              </div>
            </div>

            <h2 style={{ fontSize:'1.15rem', fontWeight:700, color:'#f0f6fc', marginBottom:'0.25rem', letterSpacing:'-0.015em' }}>Welcome back</h2>
            <p style={{ fontSize:'0.82rem', color:'rgba(240,246,252,.50)', marginBottom:'1.4rem', lineHeight:1.5 }}>Sign in to access your dashboard</p>

            {/* Form */}
            <form onSubmit={e => { e.preventDefault(); attemptLogin(email, password) }}
              style={{ display:'flex', flexDirection:'column', gap:'0.8rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'rgba(240,246,252,.72)', marginBottom:'0.3rem' }}>Email address</label>
                <input
                  className="lp-input"
                  type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width:'100%', padding:'0.62rem 0.875rem', borderRadius:'0.65rem',
                    border:'1px solid rgba(255,255,255,.14)', background:'rgba(255,255,255,.07)',
                    color:'#f0f6fc', fontSize:'0.875rem', outline:'none',
                    boxSizing:'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'rgba(240,246,252,.72)', marginBottom:'0.3rem' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    className="lp-input"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width:'100%', padding:'0.62rem 2.6rem 0.62rem 0.875rem', borderRadius:'0.65rem',
                      border:'1px solid rgba(255,255,255,.14)', background:'rgba(255,255,255,.07)',
                      color:'#f0f6fc', fontSize:'0.875rem', outline:'none',
                      boxSizing:'border-box',
                    }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{
                      position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', padding:0,
                      color:'rgba(240,246,252,.38)', cursor:'pointer',
                      display:'flex', alignItems:'center',
                    }}
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  padding:'0.6rem 0.875rem', borderRadius:'0.6rem',
                  background:'rgba(248,113,113,.10)', border:'1px solid rgba(248,113,113,.25)',
                  color:'#fca5a5', fontSize:'0.80rem', lineHeight:1.5,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="lp-submit"
                disabled={loading || success}
                style={{
                  width:'100%', padding:'0.72rem',
                  borderRadius:'0.65rem', border:'none',
                  background: success
                    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                    : 'linear-gradient(135deg,#2dd4bf,#0d9488)',
                  color: success ? '#fff' : '#07211e',
                  fontSize:'0.9rem', fontWeight:700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  transition:'all .2s ease',
                  boxShadow:'0 4px 18px rgba(45,212,191,.32)',
                  letterSpacing:'.015em',
                }}
              >
                {success ? '✓ Redirecting…' : loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>
          </div>

          <div style={{
            textAlign:'center', fontSize:'0.68rem',
            color:'rgba(240,246,252,.22)', marginTop:'1.1rem',
          }}>
            Steel Logistics &amp; Dispatch Tracker v1.0
          </div>
        </div>
      </div>
    </>
  )
}
