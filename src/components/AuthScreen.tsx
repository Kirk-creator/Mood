import { useEffect, useState, type FormEvent } from 'react'

type Mode = 'login' | 'signup' | 'forgot' | 'reset'

interface AuthScreenProps {
  mode?: Mode
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
  onRequestReset: (
    email: string,
  ) => Promise<{ ok: boolean; message?: string }>
  onCompleteReset: (
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>
  message?: string | null
}

export function AuthScreen({
  mode: controlledMode,
  onSignIn,
  onSignUp,
  onRequestReset,
  onCompleteReset,
  message,
}: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>(controlledMode ?? 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    if (controlledMode) setMode(controlledMode)
  }, [controlledMode])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLocalError(null)
    setInfo(null)

    setBusy(true)
    try {
      if (mode === 'forgot') {
        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
          setLocalError('Enter the email for your account.')
          return
        }
        const result = await onRequestReset(trimmedEmail)
        if (result.ok) {
          setInfo(result.message ?? 'Check your email for a reset link.')
          setMode('login')
        } else {
          setLocalError(result.message ?? 'Could not send reset email.')
        }
        return
      }

      if (mode === 'reset') {
        if (password.length < 6) {
          setLocalError('Use a password of at least 6 characters.')
          return
        }
        if (password !== confirmPassword) {
          setLocalError('Passwords do not match.')
          return
        }
        const result = await onCompleteReset(password)
        if (!result.ok) {
          setLocalError(result.message ?? 'Could not update password.')
        }
        return
      }

      const trimmedEmail = email.trim()
      if (!trimmedEmail || password.length < 6) {
        setLocalError('Enter an email and a password of at least 6 characters.')
        return
      }

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
  const title =
    mode === 'login'
      ? 'Welcome back'
      : mode === 'signup'
        ? 'Create your space'
        : mode === 'forgot'
          ? 'Reset your password'
          : 'Choose a new password'

  const copy =
    mode === 'login'
      ? 'Log in to pull your mood, activities, and history from Supabase.'
      : mode === 'signup'
        ? 'Sign up to save check-ins to your account and open them on any device.'
        : mode === 'forgot'
          ? 'We’ll email you a link to set a new password.'
          : 'Enter a new password for your Pulse account.'

  const submitLabel =
    mode === 'login'
      ? 'Log in'
      : mode === 'signup'
        ? 'Sign up'
        : mode === 'forgot'
          ? 'Send reset link'
          : 'Update password'

  return (
    <div className="auth-screen">
      <div className="auth-ambient" aria-hidden />
      <div className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden />
          <p className="brand-name">Pulse</p>
        </div>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-copy">{copy}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode !== 'reset' && (
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
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
            <label className="auth-field">
              <span>{mode === 'reset' ? 'New password' : 'Password'}</span>
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
          )}

          {mode === 'reset' && (
            <label className="auth-field">
              <span>Confirm password</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
          )}

          {mode === 'login' && (
            <div className="auth-forgot-row">
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setMode('forgot')
                  setLocalError(null)
                  setInfo(null)
                  setPassword('')
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

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
            {busy ? 'Please wait…' : submitLabel}
          </button>
        </form>

        {mode !== 'reset' && (
          <p className="auth-switch">
            {mode === 'login' && (
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
            )}
            {mode === 'signup' && (
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
            {mode === 'forgot' && (
              <>
                Remembered it?{' '}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => {
                    setMode('login')
                    setLocalError(null)
                    setInfo(null)
                  }}
                >
                  Back to log in
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
