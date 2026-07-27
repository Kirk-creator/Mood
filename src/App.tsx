import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { nextActivityColor } from './chartUtils'
import { CheckInForm } from './components/CheckInForm'
import { Dashboard } from './components/Dashboard'
import { HistoryList } from './components/HistoryList'
import { SettingsPanel } from './components/SettingsPanel'
import { useCheckIns, useSettings } from './hooks/useCheckIns'
import { isSupabaseConfigured } from './lib/env'
import './App.css'

type View = 'checkin' | 'trends' | 'history' | 'settings'

const NAV_ITEMS = [
  { id: 'checkin' as const, label: 'Check-in' },
  { id: 'trends' as const, label: 'Trends' },
  { id: 'history' as const, label: 'History' },
  { id: 'settings' as const, label: 'Settings' },
]

export default function App() {
  const {
    checkIns,
    ready,
    add,
    update,
    remove,
    cloudSync,
    cloudError,
    retrySync,
  } = useCheckIns()
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
          activities: [
            ...cat.activities,
            { id, label: trimmed, color: nextActivityColor(cat.activities.length) },
          ],
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
        {cloudSync === 'error' && (
          <div className="sync-banner" role="alert">
            <div>
              <p className="sync-banner-title">Cloud sync is not working</p>
              <p className="sync-banner-body">
                {cloudError ??
                  'Could not reach Supabase. Your check-ins are still saved in this browser only.'}
              </p>
            </div>
            <button type="button" className="sync-banner-retry" onClick={retrySync}>
              Retry sync
            </button>
          </div>
        )}
        {cloudSync === 'syncing' && (
          <div className="sync-banner is-info" role="status">
            <p className="sync-banner-body">
              Connecting to Supabase and uploading local check-ins…
            </p>
          </div>
        )}
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
        <p>
          {cloudSync === 'local-only' &&
            'Data stays in your browser via localStorage — nothing is uploaded.'}
          {cloudSync === 'syncing' && 'Uploading to Supabase…'}
          {cloudSync === 'synced' &&
            'Synced to Supabase; also cached in your browser.'}
          {cloudSync === 'error' &&
            'Cloud sync failed — check-ins remain in this browser until sync succeeds.'}
        </p>
        {isSupabaseConfigured() ? null : (
          <p className="site-footer-hint">
            Supabase keys were not baked into this build. Confirm Doppler syncs
            SUPABASE_URL + SUPABASE_ANON_KEY into the github-pages environment,
            then re-run deploy.
          </p>
        )}
      </footer>

      {renderNav('nav mobile-nav', 'Mobile')}
    </div>
  )
}
