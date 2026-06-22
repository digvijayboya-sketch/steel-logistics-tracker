/**
 * MasterDataPage.tsx
 * Admin-only page. All columns match the EXACT database schema:
 *   suppliers       → id, name
 *   service_centres → id, name, city
 *   customers       → id, name, city
 *   profiles        → id, full_name, role (admin|planner|purchase|agent), phone
 */
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

// Exact roles from DB enum: admin | planner | purchase | agent
const DB_ROLES = ['admin', 'planner', 'purchase', 'agent'] as const
type DBRole = typeof DB_ROLES[number]

const ROLE_COLORS: Record<DBRole, string> = {
  admin:    '#c4b5fd',
  planner:  '#93c5fd',
  purchase: '#fcd34d',
  agent:    '#5eead4',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.7rem', borderRadius: '0.5rem',
  border: '1px solid var(--input-border)', background: 'var(--input-bg)',
  color: 'var(--tx1)', fontSize: '0.82rem', outline: 'none',
  boxSizing: 'border-box' as const,
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

// ── Types ───────────────────────────────────────────────────
type StrMap = Record<string, string>
type ColDef = { key: string; label: string; placeholder?: string }

// ── Generic inline-edit table ─────────────────────────────────
function EntityTable({
  data, columns, onAdd, onUpdate, onDelete, loading, addLabel, emptyMsg,
}: {
  data: (StrMap & { id: string })[]
  columns: ColDef[]
  onAdd: (fields: StrMap) => Promise<void>
  onUpdate: (id: string, fields: StrMap) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading: boolean
  addLabel: string
  emptyMsg: string
}) {
  const blank = (): StrMap => Object.fromEntries(columns.map(c => [c.key, '']))
  const [editRow, setEditRow] = useState<{ id: string; fields: StrMap } | null>(null)
  const [addRow,  setAddRow]  = useState<StrMap | null>(null)
  const [busy,    setBusy]    = useState<string | null>(null)
  const [search,  setSearch]  = useState('')

  const filtered = data.filter(row =>
    columns.some(c => (row[c.key] ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  const save = async (fn: () => Promise<void>, successMsg: string) => {
    try { await fn(); toast.success(successMsg) }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed') }
  }

  const handleAdd = async () => {
    if (!addRow) return
    setBusy('add')
    await save(async () => { await onAdd(addRow); setAddRow(null) }, 'Created')
    setBusy(null)
  }

  const handleUpdate = async () => {
    if (!editRow) return
    setBusy(editRow.id)
    await save(async () => { await onUpdate(editRow.id, editRow.fields); setEditRow(null) }, 'Updated')
    setBusy(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    setBusy(id + '_del')
    await save(() => onDelete(id), 'Deleted')
    setBusy(null)
  }

  const actionBtn = (label: React.ReactNode, onClick: () => void, color: string, disabled = false) => (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '0.28rem 0.55rem', borderRadius: 6, border: 'none',
        background: `${color}22`, color, cursor: 'pointer',
        display: 'flex', alignItems: 'center', opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx4)', pointerEvents: 'none' }} />
          <input style={{ ...inp, paddingLeft: '1.8rem' }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setAddRow(blank()); setEditRow(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.9rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Plus size={13} /> {addLabel}
        </button>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.5rem', color: 'var(--tx3)' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="st-table">
              <thead>
                <tr>
                  {columns.map(c => <th key={c.key}>{c.label}</th>)}
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Add row */}
                {addRow && (
                  <tr style={{ background: 'rgba(45,212,191,0.06)' }}>
                    {columns.map(c => (
                      <td key={c.key}>
                        <input style={inp} placeholder={c.placeholder ?? c.label}
                          value={addRow[c.key] ?? ''}
                          onChange={e => setAddRow(r => ({ ...r!, [c.key]: e.target.value }))} />
                      </td>
                    ))}
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {actionBtn(
                          busy === 'add' ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={13} />,
                          handleAdd, '#22c55e', busy === 'add'
                        )}
                        {actionBtn(<X size={13} />, () => setAddRow(null), '#f87171')}
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
                      {columns.map((c, i) => (
                        <td key={c.key}>
                          {isEditing
                            ? <input style={inp} value={editRow.fields[c.key] ?? ''}
                                onChange={e => setEditRow(r => r ? { ...r, fields: { ...r.fields, [c.key]: e.target.value } } : r)} />
                            : <span style={i === 0 ? { fontWeight: 600, color: 'var(--tx1)' } : { color: 'var(--tx2)', fontSize: '0.82rem' }}>
                                {row[c.key] || '—'}
                              </span>
                          }
                        </td>
                      ))}
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {isEditing ? (
                            <>
                              {actionBtn(
                                busy === row.id ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={13} />,
                                handleUpdate, '#22c55e', busy === row.id
                              )}
                              {actionBtn(<X size={13} />, () => setEditRow(null), '#f87171')}
                            </>
                          ) : (
                            <>
                              {actionBtn(<Pencil size={12} />, () =>
                                setEditRow({ id: row.id, fields: Object.fromEntries(columns.map(c => [c.key, row[c.key] ?? ''])) }),
                              '#60a5fa')}
                              {actionBtn(
                                busy === row.id + '_del' ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={12} />,
                                () => handleDelete(row.id), '#f87171', busy === row.id + '_del'
                              )}
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

// ── Users panel ─────────────────────────────────────────────
function UsersPanel() {
  const { allProfiles, loading, fetchAllProfiles, updateUserRole, updateUserProfile } = useDataStore()
  const [search,   setSearch]   = useState('')
  const [editId,   setEditId]   = useState<string | null>(null)
  const [editRole, setEditRole] = useState<DBRole>('agent')
  const [editName, setEditName] = useState('')
  const [editPhone,setEditPhone]= useState('')
  const [busy,     setBusy]     = useState<string | null>(null)

  useEffect(() => { fetchAllProfiles() }, [])

  const filtered = allProfiles.filter(p =>
    (p.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.role      ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (p: typeof allProfiles[0]) => {
    setEditId(p.id)
    setEditRole((p.role as DBRole) ?? 'agent')
    setEditName(p.full_name ?? '')
    setEditPhone(p.phone ?? '')
  }

  const handleSave = async (id: string) => {
    setBusy(id)
    try {
      await updateUserRole(id, editRole)
      await updateUserProfile(id, { full_name: editName, phone: editPhone })
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
                <tr><th>Name</th><th>Role</th><th>Phone</th><th>Member Since</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isEditing = editId === p.id
                  const rc = ROLE_COLORS[(p.role as DBRole)] ?? 'var(--tx3)'
                  return (
                    <tr key={p.id}>
                      {/* Name */}
                      <td>
                        {isEditing
                          ? <input style={inp} value={editName} onChange={e => setEditName(e.target.value)} />
                          : <span style={{ fontWeight: 600, color: 'var(--tx1)' }}>{p.full_name ?? '—'}</span>
                        }
                      </td>
                      {/* Role */}
                      <td>
                        {isEditing ? (
                          <select style={inp} value={editRole} onChange={e => setEditRole(e.target.value as DBRole)}>
                            {DB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${rc}22`, color: rc, border: `1px solid ${rc}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {p.role}
                          </span>
                        )}
                      </td>
                      {/* Phone */}
                      <td style={{ color: 'var(--tx3)', fontSize: '0.82rem' }}>
                        {isEditing
                          ? <input style={inp} placeholder="+91 XXXXX" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                          : p.phone ?? '—'
                        }
                      </td>
                      {/* Created at */}
                      <td style={{ color: 'var(--tx4)', fontSize: '0.78rem' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      {/* Actions */}
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
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--tx3)', fontSize: '0.84rem' }}>No users found</td></tr>
                )}
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
  const [tab, setTab] = useState<Tab>('suppliers')

  const {
    suppliers, serviceCentres, customers, loading, fetchLookups,
    createSupplier, updateSupplier, deleteSupplier,
    createServiceCentre, updateServiceCentre, deleteServiceCentre,
    createCustomer, updateCustomer, deleteCustomer,
  } = useDataStore()

  useEffect(() => { fetchLookups() }, [])

  if (!isAdmin) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <ShieldCheck size={44} style={{ color: 'var(--tx4)', marginBottom: '0.75rem' }} />
      <div style={{ color: 'var(--tx2)', fontWeight: 600, fontSize: '1rem' }}>Admin access required</div>
      <div style={{ color: 'var(--tx4)', fontSize: '0.82rem', marginTop: '0.35rem' }}>Only admins can manage master data.</div>
      <button onClick={() => navigate('/dashboard')}
        style={{ marginTop: '1.25rem', padding: '0.5rem 1.3rem', borderRadius: '0.5rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', cursor: 'pointer', fontWeight: 600 }}>
        Back to Dashboard
      </button>
    </div>
  )

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'suppliers',       label: 'Suppliers',       icon: Building2 },
    { key: 'service_centres', label: 'Service Centres', icon: Factory },
    { key: 'customers',       label: 'Customers',       icon: Truck },
    { key: 'users',           label: 'Users & Roles',   icon: Users },
  ]

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 1.1rem',
    borderRadius: '0.5rem 0.5rem 0 0',
    border: 'none',
    borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
    background: 'transparent',
    color: active ? 'var(--accent)' : 'var(--tx3)',
    fontWeight: active ? 700 : 500,
    fontSize: '0.84rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  return (
    <PageShell>
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
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Suppliers – only column: name */}
      {tab === 'suppliers' && (
        <EntityTable
          data={suppliers.map(s => ({ id: s.id, name: s.name }))}
          loading={!!loading['lookups']}
          addLabel="Add Supplier"
          emptyMsg="No suppliers yet. Add one above."
          columns={[
            { key: 'name', label: 'Supplier Name', placeholder: 'e.g. Tata Steel Ltd.' },
          ]}
          onAdd={fields => createSupplier({ name: fields.name })}
          onUpdate={(id, fields) => updateSupplier(id, { name: fields.name })}
          onDelete={deleteSupplier}
        />
      )}

      {/* Service Centres – columns: name, city */}
      {tab === 'service_centres' && (
        <EntityTable
          data={serviceCentres.map(s => ({ id: s.id, name: s.name, city: s.city ?? '' }))}
          loading={!!loading['lookups']}
          addLabel="Add Service Centre"
          emptyMsg="No service centres yet. Add one above."
          columns={[
            { key: 'name', label: 'Centre Name', placeholder: 'e.g. Chakan Service Centre' },
            { key: 'city', label: 'City',         placeholder: 'e.g. Pune' },
          ]}
          onAdd={fields => createServiceCentre({ name: fields.name, city: fields.city })}
          onUpdate={(id, fields) => updateServiceCentre(id, { name: fields.name, city: fields.city })}
          onDelete={deleteServiceCentre}
        />
      )}

      {/* Customers – columns: name, city */}
      {tab === 'customers' && (
        <EntityTable
          data={customers.map(c => ({ id: c.id, name: c.name, city: c.city ?? '' }))}
          loading={!!loading['lookups']}
          addLabel="Add Customer"
          emptyMsg="No customers yet. Add one above."
          columns={[
            { key: 'name', label: 'Customer Name', placeholder: 'e.g. Mahindra & Mahindra' },
            { key: 'city', label: 'City',           placeholder: 'e.g. Nashik' },
          ]}
          onAdd={fields => createCustomer({ name: fields.name, city: fields.city })}
          onUpdate={(id, fields) => updateCustomer(id, { name: fields.name, city: fields.city })}
          onDelete={deleteCustomer}
        />
      )}

      {/* Users – full_name, role (DB enum), phone */}
      {tab === 'users' && <UsersPanel />}
    </PageShell>
  )
}
