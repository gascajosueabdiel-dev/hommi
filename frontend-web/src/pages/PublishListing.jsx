// src/pages/PublishListing.jsx — publicar un alojamiento nuevo
import ListingForm from '../components/ListingForm';
import { createListing } from '../services/listingsService';
import { getStoredUser } from '../services/authService';

function PublishListing() {
  const usuario = getStoredUser();

  return (
    <ListingForm
      eyebrow="Nueva publicación"
      titulo="Publicar alojamiento"
      subtitulo="Completa los datos para que los estudiantes encuentren tu propiedad."
      textoBoton="Publicar alojamiento"
      tituloExito="¡Alojamiento publicado!"
      subtituloExito="Los estudiantes ya pueden ver tu propiedad en el catálogo."
      onGuardar={datos => createListing({ ...datos, arrendador_id: usuario?.id })}
    />
  );
}

export default PublishListing;
