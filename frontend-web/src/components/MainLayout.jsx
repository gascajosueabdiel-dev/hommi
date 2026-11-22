// src/components/MainLayout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './MainLayout.css';

function MainLayout() {
  const { pathname } = useLocation();
  // Todas las pantallas (portada, catálogo, detalle, formularios, acceso y panel) ocupan todo el ancho; el resto de páginas van centradas.
  const anchoCompleto =
    ['/', '/alojamientos', '/publicar', '/login', '/registro', '/mi-panel'].includes(pathname) ||
    pathname.startsWith('/alojamiento/') ||
    pathname.startsWith('/editar/');

  return (
    <div className="layout">
      <Navbar />
      <main className={`layout-content ${anchoCompleto ? 'layout-content--wide' : ''}`}>
        <Outlet /> {/* aquí se renderiza la página actual */}
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
