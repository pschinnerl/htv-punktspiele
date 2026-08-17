import { Link } from 'react-router-dom'
import logo from '../assets/htv-logo.jpeg'

// Schlichtes Grundgerüst ohne Seitenleiste – für die Spieler-Ansicht,
// die Anmeldung und öffentliche Seiten wie den Datenschutzhinweis.
function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <img src={logo} alt="HTV Helmstedt" className="app-header__logo" />
        <span className="app-header__title">HTV Punktspiele</span>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-fuss">
        <Link to="/datenschutz">Datenschutz</Link>
      </footer>
    </div>
  )
}

export default Layout
