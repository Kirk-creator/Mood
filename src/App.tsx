import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CheckInForm } from './components/CheckInForm'
import { Dashboard } from './components/Dashboard'
import { HistoryList } from './components/HistoryList'
import { SettingsPanel } from './components/SettingsPanel'
import { useCheckIns, useSettings } from './hooks/useCheckIns'
import './App.css'

type View = 'checkin' | 'trends' | 'history' | 'settings'

const NAV_ITEMS = [
  { id: 'checkin' as const, label: 'Check-in' },
  { id: 'trends' as const, label: 'Trends' },
  { id: 'history' as const, label: 'History' },
  { id: 'settings' as const, label: 'Settings' },
]

export default function App() {
  const { checkIns, ready, add, update, remove } = useCheckIns()
  const { settings, updateSettings } = useSettings()
  const [view, setView] = useState<View>('checkin')

  const addActivity = useCallback(
    (categoryId: string, label: string): string | null => {
      const trimmed = label.trim()
      if (!trimmed) return null
      const id = uuidv4()
      const nextCategories = settings.categories.map((cat) => {
        if (cat.id !== categoryId) return cat
        if (
          cat.activities.some(
            (a) => a.label.trim().toLowerCase() === trimmed.toLowerCase(),
          )
        ) {
          return cat
        }
        return {
          ...cat,
          activities: [...cat.activities, { id, label: trimmed }],
        }
      })
      const target = nextCategories.find((c) => c.id === categoryId)
      const created = target?.activities.find((a) => a.id === id)
      if (!created) {
        // Duplicate label — return existing id if present
        const existing = settings.categories
          .find((c) => c.id === categoryId)
          ?.activities.find(
            (a) => a.label.trim().toLowerCase() === trimmed.toLowerCase(),
          )
        return existing?.id ?? null
      }
      updateSettings({ categories: nextCategories })
      return id
    },
    [settings.categories, updateSettings],
  )

  function renderNav(className: string, ariaLabel: string) {
    return (
      <nav className={className} aria-label={ariaLabel}>
        {NAV_ITEMS.map(({ id, label }) => (
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
    )
  }

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
        {renderNav('nav desktop-nav', 'Primary')}
        <p className="header-meta">
          {ready ? `${checkIns.length} saved` : 'Loading…'}
        </p>
      </header>

      <main className="main">
        {view === 'checkin' && (
          <CheckInForm
            categories={settings.categories}
            onSubmit={add}
            onAddActivity={addActivity}
          />
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
            onAddActivity={addActivity}
          />
        )}
        {view === 'settings' && (
          <SettingsPanel settings={settings} onChange={updateSettings} />
        )}
      </main>

      <footer className="site-footer">
        <p>Data stays in your browser via localStorage — nothing is uploaded.</p>
      </footer>

      {renderNav('nav mobile-nav', 'Mobile')}
    </div>
  )
}
