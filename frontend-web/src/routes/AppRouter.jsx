// src/routes/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getStoredUser, isAuthenticated, getHomePath } from '../services/authService';
import MainLayout     from '../components/MainLayout';
import Home           from '../pages/Home';
import Login          from '../pages/Login';
import Register       from '../pages/Register';
import Listings       from '../pages/Listings';
import ListingDetail  from '../pages/ListingDetail';
import LandlordPanel  from '../pages/LandlordPanel';
import PublishListing from '../pages/PublishListing';
import EditListing    from '../pages/EditListing';

function PrivateRoute({ children, soloRol }) {
  if (!isAuthenticated()) {
    // Si el token había expirado, authService dejó una marca y el Login
    // mostrará el aviso de sesión expirada.
    return <Navigate to="/login" replace />;
  }

  const user = getStoredUser();

  // Si la ruta exige un rol específico y el usuario no lo tiene, lo manda a su página de inicio
  if (soloRol && user?.rol !== soloRol) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return children;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Rutas públicas sin layout (Auth) ── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/registro" element={<Register />} />

        {/* ── Rutas con layout compartido ── */}
        <Route element={<MainLayout />}>
          
          {/* Portada: la ven todos (visitantes y usuarios con sesión) */}
          <Route path="/" element={<Home />} />

          {/* 🟢 Catálogo e Info - Usado por Estudiantes, Invitados y Administradores */}
          <Route path="/alojamientos"    element={<Listings />} />
          <Route path="/alojamiento/:id" element={<ListingDetail />} />

          {/* 🏠 Solo Arrendadores (Gestión propia) ── */}
          <Route path="/mi-panel" element={
            <PrivateRoute soloRol="arrendador">
              <LandlordPanel />
            </PrivateRoute>
          } />
          <Route path="/publicar" element={
            <PrivateRoute soloRol="arrendador">
              <PublishListing />
            </PrivateRoute>
          } />
          <Route path="/editar/:id" element={
            <PrivateRoute soloRol="arrendador">
              <EditListing />
            </PrivateRoute>
          } />

          {/* El rol "administrador" ya no tiene rutas exclusivas aquí. */}
          {/* Entra de forma pública a los componentes superiores donde lee sus variables 'esAdmin' */}

        </Route>

        {/* Cualquier URL desconocida regresa al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
