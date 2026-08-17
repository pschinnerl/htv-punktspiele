import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTeamAuswahl } from '../context/TeamContext'
import { VERSION_TEXT } from '../lib/version'

// Menüpunkte der Verwaltung. `nurVorstand` blendet Einträge für
// Mannschaftsführer aus.
const MENUE = [
  { pfad: '/', text: 'Übersicht', symbol: '🏠', exakt: true },
  { pfad: '/spieltage', text: 'Spieltage', symbol: '📅' },
  { pfad: '/spieler', text: 'Spieler', symbol: '👥' },
  { pfad: '/tabelle', text: 'Tabelle', symbol: '🏆' },
  { pfad: '/teams', text: 'Teams', symbol: '⚙️' },
  { pfad: '/rollen', text: 'Zugänge', symbol: '🔑', nurVorstand: true },
  { pfad: '/hilfe', text: 'Hilfe', symbol: '❓' },
  { pfad: '/datenschutz', text: 'Datenschutz', symbol: '🔒' },
]

function Seitenleiste({ offen, onSchliessen }) {
  const { user, istVorstand, logout } = useAuth()
  const { teams, teamId, setTeamId, teamsLaden } = useTeamAuswahl()

  const eintraege = MENUE.filter((m) => !m.nurVorstand || istVorstand)

  return (
    <>
      {offen && <div className="seitenleiste-overlay" onClick={onSchliessen} />}

      <nav
        className={'seitenleiste' + (offen ? ' seitenleiste--offen' : '')}
        aria-label="Hauptmenü"
      >
        <div className="seitenleiste__team">
          <label className="field">
            <span>Mannschaft</span>
            <select
              value={teamId || ''}
              onChange={(e) => setTeamId(e.target.value || null)}
              disabled={teamsLaden || teams.length === 0}
            >
              {teams.length === 0 && <option value="">– noch keine Teams –</option>}
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ul className="seitenleiste__menue">
          {eintraege.map((m) => (
            <li key={m.pfad}>
              <NavLink
                to={m.pfad}
                end={m.exakt}
                className={({ isActive }) =>
                  'seitenleiste__link' + (isActive ? ' seitenleiste__link--aktiv' : '')
                }
                onClick={onSchliessen}
              >
                <span aria-hidden="true">{m.symbol}</span>
                {m.text}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="seitenleiste__fuss">
          <span className="hint">
            {user?.email}
            <br />
            {istVorstand ? 'Vorstand' : 'Mannschaftsführer'}
          </span>
          <button type="button" className="btn btn--secondary btn--klein" onClick={logout}>
            Abmelden
          </button>
          <span className="seitenleiste__version">{VERSION_TEXT}</span>
        </div>
      </nav>
    </>
  )
}

export default Seitenleiste
