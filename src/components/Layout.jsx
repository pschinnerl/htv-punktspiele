import logo from '../assets/htv-logo.jpeg'

function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <img src={logo} alt="HTV Helmstedt" className="app-header__logo" />
        <span className="app-header__title">HTV Punktspiele</span>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}

export default Layout
