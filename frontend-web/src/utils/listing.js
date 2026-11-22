// src/utils/listing.js
// Funciones para leer los datos de un alojamiento tal como los manda el backend.

// Lista de URLs de fotos: primero la principal, luego por orden.
// Si el alojamiento solo trae `foto_url` (formato anterior), se usa esa.
export function getFotos(listing) {
  // Formato con lista directa de URLs (si el backend la manda así)
  if (Array.isArray(listing?.imagenesUrls)) {
    const urls = listing.imagenesUrls.filter(u => typeof u === 'string' && u.trim() !== '');
    if (urls.length > 0) return urls;
  }
  const imagenes = Array.isArray(listing?.imagenes) ? [...listing.imagenes] : [];
  imagenes.sort(
    (a, b) =>
      Number(Boolean(b?.es_principal)) - Number(Boolean(a?.es_principal)) ||
      (a?.orden ?? 0) - (b?.orden ?? 0) ||
      (a?.id_imagen ?? 0) - (b?.id_imagen ?? 0)
  );
  const urls = imagenes.map(i => i?.url).filter(Boolean);
  if (urls.length === 0 && listing?.foto_url) urls.push(listing.foto_url);
  return urls;
}

export function getServicios(listing) {
  return (listing?.servicios ?? [])
    .map(s => {
      // Si el servicio está en nuestra lista, se usa su nombre (así no importa cómo esté escrito en la base)
      const conocido = SERVICIOS_DISPONIBLES.find(c => c.id === (s?.id_servicio ?? s?.id));
      return conocido ? conocido.nombre : (s?.nombre || s?.servicio);
    })
    .filter(Boolean)
    .map(nombre => nombre.charAt(0).toUpperCase() + nombre.slice(1)); // "gas" -> "Gas"
}

// "Disponible", "Ocupado" o "Mantenimiento" (o '' si no viene)
export function getEstado(listing) {
  return listing?.disponibilidad?.disponibilidad ?? '';
}

// Variante de color para la etiqueta de disponibilidad: ok | busy | warn
export function getClaseEstado(estado) {
  if (estado === 'Disponible') return 'ok';
  if (estado === 'Ocupado') return 'busy';
  return 'warn';
}

