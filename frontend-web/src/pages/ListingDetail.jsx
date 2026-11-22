// src/pages/ListingDetail.jsx — detalle de un alojamiento
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getListingById } from '../services/listingsService';
import { getStoredUser, isAuthenticated } from '../services/authService';
import {
  getFotos, getServicios, getEstado, getClaseEstado, formatPrecio, whatsappUrl, puedeVerListing,
} from '../utils/listing';
import PhotoGallery from '../components/PhotoGallery';
import ListingMap from '../components/ListingMap';
import ListingReviews from '../components/ListingReviews';
import Avatar from '../components/Avatar';
import { ListingCardSkeleton } from '../components/ListingCard';
import './ListingDetail.css';

// Parte visual. estado: 'cargando' | 'invitado' | 'error' | 'ok'
export function DetailView({ estado, listing, mensajeError, usuario }) {
  const esAdmin = usuario?.rol === 'administrador';
  const esDueno =
    usuario?.rol === 'arrendador' &&
    listing &&
    String(usuario.perfilId) === String(listing.arrendador_id);

  const volverA = esDueno ? '/mi-panel' : '/alojamientos';
  const volverTexto = esDueno ? '← Volver a mi panel' : '← Volver al catálogo';

  let contenido;

  if (estado === 'cargando') {
    contenido = (
      <div className="detail-grid" aria-busy="true">
        <div className="detail-main">
          <ListingCardSkeleton />
        </div>
        <aside className="detail-side">
          <ListingCardSkeleton />
        </aside>
      </div>
    );
  } else if (estado === 'invitado') {
    contenido = (
      <div className="detail-notice">
        <div className="detail-notice-icon">🔒</div>
        <h1>Acceso restringido</h1>
        <p>Para ver las fotos, la ubicación y el contacto del arrendador necesitas iniciar sesión.</p>
        <div className="detail-notice-actions">
          <Link to="/login" className="detail-btn detail-btn--primary">Iniciar sesión</Link>
          <Link to="/registro" className="detail-btn detail-btn--ghost">Crear cuenta</Link>
        </div>
      </div>
    );
  } else if (estado === 'error') {
    const sesionCaducada = /sesi[oó]n|token|iniciar/i.test(mensajeError ?? '');
    contenido = (
      <div className="detail-notice">
        <div className="detail-notice-icon">⚠️</div>
        <h1>{sesionCaducada ? 'Tu sesión terminó' : 'No pudimos cargar el alojamiento'}</h1>
        <p>{mensajeError || 'Inténtalo de nuevo en unos momentos.'}</p>
        <div className="detail-notice-actions">
          {sesionCaducada && (
            <Link to="/login" className="detail-btn detail-btn--primary">Iniciar sesión</Link>
          )}
          <Link to="/alojamientos" className="detail-btn detail-btn--ghost">Volver al catálogo</Link>
        </div>
      </div>
    );
  } else {
    const fotos      = getFotos(listing);
    const servicios  = getServicios(listing);
    const disp       = getEstado(listing);
    const dueno      = listing.dueno ?? null;
    const usuarioDue = dueno?.Usuario ?? null;
    const telefono   = dueno?.telefono;
    const correo     = usuarioDue?.correo;
    const wa         = whatsappUrl(telefono, listing.direccion);
    const sinContacto = !wa && !correo;

    contenido = (
      <div className="detail-grid">
        {/* ───────── Columna principal ───────── */}
        <div className="detail-main">
          <PhotoGallery fotos={fotos} alt={`Alojamiento en ${listing.colonia}`} />

          <header className="detail-header">
            {disp && (
              <span className={`detail-badge detail-badge--${getClaseEstado(disp)}`}>{disp}</span>
            )}
            <h1 className="detail-title">{listing.direccion}</h1>
            <p className="detail-location">
              {listing.colonia}
              {listing.codigo_postal ? ` · C.P. ${listing.codigo_postal}` : ''} · Querétaro
            </p>
          </header>

          <section className="detail-section">
            <h2>Descripción</h2>
            <p className="detail-description">{listing.descripcion || 'El arrendador no agregó una descripción.'}</p>
          </section>

          <section className="detail-section">
            <h2>Servicios incluidos</h2>
            {servicios.length > 0 ? (
              <ul className="detail-tags">
                {servicios.map(nombre => <li key={nombre}>{nombre}</li>)}
              </ul>
            ) : (
              <p className="detail-muted">Sin servicios registrados.</p>
            )}
          </section>

          <section className="detail-section">
            <h2>Ubicación</h2>
            <ListingMap listing={listing} />
          </section>

          <section className="detail-section">
            <h2>Reseñas</h2>
            <ListingReviews alojamientoId={listing.id_alojamiento} usuario={usuario} />
          </section>
        </div>

        {/* ───────── Columna lateral fija ───────── */}
        <aside className="detail-side">
          <div className="detail-card">
            <p className="detail-card-label">Renta mensual</p>
            <p className="detail-price">
              {formatPrecio(listing.precio_mensual)} <span>/ mes</span>
            </p>

            <div className="detail-actions">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="detail-btn detail-btn--wa">
                  Escribir por WhatsApp
                </a>
              )}
              {correo && (
                <a href={`mailto:${correo}`} className="detail-btn detail-btn--ghost">
                  Enviar correo
                </a>
              )}
              {sinContacto && (
                <p className="detail-muted">El arrendador no registró datos de contacto.</p>
              )}
              {esDueno && (
                <Link
                  to={`/editar/${listing.id_alojamiento}`}
                  state={{ listing }}
                  className="detail-btn detail-btn--ghost"
                >
                  Editar publicación
                </Link>
              )}
            </div>
          </div>

          <div className="detail-card detail-owner">
            <Avatar nombre={usuarioDue?.nombre} email={correo} size={52} />
            <div>
              <p className="detail-owner-role">Propietario</p>
              <p className="detail-owner-name">{usuarioDue?.nombre ?? 'Arrendador'}</p>
              {dueno?.estado_verificacion === true && (
                <span className="detail-verified">✓ Perfil verificado</span>
              )}
            </div>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="detail">
      <div className="detail-container">
        {esAdmin && <div className="detail-admin-banner">🛡️ Panel de administrador</div>}
        {estado !== 'invitado' && (
          <Link to={volverA} className="detail-back">{volverTexto}</Link>
        )}
        {contenido}
      </div>
    </div>
  );
}

