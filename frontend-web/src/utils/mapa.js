// src/utils/mapa.js
// Ubica un alojamiento en el mapa a partir de su dirección.
//
// Usa Nominatim (el buscador de OpenStreetMap): gratis y sin API key.
// Solo da por buena una ubicación si:
//   1. está dentro de la zona metropolitana de Querétaro,
//   2. es una calle o un domicilio (no un hotel, negocio o colonia completa), y
//   3. si el resultado trae código postal, coincide con el del alojamiento.
// Si no se cumple, devuelve null y NO se muestra mapa: es mejor sin mapa que con uno equivocado.

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

// Zona metropolitana de Querétaro: oeste, norte, este, sur
const ZONA = '-100.62,20.85,-100.15,20.40';

const cache = new Map();

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Quita abreviaturas y palabras que confunden al buscador ("Col.", "#", "Qro.", "Int. 3"...)
export function limpiarTexto(texto) {
  return String(texto ?? '')
    .replace(/\b(col|colonia|fracc|fraccionamiento)\b\.?/gi, ' ')
    .replace(/\b(int|interior|depto|dpto|departamento)\b\.?\s*\w*/gi, ' ')
    .replace(/\b(no|num|núm|numero|número)\b\.?\s*(?=\d)/gi, ' ')
    .replace(/\bsantiago de\b/gi, ' ')
    .replace(/\b(querétaro|queretaro|qro|méxico|mexico)\b\.?/gi, ' ')
    .replace(/[#°,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Búsquedas a intentar, de la más específica a la menos (sin repetir)
export function armarConsultas(listing) {
  const calle   = limpiarTexto(listing?.direccion);
  const colonia = limpiarTexto(listing?.colonia);
  if (!calle) return [];

  const sinNumero = calle.replace(/\b\d+[a-z]?\b/gi, ' ').replace(/\s+/g, ' ').trim();

  const lista = [
    `${calle} ${colonia} Querétaro`,
    `${calle} Querétaro`,
    sinNumero && sinNumero !== calle ? `${sinNumero} ${colonia} Querétaro` : '',
  ];
  return [...new Set(lista.map(c => c.replace(/\s+/g, ' ').trim()).filter(Boolean))];
}

// ¿Es una calle o un domicilio? (descarta hoteles, negocios, colonias y ciudades)
function esDomicilio(r) {
  return (
    r.category === 'highway' ||
    r.category === 'building' ||
    (r.category === 'place' && r.type === 'house')
  );
}

// Devuelve el primer resultado válido o null
export function elegirResultado(resultados, codigoPostal) {
  const cp = String(codigoPostal ?? '').trim();
  const valido = (resultados ?? []).find(r => {
    if (!esDomicilio(r)) return false;
    const cpResultado = r.address?.postcode;
    if (cpResultado && cp && String(cpResultado).trim() !== cp) return false;
    return Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lon));
  });
  return valido ? { lat: Number(valido.lat), lon: Number(valido.lon) } : null;
}

async function buscar(consulta, signal) {
  const params = new URLSearchParams({
    q: consulta,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '10',
    countrycodes: 'mx',
    viewbox: ZONA,
    bounded: '1',
    'accept-language': 'es',
  });
  const res = await fetch(`${NOMINATIM}?${params}`, { signal });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// Devuelve { lat, lon } o null si no se pudo ubicar con seguridad.
// Lanza error solo si falla la conexión (en ese caso no se guarda en caché).
export async function ubicarAlojamiento(listing, signal) {
  const clave = [listing?.direccion, listing?.colonia, listing?.codigo_postal].join('|');
  if (cache.has(clave)) return cache.get(clave);

  const consultas = armarConsultas(listing);
  let punto = null;

  for (let i = 0; i < consultas.length && !punto; i += 1) {
    if (i > 0) await esperar(1100); // Nominatim pide máximo 1 consulta por segundo
    punto = elegirResultado(await buscar(consultas[i], signal), listing?.codigo_postal);
  }

  cache.set(clave, punto);
  return punto;
}

// Mapa insertable de OpenStreetMap con un marcador en el punto
export function mapaEmbedUrl({ lat, lon }) {
  const d = 0.004;
  const bbox = [lon - d, lat - d, lon + d, lat + d].map(n => n.toFixed(5)).join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

// Enlace a Google Maps con las coordenadas exactas (no vuelve a buscar por texto)
export function mapaEnlaceUrl({ lat, lon }) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
