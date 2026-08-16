import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Verwaltung from './pages/Verwaltung'
import Spieler from './pages/Spieler'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Verwaltung />} />
        <Route path="/s/:token" element={<Spieler />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

export default App
