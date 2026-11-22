// src/components/ListingCard.jsx
// Tarjeta de alojamiento (foto grande, precio, ubicación y servicios).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { getResenas } from '../services/listingsService';
import { getFotos, getServicios, getEstado, getClaseEstado, formatPrecio } from '../utils/listing';
import './ListingCard.css';

function ListingCard({ listing, to, onSelect }) {
  const [fotoRota, setFotoRota] = useState(false);
  const [resumen, setResumen] = useState(null); // { promedio, total } si ya tiene reseñas

  // Pide el promedio de reseñas; si no hay ninguna (o falla) la tarjeta no muestra nada
  useEffect(() => {
    if (!listing.id_alojamiento) return; // la vista previa del formulario no tiene id
    let activo = true;
    getResenas(listing.id_alojamiento)
      .then(r => {
        if (activo && r.totalResenas > 0) setResumen({ promedio: r.promedio, total: r.totalResenas });
      })
      .catch(() => {});
    return () => { activo = false; };
  }, [listing.id_alojamiento]);

  const fotos     = getFotos(listing);
  const estado    = getEstado(listing);
  const servicios = getServicios(listing);
  const visibles  = servicios.slice(0, 3);
  const extra     = servicios.length - visibles.length;

  return (
    <Link
      to={to}
      className="listing-card"
      onClick={
        onSelect
          ? e => {
              e.preventDefault();
              onSelect(listing);
            }
          : undefined
      }
    >
      <div className="listing-card-media">
        {fotos[0] && !fotoRota ? (
          <img
            src={fotos[0]}
            alt={`Alojamiento en ${listing.colonia}`}
            loading="lazy"
            onError={() => setFotoRota(true)}
          />
        ) : (
          <div className="listing-card-placeholder" aria-hidden="true">
            <Logo size={44} />
          </div>
        )}
        {estado && (
          <span className={`listing-badge listing-badge--${getClaseEstado(estado)}`}>
            {estado}
          </span>
        )}
        {fotos.length > 1 && (
          <span className="listing-card-count">{fotos.length} fotos</span>
        )}
      </div>

      <div className="listing-card-body">
        <p className="listing-card-price">
          {formatPrecio(listing.precio_mensual)} <span>/ mes</span>
        </p>
        {resumen && (
          <p className="listing-card-rating" aria-label={`Calificación ${resumen.promedio.toFixed(1)} de 5`}>
            <span aria-hidden="true">★</span> {resumen.promedio.toFixed(1)}
            <small>({resumen.total} {resumen.total === 1 ? 'reseña' : 'reseñas'})</small>
          </p>
        )}
        <h3 className="listing-card-title">{listing.direccion}</h3>
        <p className="listing-card-colonia">
          {listing.colonia}
          {listing.codigo_postal ? ` · C.P. ${listing.codigo_postal}` : ''}
        </p>

        {visibles.length > 0 && (
          <ul className="listing-card-tags">
            {visibles.map(nombre => (
              <li key={nombre}>{nombre}</li>
            ))}
            {extra > 0 && <li className="listing-card-tags-extra">+{extra}</li>}
          </ul>
        )}
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="listing-card listing-card--skeleton" aria-hidden="true">
      <div className="listing-card-media" />
      <div className="listing-card-body">
        <div className="skeleton-line skeleton-line--lg" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-line--sm" />
      </div>
    </div>
  );
}

export default ListingCard;
