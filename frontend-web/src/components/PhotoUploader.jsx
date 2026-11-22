// src/components/PhotoUploader.jsx
// Subidor de fotos: arrastrar y soltar, vista previa, "hacer principal" y quitar.
// Cada foto es { id, tipo: 'existente' | 'nueva', url? , file?, previewUrl?, nombreArchivo? }.
import { useEffect, useRef, useState } from 'react';
import { MAX_FOTOS, nombreSeguro, validarArchivos } from '../utils/listing';
import './PhotoUploader.css';

let contador = 0;
const nuevoId = () => `foto-${Date.now()}-${++contador}`;

function PhotoUploader({ items, onChange, onAvisos, disabled = false }) {
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef(null);

  // Al salir de la página se liberan las vistas previas que se crearon en memoria
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(
    () => () => {
      itemsRef.current.forEach(i => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
    },
    []
  );

  const cupoLibre = MAX_FOTOS - items.length;

  function agregar(lista) {
    const archivos = Array.from(lista ?? []);
    if (archivos.length === 0) return;

    const { validos, avisos } = validarArchivos(archivos, cupoLibre);
    onAvisos(avisos.length ? `No se agregó: ${avisos.join(' · ')}.` : '');

    if (validos.length > 0) {
      const nuevas = validos.map(file => ({
        id: nuevoId(),
        tipo: 'nueva',
        file,
        nombreArchivo: nombreSeguro(file.name),
        previewUrl: URL.createObjectURL(file),
      }));
      onChange([...items, ...nuevas]);
    }
  }

  function alElegir(e) {
    agregar(e.target.files);
    e.target.value = ''; // permite volver a elegir el mismo archivo
  }

  function alSoltar(e) {
    e.preventDefault();
    setArrastrando(false);
    if (!disabled && cupoLibre > 0) agregar(e.dataTransfer?.files);
  }

  function quitar(indice) {
    const quitada = items[indice];
    if (quitada.previewUrl) URL.revokeObjectURL(quitada.previewUrl);
    onAvisos('');
    onChange(items.filter((_, i) => i !== indice));
  }

  function hacerPrincipal(indice) {
    const copia = [...items];
    const [elegida] = copia.splice(indice, 1);
    onChange([elegida, ...copia]);
  }

  return (
    <div
      className={`pu ${arrastrando ? 'pu--arrastrando' : ''}`}
      onDragOver={e => { e.preventDefault(); if (!disabled && cupoLibre > 0) setArrastrando(true); }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={alSoltar}
    >
      <ul className="pu-grid">
        {items.map((item, i) => (
          <li key={item.id} className="pu-item">
            <img src={item.tipo === 'nueva' ? item.previewUrl : item.url} alt={`Foto ${i + 1}`} />
            {i === 0 && <span className="pu-principal">Portada</span>}
            <div className="pu-acciones">
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => hacerPrincipal(i)}
                  disabled={disabled}
                  aria-label={`Hacer portada la foto ${i + 1}`}
                  title="Hacer portada"
                >
                  ★
                </button>
              )}
              <button
                type="button"
                onClick={() => quitar(i)}
                disabled={disabled}
                aria-label={`Quitar la foto ${i + 1}`}
                title="Quitar"
              >
                ✕
              </button>
            </div>
          </li>
        ))}

        {cupoLibre > 0 && (
          <li className="pu-agregar">
            <button
              type="button"
              className="pu-drop"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              <span className="pu-drop-icono" aria-hidden="true">＋</span>
              <span>Agregar fotos</span>
              <small>o arrástralas aquí</small>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
              multiple
              onChange={alElegir}
              disabled={disabled}
              hidden
              data-testid="pu-input"
            />
          </li>
        )}
      </ul>

      <p className="pu-ayuda">
        {items.length} de {MAX_FOTOS} fotos · Solo JPG o JPEG, máximo 2 MB cada una.
        La primera foto es la portada del anuncio.
      </p>
    </div>
  );
}

export default PhotoUploader;
