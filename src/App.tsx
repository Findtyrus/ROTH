import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_INPUTS } from './engine/types'
import type { PlanInputs, ProjectionResults, MonteCarloResults } from './engine/types'
import { runProjection } from './engine/calculator'
import { runMonteCarlo } from './engine/monteCarlo'
import { ControlPanel } from './components/ControlPanel'
import { Dashboard } from './components/Dashboard'

export default function App() {
  const [inputs, setInputs] = useState<PlanInputs>(DEFAULT_INPUTS)
  const [results, setResults] = useState<ProjectionResults>(() => runProjection(DEFAULT_INPUTS))
  const [mcResults, setMcResults] = useState<MonteCarloResults | null>(null)
  const [mcLoading, setMcLoading] = useState(false)

  useEffect(() => {
    setResults(runProjection(inputs))
    setMcResults(null)
  }, [inputs])

  const runMC = useCallback(() => {
    setMcLoading(true)
    setMcResults(null)
    // Defer to next tick so the loading state renders first
    setTimeout(() => {
      try {
        const mc = runMonteCarlo(inputs, 1000, 0.12)
        setMcResults(mc)
      } finally {
        setMcLoading(false)
      }
    }, 20)
  }, [inputs])

  // Auto-run Monte Carlo when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(runMC, 300)
    return () => clearTimeout(timer)
  }, [runMC])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gridTemplateRows: '1fr',
      gap: 0,
    }}>
      {/* Left sidebar */}
      <aside style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        padding: 16,
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
      }}>
        <ControlPanel inputs={inputs} onChange={setInputs} />
      </aside>

      {/* Main content */}
      <main style={{
        padding: '24px 28px',
        overflowY: 'auto',
        height: '100vh',
      }}>
        <Dashboard results={results} mcResults={mcResults} mcLoading={mcLoading} />
      </main>
    </div>
  )
}
