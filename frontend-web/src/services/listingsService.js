// src/services/listingsService.js

import { expireSession, getStoredUser } from './authService';
import { filtrarPorBusqueda, puedeVerListing } from '../utils/listing';

const BASE_URL = '/api';
//const BASE_URL = 'https://hommi.homes';

function getToken() {
  return sessionStorage.getItem('token');
}

// Solo manda Authorization cuando hay sesión (antes mandaba "Bearer null").
function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// El backend manda el texto del error en `message`, `msg` o `error`.
async function leerMensaje(res) {
  const err = await res.json().catch(() => ({}));
  const mensaje = err.message || err.msg || err.error;
  return typeof mensaje === 'string' && mensaje.trim() ? mensaje : '';
}

// ¿El servidor está diciendo que el token ya no es válido?
function sesionInvalida(status, mensaje) {
  return status === 401 || (status === 403 && /sesi[oó]n|token/i.test(mensaje));
}

async function handleResponse(res) {
  if (!res.ok) {
    const mensaje = await leerMensaje(res);
    // Con sesión vencida se cierra la sesión y se manda al login.
    if (getToken() && sesionInvalida(res.status, mensaje)) expireSession();
    throw new Error(mensaje || `Error ${res.status}`);
  }
  return res.json();
}

// ── 1. Obtener todos los alojamientos (catálogo estudiantes) ───────────────
export async function getAllListings() {
  const res = await fetch(`${BASE_URL}/alojamientos`);
  const todos = await handleResponse(res);
  // Cada quien ve solo lo que le corresponde (los ocupados no se muestran a estudiantes ni invitados)
  const usuario = getStoredUser();
  return todos.filter(l => puedeVerListing(l, usuario));
}

// ── 2. Obtener alojamientos del arrendador autenticado ────────────────────
export async function getMyListings(arrendadorId) {
  const res = await fetch(`${BASE_URL}/alojamientos`, {
    headers: authHeaders(),
  });
  const todos = await handleResponse(res);
  // Filtra los del arrendador actual hasta que el backend tenga /alojamientos/my
  return todos.filter(l => l.arrendador_id === arrendadorId);
}

// ── 3. Pedir las URLs firmadas para subir fotos a S3 (hasta 5 a la vez) ───
// archivos: [{ fileName, fileType }]  →  [{ uploadUrl, imageUrl, key, fileName }]
export async function getUploadUrls(archivos) {
  const res = await fetch(`${BASE_URL}/alojamientos/generate-url`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ archivos }),
  });
  const data = await handleResponse(res);
  return Array.isArray(data?.archivos) ? data.archivos : [];
}

// ── 4. Subir imagen directamente a S3 ────────────────────────────────────
export async function uploadImageToS3(uploadUrl, archivo) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': archivo.type },
    body: archivo, // archivo binario tal cual
  });
  if (!res.ok) throw new Error('No se pudo subir una de las fotos. Inténtalo de nuevo.');
  return true;
}

// Sube las fotos nuevas y devuelve las URLs finales de TODAS, en el orden en que
// el usuario las dejó (la primera es la portada). Las que ya existen conservan su URL.
// Si algo falla, las fotos ya subidas se recuerdan (urlSubida) para no repetirlas al reintentar.
export async function subirFotos(items, onProgreso = () => {}) {
  const pendientes = items.filter(i => i.tipo === 'nueva' && !i.urlSubida);

  if (pendientes.length > 0) {
    const permisos = await getUploadUrls(
      pendientes.map(i => ({ fileName: i.nombreArchivo ?? i.file.name, fileType: i.file.type }))
    );
    if (permisos.length !== pendientes.length || permisos.some(p => !p?.uploadUrl || !p?.imageUrl)) {
      throw new Error('El servidor no devolvió los permisos de subida de las fotos.');
    }

    let hechas = 0;
    onProgreso(0, pendientes.length);
    await Promise.all(
      pendientes.map(async (item, k) => {
        await uploadImageToS3(permisos[k].uploadUrl, item.file);
        item.urlSubida = permisos[k].imageUrl;
        hechas += 1;
        onProgreso(hechas, pendientes.length);
      })
    );
  }

  return items.map(i => (i.tipo === 'nueva' ? i.urlSubida : i.url));
}