// El servicio entrega errores como "Error 403"; aquí se convierten en mensajes claros.
function traducirError(err) {
  const texto = String(err?.message ?? '');
  const codigo = Number((texto.match(/Error (\d{3})/) ?? [])[1]);
  if (codigo === 401 || codigo === 403 || /sesi[oó]n|token/i.test(texto)) {
    return 'Tu sesión expiró o ya no es válida. Inicia sesión de nuevo para ver este alojamiento.';
  }
  if (codigo === 404 || /no encontrado/i.test(texto)) {
    return 'Este alojamiento no existe o ya no está disponible.';
  }
  if (codigo >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.';
  if (/failed to fetch|network|load failed/i.test(texto)) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }
  return texto || 'No se pudo cargar el alojamiento.';
}

// Carga los datos. Va separado para que, al cambiar de alojamiento, el estado se reinicie.
function DetailLoader({ id }) {
  const sesion  = isAuthenticated();
  const usuario = getStoredUser();
  const [listing, setListing]   = useState(null);
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(sesion);

  useEffect(() => {
    if (!sesion) return;
    let activo = true;
    getListingById(id)
      .then(res => {
        if (!activo) return;
        const encontrado = res?.data ?? res;
        // Un alojamiento ocupado no se puede abrir (ni escribiendo la dirección) si no es tuyo
        if (!puedeVerListing(encontrado, getStoredUser())) {
          setError('Este alojamiento no está disponible por el momento.');
          return;
        }
        setListing(encontrado);
        setError('');
      })
      .catch(err => {
        if (activo) setError(traducirError(err));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, [id, sesion]);

  let estado = 'ok';
  if (!sesion) estado = 'invitado';
  else if (cargando) estado = 'cargando';
  else if (error || !listing) estado = 'error';

  return <DetailView estado={estado} listing={listing} mensajeError={error} usuario={usuario} />;
}

function ListingDetail() {
  const { id } = useParams();
  return <DetailLoader key={id} id={id} />;
}

export default ListingDetail;
