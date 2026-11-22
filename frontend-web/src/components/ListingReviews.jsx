// src/components/ListingReviews.jsx
// Reseñas de un alojamiento: promedio, lista y formulario (solo estudiantes).
import { useEffect, useState } from 'react';
import { getResenas, guardarResena, eliminarResena } from '../services/listingsService';
import Avatar from './Avatar';
import ConfirmDialog from './ConfirmDialog';
import './ListingReviews.css';

// Cinco estrellas; las primeras `valor` (redondeado) van rellenas
function Estrellas({ valor }) {
  return (
    <span className="reviews-estrellas" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= Math.round(valor) ? 'is-llena' : ''} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

function formatFecha(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ¿La reseña es del estudiante que tiene la sesión iniciada?
function esDelUsuario(r, rol, perfilId, nombre) {
  if (rol !== 'estudiante') return false;
  if (r.estudiante_id != null) return String(r.estudiante_id) === String(perfilId);
  // Respaldo por si el backend aún no manda estudiante_id: se compara por nombre
  return Boolean(nombre) && r.estudiante?.Usuario?.nombre === nombre;
}

function ListingReviews({ alojamientoId, usuario }) {
  const { rol, perfilId, nombre: nombreSesion } = usuario ?? {};
  const esEstudiante = rol === 'estudiante';
  const esAdmin = rol === 'administrador';

  const [datos, setDatos] = useState(null);      // { promedio, totalResenas, resenas }
  const [errorCarga, setErrorCarga] = useState('');
  const [recarga, setRecarga] = useState(0);     // al cambiarlo se vuelven a pedir las reseñas

  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const esMia = r => esDelUsuario(r, rol, perfilId, nombreSesion);

  useEffect(() => {
    let activo = true;
    getResenas(alojamientoId)
      .then(res => {
        if (!activo) return;
        setDatos(res);
        setErrorCarga('');
        // El formulario arranca con la reseña del estudiante, si ya escribió una
        const mia = (res.resenas ?? []).find(r => esDelUsuario(r, rol, perfilId, nombreSesion));
        setCalificacion(mia?.calificacion ?? 0);
        setComentario(mia?.comentario ?? '');
      })
      .catch(err => {
        if (activo) setErrorCarga(err.message || 'No se pudieron cargar las reseñas.');
      });
    return () => { activo = false; };
  }, [alojamientoId, recarga, rol, perfilId, nombreSesion]);

  async function handleEnviar(e) {
    e.preventDefault();
    if (!calificacion) {
      setErrorForm('Elige una calificación de 1 a 5 estrellas.');
      return;
    }
    setEnviando(true);
    setErrorForm('');
    try {
      await guardarResena(alojamientoId, { calificacion, comentario: comentario.trim() });
      setRecarga(n => n + 1);
    } catch (err) {
      setErrorForm(err.message || 'No se pudo guardar tu reseña.');
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;
    setEliminando(true);
    try {
      await eliminarResena(aEliminar.id_resena);
      setRecarga(n => n + 1);
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo eliminar la reseña.');
    } finally {
      setEliminando(false);
      setAEliminar(null);
    }
  }

  if (!datos && !errorCarga) return <p className="detail-muted">Cargando reseñas…</p>;

  const resenas = datos?.resenas ?? [];
  const total = datos?.totalResenas ?? 0;
  const yaReseno = resenas.some(esMia);

  return (
    <div className="reviews">
      {errorCarga && <p className="reviews-error" role="alert">{errorCarga}</p>}

      {datos && (
        <div className="reviews-resumen">
          {total > 0 ? (
            <>
              <span className="reviews-promedio">{Number(datos.promedio).toFixed(1)}</span>
              <Estrellas valor={datos.promedio} />
              <span className="detail-muted">{total} {total === 1 ? 'reseña' : 'reseñas'}</span>
            </>
          ) : (
            <span className="detail-muted">Aún no hay reseñas.</span>
          )}
        </div>
      )}

      {esEstudiante && (
        <form className="reviews-form" onSubmit={handleEnviar} noValidate>
          <p className="reviews-form-titulo">{yaReseno ? 'Tu reseña' : 'Deja tu reseña'}</p>

          <div className="reviews-selector" role="group" aria-label="Calificación">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                className={n <= calificacion ? 'is-llena' : ''}
                aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                aria-pressed={n === calificacion}
                onClick={() => setCalificacion(n)}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            maxLength={1000}
            placeholder="Cuéntanos tu experiencia (opcional)"
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            aria-label="Comentario"
          />

          {errorForm && <p className="reviews-error" role="alert">{errorForm}</p>}

          <button type="submit" className="reviews-btn" disabled={enviando}>
            {enviando ? 'Guardando…' : yaReseno ? 'Actualizar reseña' : 'Publicar reseña'}
          </button>
        </form>
      )}

      {resenas.length > 0 && (
        <ul className="reviews-lista">
          {resenas.map(r => {
            const nombre = r.estudiante?.Usuario?.nombre ?? 'Estudiante';
            return (
              <li key={r.id_resena} className="reviews-item">
                <Avatar nombre={nombre} size={40} />
                <div className="reviews-item-cuerpo">
                  <div className="reviews-item-top">
                    <strong>{nombre}</strong>
                    <Estrellas valor={r.calificacion} />
                    <span className="detail-muted">{formatFecha(r.created_at)}</span>
                  </div>
                  {r.comentario && <p className="reviews-comentario">{r.comentario}</p>}
                  {(esAdmin || esMia(r)) && (
                    <button type="button" className="reviews-eliminar" onClick={() => setAEliminar(r)}>
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {aEliminar && (
        <ConfirmDialog
          peligro
          titulo="¿Eliminar esta reseña?"
          texto="La reseña se borrará y el promedio del alojamiento se recalculará."
          textoConfirmar="Sí, eliminar"
          cargando={eliminando}
          onConfirmar={confirmarEliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </div>
  );
}

export default ListingReviews;
