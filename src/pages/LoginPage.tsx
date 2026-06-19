import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { toast } from 'sonner'

const QUICK_LOGINS = [
  { label:'Admin',    email:'admin@steelco.in',    password:'admin123', color:'bg-violet-50 text-violet-700 border-violet-200' },
  { label:'Purchase', email:'purchase@steelco.in', password:'steel123', color:'bg-amber-50 text-amber-700 border-amber-200' },
  { label:'Planner',  email:'planner@steelco.in',  password:'steel123', color:'bg-blue-50 text-blue-700 border-blue-200' },
  { label:'Agent 1',  email:'agent1@steelco.in',   password:'agent123', color:'bg-teal-50 text-teal-700 border-teal-200' },
  { label:'Agent 2',  email:'agent2@steelco.in',   password:'agent123', color:'bg-teal-50 text-teal-700 border-teal-200' },
]

export const LoginPage = () => {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e?: React.FormEvent, em = email, pw = password) => {
    e?.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const ok = login(em, pw)
      setLoading(false)
      if (ok) { navigate('/dashboard') }
      else toast.error('Invalid credentials')
    }, 400)
  }

  const quickLogin = (em: string, pw: string) => {
    setEmail(em); setPassword(pw)
    handleLogin(undefined, em, pw)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[--color-primary] shadow-lg mb-4">
            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
              <rect x="3" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="13" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[--color-ink]">SteelTrack</h1>
          <p className="text-sm text-[--color-ink-muted] mt-1">Logistics & Dispatch Tracker</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[--color-ink] mb-1">Email</label>
              <input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-[--color-surface-border] bg-[--color-surface-bg] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] transition"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[--color-ink] mb-1">Password</label>
              <input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-[--color-surface-border] bg-[--color-surface-bg] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] transition"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[--color-primary] text-white text-sm font-semibold hover:bg-[--color-primary-dark] transition disabled:opacity-60 shadow-sm">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-[--color-surface-border]" />
              <span className="text-xs text-[--color-ink-faint] uppercase tracking-wide">Quick demo login</span>
              <div className="flex-1 h-px bg-[--color-surface-border]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_LOGINS.map(ql=>(
                <button key={ql.email} onClick={()=>quickLogin(ql.email, ql.password)}
                  className={`text-xs font-medium px-2 py-1.5 rounded-lg border transition hover:shadow-sm ${ql.color}`}>
                  {ql.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-[--color-ink-faint] mt-4">Steel Logistics & Dispatch Tracker v1.0 · Demo Mode</p>
      </div>
    </div>
  )
}
