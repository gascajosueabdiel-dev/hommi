// src/components/Navbar.jsx
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logoutUser, getStoredUser } from '../services/authService';
import Logo from './Logo';
import Avatar from './Avatar';
import './Navbar.css';

function Navbar() {
  const navigate  = useNavigate();
  const user      = getStoredUser();

  function handleLogout() {
    logoutUser();
    navigate('/login');
  }

  const claseLink = ({ isActive }) =>
    `navbar-link ${isActive ? 'navbar-link--active' : ''}`;

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <Link to="/" className="navbar-brand">
        <Logo size={22} className="navbar-brand-icon" />
        <span className="navbar-brand-name">HOMMI</span>
      </Link>

      <div className="navbar-right">
        <NavLink to="/alojamientos" className={claseLink}>
          Explorar
        </NavLink>
        {user?.rol === 'arrendador' && (
          <NavLink to="/mi-panel" className={claseLink}>
            Mi panel
          </NavLink>
        )}

        {user ? (
          <>
            <Avatar nombre={user.nombre} email={user.email} size={34} />
            <span className="navbar-username">{user.nombre || user.email}</span>
            <button className="navbar-logout" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-login-btn">Iniciar sesión</Link>
            <Link to="/registro" className="navbar-register-btn">Regístrate</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
