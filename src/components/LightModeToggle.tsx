import React, { useEffect, useState } from 'react'

export function LightModeToggle() {
  const [light, setLight] = useState(() => {
    return localStorage.getItem('roth-theme') === 'light'
  })

  useEffect(() => {
    if (light) {
      document.documentElement.classList.add('light')
      localStorage.setItem('roth-theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('roth-theme', 'dark')
    }
  }, [light])

  // Apply saved theme on first mount
  useEffect(() => {
    if (localStorage.getItem('roth-theme') === 'light') {
      document.documentElement.classList.add('light')
    }
  }, [])

  return (
    <button
      onClick={() => setLight(l => !l)}
      title={light ? 'Switch to dark mode' : 'Switch to light mode'}
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
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {light ? '🌙' : '☀️'}
    </button>
  )
}
