// src/components/Reveal.jsx
// Hace que su contenido aparezca suavemente la primera vez que entra en pantalla.
import { useEffect, useRef, useState } from 'react';
import './Reveal.css';

function Reveal({ children, className = '', delay = 0, as = 'div' }) {
  const Etiqueta = as;
  const ref = useRef(null);
  // Si el navegador no soporta IntersectionObserver, se muestra de una vez.
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <Etiqueta
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Etiqueta>
  );
}

export default Reveal;
