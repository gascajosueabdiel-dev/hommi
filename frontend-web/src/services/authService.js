// src/services/authService.js

const BASE_URL = '/api';
//const BASE_URL = 'https://hommi.homes';

const HEADERS = {
  'Content-Type': 'application/json',
};

// Lee el mensaje de error que manda el backend. Según el endpoint puede venir
// en `message`, `msg`, `error` o `detail`.
async function leerMensajeError(response, porDefecto) {
  try {
    const err = await response.json();
    const mensaje = err.message || err.msg || err.detail || err.error;
    if (typeof mensaje === 'string' && mensaje.trim()) return mensaje;
  } catch {
    // la respuesta no era JSON: se usa el mensaje por defecto
  }
  return porDefecto;
}

// Decodifica el contenido (payload) del JWT sin verificarlo.
// Solo sirve para saber cuándo expira; la verificación real la hace el backend.
function leerPayloadToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export async function loginUser(email, password) {
  const response = await fetch(`${BASE_URL}/usuarios/login`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      correo:     email,
      contrasena: password,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, 'Correo o contraseña incorrectos')
    );
  }

  const respuesta = await response.json();

  const user = {
    id:       respuesta.data.user_id,
    perfilId: respuesta.data.perfil_id,
    rol:      respuesta.data.tipo,
    nombre:   respuesta.data.nombre,   // lo manda el backend actualizado; si no, se muestra el correo
    email:    email,
  };

  // sessionStorage se borra automáticamente al cerrar la pestaña/navegador
  sessionStorage.setItem('token', respuesta.data.token);
  sessionStorage.setItem('user',  JSON.stringify(user));
  sessionStorage.removeItem('sessionExpired');

  return user;
}

export async function registerEstudiante(datos) {
  const payload = {
    nombre:      datos.nombre,
    correo:      datos.email,
    contrasena:  datos.password,
    universidad: datos.universidad,
    id_catsexo:  datos.id_catsexo ?? 1,
  };

  const response = await fetch(`${BASE_URL}/usuarios/registro-estudiante`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await leerMensajeError(response, 'Error al crear la cuenta'));
  }

  return await response.json();
}

export async function registerArrendador(datos) {
  const payload = {
    nombre:     datos.nombre,
    correo:     datos.email,
    contrasena: datos.password,
    telefono:   datos.telefono,
  };

  const response = await fetch(`${BASE_URL}/usuarios/registro-arrendador`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await leerMensajeError(response, 'Error al crear la cuenta'));
  }

  return await response.json();
}

export function logoutUser() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

// Devuelve true solo si hay token y todavía no ha expirado (el backend los
// emite con duración de 1 hora). Si ya expiró, limpia la sesión y deja una
// marca para que el Login muestre el aviso "Tu sesión ha expirado".
export function isAuthenticated() {
  const token = sessionStorage.getItem('token');
  if (!token) return false;

  const payload = leerPayloadToken(token);
  if (payload?.exp && payload.exp * 1000 <= Date.now()) {
    logoutUser();
    sessionStorage.setItem('sessionExpired', '1');
    return false;
  }
  return true;
}

export function getStoredUser() {
  if (!isAuthenticated()) return null;
  try {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

// Página a la que va cada usuario justo después de iniciar sesión.
// La portada ("/") ya no redirige: se puede ver siempre desde el logo.
export function getHomePath(user) {
  return user?.rol === 'arrendador' ? '/mi-panel' : '/alojamientos';
}

// Se usa cuando el servidor responde que el token ya no sirve: limpia la sesión,
// deja la marca para el aviso del Login y lleva al usuario a iniciar sesión.
export function expireSession() {
  logoutUser();
  sessionStorage.setItem('sessionExpired', '1');
  window.location.assign('/login');
}
