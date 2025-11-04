import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <Link to="/" className="navbar-logo">
          <span className="logo-text">
            🏆 <strong>CodeArena</strong> 💻⚡
          </span>
        </Link>

        {/* Menu Section */}
        <div className="navbar-menu">
          <Link to="/" className="nav-link">Contests</Link>

          {user ? (
            <>
              <Link to="/create-contest" className="nav-link">Create Contest</Link>
              <div className="user-section">
                <span className="username">{user.email}</span>
                <button onClick={onLogout} className="btn-logout">Log Out</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log In</Link>
              <Link to="/register" className="btn-register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar