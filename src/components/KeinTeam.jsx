import { Link } from 'react-router-dom'

// Hinweis, wenn noch keine Mannschaft ausgewählt bzw. angelegt ist.
function KeinTeam() {
  return (
    <div className="page">
      <h1>Keine Mannschaft ausgewählt</h1>
      <p>
        Bitte oben in der Seitenleiste eine Mannschaft auswählen – oder unter{' '}
        <Link to="/teams">Teams</Link> die erste Mannschaft anlegen.
      </p>
    </div>
  )
}

export default KeinTeam
