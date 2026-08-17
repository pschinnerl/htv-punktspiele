import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import logo from '../assets/htv-logo.jpeg'
import Seitenleiste from './Seitenleiste'
import { TeamProvider } from '../context/TeamContext'

// Grundgerüst der Verwaltung: Seitenleiste am Desktop dauerhaft sichtbar,
// am Handy über den Menü-Knopf ein- und ausklappbar.
function VerwaltungLayout({ children }) {
  const [menueOffen, setMenueOffen] = useState(false)
  const { pathname } = useLocation()

  // Nach einem Seitenwechsel das Menü am Handy wieder schließen.
  useEffect(() => {
    setMenueOffen(false)
  }, [pathname])

  return (
    <TeamProvider>
      <div className="app-shell app-shell--verwaltung">
        <header className="app-header">
          <button
            type="button"
            className="menue-knopf"
            aria-label={menueOffen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={menueOffen}
            onClick={() => setMenueOffen((o) => !o)}
          >
            {menueOffen ? '✕' : '☰'}
          </button>
          <img src={logo} alt="HTV Helmstedt" className="app-header__logo" />
          <span className="app-header__title">HTV Punktspiele</span>
        </header>

        <div className="app-body">
          <Seitenleiste offen={menueOffen} onSchliessen={() => setMenueOffen(false)} />
          <main className="app-main app-main--verwaltung">{children}</main>
        </div>
      </div>
    </TeamProvider>
  )
}

export default VerwaltungLayout
