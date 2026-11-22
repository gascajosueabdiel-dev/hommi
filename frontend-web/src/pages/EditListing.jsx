// src/pages/EditListing.jsx — modificar un alojamiento existente
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import ListingForm from '../components/ListingForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { getListingById, updateListing } from '../services/listingsService';
import { getStoredUser } from '../services/authService';
import { aValoresIniciales } from '../utils/listing';
import './PublishListing.css';

export function EditView({ estado, listing, usuario, mensajeError, id }) {
  if (estado === 'cargando') {
    return (
      <div className="lf-page">
        <div className="lf-container"><LoadingSpinner mensaje="Cargando alojamiento..." /></div>
      </div>
    );
  }

  if (estado === 'error' || estado === 'ajeno') {
    return (
      <div className="lf-page">
        <div className="lf-container">
          <div className="lf-notice">
            <h1>{estado === 'ajeno' ? 'No puedes editar este alojamiento' : 'No pudimos cargar el alojamiento'}</h1>
            <p>
              {estado === 'ajeno'
                ? 'Solo el arrendador que lo publicó puede modificarlo.'
                : mensajeError}
            </p>
            <Link to="/mi-panel" className="lf-btn">Volver a mi panel</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ListingForm
      eyebrow="Modificar publicación"
      titulo="Modificar alojamiento"
      subtitulo="Actualiza solo lo que quieras cambiar."
      textoBoton="Guardar cambios"
      tituloExito="¡Cambios guardados!"
      subtituloExito="Redirigiendo a tus publicaciones..."
      inicial={aValoresIniciales(listing)}
      onGuardar={datos => updateListing(id, { ...datos, arrendador_id: usuario?.id })}
    />
  );
}

function EditLoader({ id }) {
  const location = useLocation();
  const usuario = getStoredUser();
  const desdePanel = location.state?.listing ?? null;

  const [listing, setListing] = useState(desdePanel);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(!desdePanel);

  useEffect(() => {
    if (desdePanel) return;
    let activo = true;
    getListingById(id)
      .then(res => { if (activo) setListing(res?.data ?? res); })
      .catch(err => { if (activo) setError(err.message || 'No se pudo cargar el alojamiento.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [id, desdePanel]);

  let estado = 'ok';
  if (cargando) estado = 'cargando';
  else if (error || !listing) estado = 'error';
  else if (String(listing.arrendador_id) !== String(usuario?.id)) estado = 'ajeno';

  return <EditView estado={estado} listing={listing} usuario={usuario} mensajeError={error} id={id} />;
}

function EditListing() {
  const { id } = useParams();
  return <EditLoader key={id} id={id} />;
}

export default EditListing;
