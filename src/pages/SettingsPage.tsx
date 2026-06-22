import { useNavigate } from 'react-router-dom'
import { useRole, ROLE_META } from '@/hooks/useRole'
import { useAuthStore } from '@/store/appStore'
import { useTheme } from '@/hooks/useTheme'
import { Sun, Moon, LogOut, User, Shield, Bell, Database } from 'lucide-react'

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 720, margin: '0 auto' }}>
    {children}
  </div>
)

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', marginBottom: '1rem', boxShadow: 'var(--sh-card)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gb)', background: 'var(--g1)' }}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)' }}>{title}</span>
    </div>
    <div style={{ padding: '1rem 1.25rem' }}>{children}</div>
  </div>
)

const Row = ({ label, value, action }: { label: string; value?: string; action?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0', borderBottom: '1px solid var(--gb)' }}>
    <div>
      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--tx1)' }}>{label}</div>
      {value && <div style={{ fontSize: '0.78rem', color: 'var(--tx3)', marginTop: 2 }}>{value}</div>}
    </div>
    {action && <div style={{ flexShrink: 0 }}>{action}</div>}
  </div>
)

export const SettingsPage = () => {
  const { user, isAdmin } = useRole()
  const { logout } = useAuthStore()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()
  const roleMeta = ROLE_META[user?.role ?? 'agent']

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <PageShell>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
          <span>SteelTrack</span><span className="sep">›</span><span className="active">Settings</span>
        </div>
        <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Settings</h1>
        <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Profile, preferences and app configuration</p>
      </div>

      {/* Profile */}
      <SectionCard title="Profile" icon={<User size={15} />}>
        <Row label="Full name"   value={user?.full_name ?? '—'} />
        <Row label="Email"       value={user?.email ?? '—'} />
        <Row label="Role"
          action={
            <span style={{ fontSize: '0.70rem', fontWeight: 700, padding: '0.22rem 0.65rem', borderRadius: 999, background: roleMeta.bg, color: roleMeta.color, border: `1px solid ${roleMeta.accent}44`, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {roleMeta.label}
            </span>
          }
        />
        <Row label="User ID"     value={user?.id ?? '—'} />
      </SectionCard>

      {/* Appearance */}
      <SectionCard title="Appearance" icon={isDark ? <Moon size={15} /> : <Sun size={15} />}>
        <Row label="Theme" value={isDark ? 'Dark mode' : 'Light mode'}
          action={
            <button onClick={toggle}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.9rem', borderRadius: '0.5rem',
                border: '1px solid var(--gb)', background: 'var(--g2)',
                color: 'var(--tx2)', fontWeight: 600, fontSize: '0.80rem',
                cursor: 'pointer',
              }}>
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
              Switch to {isDark ? 'light' : 'dark'}
            </button>
          }
        />
      </SectionCard>

      {/* Notifications (static) */}
      <SectionCard title="Notifications" icon={<Bell size={15} />}>
        {[['Job status updates', 'Push & email'], ['Expense approvals', 'Email only'], ['Route deviations', 'Push & email']]
          .map(([l, v]) => <Row key={l} label={l} value={v} />)}
      </SectionCard>

      {/* Admin: Data */}
      {isAdmin && (
        <SectionCard title="Administration" icon={<Shield size={15} />}>
          <Row label="User management"     value="Manage roles and access" />
          <Row label="Service centres"     value="Add / edit SC list" />
          <Row label="Supplier directory"  value="Manage suppliers" />
          <Row label="Audit log"           value="Full activity trail" />
        </SectionCard>
      )}

      {/* Sign out */}
      <SectionCard title="Account" icon={<Database size={15} />}>
        <Row label="Sign out" value="End your current session"
          action={
            <button onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.9rem', borderRadius: '0.5rem',
                border: '1px solid rgba(248,113,113,0.35)',
                background: 'rgba(248,113,113,0.10)',
                color: '#f87171', fontWeight: 700, fontSize: '0.80rem',
                cursor: 'pointer',
              }}>
              <LogOut size={13} /> Sign out
            </button>
          }
        />
      </SectionCard>
    </PageShell>
  )
}
