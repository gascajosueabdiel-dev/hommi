// src/components/ListingForm.jsx
// Formulario compartido por "Publicar alojamiento" y "Modificar alojamiento".
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subirFotos } from '../services/listingsService';
import { SERVICIOS_DISPONIBLES, validarFormulario } from '../utils/listing';
import PhotoUploader from './PhotoUploader';
import ListingCard from './ListingCard';
import SuccessScreen from './SuccessScreen';
import '../pages/PublishListing.css';

const MAX_DESCRIPCION = 1500;

const VACIO = {
  direccion: '',
  colonia: '',
  codigo_postal: '',
  precio: '',
  descripcion: '',
  servicios: [],
};

function ListingForm({
  eyebrow,
  titulo,
  subtitulo,
  textoBoton,
  tituloExito,
  subtituloExito,
  inicial,
  onGuardar,
}) {
  const navigate = useNavigate();

  const [valores, setValores] = useState(() => ({ ...VACIO, ...(inicial?.valores ?? {}) }));
  const [fotos, setFotos] = useState(() => inicial?.fotos ?? []);
  const [errores, setErrores] = useState({});
  const [avisoFotos, setAvisoFotos] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState(null); // { texto, pct }
  const [exito, setExito] = useState(false);

  const temporizador = useRef(null);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  function cambiar(campo, valor) {
    setValores(v => ({ ...v, [campo]: valor }));
    setErrores(e => ({ ...e, [campo]: '' }));
  }

  function alternarServicio(id) {
    setValores(v => ({
      ...v,
      servicios: v.servicios.includes(id) ? v.servicios.filter(s => s !== id) : [...v.servicios, id],
    }));
  }

  function cambiarFotos(nuevas) {
    setFotos(nuevas);
    setErrores(e => ({ ...e, fotos: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorGeneral('');

    const encontrados = validarFormulario(valores, fotos);
    setErrores(encontrados);
    const primero = Object.keys(encontrados)[0];
    if (primero) {
      document.getElementById(`lf-${primero}`)?.focus();
      return;
    }

    setEnviando(true);
    setProgreso({ texto: 'Preparando…', pct: 5 });
    try {
      const urls = await subirFotos(fotos, (hechas, total) =>
        setProgreso({
          texto: `Subiendo fotos (${hechas} de ${total})…`,
          pct: 10 + Math.round((80 * hechas) / total),
        })
      );

      setProgreso({ texto: 'Guardando…', pct: 95 });
      await onGuardar({
        direccion: valores.direccion.trim(),
        colonia: valores.colonia.trim(),
        codigo_postal: valores.codigo_postal.trim(),
        precio_mensual: Number(valores.precio),
        descripcion: valores.descripcion.trim(),
        foto_url: urls[0] ?? '',
        imagenesUrls: urls,
        // El backend lee "serviciosIds" al crear y "servicios" al editar: se mandan los dos.
        servicios: valores.servicios,
        serviciosIds: valores.servicios,
      });

      setExito(true);
      temporizador.current = setTimeout(() => navigate('/mi-panel'), 2500);
    } catch (err) {
      setErrorGeneral(err.message || 'No se pudo guardar el alojamiento.');
    } finally {
      setEnviando(false);
      setProgreso(null);
    }
  }

  if (exito) {
    return (
      <div className="lf-page">
        <div className="lf-success">
          <div className="lf-success-box">
            <SuccessScreen titulo={tituloExito} subtitulo={subtituloExito} />
          </div>
        </div>
      </div>
    );
  }

  // Tarjeta de vista previa con lo que se lleva capturado
  const vistaPrevia = {
    id_alojamiento: 0,
    direccion: valores.direccion.trim() || 'Dirección del alojamiento',
    colonia: valores.colonia.trim() || 'Colonia',
    codigo_postal: valores.codigo_postal,
    precio_mensual: Number(valores.precio) || 0,
    servicios: SERVICIOS_DISPONIBLES.filter(s => valores.servicios.includes(s.id)),
    imagenes: fotos.map(f => ({ url: f.tipo === 'nueva' ? f.previewUrl : f.url })),
  };

  const campo = (id, etiqueta, hijo, error, ayuda) => (
    <div className={`lf-field ${error ? 'lf-field--error' : ''}`}>
      <label htmlFor={`lf-${id}`}>{etiqueta}</label>
      {hijo}
      {error ? <span className="lf-error" role="alert">{error}</span> : ayuda && <span className="lf-hint">{ayuda}</span>}
    </div>
  );

  return (
    <div className="lf-page">
      <div className="lf-container">
        <Link to="/mi-panel" className="lf-back">← Volver a mi panel</Link>
        <p className="lf-eyebrow">{eyebrow}</p>
        <h1 className="lf-title">{titulo}</h1>
        <p className="lf-sub">{subtitulo}</p>

        <div className="lf-layout">
          <form onSubmit={handleSubmit} noValidate className="lf-form">
            <fieldset disabled={enviando} className="lf-fieldset">
              {errorGeneral && <div className="lf-alert" role="alert">{errorGeneral}</div>}

              <section className="lf-card">
                <h2><span>1</span> Ubicación</h2>
                {campo('direccion', 'Dirección completa *',
                  <input id="lf-direccion" type="text" maxLength={200} placeholder="Calle, número, colonia"
                    value={valores.direccion} onChange={e => cambiar('direccion', e.target.value)} />,
                  errores.direccion)}
                <div className="lf-row">
                  {campo('colonia', 'Colonia o zona *',
                    <input id="lf-colonia" type="text" maxLength={70} placeholder="Ej. Centro, Juriquilla"
                      value={valores.colonia} onChange={e => cambiar('colonia', e.target.value)} />,
                    errores.colonia)}
                  {campo('codigo_postal', 'Código postal *',
                    <input id="lf-codigo_postal" type="text" inputMode="numeric" maxLength={5} placeholder="76000"
                      value={valores.codigo_postal}
                      onChange={e => cambiar('codigo_postal', e.target.value.replace(/\D/g, ''))} />,
                    errores.codigo_postal)}
                </div>
              </section>

              <section className="lf-card">
                <h2><span>2</span> Precio y descripción</h2>
                {campo('precio', 'Renta mensual (MXN) *',
                  <div className="lf-money">
                    <span aria-hidden="true">$</span>
                    <input id="lf-precio" type="number" min="1" max="99999999" step="1" inputMode="decimal"
                      placeholder="4500" value={valores.precio}
                      onChange={e => cambiar('precio', e.target.value)} />
                    <span aria-hidden="true">/ mes</span>
                  </div>,
                  errores.precio)}
                {campo('descripcion', 'Descripción',
                  <textarea id="lf-descripcion" rows={5} maxLength={MAX_DESCRIPCION}
                    placeholder="Cuéntales a los estudiantes cómo es el lugar: cuartos, reglas, distancia a la escuela…"
                    value={valores.descripcion} onChange={e => cambiar('descripcion', e.target.value)} />,
                  null,
                  `${valores.descripcion.length} / ${MAX_DESCRIPCION}`)}
              </section>

              <section className="lf-card">
                <h2><span>3</span> Servicios incluidos</h2>
                <div className="lf-servicios">
                  {SERVICIOS_DISPONIBLES.map(s => {
                    const activo = valores.servicios.includes(s.id);
                    return (
                      <button key={s.id} type="button"
                        className={`lf-servicio ${activo ? 'is-active' : ''}`}
                        aria-pressed={activo}
                        onClick={() => alternarServicio(s.id)}>
                        {activo ? '✓ ' : ''}{s.nombre}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className={`lf-card ${errores.fotos ? 'lf-card--error' : ''}`}>
                <h2><span>4</span> Fotos *</h2>
                <div id="lf-fotos" tabIndex={-1}>
                  <PhotoUploader items={fotos} onChange={cambiarFotos} onAvisos={setAvisoFotos} disabled={enviando} />
                </div>
                {avisoFotos && <p className="lf-warning" role="status">{avisoFotos}</p>}
                {errores.fotos && <span className="lf-error" role="alert">{errores.fotos}</span>}
              </section>
            </fieldset>

            {progreso && (
              <div className="lf-progress" role="status" aria-live="polite">
                <div className="lf-progress-bar"><div style={{ width: `${progreso.pct}%` }} /></div>
                <p>{progreso.texto}</p>
              </div>
            )}

            <div className="lf-actions">
              <button type="submit" className="lf-btn" disabled={enviando}>
                {enviando ? 'Guardando…' : textoBoton}
              </button>
              <Link to="/mi-panel" className="lf-cancel" aria-disabled={enviando}>Cancelar</Link>
            </div>
          </form>

          <aside className="lf-aside" aria-label="Vista previa">
            <p className="lf-aside-title">Así se verá en el catálogo</p>
            <ListingCard
              key={vistaPrevia.imagenes[0]?.url ?? 'sin-foto'}
              listing={vistaPrevia}
              to="#"
              onSelect={() => {}}
            />
            <p className="lf-aside-note">
              La vista previa se actualiza mientras escribes. El estado de disponibilidad lo asigna el sistema al guardar.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ListingForm;
