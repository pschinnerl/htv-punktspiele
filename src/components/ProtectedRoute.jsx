import { useAuth } from '../context/AuthContext'
import Layout from './Layout'
import Login from '../pages/Login'

// Schützt die Verwaltung. Anmeldung und Hinweise bekommen das schlichte
// Grundgerüst (mit Kopfzeile), die Seitenleiste erscheint erst nach der
// erfolgreichen Anmeldung.
function ProtectedRoute({ children }) {
  const { loading, istAngemeldet, istMF, user } = useAuth()

  if (loading) {
    return (
      <Layout>
        <div className="page">Lade …</div>
      </Layout>
    )
  }

  if (!istAngemeldet) {
    return (
      <Layout>
        <Login />
      </Layout>
    )
  }

  if (!istMF) {
    return (
      <Layout>
        <div className="page">
          <h1>Kein Zugriff</h1>
          <p>
            Für {user?.email} ist keine Rolle hinterlegt. Bitte beim Vorstand melden, damit
            unter „Zugänge“ ein Eintrag angelegt wird.
          </p>
        </div>
      </Layout>
    )
  }

  return children
}

export default ProtectedRoute
