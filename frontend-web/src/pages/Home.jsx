// src/pages/Home.jsx — portada para visitantes
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllListings } from '../services/listingsService';
import { getStoredUser } from '../services/authService';
import { formatPrecio } from '../utils/listing';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import Reveal from '../components/Reveal';
import Logo from '../components/Logo';
import './Home.css';

const PASOS = [
  {
    titulo: 'Busca',
    texto: 'Filtra por colonia o por presupuesto y encuentra opciones cerca de tu escuela.',
    icono: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
  },
  {
    titulo: 'Compara',
    texto: 'Revisa fotos, precio mensual, ubicación y servicios incluidos antes de decidir.',
    icono: <path d="M4 6h16M4 12h10M4 18h6" />,
  },
  {
    titulo: 'Contacta',
    texto: 'Habla directo con el arrendador. Sin intermediarios ni mensajes perdidos.',
    icono: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
  },
];

// Parte visual de la portada; recibe los datos ya cargados.
// listings: null = cargando | [] = sin datos | [...] = alojamientos
export function HomeView({
  listings,
  fallo,
  usuario,
  query,
  precioMax,
  onQueryChange,
  onPrecioChange,
  onBuscar,
  onReintentar,
}) {
  const cargando = listings === null && !fallo;

  const destacados = useMemo(() => {
    if (!listings) return [];
    const prioridad = l => (l.disponibilidad?.disponibilidad === 'Disponible' ? 0 : 1);
    return [...listings].sort((a, b) => prioridad(a) - prioridad(b)).slice(0, 6);
  }, [listings]);

  const stats = useMemo(() => {
    if (!listings || listings.length === 0) return null;
    const precios = listings.map(l => Number(l.precio_mensual)).filter(Number.isFinite);
    const colonias = new Set(
      listings.map(l => (l.colonia || '').trim().toLowerCase()).filter(Boolean)
    );
    return {
      total: listings.length,
      desde: precios.length ? Math.min(...precios) : null,
      colonias: colonias.size,
    };
  }, [listings]);

  const sesionActiva = Boolean(usuario);
  const esArrendador = usuario?.rol === 'arrendador';
  const destinoDetalle = id => (sesionActiva ? `/alojamiento/${id}` : '/login');

  return (
    <div className="home">
      {/* ───────── Portada ───────── */}
      <section className="home-hero">
        <Logo size={520} className="home-hero-mark" />
        <div className="home-container home-hero-inner">
          <p className="home-eyebrow home-eyebrow--light">HOMMI · Alojamiento estudiantil</p>
          <h1 className="home-hero-title">
            Encuentra el lugar ideal para <span className="home-gradient">vivir mientras estudias</span>
          </h1>
          <p className="home-hero-sub">
            Alojamientos para estudiantes en Querétaro con precio claro, fotos reales y contacto
            directo con el arrendador.
          </p>

          <div className="home-hero-actions">
            {esArrendador ? (
              <>
                <Link to="/mi-panel" className="home-btn home-btn--primary">
                  Ir a mi panel
                </Link>
                <Link to="/alojamientos" className="home-btn home-btn--ghost">
                  Explorar alojamientos
                </Link>
              </>
            ) : (
              <>
                <Link to="/alojamientos" className="home-btn home-btn--primary">
                  Explorar alojamientos
                </Link>
                {!sesionActiva && (
                  <Link to="/registro?rol=arrendador" className="home-btn home-btn--ghost">
                    Publicar mi propiedad
                  </Link>
                )}
              </>
            )}
          </div>

          <form className="home-search" onSubmit={onBuscar} role="search">
            <label className="home-search-field">
              <span>Zona o colonia</span>
              <input
                type="text"
                placeholder="Centro, Juriquilla, Milenio…"
                value={query}
                onChange={e => onQueryChange(e.target.value)}
              />
            </label>
            <label className="home-search-field home-search-field--precio">
              <span>Presupuesto máximo</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Ej. 4500"
                value={precioMax}
                onChange={e => onPrecioChange(e.target.value)}
              />
            </label>
            <button type="submit" className="home-btn home-btn--primary home-search-btn">
              Buscar
            </button>
          </form>

          {stats && (
            <dl className="home-stats">
              <div>
                <dt>{stats.total === 1 ? 'alojamiento publicado' : 'alojamientos publicados'}</dt>
                <dd>{stats.total}</dd>
              </div>
              {stats.desde !== null && (
                <div>
                  <dt>precio mensual desde</dt>
                  <dd>{formatPrecio(stats.desde)}</dd>
                </div>
              )}
              <div>
                <dt>{stats.colonias === 1 ? 'colonia' : 'colonias'}</dt>
                <dd>{stats.colonias}</dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* ───────── Destacados (claro) ───────── */}
      <section className="home-section home-section--light">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Catálogo</p>
            <h2 className="home-title">Alojamientos destacados</h2>
            <p className="home-lead">
              Compara precio, ubicación y servicios antes de contactar al arrendador.
            </p>
          </Reveal>

          {cargando && (
            <div className="home-grid" aria-busy="true">
              {[0, 1, 2].map(i => <ListingCardSkeleton key={i} />)}
            </div>
          )}

          {fallo && (
            <div className="home-empty">
              <h3>No pudimos cargar los alojamientos</h3>
              <p>Revisa tu conexión e inténtalo de nuevo.</p>
              <button type="button" className="home-btn home-btn--dark" onClick={onReintentar}>
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !fallo && destacados.length === 0 && (
            <div className="home-empty">
              <h3>Aún no hay alojamientos publicados</h3>
              {sesionActiva && !esArrendador ? (
                <p>Los arrendadores están preparando sus publicaciones. Vuelve pronto.</p>
              ) : (
                <>
                  <p>¿Tienes un espacio para rentar a estudiantes? Sé el primero en publicarlo.</p>
                  <Link
                    to={esArrendador ? '/publicar' : '/registro?rol=arrendador'}
                    className="home-btn home-btn--dark"
                  >
                    Publicar el primero
                  </Link>
                </>
              )}
            </div>
          )}

          {destacados.length > 0 && (
            <>
              <div className="home-grid">
                {destacados.map((l, i) => (
                  <Reveal key={l.id_alojamiento} delay={i * 70}>
                    <ListingCard listing={l} to={destinoDetalle(l.id_alojamiento)} />
                  </Reveal>
                ))}
              </div>
              <div className="home-more">
                <Link to="/alojamientos" className="home-btn home-btn--dark">
                  Ver todos los alojamientos
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ───────── Cómo funciona (claro) ───────── */}
      <section className="home-section home-section--white">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Cómo funciona</p>
            <h2 className="home-title">Encontrar hogar, en tres pasos</h2>
          </Reveal>
          <ol className="home-steps">
            {PASOS.map((paso, i) => (
              <Reveal as="li" key={paso.titulo} delay={i * 90} className="home-step">
                <span className="home-step-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {paso.icono}
                  </svg>
                </span>
                <h3><span className="home-step-num">{i + 1}.</span> {paso.titulo}</h3>
                <p>{paso.texto}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Perfiles (oscuro): solo para visitantes ───────── */}
      {!sesionActiva && (
        <section className="home-section home-section--dark">
          <div className="home-container">
            <Reveal>
              <p className="home-eyebrow home-eyebrow--light">Perfiles</p>
              <h2 className="home-title home-title--light">
                Un camino para quien busca y otro para quien publica
              </h2>
            </Reveal>
            <div className="home-roles">
              <Reveal className="home-role home-role--student">
                <p className="home-role-tag">Estudiante</p>
                <h3>Encuentra dónde vivir sin perder tiempo</h3>
                <p>
                  Crea tu cuenta para ver los detalles completos de cada alojamiento y
                  la información de contacto del arrendador.
                </p>
                <Link to="/registro" className="home-btn home-btn--primary">
                  Crear cuenta de estudiante
                </Link>
              </Reveal>
              <Reveal className="home-role home-role--landlord" delay={90}>
                <p className="home-role-tag">Arrendador</p>
                <h3>Publica tu propiedad con fotos y datos claros</h3>
                <p>
                  Sube hasta 5 fotos, define el precio y los servicios incluidos, y
                  administra tus publicaciones desde tu panel.
                </p>
                <Link to="/registro?rol=arrendador" className="home-btn home-btn--ghost">
                  Publicar mi propiedad
                </Link>
              </Reveal>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [listings, setListings] = useState(null);
  const [fallo, setFallo] = useState(false);
  const [intento, setIntento] = useState(0);
  const [query, setQuery] = useState('');
  const [precioMax, setPrecioMax] = useState('');

  useEffect(() => {
    let activo = true;
    getAllListings()
      .then(data => {
        if (!activo) return;
        setListings(Array.isArray(data) ? data : []);
        setFallo(false);
      })
      .catch(() => {
        if (activo) setFallo(true);
      });
    return () => { activo = false; };
  }, [intento]);

  function handleBuscar(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (precioMax) params.set('max', precioMax);
    const texto = params.toString();
    navigate(texto ? `/alojamientos?${texto}` : '/alojamientos');
  }

  function handleReintentar() {
    setFallo(false);
    setListings(null);
    setIntento(n => n + 1);
  }

  return (
    <HomeView
      listings={listings}
      fallo={fallo}
      usuario={getStoredUser()}
      query={query}
      precioMax={precioMax}
      onQueryChange={setQuery}
      onPrecioChange={setPrecioMax}
      onBuscar={handleBuscar}
      onReintentar={handleReintentar}
    />
  );
}

export default Home;
