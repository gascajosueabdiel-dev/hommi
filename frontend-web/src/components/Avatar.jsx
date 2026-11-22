// src/components/Avatar.jsx
import './Avatar.css';

// Iniciales a partir del nombre; si no hay nombre, la primera letra del correo.
function getIniciales(nombre, email) {
  if (nombre) {
    return nombre
      .split(' ')
      .filter(Boolean)
      .map(parte => parte[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

function Avatar({ nombre, email, size = 34 }) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {getIniciales(nombre, email)}
    </div>
  );
}

export default Avatar;
