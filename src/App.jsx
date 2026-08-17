import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import VerwaltungLayout from './components/VerwaltungLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import Uebersicht from './pages/Uebersicht'
import SpieltageSeite from './pages/SpieltageSeite'
import SpielerVerwaltung from './pages/SpielerVerwaltung'
import TabelleSeite from './pages/TabelleSeite'
import TeamsSeite from './pages/TeamsSeite'
import Rollen from './pages/Rollen'
import Hilfe from './pages/Hilfe'
import Datenschutz from './pages/Datenschutz'
import Spieler from './pages/Spieler'
import NotFound from './pages/NotFound'
import './App.css'

// Die Verwaltung liegt hinter der Anmeldung und bekommt die Seitenleiste;
// Spieler-Ansicht und Datenschutzhinweis bleiben schlank und öffentlich.
function VerwaltungBereich() {
  return (
    <ProtectedRoute>
      <VerwaltungLayout>
        <Routes>
          <Route path="/" element={<Uebersicht />} />
          <Route path="/spieltage" element={<SpieltageSeite />} />
          <Route path="/spieler" element={<SpielerVerwaltung />} />
          <Route path="/tabelle" element={<TabelleSeite />} />
          <Route path="/teams" element={<TeamsSeite />} />
          <Route path="/rollen" element={<Rollen />} />
          <Route path="/hilfe" element={<Hilfe />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </VerwaltungLayout>
    </ProtectedRoute>
  )
}

// Der Datenschutzhinweis ist für alle erreichbar – auch für Spieler, die nur
// ihren Link haben. Angemeldete Mannschaftsführer und Vorstandsmitglieder
// sehen ihn mit der gewohnten Seitenleiste, alle anderen schlank mit einem
// Zurück-Knopf, damit die Seite keine Sackgasse ist.
function DatenschutzSeite() {
  const { loading, istAngemeldet, istMF } = useAuth()

  if (loading) {
    return (
      <Layout>
        <div className="page">Lade …</div>
      </Layout>
    )
  }

  if (istAngemeldet && istMF) {
    return (
      <VerwaltungLayout>
        <Datenschutz />
      </VerwaltungLayout>
    )
  }

  return (
    <Layout>
      <Datenschutz mitZurueck />
    </Layout>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/s/:token"
        element={
          <Layout>
            <Spieler />
          </Layout>
        }
      />
      <Route path="/datenschutz" element={<DatenschutzSeite />} />
      <Route path="/*" element={<VerwaltungBereich />} />
    </Routes>
  )
}

export default App
