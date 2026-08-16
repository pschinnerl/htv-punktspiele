import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'

function ProtectedRoute({ children }) {
  const { loading, istAngemeldet, istMF, user } = useAuth()

  if (loading) {
    return <div className="page">Lade …</div>
  }

  if (!istAngemeldet) {
    return <Login />
  }

  if (!istMF) {
    return (
      <div className="page">
        <h1>Kein Zugriff</h1>
        <p>
          Für {user?.email} ist keine Rolle hinterlegt. Bitte beim Vorstand
          melden, damit ein Eintrag unter „rollen“ angelegt wird.
        </p>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
