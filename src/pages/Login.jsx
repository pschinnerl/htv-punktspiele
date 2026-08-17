import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'

function fehlertext(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Die E-Mail-Adresse ist ungültig.'
    case 'auth/user-disabled':
      return 'Dieses Konto wurde deaktiviert.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-Mail oder Passwort ist falsch.'
    case 'auth/too-many-requests':
      return 'Zu viele Versuche. Bitte kurz warten und erneut probieren.'
    case 'auth/network-request-failed':
      return 'Keine Verbindung möglich. Bitte Internetverbindung prüfen.'
    default:
      return 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.'
  }
}

function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [fehler, setFehler] = useState(null)
  const [hinweis, setHinweis] = useState(null)
  const [ladevorgang, setLadevorgang] = useState(false)

  async function absenden(e) {
    e.preventDefault()
    setFehler(null)
    setHinweis(null)
    setLadevorgang(true)
    try {
      await login(email.trim(), passwort)
    } catch (err) {
      setFehler(fehlertext(err.code))
    } finally {
      setLadevorgang(false)
    }
  }

  async function passwortVergessen() {
    setFehler(null)
    setHinweis(null)
    const adresse = email.trim()
    if (!adresse) {
      setFehler('Bitte zuerst die E-Mail-Adresse eintragen, dann auf „Passwort vergessen“ klicken.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, adresse)
      setHinweis(
        `Eine E-Mail zum Zurücksetzen des Passworts wurde an ${adresse} geschickt. ` +
          'Bitte auch den Spam-Ordner prüfen.',
      )
    } catch (err) {
      setFehler(fehlertext(err.code))
    }
  }

  return (
    <div className="page page--login">
      <h1>Anmeldung</h1>
      <p className="hint">Für Mannschaftsführer und Vorstand.</p>

      <form className="login-form" onSubmit={absenden}>
        <label className="field">
          <span>E-Mail</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Passwort</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
          />
        </label>

        {fehler && <p className="form-error">{fehler}</p>}
        {hinweis && <p className="hint">{hinweis}</p>}

        <button type="submit" className="btn btn--primary" disabled={ladevorgang}>
          {ladevorgang ? 'Anmelden …' : 'Anmelden'}
        </button>

        <button type="button" className="btn-link" onClick={passwortVergessen}>
          Passwort vergessen?
        </button>
      </form>
    </div>
  )
}

export default Login
