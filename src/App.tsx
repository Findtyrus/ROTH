import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_INPUTS, DEFAULT_DIST_INPUTS } from './engine/types'
import type { PlanInputs, DistributionInputs, ProjectionResults, MonteCarloResults, DistYearData } from './engine/types'
import { runProjection } from './engine/calculator'
import { runMonteCarlo } from './engine/monteCarlo'
import { projectWithDistributions } from './engine/customDistCalc'
import { ControlPanel } from './components/ControlPanel'
import { Dashboard } from './components/Dashboard'

export default function App() {
  const [inputs, setInputs] = useState<PlanInputs>(DEFAULT_INPUTS)
  const [distInputs, setDistInputs] = useState<DistributionInputs>(DEFAULT_DIST_INPUTS)
  const [results, setResults] = useState<ProjectionResults>(() => runProjection(DEFAULT_INPUTS, DEFAULT_DIST_INPUTS))
  const [distData, setDistData] = useState<DistYearData[] | null>(null)
  const [mcResults, setMcResults] = useState<MonteCarloResults | null>(null)
  const [mcLoading, setMcLoading] = useState(false)

  useEffect(() => {
    setResults(runProjection(inputs, distInputs))
    setMcResults(null)
  }, [inputs, distInputs])

  useEffect(() => {
    if (distInputs.enabled) {
      setDistData(projectWithDistributions(inputs, distInputs))
    } else {
      setDistData(null)
    }
  }, [inputs, distInputs])

  const runMC = useCallback(() => {
    setMcLoading(true)
    setMcResults(null)
    setTimeout(() => {
      try {
        setMcResults(runMonteCarlo(inputs, 1000, 0.12))
      } finally {
        setMcLoading(false)
      }
    }, 20)
  }, [inputs])

  useEffect(() => {
    const t = setTimeout(runMC, 400)
    return () => clearTimeout(t)
  }, [runMC])

  function handleLoadClient(savedInputs: PlanInputs, savedDist: DistributionInputs) {
    setInputs(savedInputs)
    setDistInputs(savedDist)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: 0,
    }}>
      <aside style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        padding: 20,
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
      }}>
        <ControlPanel
          inputs={inputs}
          onChange={setInputs}
          distInputs={distInputs}
          onDistChange={setDistInputs}
        />
      </aside>

      <main style={{ padding: '28px 32px', overflowY: 'auto', height: '100vh' }}>
        <Dashboard
          results={results}
          mcResults={mcResults}
          mcLoading={mcLoading}
          distInputs={distInputs}
          distData={distData}
          onLoadClient={handleLoadClient}
          currentInputs={inputs}
        />
      </main>
    </div>
  )
}
