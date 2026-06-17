import React from 'react'
import type { ProjectionResults } from '../../engine/types'
import { exportToPDF, exportToCSV } from '../../utils/pdfExport'

interface Props { results: ProjectionResults }

export function ExportButtons({ results }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => exportToCSV(results)}
        style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
          padding: '7px 14px', fontSize: 12, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--blue-light)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)' }}
      >
        ↓ CSV
      </button>
      <button
        onClick={() => exportToPDF(results)}
        style={{
          background: 'var(--blue-dim)', border: '1px solid var(--blue)',
          borderRadius: 'var(--radius-sm)', color: 'var(--blue-light)',
          padding: '7px 14px', fontSize: 12, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.25)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue-dim)' }}
      >
        ↓ PDF Report
      </button>
    </div>
  )
}
