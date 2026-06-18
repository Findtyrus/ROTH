import React, { useEffect, useState } from 'react'

export function LightModeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('roth-theme') === 'dark'
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('roth-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('roth-theme', 'light')
    }
  }, [dark])

  useEffect(() => {
    if (localStorage.getItem('roth-theme') === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <button
      onClick={() => setDark(d => !d)}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-secondary)',
        padding: '6px 10px',
        fontSize: 14,
        lineHeight: 1,
        transition: 'all 0.15s',
        cursor: 'pointer',
      }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
