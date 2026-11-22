// src/pages/Listings.jsx — catálogo de alojamientos
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getAllListings, searchListings } from '../services/listingsService';
import { getStoredUser, isAuthenticated } from '../services/authService';
import { filtrarYOrdenar, SERVICIOS_DISPONIBLES } from '../utils/listing';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import SearchFilters from '../components/SearchFilters';
import AlertBanner from '../components/AlertBanner';
import './Listings.css';

const ORDENES = [
  { valor: 'recientes',   texto: 'Más recientes' },
  { valor: 'precio-asc',  texto: 'Precio: menor a mayor' },
  { valor: 'precio-desc', texto: 'Precio: mayor a menor' },
];

// Parte visual del catálogo; recibe el estado y las acciones ya preparados.
export function CatalogView({
  esAdmin, sesionActiva,
  query, precioMax, setQuery, setPrecioMax, handleBuscar, handleLimpiarTodo,
  loading, error, listings, visibles,
  opcionesServicio, serviciosSel, soloDisponibles, orden,
  onToggleDisponibles, onToggleServicio, onOrden,
  busquedaActiva, textoConteo, handleQuitarFiltrosLocales,
  showAuthModal, onPedirSesion, onCerrarModal, onIrALogin,
}) {
  return (
    <div className="catalog">
      {/* ───────── Encabezado oscuro con buscador ───────── */}
      <section className="catalog-hero">
        <div className="catalog-container">
          {esAdmin && (
            <div className="listings-admin-banner">🛡️ Panel de administrador</div>
          )}
          <p className="catalog-eyebrow">Catálogo</p>
          <h1 className="catalog-title">Alojamientos para estudiantes</h1>
          <p className="catalog-sub">
            Compara precio, ubicación y servicios antes de contactar al arrendador.
          </p>

          <SearchFilters
            query={query}
            precioMax={precioMax}
            onQueryChange={setQuery}
            onPrecioChange={setPrecioMax}
            onSubmit={handleBuscar}
            onClear={handleLimpiarTodo}
          />

          {!sesionActiva && (
            <p className="catalog-hint">
              Para ver el detalle completo y el contacto del arrendador,{' '}
              <Link to="/login">inicia sesión</Link>.
            </p>
          )}
        </div>
      </section>

      {/* ───────── Resultados (fondo claro) ───────── */}
      <section className="catalog-body">
        <div className="catalog-container">
          {error && <AlertBanner mensaje={error} tipo="error" />}

          {!loading && !error && listings.length > 0 && (
            <div className="catalog-toolbar">
              <p className="catalog-count" aria-live="polite">{textoConteo}</p>

              <div className="catalog-controls">
                <button
                  type="button"
                  className={`catalog-chip ${soloDisponibles ? 'is-active' : ''}`}
                  aria-pressed={soloDisponibles}
                  onClick={() => onToggleDisponibles()}
                >
                  Solo disponibles
                </button>

                {opcionesServicio.map(nombre => (
                  <button
                    key={nombre}
                    type="button"
                    className={`catalog-chip ${serviciosSel.includes(nombre) ? 'is-active' : ''}`}
                    aria-pressed={serviciosSel.includes(nombre)}
                    onClick={() => onToggleServicio(nombre)}
                  >
                    {nombre}
                  </button>
                ))}

                <label className="catalog-sort">
                  <span>Ordenar</span>
                  <select value={orden} onChange={e => onOrden(e.target.value)}>
                    {ORDENES.map(o => (
                      <option key={o.valor} value={o.valor}>{o.texto}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {loading ? (
            <div className="catalog-grid" aria-busy="true">
              {[0, 1, 2, 3, 4, 5].map(i => <ListingCardSkeleton key={i} />)}
            </div>
          ) : error ? null : listings.length === 0 ? (
            <div className="catalog-empty">
              <h2>{busquedaActiva ? 'Sin resultados' : 'Aún no hay alojamientos publicados'}</h2>
              <p>
                {busquedaActiva
                  ? 'No encontramos alojamientos con esa búsqueda. Prueba con otra zona o un presupuesto mayor.'
                  : 'Cuando los arrendadores publiquen, los verás aquí.'}
              </p>
              {busquedaActiva && (
                <button type="button" className="catalog-btn" onClick={handleLimpiarTodo}>
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : visibles.length === 0 ? (
            <div className="catalog-empty">
              <h2>Ningún alojamiento cumple esos filtros</h2>
              <p>Quita alguno de los filtros para ver más opciones.</p>
              <button type="button" className="catalog-btn" onClick={handleQuitarFiltrosLocales}>
                Quitar filtros
              </button>
            </div>
          ) : (
            <div className="catalog-grid">
              {visibles.map(listing => (
                <ListingCard
                  key={listing.id_alojamiento}
                  listing={listing}
                  to={sesionActiva ? `/alojamiento/${listing.id_alojamiento}` : '/login'}
                  onSelect={sesionActiva ? undefined : onPedirSesion}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───────── Aviso para invitados ───────── */}
      {showAuthModal && (
        <div
          className="listings-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-titulo"
          onClick={e => { if (e.target === e.currentTarget) onCerrarModal(); }}
        >
          <div className="listings-modal">
            <div className="listings-modal-icon">🔒</div>
            <h2 className="listings-modal-title" id="auth-modal-titulo">Acceso restringido</h2>
            <p className="listings-modal-text">
              Para ver los detalles completos del alojamiento y la información de contacto del arrendador, necesitas iniciar sesión.
            </p>
            <div className="listings-modal-actions">
              <button
                className="listings-modal-btn-primary"
                onClick={onIrALogin}
              >
                Iniciar sesión
              </button>
              <button
                className="listings-modal-btn-secondary"
                onClick={onCerrarModal}
              >
                Seguir explorando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Listings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = getStoredUser();
  const esAdmin = user?.rol === 'administrador';
  const sesionActiva = isAuthenticated();

  // Filtros iniciales: pueden venir en la URL (?q=...&max=...) desde la portada
  const [filtrosIniciales] = useState(() => ({
    query: searchParams.get('q') ?? '',
    precioMax: searchParams.get('max') ?? '',
  }));

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Búsqueda en el servidor (texto y precio)
  const [query, setQuery] = useState(filtrosIniciales.query);
  const [precioMax, setPrecioMax] = useState(filtrosIniciales.precioMax);
  const [busquedaActiva, setBusquedaActiva] = useState(
    Boolean(filtrosIniciales.query || filtrosIniciales.precioMax)
  );

  // Filtros y orden en el navegador (servicios, disponibilidad, precio)
  const [serviciosSel, setServiciosSel] = useState([]);
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [orden, setOrden] = useState('recientes');

  // Últimos filtros enviados al servidor; el refresco al volver a la pestaña los reutiliza.
  const filtrosAplicados = useRef({});

  // Pide los alojamientos al servidor. No muestra el esqueleto de carga por sí sola:
  // las acciones del usuario lo activan antes de llamarla (así el refresco al volver
  // a la pestaña se hace sin tapar lo que ya se ve).
  const cargar = useCallback(async (filtros = {}) => {
    filtrosAplicados.current = filtros;
    try {
      const hayFiltros = filtros.query || filtros.precioMax;
      const data = hayFiltros
        ? await searchListings(filtros)
        : await getAllListings();
      setListings(Array.isArray(data) ? data : []);
      setBusquedaActiva(Boolean(hayFiltros));
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los alojamientos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(filtrosIniciales); // el estado inicial ya es "cargando"

    // Al volver a la pestaña se refresca el catálogo respetando los filtros aplicados.
    const alVolver = () => cargar(filtrosAplicados.current);
    window.addEventListener('focus', alVolver);
    return () => window.removeEventListener('focus', alVolver);
  }, [cargar, filtrosIniciales]);

  // Servicios que se pueden elegir como filtro: siempre los 9 del catálogo
    const opcionesServicio = SERVICIOS_DISPONIBLES.map(s => s.nombre).sort((a, b) => a.localeCompare(b, 'es'));

  const visibles = useMemo(
    () => filtrarYOrdenar(listings, { servicios: serviciosSel, soloDisponibles, orden }),
    [listings, serviciosSel, soloDisponibles, orden]
  );

  const hayFiltrosLocales = serviciosSel.length > 0 || soloDisponibles;

  function sincronizarUrl(q, max) {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (max) params.set('max', max);
    setSearchParams(params, { replace: true });
  }

  function handleBuscar(e) {
    e.preventDefault();
    sincronizarUrl(query, precioMax);
    setLoading(true);
    cargar({ query, precioMax });
  }

  function handleLimpiarTodo() {
    setQuery('');
    setPrecioMax('');
    setServiciosSel([]);
    setSoloDisponibles(false);
    sincronizarUrl('', '');
    setLoading(true);
    cargar({});
  }

  function handleQuitarFiltrosLocales() {
    setServiciosSel([]);
    setSoloDisponibles(false);
  }

  function alternarServicio(nombre) {
    setServiciosSel(prev =>
      prev.includes(nombre) ? prev.filter(n => n !== nombre) : [...prev, nombre]
    );
  }

  const textoConteo = hayFiltrosLocales
    ? `${visibles.length} de ${listings.length} ${listings.length === 1 ? 'alojamiento' : 'alojamientos'}`
    : `${listings.length} ${listings.length === 1 ? 'alojamiento' : 'alojamientos'}`;

  return (
    <CatalogView
      esAdmin={esAdmin}
      sesionActiva={sesionActiva}
      query={query}
      precioMax={precioMax}
      setQuery={setQuery}
      setPrecioMax={setPrecioMax}
      handleBuscar={handleBuscar}
      handleLimpiarTodo={handleLimpiarTodo}
      loading={loading}
      error={error}
      listings={listings}
      visibles={visibles}
      opcionesServicio={opcionesServicio}
      serviciosSel={serviciosSel}
      soloDisponibles={soloDisponibles}
      orden={orden}
      onToggleDisponibles={() => setSoloDisponibles(v => !v)}
      onToggleServicio={alternarServicio}
      onOrden={setOrden}
      busquedaActiva={busquedaActiva}
      textoConteo={textoConteo}
      handleQuitarFiltrosLocales={handleQuitarFiltrosLocales}
      showAuthModal={showAuthModal}
      onPedirSesion={() => setShowAuthModal(true)}
      onCerrarModal={() => setShowAuthModal(false)}
      onIrALogin={() => navigate('/login')}
    />
  );
}

export default Listings;
