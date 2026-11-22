// src/pages/LandlordPanel.jsx — panel del arrendador
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyListings, deleteListing, searchMyListings, updateDisponibilidad,
  getNotificaciones, marcarNotificacionesLeidas,
} from '../services/listingsService';
import { getStoredUser } from '../services/authService';
import { getEstado, getClaseEstado, getDisponibilidadId, DISPONIBILIDADES } from '../utils/listing';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import SearchFilters from '../components/SearchFilters';
import ConfirmDialog from '../components/ConfirmDialog';
import Avatar from '../components/Avatar';
import './LandlordPanel.css';

// Parte visual; recibe el estado y las acciones ya preparados.
export function PanelView({
  usuario, loading, error, errorAccion, listings, todas, busquedaActiva,
  query, precioMax, setQuery, setPrecioMax, handleBuscar, handleLimpiar,
  notificaciones, cerrarNotificaciones, aviso,
  aEliminar, eliminando, pedirEliminar, cancelarEliminar, confirmarEliminar,
  cambiandoId, onCambiarDisponibilidad,
}) {
  const stats = useMemo(() => {
    const disponibles = todas.filter(l => getEstado(l) === 'Disponible').length;
    return { total: todas.length, disponibles, otros: todas.length - disponibles };
  }, [todas]);

  const tienePublicaciones = todas.length > 0;

  return (
    <div className="panel">
      {/* ───────── Encabezado oscuro ───────── */}
      <section className="panel-hero">
        <div className="panel-container">
          <p className="panel-eyebrow">Panel del arrendador</p>
          <div className="panel-hero-row">
            <div className="panel-perfil">
              <Avatar nombre={usuario?.nombre} email={usuario?.email} size={64} />
              <div>
                <h1>{usuario?.nombre || usuario?.email}</h1>
                {usuario?.nombre && usuario?.email && <p>{usuario.email}</p>}
              </div>
            </div>
            <Link to="/publicar" className="panel-btn panel-btn--primary">
              + Publicar alojamiento
            </Link>
          </div>

          {!loading && tienePublicaciones && (
            <dl className="panel-stats">
              <div><dd>{stats.total}</dd><dt>{stats.total === 1 ? 'publicación' : 'publicaciones'}</dt></div>
              <div><dd>{stats.disponibles}</dd><dt>{stats.disponibles === 1 ? 'disponible' : 'disponibles'}</dt></div>
              <div><dd>{stats.otros}</dd><dt>{stats.otros === 1 ? 'no disponible' : 'no disponibles'}</dt></div>
            </dl>
          )}
        </div>
      </section>

      {/* ───────── Publicaciones (claro) ───────── */}
      <section className="panel-body">
        <div className="panel-container">
          {notificaciones.length > 0 && (
            <div className="panel-notif" role="alert">
              <span className="panel-notif-icon" aria-hidden="true">⚠️</span>
              <div className="panel-notif-texto">
                <p className="panel-notif-titulo">Aviso del administrador</p>
                {notificaciones.map((n, i) => <p key={i}>{n.mensaje}</p>)}
              </div>
              <button type="button" className="panel-notif-cerrar" onClick={cerrarNotificaciones}>
                Entendido
              </button>
            </div>
          )}

          {aviso && <div className="panel-aviso" role="status">{aviso}</div>}
          {errorAccion && <div className="panel-error" role="alert">{errorAccion}</div>}
          {error && <div className="panel-error" role="alert">{error}</div>}

          <h2 className="panel-subtitulo">Mis publicaciones</h2>

          {tienePublicaciones && (
            <SearchFilters
              variant="light"
              query={query}
              precioMax={precioMax}
              onQueryChange={setQuery}
              onPrecioChange={setPrecioMax}
              onSubmit={handleBuscar}
              onClear={handleLimpiar}
              placeholder="Buscar en mis propiedades..."
              submitLabel="Filtrar"
              clearLabel="Limpiar filtros"
            />
          )}

          {loading ? (
            <div className="panel-grid" aria-busy="true">
              {[0, 1, 2].map(i => <ListingCardSkeleton key={i} />)}
            </div>
          ) : !error && listings.length === 0 ? (
            !busquedaActiva && !tienePublicaciones ? (
              <div className="panel-empty">
                <h3>¡Bienvenido a HOMMI!</h3>
                <p>Aún no has publicado ningún alojamiento. Comienza a recibir estudiantes publicando tu primer espacio.</p>
                <Link to="/publicar" className="panel-btn panel-btn--dark">Publicar mi primera propiedad</Link>
              </div>
            ) : (
              <div className="panel-empty">
                <h3>Sin resultados</h3>
                <p>No encontramos ninguna de tus propiedades que coincida con esos criterios.</p>
                <button type="button" className="panel-btn panel-btn--dark" onClick={handleLimpiar}>
                  Ver todas mis publicaciones
                </button>
              </div>
            )
          ) : (
            !error && (
              <div className="panel-grid">
                {listings.map(listing => (
                  <article key={listing.id_alojamiento} className="panel-item">
                    <ListingCard listing={listing} to={`/alojamiento/${listing.id_alojamiento}`} />
                    <div className="panel-dispon" role="group" aria-label="Disponibilidad del alojamiento">
                      <p className="panel-dispon-label">Disponibilidad</p>
                      <div className="panel-dispon-botones">
                        {DISPONIBILIDADES.map(d => {
                          const activa = getDisponibilidadId(listing) === d.id;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              className={`panel-dispon-btn panel-dispon-btn--${getClaseEstado(d.nombre)} ${activa ? 'is-active' : ''}`}
                              aria-pressed={activa}
                              disabled={cambiandoId === listing.id_alojamiento}
                              onClick={() => onCambiarDisponibilidad(listing, d)}
                            >
                              {d.corto}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="panel-item-acciones">
                      <Link
                        to={`/editar/${listing.id_alojamiento}`}
                        state={{ listing }}
                        className="panel-btn panel-btn--ghost"
                      >
                        Modificar
                      </Link>
                      <button
                        type="button"
                        className="panel-btn panel-btn--danger"
                        onClick={() => pedirEliminar(listing)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}
        </div>
      </section>

      {aEliminar && (
        <ConfirmDialog
          peligro
          titulo="¿Eliminar esta publicación?"
          texto={`Se eliminará "${aEliminar.direccion}" junto con sus fotos y datos. Esta acción no se puede deshacer.`}
          textoConfirmar="Sí, eliminar"
          cargando={eliminando}
          onConfirmar={confirmarEliminar}
          onCancelar={cancelarEliminar}
        />
      )}
    </div>
  );
}

function LandlordPanel() {
  const user = getStoredUser();

  const [listings, setListings] = useState([]);   // lo que se muestra (con o sin filtros)
  const [todas, setTodas] = useState([]);         // todas las publicaciones del arrendador
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');             // fallo al CARGAR (oculta la lista)
  const [errorAccion, setErrorAccion] = useState(''); // fallo al ELIMINAR (la lista se conserva)
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [aviso, setAviso] = useState('');

  const [query, setQuery] = useState('');
  const [precioMax, setPrecioMax] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [cambiandoId, setCambiandoId] = useState(null); // alojamiento cuya disponibilidad se está guardando

  // Pide las publicaciones. El esqueleto de carga lo activan las acciones del usuario.
  const cargar = useCallback(async (filtros = {}) => {
    try {
      const hayFiltros = Boolean(filtros.query || filtros.precioMax);
      const data = hayFiltros
        ? await searchMyListings(filtros, user?.id)
        : await getMyListings(user?.id);
      setListings(data);
      if (!hayFiltros) setTodas(data);
      setBusquedaActiva(hayFiltros);
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus publicaciones.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    cargar({});
  }, [cargar]);

  useEffect(() => {
    getNotificaciones().then(notifs => {
      if (notifs.length > 0) setNotificaciones(notifs);
    });
  }, []);

  // El aviso de "publicación eliminada" desaparece solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  function handleBuscar(e) {
    e.preventDefault();
    setErrorAccion('');
    setLoading(true);
    cargar({ query, precioMax });
  }

  function handleLimpiar() {
    setQuery('');
    setPrecioMax('');
    setErrorAccion('');
    setLoading(true);
    cargar({});
  }

  async function cerrarNotificaciones() {
    await marcarNotificacionesLeidas();
    setNotificaciones([]);
  }

  // Guarda la nueva disponibilidad y la refleja en la tarjeta sin recargar la lista
  async function cambiarDisponibilidad(listing, nueva) {
    if (getDisponibilidadId(listing) === nueva.id) return;
    setCambiandoId(listing.id_alojamiento);
    setErrorAccion('');
    try {
      await updateDisponibilidad(listing.id_alojamiento, user?.id, nueva.id);
      const aplicar = l =>
        l.id_alojamiento === listing.id_alojamiento
          ? {
              ...l,
              disponibilidad_id: nueva.id,
              disponibilidad: { id_catdispon: nueva.id, disponibilidad: nueva.nombre },
            }
          : l;
      setListings(prev => prev.map(aplicar));
      setTodas(prev => prev.map(aplicar));
    } catch (err) {
      setErrorAccion(err.message || 'No se pudo cambiar la disponibilidad.');
    } finally {
      setCambiandoId(null);
    }
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;
    setEliminando(true);
    setErrorAccion('');
    try {
      await deleteListing(aEliminar.id_alojamiento, user?.id);
      const sinEsta = l => l.id_alojamiento !== aEliminar.id_alojamiento;
      setListings(prev => prev.filter(sinEsta));
      setTodas(prev => prev.filter(sinEsta));
      setAviso('La publicación se eliminó correctamente.');
    } catch (err) {
      setErrorAccion(err.message || 'No se pudo eliminar la publicación.');
    } finally {
      setEliminando(false);
      setAEliminar(null);
    }
  }

  return (
    <PanelView
      usuario={user}
      loading={loading}
      error={error}
      errorAccion={errorAccion}
      listings={listings}
      todas={todas}
      busquedaActiva={busquedaActiva}
      query={query}
      precioMax={precioMax}
      setQuery={setQuery}
      setPrecioMax={setPrecioMax}
      handleBuscar={handleBuscar}
      handleLimpiar={handleLimpiar}
      notificaciones={notificaciones}
      cerrarNotificaciones={cerrarNotificaciones}
      aviso={aviso}
      aEliminar={aEliminar}
      eliminando={eliminando}
      pedirEliminar={setAEliminar}
      cancelarEliminar={() => setAEliminar(null)}
      confirmarEliminar={confirmarEliminar}
      cambiandoId={cambiandoId}
      onCambiarDisponibilidad={cambiarDisponibilidad}
    />
  );
}

export default LandlordPanel;
