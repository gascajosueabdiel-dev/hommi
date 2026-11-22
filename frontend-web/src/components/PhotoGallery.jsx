// src/components/PhotoGallery.jsx
// Galería de fotos: imagen principal con flechas, miniaturas, deslizar en el
// celular y visor a pantalla completa (teclas ← → y Esc).
import { useCallback, useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import './PhotoGallery.css';

function PhotoGallery({ fotos, alt }) {
  const [indice, setIndice] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const [rotas, setRotas] = useState(() => new Set());
  const inicioToque = useRef(null);

  const total = fotos.length;
  const mover = useCallback(
    delta => setIndice(i => (i + delta + total) % total),
    [total]
  );

  // Visor ampliado: teclado y sin scroll de fondo
  useEffect(() => {
    if (!ampliada) return;
    function alTeclear(e) {
      if (e.key === 'Escape') setAmpliada(false);
      else if (e.key === 'ArrowLeft') mover(-1);
      else if (e.key === 'ArrowRight') mover(1);
    }
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alTeclear);
    return () => {
      window.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowPrevio;
    };
  }, [ampliada, mover]);

  function marcarRota(i) {
    setRotas(prev => new Set(prev).add(i));
  }

  if (total === 0) {
    return (
      <div className="gallery-empty">
        <Logo size={56} />
        <p>Este alojamiento aún no tiene fotos</p>
      </div>
    );
  }

  function alTocarInicio(e) {
    inicioToque.current = e.touches[0].clientX;
  }
  function alTocarFin(e) {
    if (inicioToque.current === null || total < 2) return;
    const dx = e.changedTouches[0].clientX - inicioToque.current;
    inicioToque.current = null;
    if (Math.abs(dx) > 45) mover(dx < 0 ? 1 : -1);
  }

  const principalRota = rotas.has(indice);

  return (
    <div className="gallery">
      <div className="gallery-main" onTouchStart={alTocarInicio} onTouchEnd={alTocarFin}>
        {principalRota ? (
          <div className="gallery-broken">
            <Logo size={44} />
            <p>No se pudo cargar esta foto</p>
          </div>
        ) : (
          <button
            type="button"
            className="gallery-main-btn"
            onClick={() => setAmpliada(true)}
            aria-label="Ampliar foto"
          >
            <img src={fotos[indice]} alt={`${alt} — foto ${indice + 1} de ${total}`} onError={() => marcarRota(indice)} />
          </button>
        )}

        {total > 1 && (
          <>
            <button type="button" className="gallery-arrow gallery-arrow--prev" onClick={() => mover(-1)} aria-label="Foto anterior">‹</button>
            <button type="button" className="gallery-arrow gallery-arrow--next" onClick={() => mover(1)} aria-label="Foto siguiente">›</button>
            <span className="gallery-counter" aria-live="polite">{indice + 1} / {total}</span>
          </>
        )}
      </div>

      {total > 1 && (
        <ul className="gallery-thumbs">
          {fotos.map((url, i) => (
            <li key={url + i}>
              <button
                type="button"
                className={`gallery-thumb ${i === indice ? 'is-active' : ''}`}
                onClick={() => setIndice(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === indice}
              >
                <img src={url} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {ampliada && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Visor de fotos"
          onClick={e => { if (e.target === e.currentTarget) setAmpliada(false); }}
        >
          <button type="button" className="gallery-lightbox-close" onClick={() => setAmpliada(false)} aria-label="Cerrar visor">✕</button>
          {total > 1 && (
            <button type="button" className="gallery-arrow gallery-arrow--prev" onClick={() => mover(-1)} aria-label="Foto anterior">‹</button>
          )}
          <img
            className="gallery-lightbox-img"
            src={fotos[indice]}
            alt={`${alt} — foto ${indice + 1} de ${total}`}
          />
          {total > 1 && (
            <button type="button" className="gallery-arrow gallery-arrow--next" onClick={() => mover(1)} aria-label="Foto siguiente">›</button>
          )}
          <span className="gallery-counter gallery-counter--lightbox">{indice + 1} / {total}</span>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;
