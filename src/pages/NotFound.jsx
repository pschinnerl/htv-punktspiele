import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="page">
      <h1>Seite nicht gefunden</h1>
      <p>
        <Link to="/">Zurück zur Startseite</Link>
      </p>
    </div>
  )
}

export default NotFound
