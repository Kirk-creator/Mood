import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { nextActivityColor } from './chartUtils'
import { AuthScreen } from './components/AuthScreen'
import { CheckInForm } from './components/CheckInForm'
import { Dashboard } from './components/Dashboard'
import { HistoryList } from './components/HistoryList'
import { SettingsPanel } from './components/SettingsPanel'
import { useAuth } from './hooks/useAuth'
import { useCheckIns } from './hooks/useCheckIns'
import { clearAccountCache } from './lib/cloudSync'
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
    configured,
    status,
    user,
    authMessage,
    passwordRecovery,
    signIn,
    signUp,
    requestReset,
    completePasswordReset,
    logOut,
  } = useAuth()
  const userId = user?.id ?? null
  const {
    checkIns,
    settings,
    ready,
    add,
    update,
    remove,
    updateSettings,
    cloudSync,
    cloudError,
    retrySync,
  } = useCheckIns(
    configured && status === 'signed-in' && !passwordRecovery ? userId : null,
  )
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

  async function handleLogOut() {
    clearAccountCache()
    await logOut()
    setView('checkin')
  }

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

  if (configured && status === 'loading') {
    return (
      <div className="app">
        <div className="ambient" aria-hidden />
        <p className="auth-loading">Checking your session…</p>
      </div>
    )
  }

  if (configured && (status === 'signed-out' || passwordRecovery)) {
    return (
      <AuthScreen
        mode={passwordRecovery ? 'reset' : undefined}
        onSignIn={signIn}
        onSignUp={signUp}
        onRequestReset={requestReset}
        onCompleteReset={completePasswordReset}
        message={authMessage}
      />
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
        <div className="header-meta-block">
          <p className="header-meta">
            {ready ? `${checkIns.length} saved` : 'Loading…'}
          </p>
          {user?.email && (
            <p className="header-user" title={user.email}>
              {user.email}
            </p>
          )}
          {configured && (
            <button
              type="button"
              className="btn btn-ghost btn-sm header-logout"
              onClick={() => void handleLogOut()}
            >
              Log out
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {cloudSync === 'error' && (
          <div className="sync-banner" role="alert">
            <div>
              <p className="sync-banner-title">Cloud sync is not working</p>
              <p className="sync-banner-body">
                {cloudError ??
                  'Could not reach Supabase. Showing cached data for this account when available.'}
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
              Loading your check-ins from Supabase…
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
          {cloudSync === 'idle' && 'Sign in to sync with Supabase.'}
          {cloudSync === 'syncing' && 'Loading your account data…'}
          {cloudSync === 'synced' &&
            'Signed in — your check-ins are loaded from Supabase and cached locally.'}
          {cloudSync === 'error' &&
            'Cloud sync failed — showing local cache for this account when available.'}
        </p>
      </footer>

      {renderNav('nav mobile-nav', 'Mobile')}
    </div>
  )
}
