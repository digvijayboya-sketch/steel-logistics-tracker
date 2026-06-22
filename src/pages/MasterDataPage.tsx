import { useEffect, useState } from 'react'
import { useRole } from '@/hooks/useRole'
import { useDataStore } from '@/store/dataStore'
import { toast } from 'sonner'
import {
  Building2, Users, Truck, Factory,
  Plus, Pencil, Trash2, Check, X, Loader2, ShieldCheck, Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Tab = 'suppliers' | 'service_centres' | 'customers' | 'users'

const ROLES = ['admin', 'planner', 'purchase', 'manager', 'agent'] as const
type Role = typeof ROLES[number]

const ROLE_COLORS: Record<Role, string> = {
  admin:    '#c4b5fd',
  planner:  '#93c5fd',
  purchase: '#fcd34d',
  manager:  '#6ee7b7',
  agent:    '#5eead4',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.7rem', borderRadius: '0.5rem',
  border: '1px solid var(--input-border)', background: 'var(--input-bg)',
  color: 'var(--tx1)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' as const,
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

// ── Inline editable row ──────────────────────────────────────
type EntityRow = { id: string; [key: string]: string | number | boolean | null | undefined }

interface EditRowState { id: string; fields: Record<string, string> }

// ── Generic entity table ─────────────────────────────────────
function EntityTable({
  data, columns, onAdd, onUpdate, onDelete, loading, addLabel, emptyMsg,
}: {
  data: EntityRow[]
  columns: { key: string; label: string; placeholder?: string; width?: number }[]
  onAdd: (fields: Record<string, string>) => Promise<void>
  onUpdate: (id: string, fields: Record<string, string>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading: boolean
  addLabel: string
  emptyMsg: string
}) {
  const blank = () => Object.fromEntries(columns.map(c => [c.key, '']))
  const [editRow, setEditRow] = useState<EditRowState | null>(null)
  const [addRow, setAddRow]   = useState<Record<string, string> | null>(null)
  const [busy, setBusy]       = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  const filtered = data.filter(row =>
    columns.some(c => String(row[c.key] ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  const handleAdd = async () => {
    if (!addRow) return
    setBusy('add')
    try { await onAdd(addRow); setAddRow(null); toast.success('Created') }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  const handleUpdate = async () => {
    if (!editRow) return
    setBusy(editRow.id)
    try { await onUpdate(editRow.id, editRow.fields); setEditRow(null); toast.success('Updated') }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    setBusy(id + '_del')
    try { await onDelete(id); toast.success('Deleted') }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx4)', pointerEvents: 'none' }} />
          <input
            style={{ ...inp, paddingLeft: '1.8rem' }}
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setAddRow(blank()); setEditRow(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.9rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <Plus size={13} /> {addLabel}
        </button>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.5rem', color: 'var(--tx3)', fontSize: '0.84rem' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="st-table">
              <thead>
                <tr>
                  {columns.map(c => <th key={c.key}>{c.label}</th>)}
                  <th style={{ width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Add row */}
                {addRow && (
                  <tr style={{ background: 'rgba(45,212,191,0.06)' }}>
                    {columns.map(c => (
                      <td key={c.key}>
                        <input
                          style={inp}
                          placeholder={c.placeholder ?? c.label}
                          value={addRow[c.key] ?? ''}
                          onChange={e => setAddRow(r => ({ ...r!, [c.key]: e.target.value }))}
                        />
                      </td>
                    ))}
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={handleAdd} disabled={busy === 'add'}
                          style={{ padding: '0.28rem 0.55rem', borderRadius: 6, border: 'none', background: '#22c55e22', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          {busy === 'add' ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={13} />}
                        </button>
                        <button onClick={() => setAddRow(null)}
                          style={{ padding: '0.28rem 0.55rem', borderRadius: 6, border: 'none', background: '#f8717122', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {filtered.length === 0 && !addRow && (
                  <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--tx3)', fontSize: '0.84rem' }}>{emptyMsg}</td></tr>
                )}

                {filtered.map(row => {
                  const isEditing = editRow?.id === row.id
                  return (
                    <tr key={row.id}>
                      {columns.map(c => (
                        <td key={c.key}>
                          {isEditing ? (
                            <input
                              style={inp}
                              value={editRow.fields[c.key] ?? ''}
                              onChange={e => setEditRow(r => r ? { ...r, fields: { ...r.fields, [c.key]: e.target.value } } : r)}
                            />
                          ) : (
                            <span style={c.key === columns[0].key ? { fontWeight: 600, color: 'var(--tx1)' } : { color: 'var(--tx2)', fontSize: '0.82rem' }}>
                              {String(row[c.key] ?? '—')}
                            </span>
                          )}
                        </td>
                      ))}
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {isEditing ? (
                            <>
                              <button onClick={handleUpdate} disabled={busy === row.id}
                                style={{ padding: '0.28rem 0.55rem', borderRadius: 6, border: 'none', background: '#22c55e22', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                {busy === row.id ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={13} />}
                              </button>
                              <button onClick={() => setEditRow(null)}
                                style={{ padding: '0.28rem 0.55rem', borderRadius: 6, border: 'none', background: '#f8717122', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditRow({ id: row.id, fields: Object.fromEntries(columns.map(c => [c.key, String(row[c.key] ?? '')])) })}
                                style={{ padding: '0.28rem 0.55rem', borderRadius: 6, border: 'none', background: 'rgba(96,165,250,0.12)', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => handleDelete(row.id)} disabled={busy === row.id + '_del'}
                                style={{ padding: '0.28rem 0.55rem', borderRadius: 6, border: 'none', background: '#f8717122', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                {busy === row.id + '_del' ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={12} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid var(--gb)', fontSize: '0.72rem', color: 'var(--tx4)' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

// ── Users panel ───────────────────────────────────────────────
function UsersPanel() {
  const { allProfiles, loading, fetchAllProfiles, updateUserRole, updateUserProfile } = useDataStore()
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<string>('')
  const [editName, setEditName] = useState<string>('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => { fetchAllProfiles() }, [])

  const filtered = allProfiles.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.role?.toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (p: typeof allProfiles[0]) => {
    setEditId(p.id)
    setEditRole(p.role ?? '')
    setEditName(p.full_name ?? '')
  }

  const handleSave = async (id: string) => {
    setBusy(id)
    try {
      await updateUserRole(id, editRole)
      await updateUserProfile(id, { full_name: editName })
      setEditId(null)
      toast.success('User updated')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally { setBusy(null) }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx4)', pointerEvents: 'none' }} />
          <input style={{ ...inp, paddingLeft: '1.8rem' }} placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
        {loading['allProfiles'] ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.5rem', color: 'var(--tx3)' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading users…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="st-table">
              <thead>
                <tr><th>Name</th><th>Role</th><th>Phone</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isEditing = editId === p.id
                  const rc = ROLE_COLORS[p.role as Role] ?? 'var(--tx3)'
                  return (
                    <tr key={p.id}>
                      <td>
                        {isEditing
                          ? <input style={inp} value={editName} onChange={e => setEditName(e.target.value)} />
                          : <span style={{ fontWeight: 600, color: 'var(--tx1)' }}>{p.full_name ?? '—'}</span>
                        }
                      </td>
                      <td>
                        {isEditing ? (
                          <select style={inp} value={editRole} onChange={e => setEditRole(e.target.value)}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${rc}22`, color: rc, border: `1px solid ${rc}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {p.role}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--tx3)', fontSize: '0.82rem' }}>{p.phone ?? '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSave(p.id)} disabled={busy === p.id}
                                style={{ padding: '0.28rem 0.55rem', borderRadius: 6, border: 'none', background: '#22c55e22', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                {busy === p.id ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={13} />}
                              </button>
                              <button onClick={() => setEditId(null)}
                                style={{ padding: '0.28rem 0.55rem', borderRadius: 6, border: 'none', background: '#f8717122', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => startEdit(p)}
                              style={{ padding: '0.28rem 0.55rem', borderRadius: 6, border: 'none', background: 'rgba(96,165,250,0.12)', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid var(--gb)', fontSize: '0.72rem', color: 'var(--tx4)' }}>
          {filtered.length} user{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
export const MasterDataPage = () => {
  const { isAdmin } = useRole()
  const navigate = useNavigate()
  const [
    tab, setTab
  ] = useState<Tab>('suppliers')

  const {
    suppliers, serviceCentres, customers, loading,
    fetchLookups,
    createSupplier, updateSupplier, deleteSupplier,
    createServiceCentre, updateServiceCentre, deleteServiceCentre,
    createCustomer, updateCustomer, deleteCustomer,
  } = useDataStore()

  useEffect(() => { fetchLookups() }, [])

  if (!isAdmin) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <ShieldCheck size={40} style={{ color: 'var(--tx4)', marginBottom: '0.75rem' }} />
      <div style={{ color: 'var(--tx2)', fontWeight: 600 }}>Admin access required</div>
      <div style={{ color: 'var(--tx4)', fontSize: '0.82rem', marginTop: '0.3rem' }}>Only admins can manage master data.</div>
      <button onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem', padding: '0.5rem 1.2rem', borderRadius: '0.5rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', cursor: 'pointer', fontWeight: 600 }}>Back to Dashboard</button>
    </div>
  )

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'suppliers',       label: 'Suppliers',       icon: Building2 },
    { key: 'service_centres', label: 'Service Centres', icon: Factory },
    { key: 'customers',       label: 'Customers',       icon: Truck },
    { key: 'users',           label: 'Users & Roles',   icon: Users },
  ]

  const tabStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 1.1rem',
    borderRadius: '0.5rem 0.5rem 0 0',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'transparent',
    color: active ? 'var(--accent)' : 'var(--tx3)',
    fontWeight: active ? 700 : 500,
    fontSize: '0.84rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  return (
    <PageShell>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
          <span>SteelTrack</span><span className="sep">›</span>
          <span className="active">Master Data</span>
        </div>
        <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Master Data</h1>
        <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Manage suppliers, service centres, customers and user roles — admin only</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gb)', marginBottom: '1.25rem', gap: '0.1rem' }}>
        {tabs.map(t => (
          <button key={t.key} style={tabStyle(tab === t.key)} onClick={() => setTab(t.key)}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === 'suppliers' && (
        <EntityTable
          data={suppliers as unknown as EntityRow[]}
          loading={!!loading['lookups']}
          addLabel="Add Supplier"
          emptyMsg="No suppliers yet"
          columns={[
            { key: 'name',           label: 'Name',           placeholder: 'Supplier name' },
            { key: 'contact_person', label: 'Contact Person', placeholder: 'Full name' },
            { key: 'phone',          label: 'Phone',          placeholder: '+91 XXXXX XXXXX' },
            { key: 'gst_number',     label: 'GST Number',     placeholder: '27AABCU9603R1ZX' },
          ]}
          onAdd={createSupplier}
          onUpdate={(id, f) => updateSupplier(id, f)}
          onDelete={deleteSupplier}
        />
      )}

      {tab === 'service_centres' && (
        <EntityTable
          data={serviceCentres as unknown as EntityRow[]}
          loading={!!loading['lookups']}
          addLabel="Add Service Centre"
          emptyMsg="No service centres yet"
          columns={[
            { key: 'name',           label: 'Name',           placeholder: 'Centre name' },
            { key: 'city',           label: 'City',           placeholder: 'e.g. Pune' },
            { key: 'contact_person', label: 'Contact Person', placeholder: 'Full name' },
            { key: 'phone',          label: 'Phone',          placeholder: '+91 XXXXX XXXXX' },
          ]}
          onAdd={createServiceCentre}
          onUpdate={(id, f) => updateServiceCentre(id, f)}
          onDelete={deleteServiceCentre}
        />
      )}

      {tab === 'customers' && (
        <EntityTable
          data={customers as unknown as EntityRow[]}
          loading={!!loading['lookups']}
          addLabel="Add Customer"
          emptyMsg="No customers yet"
          columns={[
            { key: 'name',           label: 'Name',           placeholder: 'Customer name' },
            { key: 'city',           label: 'City',           placeholder: 'e.g. Nashik' },
            { key: 'contact_person', label: 'Contact Person', placeholder: 'Full name' },
            { key: 'gst_number',     label: 'GST Number',     placeholder: '27AABCU9603R1ZX' },
          ]}
          onAdd={createCustomer}
          onUpdate={(id, f) => updateCustomer(id, f)}
          onDelete={deleteCustomer}
        />
      )}

      {tab === 'users' && <UsersPanel />}
    </PageShell>
  )
}
