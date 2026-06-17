import React, { useState, useEffect } from 'react'
import type { CRMClient, PlanInputs, DistributionInputs } from '../engine/types'
import { DEFAULT_INPUTS, DEFAULT_DIST_INPUTS } from '../engine/types'
import { fmtFull, fmtPct } from '../utils/formatters'

const STORAGE_KEY = 'roth-clients'

interface Props {
  currentInputs: PlanInputs
  currentDistInputs: DistributionInputs
  onLoadClient: (inputs: PlanInputs, distInputs: DistributionInputs) => void
}

function loadClients(): CRMClient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveClients(clients: CRMClient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
}

const EMPTY_CLIENT: Omit<CRMClient, 'id' | 'lastUpdated' | 'savedInputs' | 'savedDistInputs'> = {
  name: '', email: '', phone: '', notes: '',
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '7px 10px',
  fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
}

const BTN = (color: 'blue' | 'green' | 'red' | 'ghost'): React.CSSProperties => {
  const map = {
    blue:  { bg: 'var(--blue-dim)',        border: 'var(--blue)',   text: 'var(--blue-light)' },
    green: { bg: 'var(--green-dim)',       border: 'var(--green)',  text: 'var(--green-light)' },
    red:   { bg: 'rgba(239,68,68,0.12)',   border: 'var(--red)',    text: '#f87171' },
    ghost: { bg: 'var(--bg-elevated)',     border: 'var(--border)', text: 'var(--text-secondary)' },
  }
  const c = map[color]
  return {
    background: c.bg, border: `1px solid ${c.border}`, color: c.text,
    borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', whiteSpace: 'nowrap',
  }
}

export function CRMTab({ currentInputs, currentDistInputs, onLoadClient }: Props) {
  const [clients, setClients] = useState<CRMClient[]>(loadClients)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY_CLIENT)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<'name' | 'age' | 'balance' | 'lastUpdated'>('lastUpdated')

  useEffect(() => { saveClients(clients) }, [clients])

  const filtered = clients
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) ||
                 c.email.toLowerCase().includes(search.toLowerCase()) ||
                 c.notes.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'age') return a.savedInputs.currentAge - b.savedInputs.currentAge
      if (sortKey === 'balance') return b.savedInputs.initialBalance - a.savedInputs.initialBalance
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    })

  function openNew() {
    setForm(EMPTY_CLIENT)
    setEditingId('new')
  }

  function openEdit(c: CRMClient) {
    setForm({ name: c.name, email: c.email, phone: c.phone, notes: c.notes })
    setEditingId(c.id)
  }

  function saveSnapshot() {
    if (!form.name.trim()) return
    const now = new Date().toISOString()
    if (editingId === 'new') {
      const newClient: CRMClient = {
        id: crypto.randomUUID(),
        ...form,
        lastUpdated: now,
        savedInputs: { ...currentInputs },
        savedDistInputs: { ...currentDistInputs },
      }
      setClients(prev => [newClient, ...prev])
    } else if (editingId) {
      setClients(prev => prev.map(c => c.id === editingId
        ? { ...c, ...form, lastUpdated: now, savedInputs: { ...currentInputs }, savedDistInputs: { ...currentDistInputs } }
        : c
      ))
    }
    setEditingId(null)
  }

  function deleteClient(id: string) {
    setClients(prev => prev.filter(c => c.id !== id))
    setConfirmDelete(null)
  }

  const TH: React.CSSProperties = {
    padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap',
    userSelect: 'none',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Client Manager</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''} saved · Click a row to load into the calculator
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Search clients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...INPUT_STYLE, width: 200 }}
          />
          <button onClick={openNew} style={BTN('green')}>+ Add Client</button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {editingId && (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            {editingId === 'new' ? 'New Client' : 'Edit Client'}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10, fontWeight: 400 }}>
              Saves current calculator inputs as a snapshot
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {([
              ['Name *', 'name', 'text'],
              ['Email', 'email', 'email'],
              ['Phone', 'phone', 'tel'],
            ] as [string, keyof typeof form, string][]).map(([label, key, type]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                style={{ ...INPUT_STYLE, resize: 'vertical' }}
                onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>
          <div style={{
            marginTop: 12, padding: '10px 12px', background: 'var(--bg-card)',
            borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7,
          }}>
            Snapshot: Age {currentInputs.currentAge} · {fmtFull(currentInputs.initialBalance)} IRA ·
            {fmtPct(currentInputs.federalTaxRate)} federal ·
            {fmtPct(currentInputs.growthRate)} growth ·
            {fmtFull(currentDistInputs.monthlyDistribution)}/mo distribution
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={saveSnapshot} style={BTN('blue')}>
              {editingId === 'new' ? 'Save Client' : 'Update Snapshot'}
            </button>
            <button onClick={() => setEditingId(null)} style={BTN('ghost')}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          color: 'var(--text-muted)', fontSize: 13,
        }}>
          {clients.length === 0
            ? 'No clients yet. Click "Add Client" to save the current calculator inputs for a client.'
            : 'No clients match your search.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {([['Name', 'name'], ['Age', 'age'], ['IRA Balance', 'balance'], ['Tax Rate', null], ['Monthly Dist.', null], ['Growth', null], ['Last Updated', 'lastUpdated'], ['', null]] as [string, any][]).map(([label, key]) => (
                  <th
                    key={label}
                    style={{ ...TH, color: key === sortKey ? 'var(--blue-light)' : 'var(--text-secondary)' }}
                    onClick={() => key && setSortKey(key)}
                  >
                    {label}{key === sortKey ? ' ↓' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,179,237,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => onLoadClient(c.savedInputs, c.savedDistInputs)}
                  title="Click to load this client's inputs into the calculator"
                >
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div>{c.name}</div>
                    {c.email && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{c.email}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{c.savedInputs.currentAge}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--blue-light)', fontFamily: 'var(--font-mono)' }}>{fmtFull(c.savedInputs.initialBalance)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{fmtPct(c.savedInputs.federalTaxRate)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--green-light)', fontFamily: 'var(--font-mono)' }}>{fmtFull(c.savedDistInputs.monthlyDistribution)}/mo</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{fmtPct(c.savedInputs.growthRate)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(c.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(c)} style={{ ...BTN('ghost'), padding: '4px 8px', fontSize: 11 }}>Edit</button>
                      {confirmDelete === c.id ? (
                        <>
                          <button onClick={() => deleteClient(c.id)} style={{ ...BTN('red'), padding: '4px 8px', fontSize: 11 }}>Confirm</button>
                          <button onClick={() => setConfirmDelete(null)} style={{ ...BTN('ghost'), padding: '4px 8px', fontSize: 11 }}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(c.id)} style={{ ...BTN('ghost'), padding: '4px 8px', fontSize: 11, color: 'var(--red)' }}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {clients.length > 0 && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
          Click any row to instantly load that client's saved inputs into the calculator. Use "Edit" to update their snapshot with the current settings.
        </p>
      )}
    </div>
  )
}
