// src/components/ConfirmDialog.jsx
// Diálogo de confirmación accesible (Esc para cancelar, foco en "Cancelar", sin scroll de fondo).
import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({
  titulo,
  texto,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  cargando = false,
  peligro = false,
  onConfirmar,
  onCancelar,
}) {
  const botonCancelar = useRef(null);
  // Siempre la versión más reciente, para no reiniciar el efecto en cada render
  const actual = useRef({ cargando, onCancelar });
  useEffect(() => {
    actual.current = { cargando, onCancelar };
  });

  useEffect(() => {
    botonCancelar.current?.focus();
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function alTeclear(e) {
      if (e.key === 'Escape' && !actual.current.cargando) actual.current.onCancelar();
    }
    window.addEventListener('keydown', alTeclear);
    return () => {
      window.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowPrevio;
    };
  }, []);

  return (
    <div
      className="confirm-overlay"
      onClick={e => { if (e.target === e.currentTarget && !cargando) onCancelar(); }}
    >
      <div className="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirm-titulo" aria-describedby="confirm-texto">
        <h2 id="confirm-titulo">{titulo}</h2>
        <p id="confirm-texto">{texto}</p>
        <div className="confirm-actions">
          <button type="button" ref={botonCancelar} className="confirm-btn confirm-btn--ghost" onClick={onCancelar} disabled={cargando}>
            {textoCancelar}
          </button>
          <button type="button" className={`confirm-btn ${peligro ? 'confirm-btn--danger' : 'confirm-btn--primary'}`} onClick={onConfirmar} disabled={cargando}>
            {cargando ? 'Procesando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
