import { useState } from 'react'
import { CheckInForm } from './components/CheckInForm'
import { Dashboard } from './components/Dashboard'
import { HistoryList } from './components/HistoryList'
import { SettingsPanel } from './components/SettingsPanel'
import { useCheckIns, useSettings } from './hooks/useCheckIns'
import './App.css'

type View = 'checkin' | 'trends' | 'history' | 'settings'

export default function App() {
  const { checkIns, ready, add, update, remove } = useCheckIns()
  const { settings, updateSettings } = useSettings()
  const [view, setView] = useState<View>('checkin')

  return (
    <div className="app">
      <div className="ambient" aria-hidden />
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <p className="brand-name">Pulse</p>
            <p className="brand-tag">Mood · activity · health</p>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          {(
            [
              ['checkin', 'Check-in'],
              ['trends', 'Trends'],
              ['history', 'History'],
              ['settings', 'Settings'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`nav-link ${view === id ? 'is-active' : ''}`}
              onClick={() => setView(id)}
              aria-current={view === id ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>
        <p className="header-meta">
          {ready ? `${checkIns.length} saved` : 'Loading…'}
        </p>
      </header>

      <main className="main">
        {view === 'checkin' && (
          <CheckInForm categories={settings.categories} onSubmit={add} />
        )}
        {view === 'trends' && (
          <Dashboard checkIns={checkIns} categories={settings.categories} />
        )}
        {view === 'history' && (
          <HistoryList
            checkIns={checkIns}
            categories={settings.categories}
            onUpdate={update}
            onDelete={remove}
          />
        )}
        {view === 'settings' && (
          <SettingsPanel settings={settings} onChange={updateSettings} />
        )}
      </main>

      <footer className="site-footer">
        <p>Data stays in your browser via localStorage — nothing is uploaded.</p>
      </footer>
    </div>
  )
}