export function formatPrecio(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '';
  return numero.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Sin mayúsculas ni acentos, para comparar textos ("Querétaro" == "queretaro")
function normalizar(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Búsqueda por texto (dirección o colonia) y por precio máximo, sobre una lista ya cargada.
export function filtrarPorBusqueda(lista, { query, precioMax } = {}) {
  const termino = normalizar(query);
  const tope = Number(String(precioMax ?? '').replace(/[^0-9.]/g, ''));
  return lista.filter(l => {
    if (termino && ![l.direccion, l.colonia].some(campo => normalizar(campo).includes(termino))) return false;
    if (tope && Number(l.precio_mensual) > tope) return false;
    return true;
  });
}

// Estados de disponibilidad que puede elegir el arrendador.
// Los ids son los de la tabla cat_disponibilidad (1 Disponible, 2 Ocupado, 3 En mantenimiento).
export const DISPONIBILIDADES = [
  { id: 1, nombre: 'Disponible',       corto: 'Disponible' },
  { id: 2, nombre: 'Ocupado',          corto: 'Ocupado' },
  { id: 3, nombre: 'En mantenimiento', corto: 'Mantenimiento' },
];

// ¿Puede este usuario ver el alojamiento?
// Los ocupados solo los ven su propio arrendador y el administrador;
// estudiantes e invitados ven únicamente Disponible y En mantenimiento.
export function puedeVerListing(listing, usuario) {
  const ocupado = getEstado(listing) === 'Ocupado' || getDisponibilidadId(listing) === 2;
  if (!ocupado) return true;
  if (usuario?.rol === 'administrador') return true;
  return (
    usuario?.rol === 'arrendador' &&
    String(usuario.perfilId ?? usuario.id) === String(listing?.arrendador_id)
  );
}

// id de disponibilidad actual del alojamiento (null si el backend no lo manda)
export function getDisponibilidadId(listing) {
  return listing?.disponibilidad_id ?? listing?.disponibilidad?.id_catdispon ?? null;
}

// Nombres de servicios que aparecen en la lista, sin repetir y en orden alfabético.
export function getServiciosDisponibles(listings) {
  const nombres = new Set();
  (listings ?? []).forEach(l => getServicios(l).forEach(n => nombres.add(n)));
  return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
}

// Filtros y orden que se aplican en el navegador sobre lo que ya devolvió el backend.
//  - servicios: el alojamiento debe incluir TODOS los seleccionados
//  - soloDisponibles: solo los que están en estado "Disponible"
//  - orden: 'recientes' | 'precio-asc' | 'precio-desc'
export function filtrarYOrdenar(
  listings,
  { servicios = [], soloDisponibles = false, orden = 'recientes' } = {}
) {
  const lista = (listings ?? []).filter(l => {
    if (soloDisponibles && getEstado(l) !== 'Disponible') return false;
    if (servicios.length > 0) {
      const propios = getServicios(l);
      if (!servicios.every(n => propios.includes(n))) return false;
    }
    return true;
  });

  const precio = l => Number(l.precio_mensual) || 0;
  if (orden === 'precio-asc')  lista.sort((a, b) => precio(a) - precio(b));
  else if (orden === 'precio-desc') lista.sort((a, b) => precio(b) - precio(a));
  else lista.sort((a, b) => (b.id_alojamiento ?? 0) - (a.id_alojamiento ?? 0));

  return lista;
}

// ── Contacto ──

// Solo los dígitos del teléfono ("442 123 4567" -> "4421234567")
export function soloDigitos(telefono) {
  return String(telefono ?? '').replace(/\D/g, '');
}

// 10 dígitos se muestran como "442 123 4567"; cualquier otro formato se deja tal cual.
export function formatTelefono(telefono) {
  const d = soloDigitos(telefono);
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return String(telefono ?? '').trim();
}

// WhatsApp solo se ofrece con números de 10 dígitos (se asume lada de México, +52).
export function whatsappUrl(telefono, direccion) {
  const d = soloDigitos(telefono);
  if (d.length !== 10) return '';
  const texto = `Hola, vi tu alojamiento en HOMMI (${direccion ?? ''}) y me interesa. ¿Sigue disponible?`;
  return `https://wa.me/52${d}?text=${encodeURIComponent(texto)}`;
}

// ── Formulario de publicar / editar ──

// Servicios que existen en la base de datos (ids fijos)
export const SERVICIOS_DISPONIBLES = [
  { id: 1, nombre: 'Internet' },
  { id: 2, nombre: 'Agua' },
  { id: 3, nombre: 'Luz' },
  { id: 4, nombre: 'Gas' },
  { id: 5, nombre: 'Lavandería' },
  { id: 6, nombre: 'Amueblado' },
  { id: 7, nombre: 'Baño privado' },
  { id: 8, nombre: 'Estacionamiento' },
  { id: 9, nombre: 'Aire acondicionado' },
];

export const MAX_FOTOS = 5;
export const MAX_BYTES_FOTO = 2 * 1024 * 1024; // 2 MB

// El nombre del archivo termina en la URL pública de S3, así que se limpia:
// sin acentos, espacios ni símbolos ("Casa Ñandú #1.JPG" -> "casa-nandu-1.jpg").
export function nombreSeguro(nombre) {
  const partes = String(nombre ?? '').split('.');
  const extension = (partes.length > 1 ? partes.pop() : 'jpg')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 5) || 'jpg';
  const base = partes.join('.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'foto';
  return `${base}.${extension}`;
}

// Separa los archivos elegidos en válidos y avisos (formato, peso y cupo).
export function validarArchivos(archivos, cupoLibre) {
  const validos = [];
  const avisos = [];
  let sinCupo = 0;

  for (const f of archivos) {
    if (f.type !== 'image/jpeg' && f.type !== 'image/jpg') {
      avisos.push(`"${f.name}" no es JPG/JPEG`);
    } else if (f.size > MAX_BYTES_FOTO) {
      avisos.push(`"${f.name}" pesa más de 2 MB`);
    } else if (validos.length >= cupoLibre) {
      sinCupo += 1;
    } else {
      validos.push(f);
    }
  }
  if (sinCupo > 0) {
    avisos.push(`el máximo es ${MAX_FOTOS} fotos; se omitieron ${sinCupo}`);
  }
  return { validos, avisos };
}

export function validarFormulario(valores, fotos) {
  const e = {};
  if (!valores.direccion.trim()) e.direccion = 'La dirección es obligatoria';
  if (!valores.colonia.trim()) e.colonia = 'La colonia es obligatoria';
  if (!/^\d{5}$/.test(valores.codigo_postal.trim())) {
    e.codigo_postal = 'El código postal debe tener 5 dígitos';
  }
  const precio = Number(valores.precio);
  if (valores.precio === '' || valores.precio === null) e.precio = 'El precio es obligatorio';
  else if (!Number.isFinite(precio) || precio <= 0) e.precio = 'El precio debe ser mayor a 0';
  else if (precio > 99999999) e.precio = 'El precio es demasiado alto';
  if (fotos.length === 0) e.fotos = 'Sube al menos una foto del alojamiento';
  return e;
}

// Convierte el alojamiento que manda el backend en los valores iniciales del formulario
export function aValoresIniciales(listing) {
  return {
    valores: {
      direccion: listing.direccion ?? '',
      colonia: listing.colonia ?? '',
      codigo_postal: String(listing.codigo_postal ?? '').trim(),
      precio: listing.precio_mensual != null ? String(Number(listing.precio_mensual)) : '',
      descripcion: listing.descripcion ?? '',
      servicios: (listing.servicios ?? []).map(s => s.id_servicio ?? s.id).filter(Boolean),
    },
    fotos: getFotos(listing).map((url, i) => ({ id: `existente-${i}`, tipo: 'existente', url })),
  };
}
