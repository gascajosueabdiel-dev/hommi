// src/components/Footer.jsx
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { isAuthenticated } from '../services/authService';
import './Footer.css';

function Footer() {
  const sesionActiva = isAuthenticated();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <Logo size={22} />
            <span>HOMMI</span>
          </Link>
          <p>
            Plataforma para que estudiantes foráneos encuentren y comparen
            alojamientos en Querétaro.
          </p>
        </div>

        <nav className="footer-col" aria-label="Enlaces del sitio">
          <h2>Explorar</h2>
          <Link to="/alojamientos">Alojamientos</Link>
          {!sesionActiva && <Link to="/login">Iniciar sesión</Link>}
          {!sesionActiva && <Link to="/registro">Crear cuenta</Link>}
        </nav>

        <div className="footer-col">
          <h2>Proyecto Académico</h2>
          <p>Gestión de Proyectos de Software</p>
          <p>Instituto Tecnológico de Querétaro</p>
        </div>
      </div>

      <p className="footer-legal">© 2026 HOMMI — Arrendamientos para estudiantes</p>
    </footer>
  );
}

export default Footer;
