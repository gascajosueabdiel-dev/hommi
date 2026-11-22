// src/components/AuthShell.jsx
// Marco de las pantallas de acceso: panel de marca a la izquierda y formulario a la derecha.
import { Link } from 'react-router-dom';
import Logo from './Logo';
import '../pages/Auth.css';

const LADOS = {
  login: {
    titulo: 'Tu hogar durante la universidad empieza aquí',
    texto: 'Entra para ver los detalles completos de cada alojamiento y contactar al arrendador.',
    puntos: [
      'Fotos reales y precio claro',
      'Contacto directo con el arrendador',
      'Publica y administra desde tu panel',
    ],
  },
  estudiante: {
    titulo: 'Encuentra dónde vivir sin perder tiempo',
    texto: 'Crea tu cuenta de estudiante y compara opciones cerca de tu escuela.',
    puntos: [
      'Compara precio, ubicación y servicios',
      'Fotos reales de cada alojamiento',
      'Contacto directo con el arrendador',
    ],
  },
  arrendador: {
    titulo: 'Publica tu propiedad y recibe estudiantes',
    texto: 'Crea tu cuenta de arrendador y administra tus publicaciones en un solo lugar.',
    puntos: [
      'Publica con hasta 5 fotos',
      'Define el precio y los servicios incluidos',
      'Edita o elimina tus publicaciones cuando quieras',
    ],
  },
};

function AuthShell({ variante = 'login', children }) {
  const lado = LADOS[variante] ?? LADOS.login;

  return (
    <div className="auth-split">
      <aside className="auth-side">
        <div className="auth-side-inner">
          <Link to="/" className="auth-side-brand">
            <Logo size={26} />
            <span>HOMMI</span>
          </Link>
          <h2 className="auth-side-title">{lado.titulo}</h2>
          <p className="auth-side-text">{lado.texto}</p>
          <ul className="auth-side-points">
            {lado.puntos.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}

export default AuthShell;