// ── 5. Crear alojamiento ──────────────────────────────────────────────────
export async function createListing(datos) {
  const res = await fetch(`${BASE_URL}/alojamientos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

// ── 6. Modificar alojamiento ──────────────────────────────────────────────
export async function updateListing(id, datos) {
  const res = await fetch(`${BASE_URL}/alojamientos/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

// ── 7. Eliminar alojamiento (Arrendador) ──────────────────────────────────
export async function deleteListing(id, arrendadorId) {
  const res = await fetch(`${BASE_URL}/alojamientos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ arrendador_id: arrendadorId }),
  });
  return handleResponse(res);
}

// ── 8. Eliminar alojamiento como admin ────────────────────────────────────
export async function deleteListingAdmin(id) {
  const res = await fetch(`${BASE_URL}/alojamientos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}

// ── 9. Obtener detalle de un alojamiento ──────────────────────────────────
export async function getListingById(id) {
  const res = await fetch(`${BASE_URL}/alojamientos/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── 10. Notificaciones (simulado hasta que backend lo implemente) ─────────
export async function getNotificaciones() {
  const notifs = sessionStorage.getItem('notificaciones');
  return notifs ? JSON.parse(notifs) : [];
}

export function guardarNotificacionLocal(mensaje) {
  const actuales = JSON.parse(sessionStorage.getItem('notificaciones') || '[]');
  actuales.push({ mensaje, fecha: new Date().toISOString(), leida: false });
  sessionStorage.setItem('notificaciones', JSON.stringify(actuales));
}

export async function marcarNotificacionesLeidas() {
  sessionStorage.removeItem('notificaciones');
}

// ── 11. Buscador para estudiantes e invitados (Público) ───────────────────
// Se filtra aquí con la lista completa: así siempre llegan las fotos y el estado,
// y no depende del buscador del servidor.
export async function searchListings({ query, precioMax }) {
  const todos = await getAllListings();
  return filtrarPorBusqueda(todos, { query, precioMax });
}

// ── 12. Buscador para Arrendadores (solo sus publicaciones) ───────────────
export async function searchMyListings({ query, precioMax }, arrendadorId) {
  const mios = await getMyListings(arrendadorId);
  return filtrarPorBusqueda(mios, { query, precioMax });
}

// ── 13. Cambiar solo la disponibilidad de un alojamiento (Arrendador) ─────
// disponibilidadId: 1 Disponible · 2 Ocupado · 3 En mantenimiento
export async function updateDisponibilidad(id, arrendadorId, disponibilidadId) {
  const res = await fetch(`${BASE_URL}/alojamientos/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ arrendador_id: arrendadorId, disponibilidad_id: disponibilidadId }),
  });
  return handleResponse(res);
}

// ── 14. Reseñas ───────────────────────────────────────────────────────────
// Público: devuelve { promedio, totalResenas, resenas: [...] }
export async function getResenas(alojamientoId) {
  const res = await fetch(`${BASE_URL}/resenas/alojamiento/${alojamientoId}`);
  const data = await handleResponse(res);
  return data.data ?? data;
}

// Estudiante: publica la reseña o, si ya tenía una en este alojamiento, la actualiza
export async function guardarResena(alojamientoId, { calificacion, comentario }) {
  const res = await fetch(`${BASE_URL}/resenas/alojamiento/${alojamientoId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ calificacion, comentario }),
  });
  return handleResponse(res);
}

// Autor de la reseña o administrador
export async function eliminarResena(idResena) {
  const res = await fetch(`${BASE_URL}/resenas/${idResena}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}
