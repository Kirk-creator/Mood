import { useState, type FormEvent } from 'react'

type Mode = 'login' | 'signup'

interface AuthScreenProps {
  onSignIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>
  onSignUp: (
    email: string,
    password: string,
  ) => Promise<{
    ok: boolean
    message?: string
    needsConfirmation?: boolean
  }>
  message?: string | null
}

export function AuthScreen({
  onSignIn,
  onSignUp,
  message,
}: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLocalError(null)
    setInfo(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || password.length < 6) {
      setLocalError('Enter an email and a password of at least 6 characters.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'login') {
        const result = await onSignIn(trimmedEmail, password)
        if (!result.ok) setLocalError(result.message ?? 'Could not log in.')
      } else {
        const result = await onSignUp(trimmedEmail, password)
        if (result.ok) return
        if (result.needsConfirmation) {
          setInfo(result.message ?? 'Check your email to confirm your account.')
          setMode('login')
        } else {
          setLocalError(result.message ?? 'Could not create account.')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const notice = localError ?? info ?? message

  return (
    <div className="auth-screen">
      <div className="auth-ambient" aria-hidden />
      <div className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden />
          <p className="brand-name">Pulse</p>
        </div>
        <h1 className="auth-title">
          {mode === 'login' ? 'Welcome back' : 'Create your space'}
        </h1>
        <p className="auth-copy">
          {mode === 'login'
            ? 'Log in to pull your mood, activities, and history from Supabase.'
            : 'Sign up to save check-ins to your account and open them on any device.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          {notice && (
            <p
              className={`auth-notice ${localError ? 'is-error' : 'is-info'}`}
              role="status"
            >
              {notice}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={busy}
          >
            {busy
              ? 'Please wait…'
              : mode === 'login'
                ? 'Log in'
                : 'Sign up'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setMode('signup')
                  setLocalError(null)
                  setInfo(null)
                }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setMode('login')
                  setLocalError(null)
                  setInfo(null)
                }}
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
