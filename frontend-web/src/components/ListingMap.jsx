// src/components/ListingMap.jsx
// Mapa del alojamiento. Si la dirección no se puede ubicar con seguridad, no muestra mapa.
import { useEffect, useState } from 'react';
import { ubicarAlojamiento, mapaEmbedUrl, mapaEnlaceUrl } from '../utils/mapa';

function ListingMap({ listing }) {
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'ok' | 'sin-ubicacion'
  const [punto, setPunto] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    ubicarAlojamiento(listing, control.signal)
      .then(p => {
        setPunto(p);
        setEstado(p ? 'ok' : 'sin-ubicacion');
      })
      .catch(err => {
        if (err.name !== 'AbortError') setEstado('sin-ubicacion');
      });
    return () => control.abort();
  }, [listing]);

  if (estado === 'cargando') {
    return <p className="detail-muted">Buscando ubicación…</p>;
  }

  if (estado === 'sin-ubicacion') {
    return <p className="detail-muted">No pudimos ubicar esta dirección en el mapa.</p>;
  }

  return (
    <>
      <div className="detail-map">
        <iframe
          title={`Mapa de ${listing.direccion}`}
          src={mapaEmbedUrl(punto)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="detail-muted detail-map-nota">
        Ubicación calculada con la dirección publicada; puede ser aproximada.
      </p>
      <a
        className="detail-maplink"
        href={mapaEnlaceUrl(punto)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir en Google Maps ↗
      </a>
    </>
  );
}

export default ListingMap;
